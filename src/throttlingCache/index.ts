import { WretcherOptions } from 'wretch/dist/wretcher'
import { WretcherResponse } from 'wretch/dist/resolver'
import { ConfiguredMiddleware } from 'wretch/dist/middleware'

/* Types */

export type ThrottlingCacheSkipFunction = (url: string, opts: WretcherOptions) => boolean
export type ThrottlingCacheKeyFunction = (url: string, opts: WretcherOptions) => string
export type ThrottlingCacheClearFunction = (url: string, opts: WretcherOptions) => boolean
export type ThrottlingCacheInvalidateFunction = (url: string, opts: WretcherOptions) => string | RegExp | null
export type ThrottlingCacheConditionFunction = (response: WretcherResponse) => boolean
export type ThrottlingCacheOptions = {
    throttle?: number,
    skip?: ThrottlingCacheSkipFunction,
    key?: ThrottlingCacheKeyFunction,
    clear?: ThrottlingCacheClearFunction,
    invalidate?: ThrottlingCacheInvalidateFunction,
    condition?: ThrottlingCacheConditionFunction,
    flagResponseOnCacheHit?: string
}
export type ThrottlingCacheMiddleware = (options?: ThrottlingCacheOptions) => ConfiguredMiddleware

/* Defaults */

const defaultSkip = (url, opts) => (
    opts.skipCache || opts.method !== 'GET'
)
const defaultKey = (url, opts) => opts.method + '@' + url
const defaultClear = (url, opts) => false
const defaultInvalidate = (url, opts) => null
const defaultCondition = response => response.ok

/**
 * ## Throttling cache middleware
 *
 * #### A throttling cache which stores and serves server responses for a certain amount of time.
 *
 * **Options**
 *
 * - *throttle* `milliseconds`
 *
 * > the response will be stored for this amount of time before being deleted from the cache.
 *
 * - *skip* `(url, opts) => boolean`
 *
 * > If skip returns true, then the request is performed even if present in the cache.
 *
 * - *key* `(url, opts) => string`
 *
 * > Returns a key that is used to identify the request.
 *
 * - *clear* `(url, opts) => boolean`
 *
 * > Clears the cache if true.
 *
 * - *invalidate* `(url, opts) => string | RegExp | null`
 *
 * > Removes url(s) matching the string/RegExp from the cache.
 *
 * - *condition* `response => boolean`
 *
 * > If false then the response will not be added to the cache.
 *
 * - *flagResponseOnCacheHit* `string`
 *
 * > If set, a Response returned from the cache whill be flagged with a property name equal to this option.
 *
 */
export const throttlingCache: ThrottlingCacheMiddleware = ({
    throttle = 1000,
    skip = defaultSkip,
    key = defaultKey,
    clear = defaultClear,
    invalidate = defaultInvalidate,
    condition = defaultCondition,
    flagResponseOnCacheHit = '__cached'
} = {}) => {

    const cache = new Map()
    const inflight = new Map()
    const throttling = new Set()

    const throttleRequest = _key => {
        if (throttle && !throttling.has(_key)) {
            throttling.add(_key)
            setTimeout(() => { throttling.delete(_key) }, throttle)
        }
    }

    const middleware = next => (url, opts) => {
        const _key = key(url, opts)

        let invalidatePatterns = invalidate(url, opts)
        if(invalidatePatterns) {
            if(!(invalidatePatterns instanceof Array)) {
                invalidatePatterns = [invalidatePatterns]
            }
            invalidatePatterns.forEach(pattern => {
                if(typeof pattern === 'string') {
                    cache.delete(pattern)
                } else if(pattern instanceof RegExp) {
                    cache.forEach((_, key) => {
                        if(pattern.test(key)) {
                            cache.delete(key)
                        }
                    })
                }
            })
        }
        if(clear(url, opts)) {
            cache.clear()
        }

        if(skip(url, opts)) {
            return next(url, opts)
        }

        if (throttling.has(_key)) {
            // If the cache contains a previous response and we are throttling, serve it and bypass the chain.
            if (cache.has(_key)) {
                const cachedClone = cache.get(_key).clone()
                if(flagResponseOnCacheHit) {
                    // Flag the Response as cached
                    Object.defineProperty(cachedClone, flagResponseOnCacheHit, {
                        value: _key,
                        enumerable: false
                    })
                }
                return Promise.resolve(cachedClone)
            // If the request in already in-flight, wait until it is resolved
            } else if (inflight.has(_key)) {
                return new Promise((resolve, reject) => {
                    inflight.get(_key).push([resolve, reject])
                })
            }
        }

        // Init. the pending promises Map
        if (!inflight.has(_key))
            inflight.set(_key, [])

        // If we are not throttling, activate the throttle for X milliseconds
        throttleRequest(_key)

        // We call the next middleware in the chain.
        return next(url, opts)
            .then(response => {
                // Add a cloned response to the cache
                if(condition(response.clone())) {
                    cache.set(_key, response.clone())
                }
                // Resolve pending promises
                inflight.get(_key).forEach(([resolve]) => resolve(response.clone()))
                // Remove the inflight pending promises
                inflight.delete(_key)
                // Return the original response
                return response
            })
            .catch(error => {
                // Reject pending promises on error
                inflight.get(_key).forEach(([resolve, reject]) => reject(error))
                inflight.delete(_key)
                throw error
            })
    }

    // Programmatically cache a response
    middleware['cache'] = function(key, response) {
        throttleRequest(key)
        cache.set(key, response)
    }

    return middleware
}

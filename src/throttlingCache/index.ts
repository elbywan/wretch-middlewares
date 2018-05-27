import { WretcherOptions } from 'wretch/dist/wretcher'
import { ConfiguredMiddleware } from 'wretch/dist/middleware'

/* Types */

export type ThrottlingCacheSkipFunction = (url: string, opts: WretcherOptions) => boolean
export type ThrottlingCacheKeyFunction = (url: string, opts: WretcherOptions) => string
export type ThrottlingCacheOptions = {
    throttle?: number,
    skip?: ThrottlingCacheSkipFunction,
    key?: ThrottlingCacheKeyFunction
}
export type ThrottlingCacheMiddleware = (options?: ThrottlingCacheOptions) => ConfiguredMiddleware

/* Defaults */

const defaultSkip = (url, opts) => (
    opts.skipCache || opts.method !== 'GET'
)
const defaultKey = (url, opts) => opts.method + '@' + url

/**
 * ## Throttling cache middleware
 *
 * #### A throttling cache which stores and serves server responses for a certain amount of time.
 *
 * **Options**
 *
 * - *throttle* `milliseconds`
 *
 * > the response will be stored for this amount of time before being deleted from the cache
 *
 * - *skip* `(url, opts) => boolean`
 *
 * > If skip returns true, then the dedupe check is skipped.
 *
 * - *key* `(url, opts) => string`
 *
 * > Returns a key that is used to identify the request.
 *
 */
export const throttlingCache: ThrottlingCacheMiddleware = ({
    throttle = 0,
    skip = defaultSkip,
    key = defaultKey
} = {}) => {

    const cache = new Map()
    const inflight = new Map()
    const throttling = new Set()

    return next => (url, opts) => {
        const _key = key(url, opts)

        if(skip(url, opts)) {
            return next(url, opts)
        }

        if (throttling.has(_key)) {
            // If the cache contains a previous response and we are throttling, serve it and bypass the chain.
            if (cache.has(_key))
                return Promise.resolve(cache.get(_key).clone())
            // If the request in already in-flight, wait until it is resolved
            else if (inflight.has(_key)) {
                return new Promise((resolve, reject) => {
                    inflight.get(_key).push([resolve, reject])
                })
            }
        }

        // Init. the pending promises Map
        if (!inflight.has(_key))
            inflight.set(_key, [])

        // If we are not throttling, activate the throttle for X milliseconds
        if (throttle && !throttling.has(_key)) {
            throttling.add(_key)
            setTimeout(() => { throttling.delete(_key) }, throttle)
        }

        // We call the next middleware in the chain.
        return next(url, opts)
            .then(response => {
                // Add a cloned response to the cache
                cache.set(_key, response.clone())
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
}

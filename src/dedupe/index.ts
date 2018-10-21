import { ConfiguredMiddleware, WretcherOptions } from 'wretch'

/* Types */

export type DedupeSkipFunction = (url: string, opts: WretcherOptions) => boolean
export type DedupeKeyFunction = (url: string, opts: WretcherOptions) => string
export type DedupeOptions = {
    skip?: DedupeSkipFunction,
    key?: DedupeKeyFunction
}
export type DedupeMiddleware = (options?: DedupeOptions) => ConfiguredMiddleware

/* Defaults */

const defaultSkip = (url, opts) => (
    opts.skipDedupe || opts.method !== 'GET'
)
const defaultKey = (url, opts) => opts.method + '@' + url

/**
 * ## Dedupe middleware
 *
 * #### Prevents having multiple identical requests on the fly at the same time.
 *
 * **Options**
 *
 * - *skip* `function(url, opts) => boolean`
 *
 * > If skip returns true, then the dedupe check is skipped.
 *
 * - *key* `function(url, opts) => string`
 *
 * > Returns a key that is used to identify the request.
 *
 */
export const dedupe: DedupeMiddleware = ({ skip = defaultSkip,  key = defaultKey } = {}) => {

    const inflight = new Map()

    return next => (url, opts) => {

        if(skip(url, opts)) {
            return next(url, opts)
        }

        const _key = key(url, opts)

        if(!inflight.has(_key)) {
            inflight.set(_key, [])
        } else {
            return new Promise((resolve, reject) => {
                inflight.get(_key).push([resolve, reject])
            })
        }

        return next(url, opts)
            .then(response => {
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

import { ConfiguredMiddleware } from 'wretch'

/* Types */

export type DelayMiddleware = (time: number) => ConfiguredMiddleware

/**
 * ##  Delay middleware
 *
 * ### Delays the request by a specific amount of time.
 *
 * **Options**
 *
 * - *time* `milliseconds`
 *
 * > The request will be delayed by that amount of time.
 */
export const delay: DelayMiddleware = time => next => (url, opts) => {
    return new Promise(res => setTimeout(() => res(next(url, opts)), time))
}

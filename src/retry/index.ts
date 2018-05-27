import { ConfiguredMiddleware } from 'wretch/dist/middleware'

/* Types */

export type DelayRampFunction = (delay: number, nbOfAttempts: number) => number
export type UntilFunction = (response: Response) => boolean
export type RetryOptions = {
    delayTimer?: number,
    delayRamp?: DelayRampFunction,
    maxAttempts?: number,
    until?: UntilFunction
}
export type RetryMiddleware = (options?: RetryOptions) => ConfiguredMiddleware

/* Defaults */

const defaultDelayRamp = (delay, nbOfAttempts) => (
    delay * nbOfAttempts
)
const defaultUntil = response => response.ok

/**
 * ## Retry middleware
 *
 * #### Retries a request multiple times in case of an error (or until a custom condition is true).
 *
 * **Options**
 *
 * - *delayTimer* `milliseconds`
 *
 * > The timer between each attempt.
 *
 * *(default: 500)*
 *
 * - *delayRamp* `(delay, nbOfAttempts) => milliseconds`
 *
 * > The custom function that is used to calculate the actual delay based on the the timer & the number of attemps.
 *
 * *(default: delay * nbOfAttemps)*
 *
 * - *maxAttempts* `number`
 *
 * > The maximum number of retries before resolving the promise with the last error. Specifying 0 means infinite retries.
 *
 * *(default: 10)*
 *
 * - *until* `(fetch response) => boolean`
 *
 * > The request will be retried until that condition is satisfied.
 *
 * *(default: !response.ok)*
 */
export const retry: RetryMiddleware = ({
    delayTimer = 500,
    delayRamp = defaultDelayRamp,
    maxAttempts = 10,
    until = defaultUntil
} = {}) => {

    return next => (url, opts) => {
        let numberOfAttemptsMade = 0

        const checkStatus = response => {
            // If the response is unexpected
            if (!until(response.clone())) {
                numberOfAttemptsMade++

                if (!maxAttempts || numberOfAttemptsMade <= maxAttempts) {
                    // We need to recurse until we have a correct response and chain the checks
                    return new Promise(resolve => {
                        const delay = defaultDelayRamp(delayTimer, numberOfAttemptsMade)
                        setTimeout(() => {
                            resolve(next(url, opts))
                        }, delay)
                    }).then(checkStatus)
                }
            }

            // If the response is ok
            return response
        }

        // Willingly omitted .catch which prevents handling network errors and should throw
        return next(url, opts).then(checkStatus)
    }
}

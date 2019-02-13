import { ConfiguredMiddleware, WretcherOptions, Wretcher } from 'wretch'

/* Types */

export type DelayRampFunction = (delay: number, nbOfAttempts: number) => number
export type UntilFunction = (response?: Response, error?: Error) => boolean | Promise<boolean>
export type OnRetryFunctionResponse = { url?: string; options?: WretcherOptions } | undefined
export type OnRetryFunction = (args: { 
    response?: Response, 
    error?: Error, 
    url: string, 
    options: WretcherOptions 
}) => OnRetryFunctionResponse | Promise<OnRetryFunctionResponse>
export type RetryOptions = {
    delayTimer?: number,
    delayRamp?: DelayRampFunction,
    maxAttempts?: number,
    until?: UntilFunction,
    onRetry?: OnRetryFunction,
    retryOnNetworkError?: boolean
}
export type RetryMiddleware = (options?: RetryOptions) => ConfiguredMiddleware

/* Defaults */

const defaultDelayRamp = (delay, nbOfAttempts) => (
    delay * nbOfAttempts
)
const defaultUntil = (response, error) => response && response.ok

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
 * - *until* `(fetch response, error) => boolean || Promise<boolean>`
 *
 * > The request will be retried until that condition is satisfied.
 *
 * *(default: response && response.ok)*
 *
 * - *onRetry* `({ response, error, url, options }) => { url?, options? } || Promise<{url?, options?}>`
 *
 * > Callback that will get executed before retrying the request. If this function returns an object having url and/or options properties, they will override existing values in the retried request.
 *
 * *(default: null)*
 *
 * - *retryOnNetworkError* : `boolean`
 *
 * > If true, will retry the request if a network error was thrown. Will also provide an 'error' argument to the `onRetry` and `until` methods.
 *
 * *(default: false)*
 */
export const retry: RetryMiddleware = ({
    delayTimer = 500,
    delayRamp = defaultDelayRamp,
    maxAttempts = 10,
    until = defaultUntil,
    onRetry = null,
    retryOnNetworkError = false
} = {}) => {

    return next => (url, opts) => {
        let numberOfAttemptsMade = 0

        const checkStatus = (response?: Response, error?: Error) => {
            return Promise.resolve(until(response && response.clone(), error)).then(done => {
                // If the response is unexpected
                if(!done) {
                    numberOfAttemptsMade++

                    if (!maxAttempts || numberOfAttemptsMade <= maxAttempts) {
                        // We need to recurse until we have a correct response and chain the checks
                        return new Promise(resolve => {
                            const delay = delayRamp(delayTimer, numberOfAttemptsMade)
                            setTimeout(() => {
                                if(typeof onRetry === 'function') {
                                    Promise.resolve(onRetry({
                                        response: response && response.clone(),
                                        error,
                                        url,
                                        options: opts
                                    })).then((values = {}) => {
                                        resolve(next(values.url || url, values.options || opts))
                                    })
                                } else {
                                    resolve(next(url, opts))
                                }
                            }, delay)
                        }).then(checkStatus).catch(error => {
                            if(!retryOnNetworkError)
                                throw error
                            checkStatus(null, error)
                        })
                    } else {
                        return Promise.reject('Number of attempts exceeded.')
                    }
                }

                return response
            })
        }

        return next(url, opts)
            .then(checkStatus)
            .catch(error => {
                if(!retryOnNetworkError)
                    throw error
                checkStatus(null, error)
            })
    }
}

<h1 align="center">
	<a href="https://elbywan.github.io/wretch"><img src="https://cdn.rawgit.com/elbywan/wretch/08831345/wretch.svg" alt="wretch-logo" width="220px"></a><br>
	<br>
    <a href="https://elbywan.github.io/wretch">Wretch middlewares</a><br>
	<br>
  <a href="https://elbywan.github.io/wretch"><img alt="homepage-badge" src="https://img.shields.io/website-up-down-green-red/http/shields.io.svg?label=wretch-homepage"></a>
  <a href="https://www.npmjs.com/package/wretch-middlewares"><img alt="npm-badge" src="https://img.shields.io/npm/v/wretch-middlewares.svg?colorB=ff733e" height="20"></a>
  <a href="https://github.com/elbywan/wretch-middlewares/blob/master/LICENSE"><img src="https://img.shields.io/badge/license-MIT-blue.svg" alt="license-badge" height="20"></a>
</h1>
<h4 align="center">
	A collection of <a href="https://github.com/elbywan/wretch#middlewares" target="_blank">middlewares</a> for the <a href="https://github.com/elbywan/wretch" target="_blank">Wretch</a> library.
</h4>

# Installation

### Prerequisite: [install Wretch](https://github.com/elbywan/wretch#installation)

## Npm

```sh
npm i wretch-middlewares
```

## Cdn

```html
<!-- Global variable name : window.wretchMiddlewares -->
<script src="https://unpkg.com/wretch-middlewares"></script>
```

# Middlewares

| [Dedupe](#dedupe) | [Retry](#retry) | [Throttling cache](#throttling-cache) | [Delay](#delay) |
|-----|-----|-----|-----|

## Dedupe

**Prevents having multiple identical requests on the fly at the same time.**

#### Options

- *skip* : `(url, opts) => boolean`

If skip returns true, then the dedupe check is skipped.

- *key* : `(url, opts) => string`

Returns a key that is used to identify the request.

#### Usage

```js
import wretch from 'wretch'
import { dedupe } from 'wretch-middlewares'

wretch().middlewares([
    dedupe({
        /* Options - defaults below */
        skip: (url, opts) => opts.skipDedupe || opts.method !== 'GET',
        key: (url, opts) => opts.method + '@' + url
    })
])./* ... */
```

## Retry

**Retries a request multiple times in case of an error (or until a custom condition is true).**

#### Options

- *delayTimer* : `milliseconds`

The timer between each attempt.

- *delayRamp* : `(delay, nbOfAttempts) => milliseconds`

The custom function that is used to calculate the actual delay based on the the timer & the number of attemps.

- *maxAttempts* : `number`

The maximum number of retries before resolving the promise with the last error. Specifying 0 means infinite retries.

- *until* : `(fetchResponse, error) => boolean | Promise<boolean>`

The request will be retried until that condition is satisfied.

- *onRetry* : `({ response, error, url, options }) => { url?, options? } || Promise<{url?, options?}>`

Callback that will get executed before retrying the request. If this function returns an object having url and/or options properties, they will override existing values in the retried request. If it returns a Promise, it will be awaited before retrying the request.

- *retryOnNetworkError* : `boolean`

If true, will retry the request if a network error was thrown. Will also provide an 'error' argument to the `onRetry` and `until` methods.

#### Usage

```js
import wretch from 'wretch'
import { retry } from 'wretch-middlewares'

wretch().middlewares([
    retry({
        /* Options - defaults below */
        delayTimer: 500,
        delayRamp: (delay, nbOfAttempts) => delay * nbOfAttempts
        maxAttempts: 10,
        until: (response, error) => response && response.ok,
        onRetry: null,
        retryOnNetworkError: false
    })
])./* ... */

// You can also return a Promise, which is useful if you want to inspect the body:
wretch().middlewares([
    retry({
        until: response =>
            response.json().then(body =>
                body.field === 'something'
            )
    })
])
```

## Throttling cache

**A throttling cache which stores and serves server responses for a certain amount of time.**

#### Options

- *throttle* : `milliseconds`

The response will be stored for this amount of time before being deleted from the cache.

- *skip* : `(url, opts) => boolean`

If skip returns true, then the dedupe check is skipped.

- *key* : `(url, opts) => string`

Returns a key that is used to identify the request.

- *clear* `(url, opts) => boolean`

Clears the cache if true.

- *invalidate* `(url, opts) => string | RegExp | Array<string | RegExp> | null`

Removes url(s) matching the string or RegExp from the cache. Can use an array to invalidate multiple values.

- *condition* `response => boolean`

If false then the response will not be added to the cache.

- *flagResponseOnCacheHit* `string`

If set, a Response returned from the cache whill be flagged with a property name equal to this option.

#### Usage

```js
import wretch from 'wretch'
import { throttlingCache } from 'wretch-middlewares'

wretch().middlewares([
    throttlingCache({
        /* Options - defaults below */
        throttle: 1000,
        skip: opts.skipCache || opts.method !== 'GET',
        key: (url, opts) => opts.method + '@' + url,
        clear: (url, opts) => false,
        invalidate: (url, opts) => null,
        condition: response => response.ok,
        flagResponseOnCacheHit: '__cached'
    })
])./* ... */
```

## Delay

**Delays the request by a specific amount of time.**

#### Options

- *time* : `milliseconds`

The request will be delayed by that amount of time.

#### Usage

```js
import wretch from 'wretch'
import { delay } from 'wretch-middlewares'

wretch().middlewares([
    delay(1000)
])./* ... */
```

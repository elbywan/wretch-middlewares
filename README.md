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
	A collection of <a href="https://github.com/elbywan/wretch#middlewares" target="_blank">middlewares</a> for the <a href="https://github.com/wretch" target="_blank">Wretch</a> library.
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
        /* options */
    })
])./* ... */
```

## Retry

**Retries a request multiple times in case of an error (or until a custom condition is true).**

#### Options

- *delayTimer* : `milliseconds`

The timer between each attempt.

*(default: 500)*

- *delayRamp* : `(delay, nbOfAttempts) => milliseconds`

The custom function that is used to calculate the actual delay based on the the timer & the number of attemps.

*(default: delay * nbOfAttemps)*

- *maxAttempts* : `number`

The maximum number of retries before resolving the promise with the last error. Specifying 0 means infinite retries.

*(default: 10)*

- *until* : `(fetchResponse) => boolean`

The request will be retried until that condition is satisfied.

*(default: response.ok)*

#### Usage

```js
import wretch from 'wretch'
import { retry } from 'wretch-middlewares'

wretch().middlewares([
    retry({
        /* options */
    })
])./* ... */
```

## Throttling cache

**A throttling cache which stores and serves server responses for a certain amount of time.**

#### Options

- *throttle* : `milliseconds`

The response will be stored for this amount of time before being deleted from the cache

- *skip* : `(url, opts) => boolean`

If skip returns true, then the dedupe check is skipped.

- *key* : `(url, opts) => string`

Returns a key that is used to identify the request.

#### Usage

```js
import wretch from 'wretch'
import { throttlingCache } from 'wretch-middlewares'

wretch().middlewares([
    throttlingCache({
        /* options */
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
    delay(/* time */)
])./* ... */
```
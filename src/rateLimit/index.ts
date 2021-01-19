import {
  ConfiguredMiddleware,
  FetchLike,
  WretcherOptions,
  WretcherResponse,
} from 'wretch';

/* Types */

export type RateLimitMiddleware = (
  reqsPerSecond: number
) => ConfiguredMiddleware;

/**
 * ##  Rate limit middleware
 *
 * ### Restricts outbound requests to a specific rate limit, storing extra requests in a temporary in-memory queue.
 *
 * **Options**
 *
 * - *reqsPerSecond* `float`
 *
 * > Throttle outbound requests to reqsPerSecond/sec
 */
export const rateLimit: RateLimitMiddleware = (reqsPerSecond) => {
  const QUEUE: {
    res: (value: WretcherResponse | PromiseLike<WretcherResponse>) => void;
    next: FetchLike;
    url: string;
    opts: WretcherOptions;
  }[] = [];

  // We use interval vs. setTimeout because more than one request can be in-flight, it just can't start until x time has passed.
  setInterval(() => {
    if (QUEUE.length > 0) {
      const queueItem = QUEUE.shift();
      if (!queueItem) {
        return;
      }
      queueItem.res(queueItem.next(queueItem.url, queueItem.opts));
    }
  }, (1 / reqsPerSecond) * 1000);

  return (next) => (url, opts) => {
    return new Promise((res) => {
      const waiter = {
        res,
        next,
        url,
        opts,
      };
      QUEUE.push(waiter);
    });
  };
};

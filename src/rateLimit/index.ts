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

  let timeoutHandle: number | undefined;

  const executeTimeoutLoop = () => {
    // Only keep one open handle active at a time, and let it GC when the queue is empty
    // If a handle doesn't exist, start the loop
    if (!timeoutHandle) {
      timeoutHandle = setTimeout(() => {
        if (QUEUE.length > 0) {
          const queueItem = QUEUE.shift();
          if (!queueItem) {
            return;
          }
          queueItem.res(queueItem.next(queueItem.url, queueItem.opts));
          executeTimeoutLoop();
        } else {
          timeoutHandle = undefined;
        }
      }, (1 / reqsPerSecond) * 1000);
    }
  };

  return (next) => (url, opts) => {
    return new Promise((res) => {
      const waiter = {
        res,
        next,
        url,
        opts,
      };
      QUEUE.push(waiter);
      executeTimeoutLoop();
    });
  };
};

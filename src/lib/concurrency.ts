import { throwIfAborted } from "@/lib/abort";

export const DEFAULT_TRANSLATION_CONCURRENCY = 3;

type QueueItem<T> = {
  task: () => Promise<T> | T;
  signal?: AbortSignal;
  resolve: (value: T) => void;
  reject: (reason?: unknown) => void;
};

export interface ConcurrencyLimiter {
  run<T>(task: () => Promise<T> | T, signal?: AbortSignal): Promise<T>;
}

export function createConcurrencyLimiter(
  concurrency = DEFAULT_TRANSLATION_CONCURRENCY,
): ConcurrencyLimiter {
  const limit = Math.max(1, Math.floor(concurrency));
  const queue: QueueItem<unknown>[] = [];
  let active = 0;

  function pump() {
    while (active < limit && queue.length > 0) {
      const item = queue.shift()!;
      if (item.signal?.aborted) {
        item.reject(new DOMException("The operation was aborted", "AbortError"));
        continue;
      }

      active += 1;
      void Promise.resolve()
        .then(() => {
          throwIfAborted(item.signal);
          return item.task();
        })
        .then(item.resolve, item.reject)
        .finally(() => {
          active -= 1;
          pump();
        });
    }
  }

  return {
    run<T>(task: () => Promise<T> | T, signal?: AbortSignal) {
      return new Promise<T>((resolve, reject) => {
        queue.push({
          task,
          signal,
          resolve: resolve as (value: unknown) => void,
          reject,
        });
        pump();
      });
    },
  };
}

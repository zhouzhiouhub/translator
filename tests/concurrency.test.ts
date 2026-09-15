import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { createConcurrencyLimiter } from "../src/lib/concurrency.ts";

describe("concurrency limiter", () => {
  it("caps active tasks while preserving Promise.all result order", async () => {
    const limiter = createConcurrencyLimiter(2);
    let active = 0;
    let maximum = 0;

    const results = await Promise.all(
      Array.from({ length: 5 }, (_, index) =>
        limiter.run(async () => {
          active += 1;
          maximum = Math.max(maximum, active);
          await new Promise((resolve) => setTimeout(resolve, 5));
          active -= 1;
          return index;
        }),
      ),
    );

    assert.equal(maximum, 2);
    assert.deepEqual(results, [0, 1, 2, 3, 4]);
  });

  it("rejects queued work after cancellation", async () => {
    const limiter = createConcurrencyLimiter(1);
    const controller = new AbortController();
    controller.abort();

    await assert.rejects(
      limiter.run(() => "never runs", controller.signal),
      { name: "AbortError" },
    );
  });
});

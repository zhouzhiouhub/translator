import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  createAbortError,
  isAbortError,
  throwIfAborted,
} from "../src/lib/abort.ts";

describe("abort helpers", () => {
  it("detects DOM AbortError and ABORTED", () => {
    const dom = new DOMException("The operation was aborted.", "AbortError");
    assert.equal(isAbortError(dom), true);

    const custom = createAbortError();
    assert.equal(isAbortError(custom), true);
    assert.equal(isAbortError(new Error("other")), false);
  });

  it("throwIfAborted only when signal aborted", () => {
    const ac = new AbortController();
    assert.doesNotThrow(() => throwIfAborted(ac.signal));
    assert.doesNotThrow(() => throwIfAborted(undefined));

    ac.abort();
    assert.throws(() => throwIfAborted(ac.signal), (err: unknown) =>
      isAbortError(err),
    );
  });
});

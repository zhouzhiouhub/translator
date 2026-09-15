/** Shared abort helpers for long-running BYOK jobs. */

export function isAbortError(err: unknown): boolean {
  if (!err || typeof err !== "object") return false;
  if ("name" in err && (err as { name: string }).name === "AbortError") {
    return true;
  }
  return err instanceof Error && err.message === "ABORTED";
}

export function createAbortError(): Error {
  const err = new Error("ABORTED");
  err.name = "AbortError";
  return err;
}

export function throwIfAborted(signal?: AbortSignal): void {
  if (signal?.aborted) throw createAbortError();
}

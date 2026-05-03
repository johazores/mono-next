import { describe, it, expect, beforeEach } from "vitest";
import { checkRateLimit } from "@/lib/rate-limiter";

const config = { windowMs: 60_000, maxAttempts: 3 };

// Use unique identifiers per test to avoid cross-test state leakage
let counter = 0;
function uniqueId() {
  return `test-${++counter}-${Date.now()}`;
}

describe("checkRateLimit", () => {
  it("allows the first request with full remaining count", () => {
    const result = checkRateLimit(uniqueId(), "login", config);
    expect(result.allowed).toBe(true);
    expect(result.remaining).toBe(2);
  });

  it("allows requests up to maxAttempts", () => {
    const id = uniqueId();
    checkRateLimit(id, "login", config);
    checkRateLimit(id, "login", config);
    const third = checkRateLimit(id, "login", config);
    expect(third.allowed).toBe(true);
    expect(third.remaining).toBe(0);
  });

  it("blocks the request exceeding maxAttempts", () => {
    const id = uniqueId();
    checkRateLimit(id, "login", config);
    checkRateLimit(id, "login", config);
    checkRateLimit(id, "login", config);
    const fourth = checkRateLimit(id, "login", config);
    expect(fourth.allowed).toBe(false);
    expect(fourth.remaining).toBe(0);
  });

  it("returns a resetAt date in the future", () => {
    const id = uniqueId();
    const result = checkRateLimit(id, "login", config);
    expect(result.resetAt.getTime()).toBeGreaterThan(Date.now() - 1000);
  });

  it("tracks different identifiers independently", () => {
    const idA = uniqueId();
    const idB = uniqueId();
    checkRateLimit(idA, "login", config);
    checkRateLimit(idA, "login", config);
    checkRateLimit(idA, "login", config);

    const resultB = checkRateLimit(idB, "login", config);
    expect(resultB.allowed).toBe(true);
    expect(resultB.remaining).toBe(2);
  });

  it("tracks different actions independently", () => {
    const id = uniqueId();
    checkRateLimit(id, "action-a", config);
    checkRateLimit(id, "action-a", config);
    checkRateLimit(id, "action-a", config);

    const result = checkRateLimit(id, "action-b", config);
    expect(result.allowed).toBe(true);
    expect(result.remaining).toBe(2);
  });
});

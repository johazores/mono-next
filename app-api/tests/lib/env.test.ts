import { describe, it, expect, afterEach } from "vitest";

describe("getAppEnv", () => {
  const originalEnv = process.env.APP_ENV;

  afterEach(() => {
    process.env.APP_ENV = originalEnv;
  });

  // Re-import each time to get fresh module state isn't needed since
  // getAppEnv reads process.env on every call. Just import once.
  async function loadGetAppEnv() {
    // Dynamic import to avoid module caching issues with vitest
    const { getAppEnv } = await import("@/lib/env");
    return getAppEnv;
  }

  it("defaults to 'dev' when APP_ENV is not set", async () => {
    delete process.env.APP_ENV;
    const getAppEnv = await loadGetAppEnv();
    expect(getAppEnv()).toBe("dev");
  });

  it("returns 'dev' when APP_ENV is 'dev'", async () => {
    process.env.APP_ENV = "dev";
    const getAppEnv = await loadGetAppEnv();
    expect(getAppEnv()).toBe("dev");
  });

  it("returns 'production' when APP_ENV is 'production'", async () => {
    process.env.APP_ENV = "production";
    const getAppEnv = await loadGetAppEnv();
    expect(getAppEnv()).toBe("production");
  });

  it("throws for invalid APP_ENV values", async () => {
    process.env.APP_ENV = "staging";
    const getAppEnv = await loadGetAppEnv();
    expect(() => getAppEnv()).toThrow('Invalid APP_ENV "staging"');
  });

  it("throws for empty string treated as falsy (defaults to dev)", async () => {
    process.env.APP_ENV = "";
    const getAppEnv = await loadGetAppEnv();
    // Empty string is falsy, so || "dev" kicks in
    expect(getAppEnv()).toBe("dev");
  });
});

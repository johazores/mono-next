import type { RateLimitEntry, RateLimitConfig, RateLimitResult } from "@/types";

const store = new Map<string, RateLimitEntry>();

// Clean up stale entries every 5 minutes
const CLEANUP_INTERVAL = 5 * 60 * 1000;

let cleanupTimer: ReturnType<typeof setInterval> | null = null;

function ensureCleanup() {
  if (cleanupTimer) return;
  cleanupTimer = setInterval(() => {
    const now = Date.now();
    for (const [key, entry] of store) {
      entry.timestamps = entry.timestamps.filter(
        (t) => now - t < 15 * 60 * 1000,
      );
      if (entry.timestamps.length === 0) store.delete(key);
    }
  }, CLEANUP_INTERVAL);
  // Allow the process to exit even if the timer is running
  if (
    cleanupTimer &&
    typeof cleanupTimer === "object" &&
    "unref" in cleanupTimer
  ) {
    cleanupTimer.unref();
  }
}

export function checkRateLimit(
  identifier: string,
  action: string,
  config: RateLimitConfig,
): RateLimitResult {
  ensureCleanup();

  const key = `${identifier}:${action}`;
  const now = Date.now();
  const windowStart = now - config.windowMs;

  let entry = store.get(key);
  if (!entry) {
    entry = { timestamps: [] };
    store.set(key, entry);
  }

  // Remove timestamps outside the window
  entry.timestamps = entry.timestamps.filter((t) => t > windowStart);

  if (entry.timestamps.length >= config.maxAttempts) {
    const oldestInWindow = entry.timestamps[0];
    return {
      allowed: false,
      remaining: 0,
      resetAt: new Date(oldestInWindow + config.windowMs),
    };
  }

  entry.timestamps.push(now);

  return {
    allowed: true,
    remaining: config.maxAttempts - entry.timestamps.length,
    resetAt: new Date(now + config.windowMs),
  };
}

// Preset configs
export const ADMIN_LOGIN_LIMIT = { windowMs: 15 * 60 * 1000, maxAttempts: 5 };
export const USER_LOGIN_LIMIT = { windowMs: 15 * 60 * 1000, maxAttempts: 10 };

export type RateLimitEntry = {
  timestamps: number[];
};

export type RateLimitConfig = {
  windowMs: number;
  maxAttempts: number;
};

export type RateLimitResult = {
  allowed: boolean;
  remaining: number;
  resetAt: Date;
};

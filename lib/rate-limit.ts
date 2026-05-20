import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

interface RateLimitResult {
  success: boolean;
  limit: number;
  remaining: number;
  reset: number;
}

let ratelimit: {
  limit: (key: string) => Promise<RateLimitResult>;
};

const hasUpstashConfig =
  process.env.UPSTASH_REDIS_REST_URL &&
  process.env.UPSTASH_REDIS_REST_URL !== "https://placeholder.upstash.io" &&
  process.env.UPSTASH_REDIS_REST_TOKEN &&
  process.env.UPSTASH_REDIS_REST_TOKEN !== "placeholderToken";

if (hasUpstashConfig) {
  const redis = new Redis({
    url: process.env.UPSTASH_REDIS_REST_URL!,
    token: process.env.UPSTASH_REDIS_REST_TOKEN!,
  });

  const upstashRatelimit = new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(5, "10 s"), // 5 requests per 10 seconds
    analytics: true,
  });

  ratelimit = {
    limit: async (key: string) => {
      const res = await upstashRatelimit.limit(key);
      return {
        success: res.success,
        limit: res.limit,
        remaining: res.remaining,
        reset: res.reset,
      };
    },
  };
} else {
  // In-memory rate limiting fallback for local development
  const localCache = new Map<string, { count: number; reset: number }>();

  ratelimit = {
    limit: async (key: string) => {
      const now = Date.now();
      const windowMs = 10 * 1000; // 10 seconds
      const limitCount = 5;

      const record = localCache.get(key);

      if (!record || now > record.reset) {
        const newRecord = { count: 1, reset: now + windowMs };
        localCache.set(key, newRecord);
        return {
          success: true,
          limit: limitCount,
          remaining: limitCount - 1,
          reset: newRecord.reset,
        };
      }

      if (record.count >= limitCount) {
        return {
          success: false,
          limit: limitCount,
          remaining: 0,
          reset: record.reset,
        };
      }

      record.count += 1;
      return {
        success: true,
        limit: limitCount,
        remaining: limitCount - record.count,
        reset: record.reset,
      };
    },
  };

  console.warn(
    "[RATE_LIMIT] Upstash Redis credentials not configured. Using in-memory fallback rate limiter " +
    "(not shared across multiple server instances)."
  );
}

export { ratelimit };

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
  const MAX_CACHE_SIZE = 1000;

  // Periodically clean up expired entries from memory to prevent memory leaks
  if (typeof window === "undefined") {
    const interval = setInterval(() => {
      const now = Date.now();
      localCache.forEach((record, key) => {
        if (now > record.reset) {
          localCache.delete(key);
        }
      });
    }, 60 * 1000); // Check every minute
    
    // Allow Node.js process to exit even if this interval is active
    if (interval && typeof interval.unref === "function") {
      interval.unref();
    }
  }

  ratelimit = {
    limit: async (key: string) => {
      const now = Date.now();
      const windowMs = 10 * 1000; // 10 seconds
      const limitCount = 5;

      const record = localCache.get(key);

      // Clean up if expired
      if (record && now > record.reset) {
        localCache.delete(key);
      }

      const freshRecord = localCache.get(key);

      if (!freshRecord) {
        // Enforce maximum cache size to prevent OOM
        if (localCache.size >= MAX_CACHE_SIZE) {
          const oldestKey = localCache.keys().next().value;
          if (oldestKey !== undefined) {
            localCache.delete(oldestKey);
          }
        }

        const newRecord = { count: 1, reset: now + windowMs };
        localCache.set(key, newRecord);
        return {
          success: true,
          limit: limitCount,
          remaining: limitCount - 1,
          reset: newRecord.reset,
        };
      }

      if (freshRecord.count >= limitCount) {
        return {
          success: false,
          limit: limitCount,
          remaining: 0,
          reset: freshRecord.reset,
        };
      }

      freshRecord.count += 1;
      return {
        success: true,
        limit: limitCount,
        remaining: limitCount - freshRecord.count,
        reset: freshRecord.reset,
      };
    },
  };

  console.warn(
    "[RATE_LIMIT] Upstash Redis credentials not configured. Using in-memory fallback rate limiter " +
    "(with memory leak eviction policy; not shared across multiple server instances)."
  );
}

export { ratelimit };

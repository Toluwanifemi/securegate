import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

interface RateLimitResult {
  success: boolean;
  limit: number;
  remaining: number;
  reset: number;
}

const hasUpstashConfig =
  process.env.UPSTASH_REDIS_REST_URL &&
  process.env.UPSTASH_REDIS_REST_URL !== "https://placeholder.upstash.io" &&
  process.env.UPSTASH_REDIS_REST_TOKEN &&
  process.env.UPSTASH_REDIS_REST_TOKEN !== "placeholderToken";

let redis: Redis | null = null;
if (hasUpstashConfig) {
  redis = new Redis({
    url: process.env.UPSTASH_REDIS_REST_URL!,
    token: process.env.UPSTASH_REDIS_REST_TOKEN!,
  });
}

// In-memory fallback cache
const localCache = new Map<string, { count: number; reset: number }>();
const MAX_CACHE_SIZE = 1000;

if (typeof window === "undefined") {
  const interval = setInterval(() => {
    const now = Date.now();
    localCache.forEach((record, key) => {
      if (now > record.reset) {
        localCache.delete(key);
      }
    });
  }, 60 * 1000);
  if (interval && typeof interval.unref === "function") {
    interval.unref();
  }
}

type WindowString = `${number} s` | `${number} m` | `${number} h`;

function createRateLimiter(limitCount: number, windowStr: WindowString) {
  if (redis) {
    const upstashRatelimit = new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(limitCount, windowStr),
      analytics: true,
    });
    return {
      limit: async (key: string): Promise<RateLimitResult> => {
        const res = await upstashRatelimit.limit(key);
        return {
          success: res.success,
          limit: res.limit,
          remaining: res.remaining,
          reset: res.reset,
        };
      },
    };
  }

  // Parse windowStr for in-memory fallback
  const [value, unit] = windowStr.split(" ");
  let windowMs = parseInt(value, 10);
  if (unit === "s") windowMs *= 1000;
  else if (unit === "m") windowMs *= 60 * 1000;
  else if (unit === "h") windowMs *= 60 * 60 * 1000;

  return {
    limit: async (key: string): Promise<RateLimitResult> => {
      const now = Date.now();
      const record = localCache.get(key);

      if (record && now > record.reset) {
        localCache.delete(key);
      }

      const freshRecord = localCache.get(key);

      if (!freshRecord) {
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
}

if (!hasUpstashConfig) {
  console.warn(
    "[RATE_LIMIT] Upstash Redis credentials not configured. Using in-memory fallback rate limiter " +
    "(with memory leak eviction policy; not shared across multiple server instances)."
  );
}

// Export the specific limiters according to rules
export const loginRateLimit = createRateLimiter(5, "10 m");
export const registerRateLimit = createRateLimiter(3, "1 h");
export const forgotPasswordRateLimit = createRateLimiter(3, "1 h");
export const verifyEmailRateLimit = createRateLimiter(5, "15 m");
export const resetPasswordRateLimit = createRateLimiter(5, "15 m");

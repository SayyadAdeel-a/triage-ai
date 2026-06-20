import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

const hasRedisCredentials = !!(process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN);

class MockRatelimit {
  async limit() {
    return { success: true, limit: 100, remaining: 100, reset: Date.now() + 60000 };
  }
}

// Create a new ratelimiter, that allows 5 requests per 1 minute (or falls back to mock)
export const ratelimit = hasRedisCredentials
  ? new Ratelimit({
      redis: Redis.fromEnv(),
      limiter: Ratelimit.slidingWindow(5, "1 m"),
      analytics: true,
    })
  : new MockRatelimit() as unknown as Ratelimit;

import { getRedisClient } from '../config/redis.js';

const RATE_LIMIT_PREFIX = 'rl:';

interface RateLimitConfig {
  maxRequests: number;
  windowSeconds: number;
}

const API_RATE_LIMITS: Record<string, RateLimitConfig> = {
  'auth:register': { maxRequests: 5, windowSeconds: 3600 },
  'auth:login': { maxRequests: 20, windowSeconds: 300 },
  'auth:forgot-password': { maxRequests: 3, windowSeconds: 3600 },
  'rooms:create': { maxRequests: 10, windowSeconds: 60 },
  'rooms:list': { maxRequests: 60, windowSeconds: 60 },
  default: { maxRequests: 100, windowSeconds: 60 },
};

export async function checkRateLimit(
  identifier: string,
  action: string
): Promise<{ allowed: boolean; remaining: number; resetIn: number }> {
  const config = API_RATE_LIMITS[action] || API_RATE_LIMITS['default'];
  const key = `${RATE_LIMIT_PREFIX}${action}:${identifier}`;

  try {
    const redis = getRedisClient();

    const multi = redis.multi();
    multi.incr(key);
    multi.ttl(key);
    const results = await multi.exec();

    if (!results) {
      return { allowed: true, remaining: config.maxRequests, resetIn: 0 };
    }

    const count = results[0]?.[1] as number;
    const ttl = results[1]?.[1] as number;

    if (ttl === -1) {
      await redis.expire(key, config.windowSeconds);
    }

    const allowed = count <= config.maxRequests;
    const remaining = Math.max(0, config.maxRequests - count);
    const resetIn = ttl > 0 ? ttl : config.windowSeconds;

    return { allowed, remaining, resetIn };
  } catch {
    return { allowed: true, remaining: config.maxRequests, resetIn: 0 };
  }
}

export async function resetRateLimit(identifier: string, action: string): Promise<void> {
  const key = `${RATE_LIMIT_PREFIX}${action}:${identifier}`;
  try {
    const redis = getRedisClient();
    await redis.del(key);
  } catch {
    // Non-critical
  }
}

export function getRateLimitConfig(action: string): RateLimitConfig {
  return API_RATE_LIMITS[action] || API_RATE_LIMITS['default'];
}

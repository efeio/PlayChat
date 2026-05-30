/**
 * Token Bucket Rate Limiter for Socket.IO Events
 * -----------------------------------------------
 * Each socket+event combination gets its own bucket.
 * Tokens refill at a fixed rate per second.
 * If no tokens remain, the event is rate-limited.
 *
 * Uses in-memory token buckets for fast-path decisions (single instance).
 * Redis is used for cross-instance violation tracking when available.
 */

interface TokenBucket {
  tokens: number;
  lastRefill: number;
}

interface EventLimitConfig {
  maxTokens: number;
  refillRatePerSecond: number;
}

/**
 * Per-event rate limit configurations.
 * Each event type gets independent token bucket parameters.
 * Unlisted events fall back to the 'default' config.
 */
const EVENT_LIMITS: Record<string, EventLimitConfig> = {
  'message:send': {
    maxTokens: 5,
    refillRatePerSecond: 2,
  },
  'game:move': {
    maxTokens: 10,
    refillRatePerSecond: 5,
  },
  'game:start': {
    maxTokens: 2,
    refillRatePerSecond: 0.2,
  },
  'room:join': {
    maxTokens: 3,
    refillRatePerSecond: 1,
  },
  'room:leave': {
    maxTokens: 5,
    refillRatePerSecond: 2,
  },
  'room:get_state': {
    maxTokens: 5,
    refillRatePerSecond: 1,
  },
  'typing:start': {
    maxTokens: 8,
    refillRatePerSecond: 4,
  },
  'typing:stop': {
    maxTokens: 8,
    refillRatePerSecond: 4,
  },
  default: {
    maxTokens: 20,
    refillRatePerSecond: 10,
  },
};

/**
 * Internal storage: maps "socketId:eventName" -> TokenBucket
 */
const buckets = new Map<string, TokenBucket>();

/**
 * Global violation counter per socket for escalating penalties.
 * If a socket exceeds this threshold within a window, it can be force-disconnected.
 */
const violationCounts = new Map<string, { count: number; firstViolationAt: number }>();

const VIOLATION_THRESHOLD = 50;
const VIOLATION_WINDOW_MS = 60000;

/**
 * Cleanup interval handle for removing stale buckets.
 */
let cleanupIntervalHandle: NodeJS.Timeout | null = null;
const CLEANUP_INTERVAL_MS = 30000;
const BUCKET_STALE_THRESHOLD_MS = 120000;

function buildBucketKey(socketId: string, eventName: string): string {
  return `${socketId}:${eventName}`;
}

/**
 * Check if a given socket's event emission should be rate-limited.
 *
 * @param socketId - The socket.id of the emitting client.
 * @param eventName - The name of the Socket.IO event being emitted.
 * @returns `true` if the event SHOULD BE BLOCKED (rate limited); `false` if allowed.
 */
export function isRateLimited(socketId: string, eventName: string): boolean {
  const config = EVENT_LIMITS[eventName] || EVENT_LIMITS['default'];
  const key = buildBucketKey(socketId, eventName);
  const now = Date.now();

  let bucket = buckets.get(key);

  if (!bucket) {
    bucket = {
      tokens: config.maxTokens,
      lastRefill: now,
    };
    buckets.set(key, bucket);
  }

  const elapsedSeconds = (now - bucket.lastRefill) / 1000;
  bucket.tokens = Math.min(
    config.maxTokens,
    bucket.tokens + elapsedSeconds * config.refillRatePerSecond
  );
  bucket.lastRefill = now;

  if (bucket.tokens >= 1) {
    bucket.tokens -= 1;
    return false;
  }

  return true;
}

/**
 * Records a rate-limit violation for the given socket.
 * Returns `true` if the socket has exceeded the violation threshold
 * and should be force-disconnected.
 *
 * @param socketId - The offending socket's ID.
 * @returns `true` if the socket should be disconnected.
 */
export function recordViolation(socketId: string): boolean {
  const now = Date.now();
  let entry = violationCounts.get(socketId);

  if (!entry || now - entry.firstViolationAt > VIOLATION_WINDOW_MS) {
    entry = { count: 1, firstViolationAt: now };
    violationCounts.set(socketId, entry);
    return false;
  }

  entry.count += 1;

  if (entry.count >= VIOLATION_THRESHOLD) {
    violationCounts.delete(socketId);
    return true;
  }

  return false;
}

/**
 * Removes all bucket entries and violation records for a disconnected socket.
 * Call this on socket disconnect to prevent memory leaks.
 *
 * @param socketId - The socket that disconnected.
 */
export function cleanupSocket(socketId: string): void {
  for (const key of buckets.keys()) {
    if (key.startsWith(`${socketId}:`)) {
      buckets.delete(key);
    }
  }
  violationCounts.delete(socketId);
}

/**
 * Returns the remaining tokens for a socket+event combination.
 * Useful for debugging or sending rate-limit headers.
 *
 * @param socketId - Socket ID.
 * @param eventName - Event name.
 * @returns Remaining token count (floored to integer), or the max if no bucket exists.
 */
export function getRemainingTokens(socketId: string, eventName: string): number {
  const config = EVENT_LIMITS[eventName] || EVENT_LIMITS['default'];
  const key = buildBucketKey(socketId, eventName);
  const bucket = buckets.get(key);

  if (!bucket) {
    return config.maxTokens;
  }

  const now = Date.now();
  const elapsedSeconds = (now - bucket.lastRefill) / 1000;
  const current = Math.min(
    config.maxTokens,
    bucket.tokens + elapsedSeconds * config.refillRatePerSecond
  );

  return Math.floor(current);
}

/**
 * Starts a periodic cleanup interval that removes stale bucket entries.
 * Prevents unbounded memory growth from disconnected sockets
 * whose cleanup was missed.
 */
export function startCleanupInterval(): void {
  if (cleanupIntervalHandle) return;

  cleanupIntervalHandle = setInterval(() => {
    const now = Date.now();

    for (const [key, bucket] of buckets.entries()) {
      if (now - bucket.lastRefill > BUCKET_STALE_THRESHOLD_MS) {
        buckets.delete(key);
      }
    }

    for (const [socketId, entry] of violationCounts.entries()) {
      if (now - entry.firstViolationAt > VIOLATION_WINDOW_MS) {
        violationCounts.delete(socketId);
      }
    }
  }, CLEANUP_INTERVAL_MS);
}

/**
 * Stops the periodic cleanup interval.
 * Call during graceful server shutdown.
 */
export function stopCleanupInterval(): void {
  if (cleanupIntervalHandle) {
    clearInterval(cleanupIntervalHandle);
    cleanupIntervalHandle = null;
  }
}

/**
 * Records a socket ban in Redis for cross-instance enforcement.
 * Called when a socket exceeds the violation threshold.
 */
export async function recordBanInRedis(userId: string): Promise<void> {
  try {
    const { getRedisClient } = await import('../config/redis.js');
    const redis = getRedisClient();
    await redis.set(`ban:socket:${userId}`, '1', 'EX', 300);
  } catch {
    // Redis unavailable — local ban still applies
  }
}

/**
 * Checks if a user is banned across instances.
 */
export async function isUserBannedInRedis(userId: string): Promise<boolean> {
  try {
    const { getRedisClient } = await import('../config/redis.js');
    const redis = getRedisClient();
    const result = await redis.exists(`ban:socket:${userId}`);
    return result === 1;
  } catch {
    return false;
  }
}

/**
 * Returns internal stats for monitoring/observability.
 */
export function getRateLimiterStats(): {
  activeBuckets: number;
  activeViolationRecords: number;
} {
  return {
    activeBuckets: buckets.size,
    activeViolationRecords: violationCounts.size,
  };
}

import { getRedisClient } from '../config/redis.js';

const DEFAULT_TTL = 300; // 5 minutes

export async function cacheGet<T>(key: string): Promise<T | null> {
  try {
    const redis = getRedisClient();
    const data = await redis.get(key);
    if (!data) return null;
    return JSON.parse(data) as T;
  } catch {
    return null;
  }
}

export async function cacheSet(key: string, value: unknown, ttl: number = DEFAULT_TTL): Promise<void> {
  try {
    const redis = getRedisClient();
    await redis.set(key, JSON.stringify(value), 'EX', ttl);
  } catch {
    // Cache write failure is non-critical
  }
}

export async function cacheDel(key: string): Promise<void> {
  try {
    const redis = getRedisClient();
    await redis.del(key);
  } catch {
    // Non-critical
  }
}

export async function cacheDelPattern(pattern: string): Promise<void> {
  try {
    const redis = getRedisClient();
    const keys = await redis.keys(pattern);
    if (keys.length > 0) {
      await redis.del(...keys);
    }
  } catch {
    // Non-critical
  }
}

// Session management
const SESSION_PREFIX = 'session:';
const SESSION_TTL = 7 * 24 * 60 * 60; // 7 days

export async function storeSession(userId: string, token: string, metadata?: Record<string, string>): Promise<void> {
  try {
    const redis = getRedisClient();
    const key = `${SESSION_PREFIX}${userId}`;
    const sessionData = {
      token,
      lastActive: Date.now(),
      ...metadata,
    };
    await redis.set(key, JSON.stringify(sessionData), 'EX', SESSION_TTL);
  } catch {
    // Non-critical
  }
}

export async function getSession(userId: string): Promise<{ token: string; lastActive: number } | null> {
  try {
    const redis = getRedisClient();
    const key = `${SESSION_PREFIX}${userId}`;
    const data = await redis.get(key);
    if (!data) return null;
    return JSON.parse(data);
  } catch {
    return null;
  }
}

export async function invalidateSession(userId: string): Promise<void> {
  try {
    const redis = getRedisClient();
    await redis.del(`${SESSION_PREFIX}${userId}`);
  } catch {
    // Non-critical
  }
}

// Room list cache
const ROOM_LIST_KEY = 'rooms:public:list';
const ROOM_LIST_TTL = 30; // 30 seconds

export async function getCachedRoomList<T>(): Promise<T | null> {
  return cacheGet<T>(ROOM_LIST_KEY);
}

export async function setCachedRoomList(rooms: unknown): Promise<void> {
  await cacheSet(ROOM_LIST_KEY, rooms, ROOM_LIST_TTL);
}

export async function invalidateRoomListCache(): Promise<void> {
  await cacheDel(ROOM_LIST_KEY);
}

// Online presence tracking
const PRESENCE_PREFIX = 'presence:';
const PRESENCE_TTL = 120; // 2 minutes

export async function markUserOnline(userId: string): Promise<void> {
  try {
    const redis = getRedisClient();
    await redis.set(`${PRESENCE_PREFIX}${userId}`, '1', 'EX', PRESENCE_TTL);
  } catch {
    // Non-critical
  }
}

export async function markUserOffline(userId: string): Promise<void> {
  try {
    const redis = getRedisClient();
    await redis.del(`${PRESENCE_PREFIX}${userId}`);
  } catch {
    // Non-critical
  }
}

export async function isUserOnlineInRedis(userId: string): Promise<boolean> {
  try {
    const redis = getRedisClient();
    const result = await redis.exists(`${PRESENCE_PREFIX}${userId}`);
    return result === 1;
  } catch {
    return false;
  }
}

export async function refreshPresence(userId: string): Promise<void> {
  try {
    const redis = getRedisClient();
    await redis.expire(`${PRESENCE_PREFIX}${userId}`, PRESENCE_TTL);
  } catch {
    // Non-critical
  }
}

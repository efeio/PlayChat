export {
  isRateLimited,
  recordViolation,
  recordBanInRedis,
  isUserBannedInRedis,
  cleanupSocket as cleanupRateLimiterSocket,
  startCleanupInterval as startRateLimiterCleanup,
  stopCleanupInterval as stopRateLimiterCleanup,
  getRemainingTokens,
  getRateLimiterStats,
} from './rateLimiter.js';

export {
  requireAuth,
  requireRoomMembership,
  eventRequiresRoom,
  extractRoomIdFromPayload,
  isPayloadSafe,
  sanitizeString,
  validateRequiredFields,
  trackSocketRoom,
  untrackSocketRoom,
  getSocketRoom,
  isSocketInRoom,
  getGuardStats,
} from './authorizationGuard.js';

export {
  initRoomGarbageCollector,
  evaluateRoomOnLeave,
  cancelEvictionOnJoin,
  isEvictionPending,
  getPendingEvictionCount,
  shutdownGarbageCollector,
} from './roomGarbageCollector.js';

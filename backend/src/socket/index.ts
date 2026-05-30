/**
 * Socket.IO Master Entry Point
 * ------------------------------
 * Initializes the Socket.IO server with:
 * 1. Authentication timeout enforcement (BUG-013).
 * 2. Rate limiting middleware (BUG-013).
 * 3. Payload safety validation (BUG-018, BUG-015).
 * 4. Authorization guards (BUG-015).
 * 5. Token revalidation lifecycle (BUG-017).
 * 6. Connection/disconnection state tracking (BUG-003).
 * 7. Graceful handler registration without duplication (BUG-001).
 */

import { Server } from 'socket.io';
import type { Server as HttpServer } from 'http';
import jwt from 'jsonwebtoken';
import env from '../infrastructure/config/env.js';
import type { JwtPayload } from '../modules/auth/index.js';
import { registerRoomSocketHandlers } from '../modules/room/index.js';
import { registerGameSocketHandlers, cancelDisconnectTimer } from '../modules/game/index.js';
import { registerNotificationHandlers } from './handlers/notification.handler.js';
import {
  isRateLimited,
  recordViolation,
  recordBanInRedis,
  isUserBannedInRedis,
  cleanupSocket as cleanupRateLimiterSocket,
  startCleanupInterval as startRateLimiterCleanup,
  stopCleanupInterval as stopRateLimiterCleanup,
} from '../infrastructure/socket/rateLimiter.js';
import {
  isPayloadSafe,
  untrackSocketRoom,
} from '../infrastructure/socket/authorizationGuard.js';
import {
  initRoomGarbageCollector,
  shutdownGarbageCollector,
} from '../infrastructure/socket/roomGarbageCollector.js';

/**
 * Authentication timeout: sockets that don't authenticate
 * within this window are force-disconnected.
 */
const AUTH_TIMEOUT_MS = 10000;

/**
 * Token revalidation interval: periodically verify tokens
 * haven't expired on long-lived connections.
 */
const TOKEN_REVALIDATION_INTERVAL_MS = 60000;

/**
 * Tracks userId -> Set<socketId> for O(1) multi-tab presence checks.
 */
const userSockets = new Map<string, Set<string>>();

/**
 * Reverse map: socketId -> userId for O(1) untrack lookups.
 */
const socketToUser = new Map<string, string>();

/**
 * Handle for the periodic token revalidation loop.
 */
let revalidationIntervalHandle: NodeJS.Timeout | null = null;

/**
 * Registers a socket under its user for presence tracking.
 */
function trackUserSocket(userId: string, socketId: string): void {
  let sockets = userSockets.get(userId);
  if (!sockets) {
    sockets = new Set();
    userSockets.set(userId, sockets);
  }
  sockets.add(socketId);
  socketToUser.set(socketId, userId);
}

/**
 * Unregisters a socket from its user. O(1) via reverse lookup map.
 */
function untrackUserSocket(socketId: string): string | undefined {
  const userId = socketToUser.get(socketId);
  if (!userId) return undefined;

  socketToUser.delete(socketId);
  const sockets = userSockets.get(userId);
  if (sockets) {
    sockets.delete(socketId);
    if (sockets.size === 0) {
      userSockets.delete(userId);
    }
  }
  return userId;
}

/**
 * Checks if a user has any active socket connections.
 */
export function isUserOnline(userId: string): boolean {
  const sockets = userSockets.get(userId);
  return !!sockets && sockets.size > 0;
}

/**
 * Returns the count of active sockets for a user.
 */
export function getUserSocketCount(userId: string): number {
  return userSockets.get(userId)?.size || 0;
}

/**
 * System-level events that bypass rate limiting and payload checks.
 */
const SYSTEM_EVENTS = new Set([
  'authenticate',
  'disconnect',
  'disconnecting',
  'connect',
  'connect_error',
  'ping',
]);

/**
 * Initializes and configures the Socket.IO server.
 *
 * @param httpServer - The underlying Node.js HTTP server from Fastify.
 * @returns The configured Socket.IO Server instance.
 */
export function initSocket(httpServer: HttpServer): Server {
  const isDevWildcard = env.CORS_ORIGIN === '*';
  const io = new Server(httpServer, {
    cors: {
      origin: isDevWildcard ? true : env.CORS_ORIGIN,
      methods: ['GET', 'POST'],
      credentials: !isDevWildcard,
    },
    pingInterval: 25000,
    pingTimeout: 20000,
    maxHttpBufferSize: 1e6,
    connectionStateRecovery: {
      maxDisconnectionDuration: 2 * 60 * 1000,
      skipMiddlewares: true,
    },
  });

  startRateLimiterCleanup();
  startTokenRevalidation(io);
  initRoomGarbageCollector(io);

  io.on('connection', (socket) => {
    /**
     * Synchronous flag to prevent duplicate authentication.
     * Handles the race condition where the client sends multiple
     * 'authenticate' events before the first one completes.
     */
    let authenticationInProgress = false;

    /**
     * Authentication timeout.
     * If the socket doesn't authenticate within AUTH_TIMEOUT_MS,
     * it is force-disconnected to prevent resource exhaustion.
     */
    const authTimeout = setTimeout(() => {
      if (!socket.data.authenticated) {
        socket.emit('error', { message: 'Authentication timeout — disconnecting' });
        socket.disconnect(true);
      }
    }, AUTH_TIMEOUT_MS);

    /**
     * Per-socket middleware: rate limiting + payload validation.
     * Unlike onAny, socket.use() can block event propagation via next(error).
     */
    socket.use(([eventName, ...args], next) => {
      if (SYSTEM_EVENTS.has(eventName)) return next();

      if (!socket.data.authenticated) {
        return next(new Error('Not authenticated'));
      }

      if (isRateLimited(socket.id, eventName)) {
        const shouldDisconnect = recordViolation(socket.id);
        socket.emit('error', { message: 'Rate limit exceeded' });
        if (shouldDisconnect) {
          socket.emit('error', { message: 'Too many violations — disconnecting' });
          if (socket.data.userId) {
            recordBanInRedis(socket.data.userId as string);
          }
          socket.disconnect(true);
        }
        return next(new Error('Rate limit exceeded'));
      }

      for (const arg of args) {
        if (arg !== null && arg !== undefined && typeof arg === 'object' && typeof arg !== 'function') {
          if (!isPayloadSafe(arg)) {
            socket.emit('error', { message: 'Invalid payload rejected' });
            return next(new Error('Invalid payload'));
          }
        }
      }

      next();
    });

    /**
     * Authentication handler.
     * Verifies JWT, sets socket metadata, and registers event handlers.
     *
     * The `authenticationInProgress` flag prevents duplicate registration
     * if the client sends multiple authenticate events rapidly.
     */
    socket.on('authenticate', async (data: { token: string }, callback?: (res: { error?: string }) => void) => {
      if (socket.data.authenticated) {
        if (callback) callback({});
        return;
      }

      if (authenticationInProgress) {
        if (callback) callback({});
        return;
      }

      authenticationInProgress = true;

      if (!data || typeof data.token !== 'string' || data.token.length === 0) {
        authenticationInProgress = false;
        socket.emit('error', { message: 'Token required' });
        if (callback) callback({ error: 'Token required' });
        return;
      }

      if (data.token.length > 2048) {
        authenticationInProgress = false;
        socket.emit('error', { message: 'Token too large' });
        if (callback) callback({ error: 'Token too large' });
        return;
      }

      try {
        const decoded = jwt.verify(data.token, env.JWT_SECRET) as JwtPayload;

        if (!decoded.userId || !decoded.username) {
          authenticationInProgress = false;
          socket.emit('error', { message: 'Invalid token payload' });
          if (callback) callback({ error: 'Invalid token payload' });
          return;
        }

        const banned = await isUserBannedInRedis(decoded.userId);
        if (banned) {
          authenticationInProgress = false;
          socket.emit('error', { message: 'Temporarily banned due to rate limit violations' });
          if (callback) callback({ error: 'Temporarily banned' });
          socket.disconnect(true);
          return;
        }

        socket.data.userId = decoded.userId;
        socket.data.username = decoded.username;
        socket.data.authenticated = true;
        socket.data.authenticatedAt = Date.now();
        socket.data.rawToken = data.token;

        clearTimeout(authTimeout);

        trackUserSocket(decoded.userId, socket.id);
        cancelDisconnectTimer(decoded.userId);

        registerRoomSocketHandlers(io, socket);
        registerGameSocketHandlers(io, socket);
        registerNotificationHandlers(io, socket);

        socket.emit('authenticated', {
          userId: decoded.userId,
          username: decoded.username,
        });

        if (callback) callback({});
      } catch (error) {
        authenticationInProgress = false;

        let errorMessage = 'Authentication failed';
        if (error instanceof jwt.TokenExpiredError) {
          errorMessage = 'Token expired';
        } else if (error instanceof jwt.JsonWebTokenError) {
          errorMessage = 'Invalid token';
        }

        socket.emit('error', { message: errorMessage });
        if (callback) callback({ error: errorMessage });
      }
    });

    /**
     * Ping handler for latency measurement.
     * Bypasses all middleware since it's in SYSTEM_EVENTS.
     */
    socket.on('ping', (_data: unknown, callback?: () => void) => {
      if (callback) callback();
    });

    /**
     * Disconnect lifecycle handler.
     * Cleans up all tracking state for this socket:
     * - User presence tracking
     * - Rate limiter buckets
     * - Room tracking
     * - Authentication timeout
     */
    socket.on('disconnect', () => {
      clearTimeout(authTimeout);

      if (socket.data.authenticated) {
        untrackUserSocket(socket.id);
      }

      cleanupRateLimiterSocket(socket.id);
    });
  });

  return io;
}

/**
 * Starts periodic token revalidation.
 * Every TOKEN_REVALIDATION_INTERVAL_MS, iterates all connected sockets
 * and verifies their stored token hasn't expired.
 *
 * Sockets with expired tokens are gracefully notified and disconnected.
 *
 * @param io - The Socket.IO server instance.
 */
function startTokenRevalidation(io: Server): void {
  if (revalidationIntervalHandle) return;

  revalidationIntervalHandle = setInterval(async () => {
    let sockets;
    try {
      sockets = await io.fetchSockets();
    } catch {
      return;
    }

    for (const socket of sockets) {
      if (!socket.data.authenticated) continue;
      if (!socket.data.rawToken) continue;

      try {
        jwt.verify(socket.data.rawToken as string, env.JWT_SECRET);
      } catch (error) {
        if (error instanceof jwt.TokenExpiredError) {
          socket.emit('session:expired', { reason: 'token_expired' });
        } else {
          socket.emit('session:expired', { reason: 'token_invalid' });
        }
        socket.emit('error', { message: 'Session expired — please re-authenticate' });
        socket.disconnect(true);
      }
    }
  }, TOKEN_REVALIDATION_INTERVAL_MS);
}

/**
 * Stops the token revalidation interval.
 * Call during graceful shutdown.
 */
export function stopTokenRevalidation(): void {
  if (revalidationIntervalHandle) {
    clearInterval(revalidationIntervalHandle);
    revalidationIntervalHandle = null;
  }
}

/**
 * Graceful shutdown procedure for the socket subsystem.
 * Stops all intervals and cleans up resources.
 *
 * @param io - The Socket.IO server instance.
 */
export function shutdownSocketSubsystem(io: Server): void {
  stopTokenRevalidation();
  stopRateLimiterCleanup();
  shutdownGarbageCollector();
  io.close();
}

/**
 * Returns presence information for monitoring.
 */
export function getPresenceStats(): {
  onlineUsers: number;
  totalSockets: number;
} {
  let totalSockets = 0;
  for (const sockets of userSockets.values()) {
    totalSockets += sockets.size;
  }
  return {
    onlineUsers: userSockets.size,
    totalSockets,
  };
}

export { userSockets };

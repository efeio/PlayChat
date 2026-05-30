import Fastify from 'fastify';
import cors from '@fastify/cors';
import { registerAuthRoutes, authenticate } from './modules/auth/index.js';
import { registerRoomRoutes } from './modules/room/index.js';
import { listNotifications, markNotificationRead, markAllNotificationsRead } from './controllers/notification.controller.js';
import { getProfile, updateProfile, getUserStats } from './controllers/user.controller.js';
import prisma from './infrastructure/config/prisma.js';
import { rateLimitMiddleware } from './infrastructure/middleware/rateLimitMiddleware.js';
import { errorHandler } from './infrastructure/middleware/errorHandler.js';
import { GameType } from '@prisma/client';
import { initSocket, shutdownSocketSubsystem } from './socket/index.js';
import {
  rehydrateActiveGames,
  startSnapshotInterval,
  stopSnapshotInterval,
} from './modules/game/index.js';
import { connectRedis, disconnectRedis } from './infrastructure/config/redis.js';
import env from './infrastructure/config/env.js';

process.on('unhandledRejection', (reason) => {
  console.error('[UnhandledRejection]', reason);
});

process.on('uncaughtException', (error) => {
  console.error('[UncaughtException]', error);
  process.exit(1);
});

async function main() {
  const app = Fastify({
    logger: true,
  });

  const isDevWildcard = env.CORS_ORIGIN === '*';
  await app.register(cors, {
    origin: isDevWildcard ? true : env.CORS_ORIGIN,
    credentials: !isDevWildcard,
  });

  app.setErrorHandler(errorHandler);

  // Redis connection (non-blocking — app works without Redis in degraded mode)
  try {
    await connectRedis();
    app.log.info('Redis connected');
  } catch (err) {
    app.log.warn('Redis connection failed — running without cache/rate-limiting');
  }

  // Apply rate limiting — runs after authenticate so request.user is available
  app.addHook('preHandler', rateLimitMiddleware);

  registerAuthRoutes(app);
  registerRoomRoutes(app);

  // Notification routes
  app.get('/api/notifications', { preHandler: [authenticate] }, listNotifications);
  app.put<{ Params: { id: string } }>('/api/notifications/:id/read', { preHandler: [authenticate] }, markNotificationRead as any);
  app.put('/api/notifications/read-all', { preHandler: [authenticate] }, markAllNotificationsRead);

  // User routes
  app.get('/api/users/me', { preHandler: [authenticate] }, async (request, reply) => {
    const userId = (request as any).user?.userId;
    if (!userId) return reply.status(401).send({ error: 'Authentication required' });
    (request.params as any) = { id: userId };
    return getProfile(request as any, reply);
  });
  app.get<{ Params: { id: string } }>('/api/users/:id', getProfile as any);
  app.put('/api/users/me', { preHandler: [authenticate] }, updateProfile as any);
  app.get<{ Params: { id: string } }>('/api/users/:id/stats', getUserStats as any);

  // Leaderboard
  app.get('/api/leaderboard', async (request, reply) => {
    const { game } = request.query as { game?: string };

    const FILTER_MAP: Record<string, GameType> = {
      'global': 'GENERAL' as GameType,
      'tic-tac-toe': 'TIC_TAC_TOE' as GameType,
      'connect-four': 'CONNECT_FOUR' as GameType,
      'wordle': 'WORDLE' as GameType,
      'memory-cards': 'MEMORY_CARDS' as GameType,
      'hangman': 'HANGMAN' as GameType,
      'number-guess': 'NUMBER_GUESS' as GameType,
      'rock-paper-scissors': 'ROCK_PAPER_SCISSORS' as GameType,
    };

    const gameType = FILTER_MAP[game || 'global'] || ('GENERAL' as GameType);

    const stats = await prisma.userStats.findMany({
      where: {
        gameType,
        gamesPlayed: { gt: 0 },
      },
      include: {
        user: { select: { id: true, username: true, displayName: true } },
      },
      orderBy: { wins: 'desc' },
      take: 50,
    });

    const entries = stats.map((s, i) => ({
      rank: i + 1,
      userId: s.userId,
      username: s.user.username,
      displayName: s.user.displayName,
      totalMatches: s.gamesPlayed,
      wins: s.wins,
      losses: s.losses,
      winRate: s.gamesPlayed > 0 ? Math.round((s.wins / s.gamesPlayed) * 100) : 0,
    }));

    return reply.send(entries);
  });

  app.get('/api/health', async () => {
    return { status: 'ok', timestamp: new Date().toISOString() };
  });

  await app.listen({ port: env.PORT, host: '0.0.0.0' });

  const io = initSocket(app.server);

  const rehydrated = await rehydrateActiveGames();
  if (rehydrated > 0) {
    app.log.info(`Rehydrated ${rehydrated} active game(s) from database`);
  }
  startSnapshotInterval();

  let isShuttingDown = false;
  const shutdown = async () => {
    if (isShuttingDown) return;
    isShuttingDown = true;

    app.log.info('Shutting down gracefully...');

    const forceExitTimer = setTimeout(() => {
      app.log.error('Graceful shutdown timed out, forcing exit');
      process.exit(1);
    }, 15000);
    forceExitTimer.unref();

    await stopSnapshotInterval();
    shutdownSocketSubsystem(io);
    await disconnectRedis();
    await prisma.$disconnect();
    await app.close();
    process.exit(0);
  };

  process.on('SIGTERM', shutdown);
  process.on('SIGINT', shutdown);
}

main().catch((err) => {
  process.stderr.write(`Failed to start server: ${err}\n`);
  process.exit(1);
});

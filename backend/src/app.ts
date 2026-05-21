import Fastify from 'fastify';
import cors from '@fastify/cors';
import {
  register,
  login,
  googleOAuthStart,
  googleOAuthCallback,
  verifyEmailHandler,
  resendVerificationHandler,
  forgotPasswordHandler,
  resetPasswordHandler,
} from './controllers/auth.controller.js';
import { list, create, getById, myRooms, verifyPassword } from './controllers/room.controller.js';
import { listNotifications, markNotificationRead, markAllNotificationsRead } from './controllers/notification.controller.js';
import { getProfile, updateProfile, getUserStats } from './controllers/user.controller.js';
import { authenticate } from './middleware/authenticate.js';
import { rateLimitMiddleware } from './middleware/rateLimitMiddleware.js';
import { errorHandler } from './middleware/errorHandler.js';
import env from './config/env.js';

export async function buildApp() {
  const app = Fastify({
    logger: true,
  });

  await app.register(cors, {
    origin: env.CORS_ORIGIN,
    credentials: true,
  });

  app.setErrorHandler(errorHandler);
  app.addHook('onRequest', rateLimitMiddleware);

  // Auth routes
  app.post('/api/auth/register', register as any);
  app.post('/api/auth/login', login as any);
  app.get('/api/auth/google', googleOAuthStart);
  app.get('/api/auth/google/callback', googleOAuthCallback as any);
  app.post('/api/auth/verify-email', verifyEmailHandler as any);
  app.post('/api/auth/resend-verification', resendVerificationHandler as any);
  app.post('/api/auth/forgot-password', forgotPasswordHandler as any);
  app.post('/api/auth/reset-password', resetPasswordHandler as any);

  // Room routes
  app.get('/api/rooms', list);
  app.post<{ Body: { name: string; description?: string; type?: string; password?: string; maxMembers?: number } }>('/api/rooms', { preHandler: [authenticate] }, create as any);
  app.get('/api/rooms/my-rooms', { preHandler: [authenticate] }, myRooms);
  app.get('/api/rooms/:id', getById);
  app.post<{ Params: { id: string }; Body: { password: string } }>('/api/rooms/:id/verify', verifyPassword as any);

  // Notification routes
  app.get('/api/notifications', { preHandler: [authenticate] }, listNotifications);
  app.put<{ Params: { id: string } }>('/api/notifications/:id/read', { preHandler: [authenticate] }, markNotificationRead as any);
  app.put('/api/notifications/read-all', { preHandler: [authenticate] }, markAllNotificationsRead);

  // User routes
  app.get<{ Params: { id: string } }>('/api/users/:id', getProfile as any);
  app.put('/api/users/me', { preHandler: [authenticate] }, updateProfile as any);
  app.get<{ Params: { id: string } }>('/api/users/:id/stats', getUserStats as any);

  app.get('/api/health', async () => {
    return { status: 'ok', timestamp: new Date().toISOString() };
  });

  return app;
}

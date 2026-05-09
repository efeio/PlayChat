import Fastify from 'fastify';
import cors from '@fastify/cors';
import { register, login } from './controllers/auth.controller.js';
import { list, create, getById } from './controllers/room.controller.js';
import { authenticate } from './middleware/authenticate.js';
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

  /* Auth routes */
  app.post('/api/auth/register', register);
  app.post('/api/auth/login', login);

  /* Room routes */
  app.get('/api/rooms', list);
  app.post<{ Body: { name: string; type?: string; maxMembers?: number; } }>('/api/rooms', { preHandler: [authenticate] }, create);
  app.get<{ Params: { id: string } }>('/api/rooms/:id', getById);

  /* Health check */
  app.get('/api/health', async () => {
    return { status: 'ok', timestamp: new Date().toISOString() };
  });

  return app;
}

import type { FastifyInstance } from 'fastify';
import { authenticate } from '../middleware/authenticate.js';
import { list, create, getById } from '../controllers/room.controller.js';

export async function roomRoutes(app: FastifyInstance) {
  app.get('/api/rooms', list);
  app.post<{ Body: { name: string; type?: string; maxMembers?: number; } }>('/api/rooms', { preHandler: [authenticate] }, create);
  app.get<{ Params: { id: string } }>('/api/rooms/:id', getById);
}

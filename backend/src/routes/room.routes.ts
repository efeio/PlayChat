import type { FastifyInstance } from 'fastify';
import { authenticate } from '../middleware/authenticate.js';
import { list, create, getById } from '../controllers/room.controller.js';

export async function roomRoutes(app: FastifyInstance) {
  app.get('/api/rooms', list);
  app.post('/api/rooms', { preHandler: [authenticate] }, create);
  app.get('/api/rooms/:id', getById);
}

import type { FastifyInstance } from 'fastify';
import { authenticate } from '../auth/index.js';
import { list, create, getById, myRooms, verifyPassword } from './room.controller.js';

export function registerRoomRoutes(app: FastifyInstance): void {
  app.get('/api/rooms', list);
  app.post<{ Body: { name: string; description?: string; type?: string; password?: string; maxMembers?: number } }>(
    '/api/rooms',
    { preHandler: [authenticate] },
    create as any
  );
  app.get('/api/rooms/my-rooms', { preHandler: [authenticate] }, myRooms);
  app.get<{ Params: { id: string } }>('/api/rooms/:id', getById);
  app.post<{ Params: { id: string }; Body: { password: string } }>(
    '/api/rooms/:id/verify',
    verifyPassword as any
  );
}

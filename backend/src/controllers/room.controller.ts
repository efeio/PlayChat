import type { FastifyRequest, FastifyReply } from 'fastify';
import { createRoom, listRooms, getRoomById } from '../services/room.service.js';

interface CreateRoomBody {
  name: string;
  type?: string;
  maxMembers?: number;
}

interface RoomParams {
  id: string;
}

export async function list(
  _request: FastifyRequest,
  reply: FastifyReply
) {
  const rooms = await listRooms();
  return reply.send(rooms);
}

export async function create(
  request: FastifyRequest<{ Body: CreateRoomBody }>,
  reply: FastifyReply
) {
  const { name, type, maxMembers } = request.body;

  if (!name) {
    return reply.status(400).send({ error: 'Room name is required' });
  }

  if (!request.user) {
    return reply.status(401).send({ error: 'Authentication required' });
  }

  try {
    const room = await createRoom({
      name,
      type,
      maxMembers,
      ownerId: request.user.userId,
    });
    return reply.status(201).send(room);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to create room';
    return reply.status(400).send({ error: message });
  }
}

export async function getById(
  request: FastifyRequest<{ Params: RoomParams }>,
  reply: FastifyReply
) {
  const room = await getRoomById(request.params.id);

  if (!room) {
    return reply.status(404).send({ error: 'Room not found' });
  }

  return reply.send(room);
}

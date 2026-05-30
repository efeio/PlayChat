import type { FastifyRequest, FastifyReply } from 'fastify';
import prisma from '../../infrastructure/config/prisma.js';
import { createRoom, listRooms, getRoomById, verifyRoomPassword } from './room.service.js';
import { RoomType } from '@prisma/client';

interface CreateRoomBody {
  name: string;
  description?: string;
  type?: string;
  password?: string;
  maxMembers?: number;
}

interface RoomParams {
  id: string;
}

interface VerifyPasswordBody {
  password: string;
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
  const { name, description, type, password, maxMembers } = request.body;

  if (!name) {
    return reply.status(400).send({ error: 'Room name is required' });
  }

  if (!request.user) {
    return reply.status(401).send({ error: 'Authentication required' });
  }

  const roomType = type === 'PRIVATE' ? RoomType.PRIVATE : RoomType.PUBLIC;

  if (roomType === RoomType.PRIVATE && !password) {
    return reply.status(400).send({ error: 'Password is required for private rooms' });
  }

  try {
    const room = await createRoom({
      name,
      description,
      type: roomType,
      password,
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

export async function myRooms(
  request: FastifyRequest,
  reply: FastifyReply
) {
  if (!request.user) {
    return reply.status(401).send({ error: 'Authentication required' });
  }

  const memberships = await prisma.roomMember.findMany({
    where: { userId: request.user.userId },
    include: {
      room: {
        include: {
          members: {
            include: { user: { select: { id: true, username: true, displayName: true, avatarUrl: true } } },
          },
        },
      },
    },
    orderBy: { joinedAt: 'desc' },
  });

  const rooms = memberships.map((m) => ({
    ...m.room,
    userRole: m.role,
  }));

  return reply.send(rooms);
}

export async function verifyPassword(
  request: FastifyRequest<{ Params: RoomParams; Body: VerifyPasswordBody }>,
  reply: FastifyReply
) {
  const { id } = request.params;
  const { password } = request.body;

  if (!password) {
    return reply.status(400).send({ error: 'Password is required' });
  }

  const valid = await verifyRoomPassword(id, password);

  if (!valid) {
    return reply.status(401).send({ error: 'Invalid password' });
  }

  return reply.send({ success: true });
}

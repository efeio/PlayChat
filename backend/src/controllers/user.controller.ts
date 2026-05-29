import type { FastifyRequest, FastifyReply } from 'fastify';
import prisma from '../config/prisma.js';

export async function getProfile(
  request: FastifyRequest<{ Params: { id: string } }>,
  reply: FastifyReply
) {
  const isOwnProfile = request.user?.userId === request.params.id;

  const user = await prisma.user.findUnique({
    where: { id: request.params.id },
    select: {
      id: true,
      username: true,
      displayName: true,
      email: isOwnProfile,
      avatarUrl: true,
      isVerified: true,
      createdAt: true,
      stats: {
        orderBy: { gameType: 'asc' },
      },
    },
  });

  if (!user) {
    return reply.status(404).send({ error: 'User not found' });
  }

  return reply.send(user);
}

export async function updateProfile(
  request: FastifyRequest<{ Body: { displayName?: string; avatarUrl?: string } }>,
  reply: FastifyReply
) {
  if (!request.user) {
    return reply.status(401).send({ error: 'Authentication required' });
  }

  const { displayName, avatarUrl } = request.body;

  const updateData: Record<string, string> = {};

  if (displayName) {
    const trimmed = displayName.trim();
    if (trimmed.length < 2 || trimmed.length > 30) {
      return reply.status(400).send({ error: 'Display name must be 2-30 characters' });
    }
    updateData.displayName = trimmed;
  }

  if (avatarUrl !== undefined) {
    if (avatarUrl && avatarUrl.length > 500) {
      return reply.status(400).send({ error: 'Avatar URL too long' });
    }
    if (avatarUrl && !/^https?:\/\/.+/.test(avatarUrl)) {
      return reply.status(400).send({ error: 'Invalid avatar URL' });
    }
    updateData.avatarUrl = avatarUrl;
  }

  if (Object.keys(updateData).length === 0) {
    return reply.status(400).send({ error: 'No fields to update' });
  }

  const user = await prisma.user.update({
    where: { id: request.user.userId },
    data: updateData,
    select: {
      id: true,
      username: true,
      displayName: true,
      email: true,
      avatarUrl: true,
      isVerified: true,
    },
  });

  return reply.send(user);
}

export async function getUserStats(
  request: FastifyRequest<{ Params: { id: string } }>,
  reply: FastifyReply
) {
  const stats = await prisma.userStats.findMany({
    where: { userId: request.params.id },
    orderBy: { gameType: 'asc' },
  });

  if (stats.length === 0) {
    return reply.status(404).send({ error: 'Stats not found' });
  }

  return reply.send(stats);
}

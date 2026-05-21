import type { FastifyRequest, FastifyReply } from 'fastify';
import {
  getUserNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
} from '../services/notification.service.js';

export async function listNotifications(
  request: FastifyRequest,
  reply: FastifyReply
) {
  if (!request.user) {
    return reply.status(401).send({ error: 'Authentication required' });
  }

  const notifications = await getUserNotifications(request.user.userId);
  const unreadCount = await getUnreadCount(request.user.userId);

  return reply.send({ notifications, unreadCount });
}

export async function markNotificationRead(
  request: FastifyRequest<{ Params: { id: string } }>,
  reply: FastifyReply
) {
  if (!request.user) {
    return reply.status(401).send({ error: 'Authentication required' });
  }

  try {
    await markAsRead(request.params.id, request.user.userId);
    return reply.send({ success: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to mark as read';
    return reply.status(400).send({ error: message });
  }
}

export async function markAllNotificationsRead(
  request: FastifyRequest,
  reply: FastifyReply
) {
  if (!request.user) {
    return reply.status(401).send({ error: 'Authentication required' });
  }

  await markAllAsRead(request.user.userId);
  return reply.send({ success: true });
}

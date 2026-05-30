import prisma from '../infrastructure/config/prisma.js';

export interface CreateNotificationInput {
  userId: string;
  senderId: string;
  roomId: string;
}

export async function createNotification(input: CreateNotificationInput) {
  const existing = await prisma.notification.findFirst({
    where: {
      userId: input.userId,
      senderId: input.senderId,
      roomId: input.roomId,
      isRead: false,
    },
  });

  if (existing) {
    return existing;
  }

  return prisma.notification.create({
    data: {
      userId: input.userId,
      senderId: input.senderId,
      roomId: input.roomId,
    },
    include: {
      sender: { select: { id: true, username: true, displayName: true, avatarUrl: true } },
      room: { select: { id: true, name: true, type: true } },
    },
  });
}

export async function getUserNotifications(userId: string) {
  return prisma.notification.findMany({
    where: { userId },
    include: {
      sender: { select: { id: true, username: true, displayName: true, avatarUrl: true } },
      room: { select: { id: true, name: true, type: true, isActive: true } },
    },
    orderBy: { createdAt: 'desc' },
    take: 50,
  });
}

export async function getUnreadCount(userId: string): Promise<number> {
  return prisma.notification.count({
    where: { userId, isRead: false },
  });
}

export async function markAsRead(notificationId: string, userId: string) {
  const notification = await prisma.notification.findFirst({
    where: { id: notificationId, userId },
  });

  if (!notification) {
    throw new Error('Notification not found');
  }

  return prisma.notification.update({
    where: { id: notificationId },
    data: { isRead: true },
  });
}

export async function markAllAsRead(userId: string) {
  return prisma.notification.updateMany({
    where: { userId, isRead: false },
    data: { isRead: true },
  });
}

import type { Server, Socket } from 'socket.io';
import prisma from '../../infrastructure/config/prisma.js';
import { createNotification } from '../../services/notification.service.js';

export function registerNotificationHandlers(io: Server, socket: Socket) {
  const userId = (socket.data as { userId: string }).userId;

  socket.on('notification:invite', async (
    data: { targetUserId: string; roomId: string },
    callback?: (res: { error?: string }) => void
  ) => {
    try {
      const { targetUserId, roomId } = data;

      if (!targetUserId || !roomId) {
        if (callback) callback({ error: 'targetUserId and roomId are required' });
        return;
      }

      if (targetUserId === userId) {
        if (callback) callback({ error: 'Cannot invite yourself' });
        return;
      }

      const room = await prisma.room.findUnique({
        where: { id: roomId },
        select: { id: true, isActive: true, name: true },
      });

      if (!room || !room.isActive) {
        if (callback) callback({ error: 'Room not found or inactive' });
        return;
      }

      const membership = await prisma.roomMember.findFirst({
        where: { userId, roomId },
      });

      if (!membership) {
        if (callback) callback({ error: 'You must be in the room to send invitations' });
        return;
      }

      const targetUser = await prisma.user.findUnique({
        where: { id: targetUserId },
        select: { id: true },
      });

      if (!targetUser) {
        if (callback) callback({ error: 'Target user not found' });
        return;
      }

      const notification = await createNotification({
        userId: targetUserId,
        senderId: userId,
        roomId,
      });

      const targetSockets = await io.fetchSockets();
      for (const s of targetSockets) {
        if ((s.data as { userId?: string }).userId === targetUserId) {
          s.emit('notification:received', notification);
        }
      }

      if (callback) callback({});
    } catch {
      if (callback) callback({ error: 'Failed to send invitation' });
    }
  });
}

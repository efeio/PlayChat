import type { Server, Socket } from 'socket.io';
import prisma from '../../config/prisma.js';
import {
  addMemberToRoom,
  removeMemberFromRoom,
} from '../../services/room.service.js';
import { handlePlayerLeftRoom } from './game.handler.js';
import { getActiveGame } from '../../services/gameState.service.js';
import {
  trackSocketRoom,
  untrackSocketRoom,
  getSocketRoom,
  sanitizeString,
} from '../authorizationGuard.js';
import {
  evaluateRoomOnLeave,
  cancelEvictionOnJoin,
} from '../roomGarbageCollector.js';
import type { GameState } from '../../games/GameEngine.js';
import { GameStatus, MemberRole, MessageType } from '@prisma/client';

interface RoomStateResponse {
  room: {
    id: string;
    name: string;
    type: string;
    maxMembers: number;
  };
  members: Array<{
    userId: string;
    username: string;
    displayName: string;
    role: string;
    isOnline: boolean;
  }>;
  messages: Array<{
    id: string;
    content: string;
    type: string;
    userId: string | null;
    username: string;
    displayName: string;
    createdAt: string;
  }>;
  activeGame: {
    gameId: string;
    gameType: string;
    status: string;
    state: GameState;
    players: Array<{
      userId: string;
      username: string;
      displayName: string;
      role: string;
      symbol: string | null;
    }>;
  } | null;
  userRole: string;
}

export function registerRoomHandlers(io: Server, socket: Socket) {
  const userId = (socket.data as { userId: string }).userId;
  const username = (socket.data as { username: string }).username;

  socket.on('room:get_state', async (data: { roomId: string }, callback?: (res: RoomStateResponse | { error: string }) => void) => {
    try {
      const { roomId } = data;

      const membership = await prisma.roomMember.findFirst({
        where: { userId, roomId },
      });

      if (!membership) {
        if (callback) callback({ error: 'Not a member of this room' });
        return;
      }

      const room = await prisma.room.findUnique({
        where: { id: roomId },
        include: {
          members: {
            include: {
              user: {
                select: { id: true, username: true, displayName: true },
              },
            },
          },
          messages: {
            orderBy: { createdAt: 'desc' },
            take: 100,
            include: {
              user: {
                select: { id: true, username: true, displayName: true },
              },
            },
          },
        },
      });

      if (!room) {
        if (callback) callback({ error: 'Room not found' });
        return;
      }

      const activeGameRecord = await prisma.game.findFirst({
        where: { roomId, status: GameStatus.IN_PROGRESS },
        include: {
          players: {
            include: {
              user: {
                select: { id: true, username: true, displayName: true },
              },
            },
          },
        },
      });

      let activeGame: RoomStateResponse['activeGame'] = null;

      if (activeGameRecord) {
        const memoryGame = getActiveGame(activeGameRecord.id);

        if (memoryGame) {
          activeGame = {
            gameId: activeGameRecord.id,
            gameType: activeGameRecord.type,
            status: activeGameRecord.status,
            state: memoryGame.state,
            players: activeGameRecord.players.map((p) => ({
              userId: p.userId,
              username: p.user.username,
              displayName: p.user.displayName,
              role: p.role,
              symbol: p.symbol,
            })),
          };
        } else {
          const state = activeGameRecord.state as GameState;
          activeGame = {
            gameId: activeGameRecord.id,
            gameType: activeGameRecord.type,
            status: activeGameRecord.status,
            state,
            players: activeGameRecord.players.map((p) => ({
              userId: p.userId,
              username: p.user.username,
              displayName: p.user.displayName,
              role: p.role,
              symbol: p.symbol,
            })),
          };
        }
      }

      const socketsInRoom = await io.in(roomId).fetchSockets();
      const onlineUserIds = new Set(
        socketsInRoom.map((s) => (s.data as { userId: string }).userId)
      );

      const response: RoomStateResponse = {
        room: {
          id: room.id,
          name: room.name,
          type: room.type,
          maxMembers: room.maxMembers,
        },
        members: room.members.map((m) => ({
          userId: m.userId,
          username: m.user.username,
          displayName: m.user.displayName,
          role: m.role,
          isOnline: onlineUserIds.has(m.userId),
        })),
        messages: room.messages.reverse().map((msg) => ({
          id: msg.id,
          content: msg.content,
          type: msg.type,
          userId: msg.userId,
          username: msg.user?.username || 'System',
          displayName: msg.user?.displayName || 'System',
          createdAt: msg.createdAt.toISOString(),
        })),
        activeGame,
        userRole: membership.role,
      };

      if (callback) callback(response);
    } catch {
      if (callback) callback({ error: 'Failed to fetch room state' });
    }
  });

  socket.on('room:join', async (data: { roomId: string; password?: string }, callback?: (res: { error?: string }) => void) => {
    try {
      const { roomId, password } = data;

      const currentRoom = getSocketRoom(socket.id);
      if (currentRoom) {
        if (callback) callback({ error: 'You are already in a room. Leave first.' });
        return;
      }

      const room = await prisma.room.findUnique({
        where: { id: roomId },
        include: {
          members: true,
          games: { where: { status: GameStatus.IN_PROGRESS }, take: 1 },
        },
      });

      if (!room || !room.isActive) {
        if (callback) callback({ error: 'Room not found or inactive' });
        return;
      }

      const existingMember = room.members.find((m) => m.userId === userId);

      if (room.type === 'PRIVATE' && !existingMember) {
        if (!password) {
          if (callback) callback({ error: 'Password required for private room' });
          return;
        }
        const bcrypt = await import('bcrypt');
        const valid = room.passwordHash ? await bcrypt.compare(password, room.passwordHash) : false;
        if (!valid) {
          if (callback) callback({ error: 'Invalid room password' });
          return;
        }
      }

      const activeGame = room.games[0];
      let role: MemberRole;
      if (existingMember) {
        role = existingMember.role;
      } else {
        role = activeGame ? MemberRole.SPECTATOR : MemberRole.MEMBER;
        await addMemberToRoom(roomId, userId, role);
      }

      socket.join(roomId);
      trackSocketRoom(socket.id, roomId);
      cancelEvictionOnJoin(roomId);

      socket.emit('room:joined', { roomId, role });
      socket.to(roomId).emit('room:user_joined', {
        userId,
        username,
        role,
      });

      const updatedRoom = await prisma.room.findUnique({
        where: { id: roomId },
        include: {
          members: {
            include: { user: { select: { id: true, username: true, displayName: true } } },
          },
        },
      });
      io.to(roomId).emit('room:updated', updatedRoom);

      if (callback) callback({});
    } catch {
      if (callback) callback({ error: 'Failed to join room' });
    }
  });

  socket.on('room:leave', async (data?: { roomId?: string }) => {
    const roomId = data?.roomId || getSocketRoom(socket.id);
    if (!roomId) return;

    socket.leave(roomId);
    untrackSocketRoom(socket.id);

    const sockets = await io.in(roomId).fetchSockets();
    const hasOtherSockets = sockets.some((s) => s.data.userId === userId && s.id !== socket.id);

    if (!hasOtherSockets) {
      socket.to(roomId).emit('room:user_left', { userId, username });
      await handlePlayerLeftRoom(io, userId, roomId);
    }

    await evaluateRoomOnLeave(roomId);
  });

  socket.on('room:kick', async (data: { roomId: string; targetUserId: string }, callback?: (res: { error?: string }) => void) => {
    try {
      const { roomId, targetUserId } = data;

      const membership = await prisma.roomMember.findFirst({
        where: { userId, roomId, role: MemberRole.OWNER },
      });

      if (!membership) {
        if (callback) callback({ error: 'Only the room owner can kick members' });
        return;
      }

      await removeMemberFromRoom(roomId, targetUserId);

      const targetSockets = await io.in(roomId).fetchSockets();
      for (const s of targetSockets) {
        if ((s.data as { userId: string }).userId === targetUserId) {
          s.leave(roomId);
          s.emit('room:kicked', { roomId });
        }
      }

      io.to(roomId).emit('room:user_left', { userId: targetUserId, username: '' });

      if (callback) callback({});
    } catch {
      if (callback) callback({ error: 'Failed to kick user' });
    }
  });

  socket.on('room:close', async (data: { roomId: string }, callback?: (res: { error?: string }) => void) => {
    try {
      const { roomId } = data;

      const membership = await prisma.roomMember.findFirst({
        where: { userId, roomId, role: MemberRole.OWNER },
      });

      if (!membership) {
        if (callback) callback({ error: 'Only the room owner can close the room' });
        return;
      }

      await prisma.room.update({
        where: { id: roomId },
        data: { isActive: false, currentGameId: null },
      });

      io.to(roomId).emit('room:closed', { roomId });

      const socketsInRoom = await io.in(roomId).fetchSockets();
      for (const s of socketsInRoom) {
        s.leave(roomId);
        untrackSocketRoom(s.id);
      }

      await prisma.roomMember.deleteMany({ where: { roomId } });

      if (callback) callback({});
    } catch {
      if (callback) callback({ error: 'Failed to close room' });
    }
  });

  socket.on('message:send', async (data: { roomId: string; content: string; clientId?: string }, callback?: (res: { error?: string }) => void) => {
    const { roomId, content, clientId } = data;
    if (!content || !roomId) {
      if (callback) callback({ error: 'Missing roomId or content' });
      return;
    }

    const sanitizedContent = sanitizeString(content, 2000);
    if (!sanitizedContent) {
      if (callback) callback({ error: 'Message content is empty' });
      return;
    }

    const membership = await prisma.roomMember.findFirst({
      where: { userId, roomId },
    });

    if (!membership) {
      if (callback) callback({ error: 'Not a member of this room' });
      return;
    }

    const message = await prisma.message.create({
      data: {
        content: sanitizedContent,
        type: MessageType.CHAT,
        userId,
        roomId,
      },
      include: {
        user: { select: { id: true, username: true, displayName: true } },
      },
    });

    io.to(roomId).emit('message:received', {
      ...message,
      createdAt: message.createdAt.toISOString(),
      ...(clientId ? { clientId } : {}),
    });

    if (callback) callback({});
  });

  socket.on('disconnect', async () => {
    const roomId = getSocketRoom(socket.id);
    if (roomId) {
      untrackSocketRoom(socket.id);

      const sockets = await io.in(roomId).fetchSockets();
      const hasOtherSockets = sockets.some((s) => s.data.userId === userId && s.id !== socket.id);

      if (!hasOtherSockets) {
        socket.to(roomId).emit('room:user_left', { userId, username });
      }

      await evaluateRoomOnLeave(roomId);
    }
  });
}

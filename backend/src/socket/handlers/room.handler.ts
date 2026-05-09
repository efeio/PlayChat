import type { Server, Socket } from 'socket.io';
import prisma from '../../config/prisma.js';
import {
  addMemberToRoom,
  removeMemberFromRoom,
} from '../../services/room.service.js';
import { activeGames } from './game.handler.js';
import type { GameState } from '../../games/GameEngine.js';

/* INV-001: Track which room each socket is in */
const socketRoomMap = new Map<string, string>();

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
    role: 'OWNER' | 'MEMBER' | 'SPECTATOR';
    isOnline: boolean;
  }>;
  messages: Array<{
    id: string;
    content: string;
    type: 'CHAT' | 'GAME_LOG';
    userId: string;
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
      playerIndex: number;
    }>;
  } | null;
  userRole: 'OWNER' | 'MEMBER' | 'SPECTATOR';
}

export function registerRoomHandlers(io: Server, socket: Socket) {
  const userId = (socket.data as { userId: string }).userId;
  const username = (socket.data as { username: string }).username;

  socket.on('room:get_state', async (data: { roomId: string }, callback?: (res: RoomStateResponse | { error: string }) => void) => {
    try {
      const { roomId } = data;

      /* Step 1: Verify membership */
      const membership = await prisma.roomMember.findFirst({
        where: { userId, roomId },
      });

      if (!membership) {
        if (callback) callback({ error: 'Not a member of this room' });
        return;
      }

      /* Step 2: Fetch room data with members and messages */
      const room = await prisma.room.findUnique({
        where: { id: roomId },
        include: {
          members: {
            include: {
              user: {
                select: {
                  id: true,
                  username: true,
                  displayName: true,
                },
              },
            },
          },
          messages: {
            orderBy: { createdAt: 'asc' },
            include: {
              user: {
                select: {
                  id: true,
                  username: true,
                  displayName: true,
                },
              },
            },
          },
        },
      });

      if (!room) {
        if (callback) callback({ error: 'Room not found' });
        return;
      }

      /* Step 3: Fetch active game from database */
      const activeGameRecord = await prisma.game.findFirst({
        where: { roomId, status: 'IN_PROGRESS' },
        include: {
          players: {
            include: {
              user: {
                select: {
                  id: true,
                  username: true,
                  displayName: true,
                },
              },
            },
          },
        },
      });

      /* Step 4: Fetch active game state from memory */
      let activeGame: RoomStateResponse['activeGame'] = null;

      if (activeGameRecord) {
        const memoryGame = activeGames.get(activeGameRecord.id);

        if (memoryGame) {
          /* Game is in memory - use current state */
          activeGame = {
            gameId: activeGameRecord.id,
            gameType: activeGameRecord.gameType,
            status: activeGameRecord.status,
            state: memoryGame.state,
            players: activeGameRecord.players.map((p) => ({
              userId: p.userId,
              username: p.user.username,
              displayName: p.user.displayName,
              role: p.role,
              playerIndex: p.playerIndex,
            })),
          };
        } else {
          /* Game exists in DB but not in memory - reconstruct from DB */
          const state = JSON.parse(activeGameRecord.state) as GameState;
          activeGame = {
            gameId: activeGameRecord.id,
            gameType: activeGameRecord.gameType,
            status: activeGameRecord.status,
            state,
            players: activeGameRecord.players.map((p) => ({
              userId: p.userId,
              username: p.user.username,
              displayName: p.user.displayName,
              role: p.role,
              playerIndex: p.playerIndex,
            })),
          };
        }
      }

      /* Step 5: Reconstruct online status from socket connections */
      const socketsInRoom = await io.in(roomId).fetchSockets();
      const onlineUserIds = new Set(
        socketsInRoom.map((s) => (s.data as { userId: string }).userId)
      );

      /* Step 6: Build response */
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
          role: m.role as 'OWNER' | 'MEMBER' | 'SPECTATOR',
          isOnline: onlineUserIds.has(m.userId),
        })),
        messages: room.messages.map((msg) => ({
          id: msg.id,
          content: msg.content,
          type: msg.type as 'CHAT' | 'GAME_LOG',
          userId: msg.userId,
          username: msg.user.username,
          displayName: msg.user.displayName,
          createdAt: msg.createdAt.toISOString(),
        })),
        activeGame,
        userRole: membership.role as 'OWNER' | 'MEMBER' | 'SPECTATOR',
      };

      if (callback) callback(response);
    } catch (error) {
      if (callback) callback({ error: 'Failed to fetch room state' });
    }
  });

  socket.on('room:join', async (data: { roomId: string }, callback?: (res: { error?: string }) => void) => {
    try {
      const { roomId } = data;

      /* INV-001: User can only be in one room at a time */
      const currentRoom = socketRoomMap.get(socket.id);
      if (currentRoom) {
        if (callback) callback({ error: 'You are already in a room. Leave first.' });
        return;
      }

      const room = await prisma.room.findUnique({
        where: { id: roomId },
        include: {
          members: true,
          games: { where: { status: 'IN_PROGRESS' }, take: 1 },
        },
      });

      if (!room) {
        if (callback) callback({ error: 'Room not found' });
        return;
      }

      /* Check if user is already a member (e.g., OWNER who created the room) */
      const existingMember = room.members.find((m) => m.userId === userId);

      /* INV-004: If game is in progress, new joiners become spectators */
      const activeGame = room.games[0];
      let role: string;
      if (existingMember) {
        role = existingMember.role; /* Preserve existing role (OWNER, MEMBER) */
      } else {
        role = activeGame ? 'SPECTATOR' : 'MEMBER';
        await addMemberToRoom(roomId, userId, role);
      }

      socket.join(roomId);
      socketRoomMap.set(socket.id, roomId);

      /* INV-006: Do not replay old messages */
      socket.emit('room:joined', { roomId, role });
      socket.to(roomId).emit('room:user_joined', {
        userId,
        username,
        role,
      });

      /* Emit room:updated */
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
    const roomId = data?.roomId || socketRoomMap.get(socket.id);
    if (!roomId) return;

    /* Don't delete membership from DB — just leave the socket room.
       Membership (including OWNER role) is persistent. */
    socket.leave(roomId);
    socketRoomMap.delete(socket.id);

    socket.to(roomId).emit('room:user_left', { userId, username });
  });

  socket.on('message:send', async (data: { roomId: string; content: string }) => {
    const { roomId, content } = data;
    if (!content || !roomId) return;

    const message = await prisma.message.create({
      data: {
        content,
        type: 'CHAT',
        userId,
        roomId,
      },
      include: {
        user: { select: { id: true, username: true, displayName: true } },
      },
    });

    io.to(roomId).emit('message:received', message);
  });

  /* Handle disconnect - cleanup socket tracking only */
  socket.on('disconnect', async () => {
    const roomId = socketRoomMap.get(socket.id);
    if (roomId) {
      socketRoomMap.delete(socket.id);
      socket.to(roomId).emit('room:user_left', { userId, username });
    }
  });
}

export { socketRoomMap };

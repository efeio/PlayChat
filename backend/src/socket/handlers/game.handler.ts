import type { Server, Socket } from 'socket.io';
import prisma from '../../config/prisma.js';
import type { GameState } from '../../games/GameEngine.js';
import {
  getActiveGames,
  getActiveGame,
  getGameEngine,
  registerActiveGame,
  updateAndPersistState,
  finishGame,
} from '../../services/gameState.service.js';
import { GameStatus, GameType, MemberRole, PlayerRole, MessageType } from '@prisma/client';

const startingGames = new Set<string>();

const disconnectTimers = new Map<string, NodeJS.Timeout>();

export function registerGameHandlers(io: Server, socket: Socket) {
  const userId = (socket.data as { userId: string }).userId;
  const username = (socket.data as { username: string }).username;

  socket.on('game:start', async (data: { roomId: string; gameType: string }, callback?: (res: { error?: string }) => void) => {
    try {
      const { roomId, gameType } = data;

      if (startingGames.has(roomId)) {
        if (callback) callback({ error: 'A game is already initializing' });
        return;
      }
      startingGames.add(roomId);

      try {
        const membership = await prisma.roomMember.findFirst({
          where: { userId, roomId, role: MemberRole.OWNER },
        });

        if (!membership) {
          if (callback) callback({ error: 'Only the room owner can start a game' });
          return;
        }

        const existingGame = await prisma.game.findFirst({
          where: { roomId, status: GameStatus.IN_PROGRESS },
        });

        if (existingGame) {
          if (callback) callback({ error: 'A game is already in progress' });
          return;
        }

        const engine = getGameEngine(gameType);
        if (!engine) {
          if (callback) callback({ error: 'Invalid game type' });
          return;
        }

        const members = await prisma.roomMember.findMany({
          where: { roomId, role: { not: MemberRole.SPECTATOR } },
          include: { user: { select: { id: true, username: true, displayName: true } } },
          take: 2,
        });

        if (members.length < 2) {
          if (callback) callback({ error: 'Need at least 2 players to start a game' });
          return;
        }

        const sockets = await io.in(roomId).fetchSockets();
        const onlineUserIds = new Set(sockets.map(s => (s.data as { userId: string }).userId));
        const allOnline = members.every(m => onlineUserIds.has(m.userId));

        if (!allOnline) {
          if (callback) callback({ error: 'Cannot start game. An opponent is offline.' });
          return;
        }

        const playerIds = members.map((m) => m.userId);
        const gameState = engine.initialize(playerIds);

        const gameTypeEnum = gameType as GameType;

        const game = await prisma.game.create({
          data: {
            roomId,
            type: gameTypeEnum,
            status: GameStatus.IN_PROGRESS,
            state: gameState as object,
            startedAt: new Date(),
            players: {
              create: members.map((m, i) => ({
                userId: m.userId,
                role: PlayerRole.PLAYER,
                symbol: i === 0 ? 'X' : 'O',
              })),
            },
          },
          include: {
            players: {
              include: { user: { select: { id: true, username: true, displayName: true } } },
            },
          },
        });

        await prisma.room.update({
          where: { id: roomId },
          data: { currentGameId: game.id },
        });

        registerActiveGame(game.id, roomId, gameType, gameState);

        const playersWithRoles = game.players.map((p) => {
          const player = { ...p, user: p.user };

          if (gameType === 'HANGMAN') {
            const hangmanState = gameState as { roles?: { [userId: string]: string } };
            return { ...player, gameRole: hangmanState.roles?.[p.userId] };
          }

          return player;
        });

        io.to(roomId).emit('game:started', {
          gameId: game.id,
          gameType,
          state: gameState,
          players: playersWithRoles,
        });

        await prisma.message.create({
          data: {
            content: `Game started: ${gameType.replace(/_/g, ' ')}`,
            type: MessageType.GAME_LOG,
            userId,
            roomId,
          },
        });

        if (callback) callback({});
      } finally {
        startingGames.delete(roomId);
      }
    } catch {
      if (callback) callback({ error: 'Failed to start game' });
    }
  });

  socket.on('game:move', async (data: { gameId: string; move: Record<string, unknown> }, callback?: (res: { error?: string }) => void) => {
    try {
      const { gameId, move } = data;

      const activeGame = getActiveGame(gameId);
      if (!activeGame) {
        if (callback) callback({ error: 'Game not found' });
        return;
      }

      const trustedRoomId = activeGame.roomId;

      const playerEntry = await prisma.gamePlayer.findFirst({
        where: { gameId, userId },
        include: { user: { select: { displayName: true } } },
      });

      if (!playerEntry || playerEntry.role === PlayerRole.SPECTATOR) {
        if (callback) callback({ error: 'Spectators cannot make moves' });
        return;
      }

      const displayName = playerEntry.user.displayName;

      const { engine, state } = activeGame;

      if (!engine.validateMove(state, move, userId)) {
        const gameRecord = await prisma.game.findUnique({
          where: { id: gameId },
          select: { type: true },
        });

        if (gameRecord?.type === GameType.HANGMAN) {
          const hangmanState = state as { guesser?: string; setter?: string };
          if (move.letter !== undefined && userId !== hangmanState.guesser) {
            if (callback) callback({ error: 'Only the Word Guesser can guess letters' });
            return;
          }
          if (move.word !== undefined && userId !== hangmanState.guesser) {
            if (callback) callback({ error: 'Only the Word Guesser can guess the word' });
            return;
          }
        }

        if (callback) callback({ error: 'Invalid move' });
        return;
      }

      const newState = engine.applyMove(state, move, userId);

      await updateAndPersistState(gameId, newState);

      io.to(trustedRoomId).emit('game:state', {
        gameId,
        state: newState,
      });

      const logText = engine.getGameLog(move, userId, newState);
      const logMessage = await prisma.message.create({
        data: {
          content: `${displayName} ${logText}`,
          type: MessageType.GAME_LOG,
          userId,
          roomId: trustedRoomId,
        },
        include: {
          user: { select: { id: true, username: true, displayName: true } },
        },
      });
      io.to(trustedRoomId).emit('message:received', logMessage);

      const result = engine.checkResult(newState);
      if (result !== 'ongoing') {
        const winnerId = engine.getWinner(newState);

        await finishGame(gameId, winnerId, newState);

        await prisma.room.update({
          where: { id: trustedRoomId },
          data: { currentGameId: null },
        });

        io.to(trustedRoomId).emit('game:end', {
          gameId,
          result,
          winnerId,
          state: newState,
        });

        const endLogText =
          result === 'draw' ? 'Game ended in a draw!' : `Game over! Winner determined.`;
        const endLogMsg = await prisma.message.create({
          data: {
            content: endLogText,
            type: MessageType.GAME_LOG,
            userId,
            roomId: trustedRoomId,
          },
          include: {
            user: { select: { id: true, username: true, displayName: true } },
          },
        });
        io.to(trustedRoomId).emit('message:received', endLogMsg);

        const gamePlayers = await prisma.gamePlayer.findMany({
          where: { gameId, role: PlayerRole.PLAYER },
        });

        const gameRecord = await prisma.game.findUnique({
          where: { id: gameId },
          select: { type: true },
        });
        const gameTypeForStats = gameRecord?.type || GameType.GENERAL;

        for (const gp of gamePlayers) {
          cancelDisconnectTimer(gp.userId);

          const statsUpdate = result === 'draw'
            ? { gamesPlayed: { increment: 1 }, draws: { increment: 1 } }
            : gp.userId === winnerId
              ? { gamesPlayed: { increment: 1 }, wins: { increment: 1 } }
              : { gamesPlayed: { increment: 1 }, losses: { increment: 1 } };

          await prisma.userStats.upsert({
            where: { userId_gameType: { userId: gp.userId, gameType: gameTypeForStats } },
            update: statsUpdate,
            create: { userId: gp.userId, gameType: gameTypeForStats, gamesPlayed: 1, wins: result !== 'draw' && gp.userId === winnerId ? 1 : 0, losses: result !== 'draw' && gp.userId !== winnerId ? 1 : 0, draws: result === 'draw' ? 1 : 0 },
          });

          await prisma.userStats.upsert({
            where: { userId_gameType: { userId: gp.userId, gameType: GameType.GENERAL } },
            update: statsUpdate,
            create: { userId: gp.userId, gameType: GameType.GENERAL, gamesPlayed: 1, wins: result !== 'draw' && gp.userId === winnerId ? 1 : 0, losses: result !== 'draw' && gp.userId !== winnerId ? 1 : 0, draws: result === 'draw' ? 1 : 0 },
          });
        }
      }

      if (callback) callback({});
    } catch {
      if (callback) callback({ error: 'Failed to process move' });
    }
  });

  socket.on('disconnect', async () => {
    const sockets = await io.fetchSockets();
    const isStillConnected = sockets.some(s => s.data.userId === userId && s.id !== socket.id);
    if (isStillConnected) return;

    const activeGamesMap = getActiveGames();
    for (const [gameId, game] of activeGamesMap.entries()) {
      const state = game.state as { players?: string[] };
      if (state.players && state.players.includes(userId)) {
        const timer = setTimeout(async () => {
          const currentGame = getActiveGame(gameId);
          if (!currentGame) return;

          const s = currentGame.state as { players?: string[] };
          const otherPlayer = s.players?.find((p) => p !== userId);

          await finishGame(gameId, otherPlayer || null, currentGame.state);

          await prisma.room.update({
            where: { id: currentGame.roomId },
            data: { currentGameId: null },
          });

          io.to(currentGame.roomId).emit('game:end', {
            gameId,
            result: 'win',
            winnerId: otherPlayer,
            reason: 'disconnect_timeout',
          });

          disconnectTimers.delete(userId);
        }, 30000);

        disconnectTimers.set(userId, timer);
      }
    }
  });
}

export function cancelDisconnectTimer(userId: string) {
  const timer = disconnectTimers.get(userId);
  if (timer) {
    clearTimeout(timer);
    disconnectTimers.delete(userId);
  }
}

export async function handlePlayerLeftRoom(io: Server, userId: string, roomId: string) {
  const activeGamesMap = getActiveGames();
  for (const [gameId, game] of activeGamesMap.entries()) {
    if (game.roomId !== roomId) continue;

    const state = game.state as { players?: string[] };
    if (state.players && state.players.includes(userId)) {
      const otherPlayer = state.players.find((p) => p !== userId);

      await finishGame(gameId, otherPlayer || null, game.state);

      await prisma.room.update({
        where: { id: roomId },
        data: { currentGameId: null },
      });

      io.to(roomId).emit('game:end', {
        gameId,
        result: 'win',
        winnerId: otherPlayer,
        reason: 'player_left',
      });

      cancelDisconnectTimer(userId);
    }
  }
}

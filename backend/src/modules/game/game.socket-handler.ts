import type { Server, Socket } from 'socket.io';
import prisma from '../../infrastructure/config/prisma.js';
import type { GameState } from './engines/index.js';
import {
  getActiveGames,
  getActiveGame,
  getGameEngine,
  registerActiveGame,
  updateAndPersistState,
  finishGame,
} from './game-state.service.js';
import { removeMemberFromRoom } from '../room/index.js';
import { GameStatus, GameType, MemberRole, PlayerRole, MessageType } from '@prisma/client';

export function sanitizeStateForClient(state: GameState, gameType: string): GameState {
  const s = { ...state } as Record<string, unknown>;

  if (gameType === 'HANGMAN') {
    const { word, ...safe } = s as { word?: string; winner?: string | null; draw?: boolean; [k: string]: unknown };
    const isFinished = !!safe.winner || !!safe.draw;

    if (isFinished) {
      return { ...safe, maskedWord: word, revealedWord: word } as unknown as GameState;
    }

    const maskedWord = word
      ? word.split('').map((c) => {
          const allGuessed = Object.values((safe.playerStates || {}) as Record<string, { guessedLetters: string[] }>)
            .flatMap((ps) => ps.guessedLetters);
          return allGuessed.includes(c) ? c : '_';
        }).join('')
      : '';
    return { ...safe, maskedWord } as unknown as GameState;
  }

  if (gameType === 'MEMORY_CARDS') {
    const memState = s as {
      cards?: Array<{ id: number; symbol: string; isFlipped: boolean; isMatched: boolean }>;
      finished?: boolean;
      [k: string]: unknown;
    };

    if (memState.finished) {
      return state;
    }

    if (memState.cards) {
      const safeCards = memState.cards.map((card) => ({
        id: card.id,
        symbol: card.isFlipped || card.isMatched ? card.symbol : '?',
        isFlipped: card.isFlipped,
        isMatched: card.isMatched,
      }));
      return { ...s, cards: safeCards } as unknown as GameState;
    }

    return state;
  }

  if (gameType === 'WORDLE') {
    const { targetWord, ...safe } = s as { targetWord?: string; [k: string]: unknown };
    const finished = (s as { finished?: boolean }).finished;
    if (finished) return { ...safe, targetWord } as unknown as GameState;
    return safe as unknown as GameState;
  }

  if (gameType === 'NUMBER_GUESS') {
    const { targetNumber, ...safe } = s as { targetNumber?: number; [k: string]: unknown };
    const finished = (s as { finished?: boolean }).finished;
    if (finished) return { ...safe, targetNumber } as unknown as GameState;
    return safe as unknown as GameState;
  }

  if (gameType === 'ROCK_PAPER_SCISSORS') {
    const choices = (s as { choices?: Record<string, string | null> }).choices;
    const players = (s as { players?: string[] }).players || [];
    if (choices && players.length === 2) {
      const allChosen = players.every((p) => choices[p] !== null);
      if (!allChosen) {
        const maskedChoices: Record<string, string | null> = {};
        for (const p of players) {
          maskedChoices[p] = choices[p] !== null ? 'chosen' : null;
        }
        return { ...s, choices: maskedChoices } as unknown as GameState;
      }
    }
  }

  return state;
}

const startingGames = new Set<string>();

const processingMoves = new Set<string>();

const disconnectTimers = new Map<string, NodeJS.Timeout>();

const GAME_NAME_TR: Record<string, string> = {
  TIC_TAC_TOE: 'XOX',
  CONNECT_FOUR: 'Connect Four',
  WORDLE: 'Wordle',
  MEMORY_CARDS: 'Hafıza Kartları',
  HANGMAN: 'Adam Asmaca',
  NUMBER_GUESS: 'Sayı Tahmin',
  ROCK_PAPER_SCISSORS: 'Taş Kağıt Makas',
};

export function registerGameSocketHandlers(io: Server, socket: Socket) {
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

        const maxPlayers = gameType === 'MEMORY_CARDS' ? 4 : 2;
        const members = await prisma.roomMember.findMany({
          where: { roomId, role: { not: MemberRole.SPECTATOR } },
          include: { user: { select: { id: true, username: true, displayName: true } } },
          take: maxPlayers,
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
          state: sanitizeStateForClient(gameState, gameType),
          players: playersWithRoles,
        });

        await prisma.message.create({
          data: {
            content: `Oyun başladı: ${GAME_NAME_TR[gameType] || gameType}`,
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
    let lockKey: string | null = null;

    try {
      const { gameId, move } = data;

      const activeGame = getActiveGame(gameId);
      if (!activeGame) {
        if (callback) callback({ error: 'Game not found' });
        return;
      }

      lockKey = `${gameId}:${userId}`;
      if (processingMoves.has(lockKey)) {
        if (callback) callback({});
        return;
      }
      processingMoves.add(lockKey);

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

      activeGame.moveCount++;
      await updateAndPersistState(gameId, newState);

      io.to(trustedRoomId).emit('game:state', {
        gameId,
        state: sanitizeStateForClient(newState, activeGame.gameType),
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
          state: sanitizeStateForClient(newState, activeGame.gameType),
        });

        const winnerName = winnerId
          ? (await prisma.user.findUnique({ where: { id: winnerId }, select: { displayName: true } }))?.displayName || ''
          : '';
        const endLogText =
          result === 'draw' ? 'Oyun berabere bitti!' : `Oyun bitti! ${winnerName} kazandı.`;
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

        const statsOps = gamePlayers.flatMap((gp) => {
          cancelDisconnectTimer(gp.userId);

          const statsUpdate = result === 'draw'
            ? { gamesPlayed: { increment: 1 }, draws: { increment: 1 } }
            : gp.userId === winnerId
              ? { gamesPlayed: { increment: 1 }, wins: { increment: 1 } }
              : { gamesPlayed: { increment: 1 }, losses: { increment: 1 } };

          const createData = {
            gamesPlayed: 1,
            wins: result !== 'draw' && gp.userId === winnerId ? 1 : 0,
            losses: result !== 'draw' && gp.userId !== winnerId ? 1 : 0,
            draws: result === 'draw' ? 1 : 0,
          };

          return [
            prisma.userStats.upsert({
              where: { userId_gameType: { userId: gp.userId, gameType: gameTypeForStats } },
              update: statsUpdate,
              create: { userId: gp.userId, gameType: gameTypeForStats, ...createData },
            }),
            prisma.userStats.upsert({
              where: { userId_gameType: { userId: gp.userId, gameType: GameType.GENERAL } },
              update: statsUpdate,
              create: { userId: gp.userId, gameType: GameType.GENERAL, ...createData },
            }),
          ];
        });

        await prisma.$transaction(statsOps);
      }

      if (callback) callback({});
    } catch {
      if (callback) callback({ error: 'Failed to process move' });
    } finally {
      if (lockKey) {
        processingMoves.delete(lockKey);
      }
    }
  });

  socket.on('disconnect', async () => {
    const activeGamesMap = getActiveGames();
    const playerGames: [string, { roomId: string; state: GameState }][] = [];

    for (const [gameId, game] of activeGamesMap.entries()) {
      const state = game.state as { players?: string[] };
      if (state.players && state.players.includes(userId)) {
        playerGames.push([gameId, game]);
      }
    }

    if (playerGames.length === 0) return;

    const roomIds = [...new Set(playerGames.map(([, g]) => g.roomId))];
    let isStillConnected = false;
    for (const roomId of roomIds) {
      const sockets = await io.in(roomId).fetchSockets();
      if (sockets.some(s => s.data.userId === userId && s.id !== socket.id)) {
        isStillConnected = true;
        break;
      }
    }
    if (isStillConnected) return;

    for (const [gameId, game] of playerGames) {
      const timerKey = `${userId}:${gameId}`;
      if (disconnectTimers.has(timerKey)) continue;

      const timer = setTimeout(async () => {
        disconnectTimers.delete(timerKey);

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
          state: sanitizeStateForClient(currentGame.state, currentGame.gameType),
        });

        await removeMemberFromRoom(currentGame.roomId, userId);

        const updatedMembers = await prisma.roomMember.findMany({
          where: { roomId: currentGame.roomId },
          include: { user: { select: { id: true, username: true, displayName: true, avatarUrl: true } } },
        });
        io.to(currentGame.roomId).emit('room:updated', { id: currentGame.roomId, members: updatedMembers });
      }, 30000);

      disconnectTimers.set(timerKey, timer);
    }
  });
}

export function cancelDisconnectTimer(userId: string) {
  for (const [key, timer] of disconnectTimers.entries()) {
    if (key === userId || key.startsWith(`${userId}:`)) {
      clearTimeout(timer);
      disconnectTimers.delete(key);
    }
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

      const gameRecord = await prisma.game.findUnique({
        where: { id: gameId },
        select: { type: true },
      });
      const gameTypeForStats = gameRecord?.type || GameType.GENERAL;

      const gamePlayers = await prisma.gamePlayer.findMany({
        where: { gameId, role: PlayerRole.PLAYER },
      });

      const statsOps = gamePlayers.flatMap((gp) => {
        const statsUpdate = gp.userId === otherPlayer
          ? { gamesPlayed: { increment: 1 }, wins: { increment: 1 } }
          : { gamesPlayed: { increment: 1 }, losses: { increment: 1 } };

        const createData = {
          gamesPlayed: 1,
          wins: gp.userId === otherPlayer ? 1 : 0,
          losses: gp.userId !== otherPlayer ? 1 : 0,
          draws: 0,
        };

        return [
          prisma.userStats.upsert({
            where: { userId_gameType: { userId: gp.userId, gameType: gameTypeForStats } },
            update: statsUpdate,
            create: { userId: gp.userId, gameType: gameTypeForStats, ...createData },
          }),
          prisma.userStats.upsert({
            where: { userId_gameType: { userId: gp.userId, gameType: GameType.GENERAL } },
            update: statsUpdate,
            create: { userId: gp.userId, gameType: GameType.GENERAL, ...createData },
          }),
        ];
      });

      await prisma.$transaction(statsOps);

      cancelDisconnectTimer(userId);
    }
  }
}

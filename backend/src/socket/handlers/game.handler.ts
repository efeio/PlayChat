import type { Server, Socket } from 'socket.io';
import prisma from '../../config/prisma.js';
import { GameEngine, type GameState } from '../../games/GameEngine.js';
import { TicTacToe } from '../../games/TicTacToe.js';
import { ConnectFour } from '../../games/ConnectFour.js';
import { RockPaperScissors } from '../../games/RockPaperScissors.js';
import { Hangman } from '../../games/Hangman.js';

export const gameEngines: Record<string, GameEngine> = {
  TIC_TAC_TOE: new TicTacToe(),
  CONNECT_FOUR: new ConnectFour(),
  ROCK_PAPER_SCISSORS: new RockPaperScissors(),
  HANGMAN: new Hangman(),
};

/* In-memory game state store (demo: no Redis) */
const activeGames = new Map<string, { engine: GameEngine; state: GameState; gameId: string }>();

/* INV-008: Disconnect timeout tracking */
const disconnectTimers = new Map<string, NodeJS.Timeout>();

export function registerGameHandlers(io: Server, socket: Socket) {
  const userId = (socket.data as { userId: string }).userId;
  const username = (socket.data as { username: string }).username;

  socket.on('game:start', async (data: { roomId: string; gameType: string }, callback?: (res: { error?: string }) => void) => {
    try {
      const { roomId, gameType } = data;

      /* INV-003: Only room owner can start game */
      const membership = await prisma.roomMember.findFirst({
        where: { userId, roomId, role: 'OWNER' },
      });

      if (!membership) {
        if (callback) callback({ error: 'Only the room owner can start a game' });
        return;
      }

      /* INV-002: Only one active game at a time */
      const existingGame = await prisma.game.findFirst({
        where: { roomId, status: 'IN_PROGRESS' },
      });

      if (existingGame) {
        if (callback) callback({ error: 'A game is already in progress' });
        return;
      }

      const engine = gameEngines[gameType];
      if (!engine) {
        if (callback) callback({ error: 'Invalid game type' });
        return;
      }

      /* Get room members who are players (not spectators) */
      const members = await prisma.roomMember.findMany({
        where: { roomId, role: { not: 'SPECTATOR' } },
        include: { user: { select: { id: true, username: true, displayName: true } } },
        take: 2,
      });

      if (members.length < 2) {
        if (callback) callback({ error: 'Need at least 2 players to start a game' });
        return;
      }

      const playerIds = members.map((m) => m.userId);
      const gameState = engine.initialize(playerIds);

      const game = await prisma.game.create({
        data: {
          roomId,
          gameType,
          status: 'IN_PROGRESS',
          state: JSON.stringify(gameState),
          players: {
            create: members.map((m, i) => ({
              userId: m.userId,
              role: 'PLAYER',
              playerIndex: i,
            })),
          },
        },
        include: {
          players: {
            include: { user: { select: { id: true, username: true, displayName: true } } },
          },
        },
      });

      activeGames.set(game.id, { engine, state: gameState, gameId: game.id });

      /* Enhance players with gameRole for Hangman */
      const playersWithRoles = game.players.map((p) => {
        const player = {
          ...p,
          user: p.user,
        };

        /* Add gameRole for Hangman */
        if (gameType === 'HANGMAN') {
          const hangmanState = gameState as { roles?: { [userId: string]: string } };
          return {
            ...player,
            gameRole: hangmanState.roles?.[p.userId],
          };
        }

        return player;
      });

      io.to(roomId).emit('game:started', {
        gameId: game.id,
        gameType,
        state: gameState,
        players: playersWithRoles,
      });

      /* Send game log message */
      const logMessage = await prisma.message.create({
        data: {
          content: `Game started: ${gameType.replace(/_/g, ' ')}`,
          type: 'GAME_LOG',
          userId,
          roomId,
        },
        include: {
          user: { select: { id: true, username: true, displayName: true } },
        },
      });
      io.to(roomId).emit('message:received', logMessage);

      if (callback) callback({});
    } catch {
      if (callback) callback({ error: 'Failed to start game' });
    }
  });

  socket.on('game:move', async (data: { gameId: string; roomId: string; move: Record<string, unknown> }, callback?: (res: { error?: string }) => void) => {
    try {
      const { gameId, roomId, move } = data;

      const activeGame = activeGames.get(gameId);
      if (!activeGame) {
        if (callback) callback({ error: 'Game not found' });
        return;
      }

      /* INV-005: Spectators cannot make moves */
      const playerEntry = await prisma.gamePlayer.findFirst({
        where: { gameId, userId },
      });

      if (!playerEntry || playerEntry.role === 'SPECTATOR') {
        if (callback) callback({ error: 'Spectators cannot make moves' });
        return;
      }

      const { engine, state } = activeGame;

      if (!engine.validateMove(state, move, userId)) {
        /* Provide specific error messages for Hangman role violations */
        const gameRecord = await prisma.game.findUnique({
          where: { id: gameId },
          select: { gameType: true },
        });

        if (gameRecord?.gameType === 'HANGMAN') {
          const hangmanState = state as { guesser?: string; setter?: string };
          if (move.letter !== undefined && userId !== hangmanState.guesser) {
            if (callback) callback({ error: 'Only the Word Guesser can guess letters' });
            return;
          }
          if (move.word !== undefined && userId !== hangmanState.setter) {
            if (callback) callback({ error: 'Only the Word Setter can submit the word' });
            return;
          }
        }

        if (callback) callback({ error: 'Invalid move' });
        return;
      }

      const newState = engine.applyMove(state, move, userId);
      activeGame.state = newState;

      /* Persist state to DB */
      await prisma.game.update({
        where: { id: gameId },
        data: { state: JSON.stringify(newState) },
      });

      io.to(roomId).emit('game:state', {
        gameId,
        state: newState,
      });

      /* Create game log */
      const logText = engine.getGameLog(move, username, newState);
      const logMessage = await prisma.message.create({
        data: {
          content: `${username} ${logText}`,
          type: 'GAME_LOG',
          userId,
          roomId,
        },
        include: {
          user: { select: { id: true, username: true, displayName: true } },
        },
      });
      io.to(roomId).emit('message:received', logMessage);

      /* Check game result */
      const result = engine.checkResult(newState);
      if (result !== 'ongoing') {
        const winnerId = engine.getWinner(newState);

        await prisma.game.update({
          where: { id: gameId },
          data: {
            status: 'FINISHED',
            winnerId,
            state: JSON.stringify(newState),
          },
        });

        activeGames.delete(gameId);

        io.to(roomId).emit('game:end', {
          gameId,
          result,
          winnerId,
          state: newState,
        });

        /* Game over log message */
        const endLogText =
          result === 'draw' ? 'Game ended in a draw!' : `Game over! Winner determined.`;
        const endLogMsg = await prisma.message.create({
          data: {
            content: endLogText,
            type: 'GAME_LOG',
            userId,
            roomId,
          },
          include: {
            user: { select: { id: true, username: true, displayName: true } },
          },
        });
        io.to(roomId).emit('message:received', endLogMsg);

        /* Update stats */
        const gamePlayers = await prisma.gamePlayer.findMany({
          where: { gameId, role: 'PLAYER' },
        });

        for (const gp of gamePlayers) {
          if (result === 'draw') {
            await prisma.userStats.upsert({
              where: { userId: gp.userId },
              update: { gamesPlayed: { increment: 1 }, gamesDraw: { increment: 1 } },
              create: { userId: gp.userId, gamesPlayed: 1, gamesDraw: 1 },
            });
          } else if (gp.userId === winnerId) {
            await prisma.userStats.upsert({
              where: { userId: gp.userId },
              update: { gamesPlayed: { increment: 1 }, gamesWon: { increment: 1 } },
              create: { userId: gp.userId, gamesPlayed: 1, gamesWon: 1 },
            });
          } else {
            await prisma.userStats.upsert({
              where: { userId: gp.userId },
              update: { gamesPlayed: { increment: 1 }, gamesLost: { increment: 1 } },
              create: { userId: gp.userId, gamesPlayed: 1, gamesLost: 1 },
            });
          }
        }
      }

      if (callback) callback({});
    } catch {
      if (callback) callback({ error: 'Failed to process move' });
    }
  });

  /* INV-008: Handle disconnect timeout for active games */
  socket.on('disconnect', () => {
    for (const [gameId, game] of activeGames.entries()) {
      const state = game.state as { players?: string[] };
      if (state.players && state.players.includes(userId)) {
        const timer = setTimeout(async () => {
          const activeGame = activeGames.get(gameId);
          if (!activeGame) return;

          const s = activeGame.state as { players?: string[] };
          const otherPlayer = s.players?.find((p) => p !== userId);

          await prisma.game.update({
            where: { id: gameId },
            data: {
              status: 'FINISHED',
              winnerId: otherPlayer || null,
            },
          });

          activeGames.delete(gameId);

          /* Find room from game */
          const dbGame = await prisma.game.findUnique({ where: { id: gameId } });
          if (dbGame) {
            io.to(dbGame.roomId).emit('game:end', {
              gameId,
              result: 'win',
              winnerId: otherPlayer,
              reason: 'disconnect_timeout',
            });
          }

          disconnectTimers.delete(userId);
        }, 30000);

        disconnectTimers.set(userId, timer);
      }
    }
  });
}

/* Cancel disconnect timer on reconnect */
export function cancelDisconnectTimer(userId: string) {
  const timer = disconnectTimers.get(userId);
  if (timer) {
    clearTimeout(timer);
    disconnectTimers.delete(userId);
  }
}

export { activeGames };

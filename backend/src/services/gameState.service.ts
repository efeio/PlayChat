import { existsSync, mkdirSync, readFileSync, readdirSync, unlinkSync } from 'fs';
import { writeFile } from 'fs/promises';
import { join } from 'path';
import prisma from '../config/prisma.js';
import { GameEngine, type GameState } from '../games/GameEngine.js';
import { TicTacToe } from '../games/TicTacToe.js';
import { ConnectFour } from '../games/ConnectFour.js';
import { RockPaperScissors } from '../games/RockPaperScissors.js';
import { Hangman } from '../games/Hangman.js';
import { Wordle } from '../games/Wordle.js';
import { MemoryCards } from '../games/MemoryCards.js';
import { NumberGuess } from '../games/NumberGuess.js';
import { GameStatus, GameType } from '@prisma/client';

const gameEngines: Record<string, GameEngine> = {
  TIC_TAC_TOE: new TicTacToe(),
  CONNECT_FOUR: new ConnectFour(),
  ROCK_PAPER_SCISSORS: new RockPaperScissors(),
  HANGMAN: new Hangman(),
  WORDLE: new Wordle(),
  MEMORY_CARDS: new MemoryCards(),
  NUMBER_GUESS: new NumberGuess(),
};

export interface ActiveGameEntry {
  engine: GameEngine;
  state: GameState;
  gameId: string;
  roomId: string;
  gameType: string;
  lastUpdated: number;
  moveCount: number;
}

const activeGames = new Map<string, ActiveGameEntry>();

const SNAPSHOT_DIR = join(process.cwd(), '.game-snapshots');

let snapshotIntervalHandle: NodeJS.Timeout | null = null;
const SNAPSHOT_INTERVAL_MS = 10000;

export function getActiveGames(): Map<string, ActiveGameEntry> {
  return activeGames;
}

export function getActiveGame(gameId: string): ActiveGameEntry | undefined {
  return activeGames.get(gameId);
}

export function getGameEngine(gameType: string): GameEngine | undefined {
  return gameEngines[gameType];
}

export function registerGameEngine(gameType: string, engine: GameEngine): void {
  gameEngines[gameType] = engine;
}

export function registerActiveGame(
  gameId: string,
  roomId: string,
  gameType: string,
  state: GameState
): void {
  const engine = gameEngines[gameType];
  if (!engine) {
    throw new Error(`Unknown game type: ${gameType}`);
  }

  activeGames.set(gameId, {
    engine,
    state,
    gameId,
    roomId,
    gameType,
    lastUpdated: Date.now(),
    moveCount: 0,
  });
}

export function updateGameStateInMemory(gameId: string, newState: GameState): boolean {
  const entry = activeGames.get(gameId);
  if (!entry) return false;

  entry.state = newState;
  entry.lastUpdated = Date.now();
  return true;
}

export async function persistGameState(gameId: string, state: GameState): Promise<void> {
  await prisma.game.update({
    where: { id: gameId },
    data: { state: state as object, lastMoveAt: new Date() },
  });
}

export async function updateAndPersistState(gameId: string, newState: GameState): Promise<void> {
  const entry = activeGames.get(gameId);
  if (!entry) {
    throw new Error(`Game ${gameId} not found in active games`);
  }

  entry.state = newState;
  entry.lastUpdated = Date.now();

  await prisma.game.update({
    where: { id: gameId },
    data: { state: newState as object, lastMoveAt: new Date() },
  });
}

export async function finishGame(
  gameId: string,
  winnerId: string | null,
  finalState?: GameState
): Promise<void> {
  activeGames.delete(gameId);
  removeSnapshot(gameId);

  await prisma.game.update({
    where: { id: gameId },
    data: {
      status: GameStatus.FINISHED,
      winnerId,
      finishedAt: new Date(),
      ...(finalState ? { state: finalState as object } : {}),
    },
  });
}

export function removeFromMemory(gameId: string): void {
  activeGames.delete(gameId);
  removeSnapshot(gameId);
}

export async function rehydrateActiveGames(): Promise<number> {
  const inProgressGames = await prisma.game.findMany({
    where: { status: GameStatus.IN_PROGRESS },
    include: {
      players: {
        include: {
          user: { select: { id: true, username: true, displayName: true } },
        },
      },
    },
  });

  let rehydratedCount = 0;

  for (const game of inProgressGames) {
    const engine = gameEngines[game.type];

    if (!engine) {
      await prisma.game.update({
        where: { id: game.id },
        data: { status: GameStatus.FINISHED, winnerId: null },
      });
      continue;
    }

    let state: GameState;

    try {
      state = game.state as GameState;
      if (typeof state === 'string') {
        state = JSON.parse(state) as GameState;
      }
    } catch {
      const snapshotState = loadSnapshot(game.id);
      if (snapshotState) {
        state = snapshotState;
      } else {
        await prisma.game.update({
          where: { id: game.id },
          data: { status: GameStatus.FINISHED, winnerId: null },
        });
        continue;
      }
    }

    if (!state || typeof state !== 'object') {
      await prisma.game.update({
        where: { id: game.id },
        data: { status: GameStatus.FINISHED, winnerId: null },
      });
      continue;
    }

    activeGames.set(game.id, {
      engine,
      state,
      gameId: game.id,
      roomId: game.roomId,
      gameType: game.type,
      lastUpdated: Date.now(),
      moveCount: 0,
    });

    rehydratedCount++;
  }

  rehydrateFromSnapshots();

  return rehydratedCount;
}

function rehydrateFromSnapshots(): void {
  if (!existsSync(SNAPSHOT_DIR)) return;

  const files = readdirSync(SNAPSHOT_DIR);
  for (const file of files) {
    if (!file.endsWith('.json')) continue;

    const gameId = file.replace('.json', '');
    if (activeGames.has(gameId)) continue;

    const state = loadSnapshot(gameId);
    if (!state) {
      removeSnapshot(gameId);
      continue;
    }

    const meta = state as { _meta?: { gameType: string; roomId: string } };
    if (!meta._meta) {
      removeSnapshot(gameId);
      continue;
    }

    const engine = gameEngines[meta._meta.gameType];
    if (!engine) {
      removeSnapshot(gameId);
      continue;
    }
  }
}

function ensureSnapshotDir(): void {
  if (!existsSync(SNAPSHOT_DIR)) {
    mkdirSync(SNAPSHOT_DIR, { recursive: true });
  }
}

async function writeSnapshot(gameId: string, entry: ActiveGameEntry): Promise<void> {
  try {
    ensureSnapshotDir();

    const snapshot = {
      _meta: {
        gameType: entry.gameType,
        roomId: entry.roomId,
        gameId: entry.gameId,
        snapshotAt: Date.now(),
      },
      ...entry.state,
    };

    const filePath = join(SNAPSHOT_DIR, `${gameId}.json`);
    await writeFile(filePath, JSON.stringify(snapshot), 'utf-8');
  } catch {
    // Snapshot write failure is non-critical
  }
}

function loadSnapshot(gameId: string): GameState | null {
  try {
    const filePath = join(SNAPSHOT_DIR, `${gameId}.json`);
    if (!existsSync(filePath)) return null;

    const raw = readFileSync(filePath, 'utf-8');
    const parsed = JSON.parse(raw) as GameState;
    return parsed;
  } catch {
    return null;
  }
}

function removeSnapshot(gameId: string): void {
  try {
    const filePath = join(SNAPSHOT_DIR, `${gameId}.json`);
    if (existsSync(filePath)) {
      unlinkSync(filePath);
    }
  } catch {
    // Non-critical
  }
}

async function writeAllSnapshots(): Promise<void> {
  const writes = Array.from(activeGames.entries()).map(([gameId, entry]) =>
    writeSnapshot(gameId, entry)
  );
  await Promise.allSettled(writes);
}

export function startSnapshotInterval(): void {
  if (snapshotIntervalHandle) return;

  ensureSnapshotDir();

  snapshotIntervalHandle = setInterval(() => {
    writeAllSnapshots().catch(() => {});
  }, SNAPSHOT_INTERVAL_MS);
}

export async function stopSnapshotInterval(): Promise<void> {
  if (snapshotIntervalHandle) {
    clearInterval(snapshotIntervalHandle);
    snapshotIntervalHandle = null;
  }

  await writeAllSnapshots();
}

export function clearAllSnapshots(): void {
  try {
    if (!existsSync(SNAPSHOT_DIR)) return;

    const files = readdirSync(SNAPSHOT_DIR);
    for (const file of files) {
      const filePath = join(SNAPSHOT_DIR, file);
      unlinkSync(filePath);
    }
  } catch {
    // Non-critical
  }
}

export function getServiceStats(): {
  activeGameCount: number;
  gameTypes: Record<string, number>;
  oldestGameAge: number | null;
} {
  const gameTypes: Record<string, number> = {};
  let oldestTimestamp: number | null = null;

  for (const entry of activeGames.values()) {
    gameTypes[entry.gameType] = (gameTypes[entry.gameType] || 0) + 1;

    if (oldestTimestamp === null || entry.lastUpdated < oldestTimestamp) {
      oldestTimestamp = entry.lastUpdated;
    }
  }

  return {
    activeGameCount: activeGames.size,
    gameTypes,
    oldestGameAge: oldestTimestamp ? Date.now() - oldestTimestamp : null,
  };
}

export { activeGames, gameEngines };

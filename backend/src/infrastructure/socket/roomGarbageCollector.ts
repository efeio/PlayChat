import type { Server } from 'socket.io';
import prisma from '../config/prisma.js';
import { getActiveGames, finishGame } from '../../modules/game/index.js';

const EVICTION_GRACE_MS = 30 * 1000; // 30 seconds
const PERIODIC_SWEEP_INTERVAL_MS = 60 * 1000; // sweep every 60 seconds

const evictionTimers = new Map<string, ReturnType<typeof setTimeout>>();

let ioRef: Server | null = null;
let sweepIntervalHandle: ReturnType<typeof setInterval> | null = null;

export function initRoomGarbageCollector(io: Server): void {
  ioRef = io;
  setTimeout(() => sweepActiveRooms(), 5000);

  sweepIntervalHandle = setInterval(() => sweepActiveRooms(), PERIODIC_SWEEP_INTERVAL_MS);
}

async function sweepActiveRooms(): Promise<void> {
  if (!ioRef) return;

  try {
    const activeRooms = await prisma.room.findMany({
      where: { isActive: true },
      select: { id: true },
    });

    for (const room of activeRooms) {
      await evaluateRoomOnLeave(room.id);
    }
  } catch {
    // Non-critical
  }
}

export async function evaluateRoomOnLeave(roomId: string): Promise<void> {
  if (!ioRef) return;
  if (evictionTimers.has(roomId)) return;

  const socketsInRoom = await ioRef.in(roomId).fetchSockets();
  if (socketsInRoom.length > 0) return;

  const timer = setTimeout(() => {
    evictionTimers.delete(roomId);
    executeRoomEviction(roomId);
  }, EVICTION_GRACE_MS);

  evictionTimers.set(roomId, timer);
}

export function cancelEvictionOnJoin(roomId: string): void {
  const timer = evictionTimers.get(roomId);
  if (timer) {
    clearTimeout(timer);
    evictionTimers.delete(roomId);
  }
}

async function executeRoomEviction(roomId: string): Promise<void> {
  if (ioRef) {
    const socketsInRoom = await ioRef.in(roomId).fetchSockets();
    if (socketsInRoom.length > 0) {
      return;
    }
  }

  const activeGames = getActiveGames();
  for (const [gameId, game] of activeGames.entries()) {
    if (game.roomId !== roomId) continue;

    try {
      await finishGame(gameId, null, game.state);
    } catch {
      // Game may have already been finished by another path
    }
  }

  try {
    await prisma.roomMember.deleteMany({
      where: { roomId },
    });
  } catch {
    // Non-critical: memberships may already be gone
  }

  try {
    await prisma.room.update({
      where: { id: roomId },
      data: { isActive: false, currentGameId: null },
    });
  } catch {
    // Room may have been deleted externally
  }
}

export function isEvictionPending(roomId: string): boolean {
  return evictionTimers.has(roomId);
}

export function getPendingEvictionCount(): number {
  return evictionTimers.size;
}

export function shutdownGarbageCollector(): void {
  if (sweepIntervalHandle) {
    clearInterval(sweepIntervalHandle);
    sweepIntervalHandle = null;
  }
  for (const [, timer] of evictionTimers.entries()) {
    clearTimeout(timer);
  }
  evictionTimers.clear();
  ioRef = null;
}

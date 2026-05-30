import type { Server } from 'socket.io';
import prisma from '../config/prisma.js';
import { getActiveGames, finishGame } from '../../modules/game/index.js';

/**
 * Configurable grace period before a zombie room is evicted.
 * Accommodates accidental disconnections and quick page refreshes.
 */
const EVICTION_GRACE_MS = 2 * 60 * 1000; // 2 minutes

/**
 * Maps roomId -> active eviction timer handle.
 * When a timer fires, the room is confirmed empty and evicted.
 * When a user joins before the timer fires, the timer is cancelled.
 */
const evictionTimers = new Map<string, ReturnType<typeof setTimeout>>();

/**
 * Reference to the Socket.IO server, set during initialization.
 * Used to verify room occupancy at eviction time (double-check).
 */
let ioRef: Server | null = null;

/**
 * Initializes the garbage collector with the Socket.IO server reference.
 * Must be called once during server startup before any room events fire.
 * Schedules an initial sweep of all ACTIVE rooms to catch pre-existing zombies.
 */
export function initRoomGarbageCollector(io: Server): void {
  ioRef = io;
  setTimeout(() => sweepExistingRooms(), 5000);
}

/**
 * Startup sweep: queries all ACTIVE rooms from the database and evaluates
 * each one for eviction. Rooms with zero connected sockets will begin
 * their grace-period countdown immediately.
 */
async function sweepExistingRooms(): Promise<void> {
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
    // Non-critical: sweep will happen organically on next disconnect
  }
}

/**
 * Evaluates whether a room should begin its eviction countdown.
 * Called when a socket disconnects or explicitly leaves a room.
 *
 * Algorithm:
 * 1. Query Socket.IO for the current occupancy of the room.
 * 2. If occupancy > 0, the room is still alive — no action.
 * 3. If occupancy === 0 and no timer is already running, start the grace countdown.
 *
 * The Socket.IO `fetchSockets` call is the authoritative source of truth for
 * real-time occupancy. This avoids maintaining a separate counter that could
 * drift due to race conditions between disconnect/join events.
 */
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

/**
 * Cancels a pending eviction for a room.
 * Called when a user successfully joins a room, signaling it's still wanted.
 *
 * This is safe to call even if no timer exists (idempotent).
 */
export function cancelEvictionOnJoin(roomId: string): void {
  const timer = evictionTimers.get(roomId);
  if (timer) {
    clearTimeout(timer);
    evictionTimers.delete(roomId);
  }
}

/**
 * Executes the full eviction procedure for a zombie room.
 *
 * Steps:
 * 1. Double-check that the room is still empty (prevents race with late joiners).
 * 2. Terminate any in-progress games associated with this room.
 * 3. Remove all room memberships (cleans the join table).
 * 4. Mark the room status as CLOSED in the database.
 *
 * All database operations are wrapped in individual try/catch blocks to ensure
 * partial progress is not lost if one step fails (e.g., game already finished
 * by another code path).
 */
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

/**
 * Returns whether an eviction timer is currently pending for a room.
 * Useful for observability and testing.
 */
export function isEvictionPending(roomId: string): boolean {
  return evictionTimers.has(roomId);
}

/**
 * Returns the count of currently pending eviction timers.
 */
export function getPendingEvictionCount(): number {
  return evictionTimers.size;
}

/**
 * Cancels all pending eviction timers.
 * Called during graceful server shutdown to prevent timers firing
 * after the database connection is closed.
 */
export function shutdownGarbageCollector(): void {
  for (const [roomId, timer] of evictionTimers.entries()) {
    clearTimeout(timer);
    evictionTimers.delete(roomId);
  }
  ioRef = null;
}

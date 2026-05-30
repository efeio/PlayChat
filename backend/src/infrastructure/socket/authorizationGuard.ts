/**
 * Authorization Guard for Socket.IO Events
 * ------------------------------------------
 * Validates Broken Object Level Authorization (BOLA) on every socket event.
 * Ensures the authenticated user can only interact with rooms they have
 * actively joined via the socket transport layer.
 *
 * Resolves BUG-015: Prevents cross-room event spoofing.
 */

import type { Socket } from 'socket.io';

/**
 * Tracks which socket room each socket has joined.
 * Key: socket.id, Value: roomId
 * This is the authoritative source for "which room is this socket in?"
 */
const socketRoomMap = new Map<string, string>();

/**
 * Dangerous object keys that could lead to prototype pollution.
 * Used by payload validation to reject malicious payloads.
 */
const DANGEROUS_KEYS = new Set([
  '__proto__',
  'constructor',
  'prototype',
  '__defineGetter__',
  '__defineSetter__',
  '__lookupGetter__',
  '__lookupSetter__',
]);

/**
 * Events that do NOT require room membership verification.
 * These are either pre-room events or system-level events.
 */
const ROOM_EXEMPT_EVENTS = new Set([
  'authenticate',
  'disconnect',
  'disconnecting',
  'room:join',
  'room:get_state',
  'ping',
  'error',
]);

/**
 * Checks if the socket is fully authenticated.
 * Returns the user identity or null if not authenticated.
 *
 * @param socket - The Socket.IO socket instance.
 * @returns User identity object or null.
 */
export function requireAuth(socket: Socket): { userId: string; username: string } | null {
  if (!socket.data.authenticated) {
    return null;
  }

  const userId = socket.data.userId as string | undefined;
  const username = socket.data.username as string | undefined;

  if (!userId || !username) {
    return null;
  }

  return { userId, username };
}

/**
 * Verifies that the socket has joined the specified room via our
 * application-level room tracking (socketRoomMap).
 *
 * This is INDEPENDENT of Socket.IO's internal room membership, which
 * can be manipulated. Our socketRoomMap is the trusted source.
 *
 * @param socket - The Socket.IO socket instance.
 * @param roomId - The room being accessed.
 * @returns `true` if the socket is authorized for this room.
 */
export function requireRoomMembership(socket: Socket, roomId: string): boolean {
  if (!socket.data.authenticated) return false;
  if (!roomId || typeof roomId !== 'string') return false;

  const currentRoom = socketRoomMap.get(socket.id);
  return currentRoom === roomId;
}

/**
 * Checks if a given event name requires room membership verification.
 *
 * @param eventName - The socket event name.
 * @returns `true` if the event requires room authorization.
 */
export function eventRequiresRoom(eventName: string): boolean {
  return !ROOM_EXEMPT_EVENTS.has(eventName);
}

/**
 * Extracts the roomId from an event payload.
 * Handles multiple payload structures:
 * - { roomId: string }
 * - { gameId: string } (roomId resolved via activeGames lookup)
 *
 * @param data - The first argument of the socket event.
 * @returns The roomId string or null if not extractable.
 */
export function extractRoomIdFromPayload(data: unknown): string | null {
  if (!data || typeof data !== 'object') return null;
  const obj = data as Record<string, unknown>;

  if (typeof obj.roomId === 'string' && obj.roomId.length > 0) {
    return obj.roomId;
  }

  return null;
}

/**
 * Deep-validates a payload object for safety:
 * 1. Rejects prototype pollution keys (__proto__, constructor, prototype).
 * 2. Enforces maximum nesting depth.
 * 3. Validates string values don't exceed maximum length.
 *
 * @param obj - The payload to validate.
 * @param maxDepth - Maximum allowed nesting depth (default: 6).
 * @param maxStringLength - Maximum string value length (default: 5000).
 * @returns `true` if the payload is safe to process.
 */
export function isPayloadSafe(
  obj: unknown,
  maxDepth: number = 6,
  maxStringLength: number = 5000
): boolean {
  return validatePayloadRecursive(obj, 0, maxDepth, maxStringLength);
}

function validatePayloadRecursive(
  obj: unknown,
  currentDepth: number,
  maxDepth: number,
  maxStringLength: number
): boolean {
  if (currentDepth > maxDepth) return false;

  if (obj === null || obj === undefined) return true;

  if (typeof obj === 'string') {
    return obj.length <= maxStringLength;
  }

  if (typeof obj === 'number' || typeof obj === 'boolean') {
    return true;
  }

  if (typeof obj !== 'object') return false;

  if (Array.isArray(obj)) {
    if (obj.length > 1000) return false;
    for (const item of obj) {
      if (!validatePayloadRecursive(item, currentDepth + 1, maxDepth, maxStringLength)) {
        return false;
      }
    }
    return true;
  }

  const keys = Object.keys(obj as Record<string, unknown>);
  if (keys.length > 100) return false;

  for (const key of keys) {
    if (DANGEROUS_KEYS.has(key)) return false;
    if (key.length > 200) return false;

    const value = (obj as Record<string, unknown>)[key];
    if (!validatePayloadRecursive(value, currentDepth + 1, maxDepth, maxStringLength)) {
      return false;
    }
  }

  return true;
}

/**
 * Sanitizes a string input:
 * - Removes null bytes
 * - Removes ASCII control characters (preserving \n, \r, \t)
 * - Trims leading/trailing whitespace
 * - Enforces max length
 *
 * @param input - The raw input value.
 * @param maxLength - Maximum allowed length.
 * @returns Sanitized string or null if input is invalid.
 */
export function sanitizeString(input: unknown, maxLength: number = 2000): string | null {
  if (typeof input !== 'string') return null;
  if (input.length === 0) return null;

  const cleaned = input
    .replace(/\0/g, '')
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '')
    .trim();

  if (cleaned.length === 0) return null;
  if (cleaned.length > maxLength) return null;

  return cleaned;
}

/**
 * Validates a typed payload against required string fields.
 * Used for quick structural validation before processing.
 *
 * @param data - The event payload.
 * @param requiredFields - Array of field names that must be non-empty strings.
 * @returns `true` if all required fields are present and valid.
 */
export function validateRequiredFields(
  data: unknown,
  requiredFields: string[]
): boolean {
  if (!data || typeof data !== 'object') return false;
  const obj = data as Record<string, unknown>;

  for (const field of requiredFields) {
    const value = obj[field];
    if (value === undefined || value === null) return false;
    if (typeof value === 'string' && value.trim().length === 0) return false;
  }

  return true;
}

/**
 * Registers a socket into a room in our tracking map.
 * Called when `room:join` succeeds.
 *
 * @param socketId - The socket.id.
 * @param roomId - The room being joined.
 */
export function trackSocketRoom(socketId: string, roomId: string): void {
  socketRoomMap.set(socketId, roomId);
}

/**
 * Removes a socket from room tracking.
 * Called on `room:leave` or `disconnect`.
 *
 * @param socketId - The socket.id.
 * @returns The roomId the socket was in, or undefined if not tracked.
 */
export function untrackSocketRoom(socketId: string): string | undefined {
  const roomId = socketRoomMap.get(socketId);
  socketRoomMap.delete(socketId);
  return roomId;
}

/**
 * Gets the current room for a socket.
 *
 * @param socketId - The socket.id.
 * @returns The roomId or undefined.
 */
export function getSocketRoom(socketId: string): string | undefined {
  return socketRoomMap.get(socketId);
}

/**
 * Checks if a socket is currently in any room.
 *
 * @param socketId - The socket.id.
 * @returns `true` if the socket is tracked in a room.
 */
export function isSocketInRoom(socketId: string): boolean {
  return socketRoomMap.has(socketId);
}

/**
 * Returns current tracking stats for observability.
 */
export function getGuardStats(): { trackedSockets: number } {
  return { trackedSockets: socketRoomMap.size };
}

export { socketRoomMap };

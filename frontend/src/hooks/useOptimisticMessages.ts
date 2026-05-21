/**
 * useOptimisticMessages — Instant UI Feedback for Sent Messages
 * ---------------------------------------------------------------
 * Manages optimistic (local-only) messages that appear instantly in the UI
 * before server acknowledgement arrives. Handles three states:
 *
 * 1. PENDING — Message is shown immediately with a "sending" indicator.
 * 2. CONFIRMED — Server ACK received; optimistic entry is removed and
 *    replaced by the authoritative server message.
 * 3. FAILED — Server rejected or timeout; message shows error state
 *    with retry/dismiss options.
 *
 * Each optimistic message carries a unique client-side transaction ID (clientId)
 * that links it to the server's acknowledgement response.
 *
 * Resolves BUG-021: Optimistic UI handling for high-latency conditions.
 */

import { useState, useCallback, useRef } from 'react';
import type { Message } from '../types/room.types';

/**
 * An optimistic message extends the base Message type with
 * local-only metadata for state tracking.
 */
export interface OptimisticMessage extends Message {
  _optimistic: true;
  _clientId: string;
  _status: 'pending' | 'failed';
  _createdLocally: number;
}

/**
 * Return type of the hook.
 */
export interface OptimisticMessagesAPI {
  /** Array of currently pending/failed optimistic messages */
  optimisticMessages: OptimisticMessage[];

  /**
   * Creates and tracks a new optimistic message.
   * Returns the generated clientId for linking to server responses.
   */
  addOptimistic: (
    roomId: string,
    content: string,
    user: { id: string; username: string; displayName: string }
  ) => string;

  /**
   * Confirms delivery of a message, removing it from the optimistic list.
   * Called when the server's broadcast matches this clientId or content.
   */
  confirmOptimistic: (clientId: string) => void;

  /**
   * Marks a message as failed. It remains visible with error styling.
   */
  failOptimistic: (clientId: string) => void;

  /**
   * Removes a message entirely (user dismissed a failed message).
   */
  dismissOptimistic: (clientId: string) => void;

  /**
   * Resets a failed message to pending (user clicked retry).
   * Returns the message content for re-emission.
   */
  retryOptimistic: (clientId: string) => OptimisticMessage | null;

  /**
   * Attempts to reconcile an incoming server message with a pending
   * optimistic message. Uses userId + content + timing window matching.
   * Returns true if a match was found and removed.
   */
  reconcileWithServer: (serverMessage: Message) => boolean;

  /**
   * Clears all optimistic messages (e.g., on room change).
   */
  clearAll: () => void;

  /**
   * Returns whether a given clientId is currently tracked.
   */
  isTracked: (clientId: string) => boolean;
}

/**
 * Time window (ms) within which a server message can match an optimistic one.
 * If the server message arrives more than this after the optimistic was created,
 * it won't be auto-reconciled (assumes a different message).
 */
const RECONCILIATION_WINDOW_MS = 15000;

/**
 * Maximum age of an optimistic message before it's auto-failed.
 */
const AUTO_FAIL_TIMEOUT_MS = 30000;

/**
 * Generates a unique client-side transaction ID.
 * Uses timestamp + random entropy for collision resistance.
 */
function generateClientId(): string {
  const ts = Date.now().toString(36);
  const rand = Math.random().toString(36).substring(2, 12);
  return `opt_${ts}_${rand}`;
}

/**
 * Custom hook for managing optimistic message state.
 */
export function useOptimisticMessages(): OptimisticMessagesAPI {
  const [optimisticMessages, setOptimisticMessages] = useState<OptimisticMessage[]>([]);

  /**
   * Internal map for O(1) lookups by clientId.
   * Kept in sync with the state array.
   */
  const trackingRef = useRef<Map<string, OptimisticMessage>>(new Map());

  /**
   * Timeout handles for auto-failing messages.
   */
  const timeoutRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

  /**
   * Schedules an auto-fail timeout for a message.
   */
  const scheduleAutoFail = useCallback((clientId: string) => {
    const existing = timeoutRef.current.get(clientId);
    if (existing) clearTimeout(existing);

    const timeout = setTimeout(() => {
      timeoutRef.current.delete(clientId);
      const tracked = trackingRef.current.get(clientId);
      if (tracked && tracked._status === 'pending') {
        tracked._status = 'failed';
        trackingRef.current.set(clientId, tracked);
        setOptimisticMessages((prev) =>
          prev.map((m) => (m._clientId === clientId ? { ...m, _status: 'failed' as const } : m))
        );
      }
    }, AUTO_FAIL_TIMEOUT_MS);

    timeoutRef.current.set(clientId, timeout);
  }, []);

  /**
   * Cancels the auto-fail timeout for a message.
   */
  const cancelAutoFail = useCallback((clientId: string) => {
    const timeout = timeoutRef.current.get(clientId);
    if (timeout) {
      clearTimeout(timeout);
      timeoutRef.current.delete(clientId);
    }
  }, []);

  /**
   * Creates and immediately renders an optimistic message.
   */
  const addOptimistic = useCallback(
    (
      roomId: string,
      content: string,
      user: { id: string; username: string; displayName: string }
    ): string => {
      const clientId = generateClientId();
      const now = Date.now();

      const message: OptimisticMessage = {
        id: clientId,
        content,
        type: 'CHAT',
        userId: user.id,
        roomId,
        createdAt: new Date(now).toISOString(),
        user,
        _optimistic: true,
        _clientId: clientId,
        _status: 'pending',
        _createdLocally: now,
      };

      trackingRef.current.set(clientId, message);
      setOptimisticMessages((prev) => [...prev, message]);
      scheduleAutoFail(clientId);

      return clientId;
    },
    [scheduleAutoFail]
  );

  /**
   * Confirms successful delivery — removes from optimistic list.
   */
  const confirmOptimistic = useCallback(
    (clientId: string) => {
      cancelAutoFail(clientId);
      trackingRef.current.delete(clientId);
      setOptimisticMessages((prev) => prev.filter((m) => m._clientId !== clientId));
    },
    [cancelAutoFail]
  );

  /**
   * Marks a message as failed (server rejected or network error).
   */
  const failOptimistic = useCallback(
    (clientId: string) => {
      cancelAutoFail(clientId);
      const tracked = trackingRef.current.get(clientId);
      if (tracked) {
        tracked._status = 'failed';
        trackingRef.current.set(clientId, tracked);
      }
      setOptimisticMessages((prev) =>
        prev.map((m) => (m._clientId === clientId ? { ...m, _status: 'failed' as const } : m))
      );
    },
    [cancelAutoFail]
  );

  /**
   * Removes a message entirely (user dismissed).
   */
  const dismissOptimistic = useCallback(
    (clientId: string) => {
      cancelAutoFail(clientId);
      trackingRef.current.delete(clientId);
      setOptimisticMessages((prev) => prev.filter((m) => m._clientId !== clientId));
    },
    [cancelAutoFail]
  );

  /**
   * Resets a failed message to pending for retry.
   * Returns the message so the caller can re-emit it.
   */
  const retryOptimistic = useCallback(
    (clientId: string): OptimisticMessage | null => {
      const tracked = trackingRef.current.get(clientId);
      if (!tracked) return null;

      tracked._status = 'pending';
      tracked._createdLocally = Date.now();
      trackingRef.current.set(clientId, tracked);

      setOptimisticMessages((prev) =>
        prev.map((m) => (m._clientId === clientId ? { ...m, _status: 'pending' as const } : m))
      );

      scheduleAutoFail(clientId);
      return tracked;
    },
    [scheduleAutoFail]
  );

  /**
   * Attempts to match an incoming server message to a pending optimistic one.
   *
   * Matching criteria (all must match):
   * 1. Same userId
   * 2. Same content (trimmed)
   * 3. Server message arrived within RECONCILIATION_WINDOW_MS of the optimistic creation
   *
   * If matched, the optimistic message is silently removed (the server
   * message takes its place in the main messages array).
   */
  const reconcileWithServer = useCallback(
    (serverMessage: Message): boolean => {
      const now = Date.now();

      for (const [clientId, optMsg] of trackingRef.current.entries()) {
        if (optMsg._status === 'failed') continue;

        const ageMs = now - optMsg._createdLocally;
        if (ageMs > RECONCILIATION_WINDOW_MS) continue;

        if (
          optMsg.userId === serverMessage.userId &&
          optMsg.content.trim() === serverMessage.content.trim()
        ) {
          cancelAutoFail(clientId);
          trackingRef.current.delete(clientId);
          setOptimisticMessages((prev) => prev.filter((m) => m._clientId !== clientId));
          return true;
        }
      }

      return false;
    },
    [cancelAutoFail]
  );

  /**
   * Clears all tracked optimistic messages and their timeouts.
   */
  const clearAll = useCallback(() => {
    for (const timeout of timeoutRef.current.values()) {
      clearTimeout(timeout);
    }
    timeoutRef.current.clear();
    trackingRef.current.clear();
    setOptimisticMessages([]);
  }, []);

  /**
   * Checks if a clientId is currently being tracked.
   */
  const isTracked = useCallback((clientId: string): boolean => {
    return trackingRef.current.has(clientId);
  }, []);

  return {
    optimisticMessages,
    addOptimistic,
    confirmOptimistic,
    failOptimistic,
    dismissOptimistic,
    retryOptimistic,
    reconcileWithServer,
    clearAll,
    isTracked,
  };
}

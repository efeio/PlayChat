/**
 * useNetworkResilience — Network State & Reconnection Hook
 * ----------------------------------------------------------
 * Tracks physical network state (online/offline), Socket.IO connection
 * lifecycle, and coordinates automatic queue flushing upon stable reconnection.
 *
 * Features:
 * - Listens to browser online/offline events for physical network state.
 * - Monitors Socket.IO reconnection attempts with exponential backoff awareness.
 * - Measures connection quality via periodic latency pings.
 * - Triggers offline queue flush when a stable connection is re-established.
 * - Exposes connection quality grades for UI indicators.
 *
 * Resolves BUG-011: Network toggle resilience and automatic recovery.
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import type { Socket } from 'socket.io-client';
import {
  flushQueue,
  getPendingCount,
  type QueuedMessage,
  type MessageSender,
} from '../services/offlineQueue';

/**
 * Connection quality grades based on measured latency.
 */
export type ConnectionQuality = 'excellent' | 'good' | 'degraded' | 'poor' | 'offline';

/**
 * Full network state exposed by the hook.
 */
export interface NetworkState {
  /** Whether the browser reports navigator.onLine */
  isOnline: boolean;
  /** Whether the Socket.IO transport is connected */
  isSocketConnected: boolean;
  /** Whether authentication has completed on the current socket */
  isAuthenticated: boolean;
  /** Latency-based quality assessment */
  connectionQuality: ConnectionQuality;
  /** Current reconnection attempt number (0 = connected) */
  reconnectAttempt: number;
  /** Timestamp of last successful connection */
  lastConnectedAt: number | null;
  /** Timestamp of last disconnection event */
  lastDisconnectedAt: number | null;
  /** Measured latency in ms (null if not yet measured) */
  latencyMs: number | null;
  /** Number of messages waiting in offline queue */
  pendingQueueCount: number;
  /** Whether the queue is currently being flushed */
  isFlushing: boolean;
}

/**
 * Configuration for the resilience hook.
 */
interface ResilienceConfig {
  /** Interval between latency pings (ms). Default: 15000 */
  pingIntervalMs?: number;
  /** How long to wait after reconnect before flushing queue (ms). Default: 1500 */
  flushDelayMs?: number;
  /** Maximum latency samples to keep for averaging. Default: 10 */
  maxLatencySamples?: number;
  /** Callback when connection is restored after being offline */
  onReconnected?: () => void;
  /** Callback when connection is lost */
  onDisconnected?: (reason: string) => void;
}

const DEFAULT_CONFIG: Required<ResilienceConfig> = {
  pingIntervalMs: 15000,
  flushDelayMs: 1500,
  maxLatencySamples: 10,
  onReconnected: () => {},
  onDisconnected: () => {},
};

/**
 * Determines connection quality grade from average latency.
 */
function gradeLatency(avgMs: number): ConnectionQuality {
  if (avgMs < 80) return 'excellent';
  if (avgMs < 200) return 'good';
  if (avgMs < 500) return 'degraded';
  return 'poor';
}

/**
 * useNetworkResilience
 *
 * @param socket - The Socket.IO client instance (from SocketContext).
 * @param isSocketAuthenticated - Whether the socket has completed authentication.
 * @param config - Optional configuration overrides.
 * @returns NetworkState object with all connectivity information.
 */
export function useNetworkResilience(
  socket: Socket | null,
  isSocketAuthenticated: boolean,
  config?: ResilienceConfig
): NetworkState {
  const opts = { ...DEFAULT_CONFIG, ...config };

  const [state, setState] = useState<NetworkState>({
    isOnline: typeof navigator !== 'undefined' ? navigator.onLine : true,
    isSocketConnected: false,
    isAuthenticated: false,
    connectionQuality: 'good',
    reconnectAttempt: 0,
    lastConnectedAt: null,
    lastDisconnectedAt: null,
    latencyMs: null,
    pendingQueueCount: getPendingCount(),
    isFlushing: false,
  });

  const latencyHistoryRef = useRef<number[]>([]);
  const pingIntervalRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const flushTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const wasDisconnectedRef = useRef(false);
  const onReconnectedRef = useRef(opts.onReconnected);
  const onDisconnectedRef = useRef(opts.onDisconnected);

  onReconnectedRef.current = opts.onReconnected;
  onDisconnectedRef.current = opts.onDisconnected;

  /**
   * Measures round-trip latency via a socket ping.
   */
  const measureLatency = useCallback(() => {
    if (!socket || !socket.connected) return;

    const start = Date.now();
    socket.emit('ping', null, () => {
      const latency = Date.now() - start;
      const history = latencyHistoryRef.current;
      history.push(latency);

      if (history.length > opts.maxLatencySamples) {
        history.shift();
      }

      const avgLatency = Math.round(
        history.reduce((sum, val) => sum + val, 0) / history.length
      );

      const quality = gradeLatency(avgLatency);

      setState((prev) => ({
        ...prev,
        latencyMs: avgLatency,
        connectionQuality: quality,
      }));
    });
  }, [socket, opts.maxLatencySamples]);

  /**
   * Creates a message sender function bound to the current socket.
   * Used by flushQueue to actually emit messages.
   */
  const createSender = useCallback((): MessageSender => {
    return async (message: QueuedMessage): Promise<boolean> => {
      if (!socket || !socket.connected) return false;

      return new Promise<boolean>((resolve) => {
        const timeout = setTimeout(() => {
          resolve(false);
        }, 5000);

        socket.emit(
          'message:send',
          {
            clientId: message.clientId,
            roomId: message.roomId,
            content: message.content,
          },
          (res: { error?: string } | undefined) => {
            clearTimeout(timeout);
            if (res?.error) {
              resolve(false);
            } else {
              resolve(true);
            }
          }
        );
      });
    };
  }, [socket]);

  /**
   * Attempts to flush the offline queue.
   * Only proceeds if the socket is connected and authenticated.
   */
  const attemptFlush = useCallback(async () => {
    if (!socket || !socket.connected || !isSocketAuthenticated) return;

    const pendingCount = getPendingCount();
    if (pendingCount === 0) return;

    setState((prev) => ({ ...prev, isFlushing: true }));

    const sender = createSender();
    await flushQueue(sender);

    setState((prev) => ({
      ...prev,
      isFlushing: false,
      pendingQueueCount: getPendingCount(),
    }));
  }, [socket, isSocketAuthenticated, createSender]);

  /**
   * Browser online/offline event handlers.
   */
  useEffect(() => {
    const handleOnline = () => {
      setState((prev) => ({
        ...prev,
        isOnline: true,
      }));

      if (socket && !socket.connected) {
        socket.connect();
      }
    };

    const handleOffline = () => {
      setState((prev) => ({
        ...prev,
        isOnline: false,
        connectionQuality: 'offline',
      }));
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [socket]);

  /**
   * Socket.IO connection lifecycle listeners.
   */
  useEffect(() => {
    if (!socket) return;

    const handleConnect = () => {
      const now = Date.now();
      latencyHistoryRef.current = [];

      setState((prev) => ({
        ...prev,
        isSocketConnected: true,
        reconnectAttempt: 0,
        lastConnectedAt: now,
        connectionQuality: 'good',
        pendingQueueCount: getPendingCount(),
      }));

      if (wasDisconnectedRef.current) {
        wasDisconnectedRef.current = false;
        onReconnectedRef.current();

        if (flushTimeoutRef.current) {
          clearTimeout(flushTimeoutRef.current);
        }
        flushTimeoutRef.current = setTimeout(() => {
          attemptFlush();
          flushTimeoutRef.current = null;
        }, opts.flushDelayMs);
      }
    };

    const handleDisconnect = (reason: string) => {
      wasDisconnectedRef.current = true;

      setState((prev) => ({
        ...prev,
        isSocketConnected: false,
        isAuthenticated: false,
        lastDisconnectedAt: Date.now(),
        connectionQuality: navigator.onLine ? 'poor' : 'offline',
      }));

      onDisconnectedRef.current(reason);

      if (reason === 'io server disconnect') {
        socket.connect();
      }
    };

    const handleReconnectAttempt = (attempt: number) => {
      setState((prev) => ({
        ...prev,
        reconnectAttempt: attempt,
      }));
    };

    const handleReconnect = (_attempt: number) => {
      setState((prev) => ({
        ...prev,
        isSocketConnected: true,
        reconnectAttempt: 0,
        lastConnectedAt: Date.now(),
      }));
    };

    const handleReconnectError = () => {
      setState((prev) => ({
        ...prev,
        connectionQuality: navigator.onLine ? 'poor' : 'offline',
      }));
    };

    socket.on('connect', handleConnect);
    socket.on('disconnect', handleDisconnect);
    socket.io.on('reconnect_attempt', handleReconnectAttempt);
    socket.io.on('reconnect', handleReconnect);
    socket.io.on('reconnect_error', handleReconnectError);

    if (socket.connected) {
      setState((prev) => ({
        ...prev,
        isSocketConnected: true,
        lastConnectedAt: Date.now(),
      }));
    }

    return () => {
      socket.off('connect', handleConnect);
      socket.off('disconnect', handleDisconnect);
      socket.io.off('reconnect_attempt', handleReconnectAttempt);
      socket.io.off('reconnect', handleReconnect);
      socket.io.off('reconnect_error', handleReconnectError);
    };
  }, [socket, opts.flushDelayMs, attemptFlush]);

  /**
   * Sync authentication state from parent.
   */
  useEffect(() => {
    setState((prev) => ({
      ...prev,
      isAuthenticated: isSocketAuthenticated,
    }));

    if (isSocketAuthenticated && wasDisconnectedRef.current) {
      if (flushTimeoutRef.current) {
        clearTimeout(flushTimeoutRef.current);
      }
      flushTimeoutRef.current = setTimeout(() => {
        attemptFlush();
        flushTimeoutRef.current = null;
      }, opts.flushDelayMs);
    }
  }, [isSocketAuthenticated, opts.flushDelayMs, attemptFlush]);

  /**
   * Periodic latency measurement.
   */
  useEffect(() => {
    if (!socket || !socket.connected || !isSocketAuthenticated) {
      if (pingIntervalRef.current) {
        clearInterval(pingIntervalRef.current);
        pingIntervalRef.current = null;
      }
      return;
    }

    measureLatency();

    pingIntervalRef.current = setInterval(measureLatency, opts.pingIntervalMs);

    return () => {
      if (pingIntervalRef.current) {
        clearInterval(pingIntervalRef.current);
        pingIntervalRef.current = null;
      }
    };
  }, [socket, isSocketAuthenticated, measureLatency, opts.pingIntervalMs]);

  /**
   * Cleanup on unmount.
   */
  useEffect(() => {
    return () => {
      if (pingIntervalRef.current) {
        clearInterval(pingIntervalRef.current);
      }
      if (flushTimeoutRef.current) {
        clearTimeout(flushTimeoutRef.current);
      }
    };
  }, []);

  return state;
}

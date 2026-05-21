/**
 * Offline Message Queue — Local Persistence Layer
 * -------------------------------------------------
 * Intercepts and queues outbound chat messages when the client is physically
 * offline or the socket connection is unavailable. Persists queued messages
 * to localStorage so they survive page refreshes and tab closures.
 *
 * Exposes synchronization triggers to flush the queue once connectivity
 * is restored and the socket is re-authenticated.
 *
 * Resolves BUG-012: Offline message delivery queue syncing.
 */

/**
 * Represents a single queued message awaiting delivery.
 */
export interface QueuedMessage {
  clientId: string;
  roomId: string;
  content: string;
  timestamp: number;
  retryCount: number;
  status: 'pending' | 'sending' | 'failed';
}

/**
 * Callback signature for the flush mechanism.
 * Returns true if the message was successfully sent, false otherwise.
 */
export type MessageSender = (message: QueuedMessage) => Promise<boolean>;

/**
 * Event listeners for queue state changes.
 */
export type QueueEventType = 'enqueued' | 'sent' | 'failed' | 'flushing' | 'flushed';
export type QueueEventListener = (event: QueueEventType, message?: QueuedMessage) => void;

const STORAGE_KEY = 'playchat_offline_queue';
const MAX_QUEUE_SIZE = 100;
const MAX_MESSAGE_AGE_MS = 10 * 60 * 1000; // 10 minutes
const MAX_RETRY_COUNT = 5;
const FLUSH_CONCURRENCY = 3;
const FLUSH_DELAY_BETWEEN_MS = 200;

/**
 * In-memory mirror of the persisted queue for fast access.
 */
let memoryQueue: QueuedMessage[] = [];

/**
 * Flag to prevent concurrent flush operations.
 */
let isFlushing = false;

/**
 * Registered event listeners.
 */
const listeners: Set<QueueEventListener> = new Set();

/**
 * Loads the queue from localStorage into memory.
 * Filters out expired messages during load.
 */
function loadFromStorage(): QueuedMessage[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];

    const parsed = JSON.parse(raw) as QueuedMessage[];
    if (!Array.isArray(parsed)) return [];

    const now = Date.now();
    const valid = parsed.filter((msg) => {
      if (!msg || typeof msg !== 'object') return false;
      if (typeof msg.clientId !== 'string') return false;
      if (typeof msg.roomId !== 'string') return false;
      if (typeof msg.content !== 'string') return false;
      if (typeof msg.timestamp !== 'number') return false;
      if (now - msg.timestamp > MAX_MESSAGE_AGE_MS) return false;
      return true;
    });

    return valid;
  } catch {
    return [];
  }
}

/**
 * Persists the current in-memory queue to localStorage.
 */
function saveToStorage(): void {
  try {
    const serializable = memoryQueue.map((msg) => ({
      clientId: msg.clientId,
      roomId: msg.roomId,
      content: msg.content,
      timestamp: msg.timestamp,
      retryCount: msg.retryCount,
      status: msg.status,
    }));
    localStorage.setItem(STORAGE_KEY, JSON.stringify(serializable));
  } catch {
    // localStorage may be full — attempt to trim oldest messages
    try {
      const trimmed = memoryQueue.slice(-20);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(trimmed));
    } catch {
      // Storage completely unavailable — queue exists only in memory
    }
  }
}

/**
 * Emits an event to all registered listeners.
 */
function emit(event: QueueEventType, message?: QueuedMessage): void {
  for (const listener of listeners) {
    try {
      listener(event, message);
    } catch {
      // Listener errors should not crash the queue
    }
  }
}

/**
 * Initializes the offline queue.
 * Call this once on application mount to load persisted state.
 */
export function initializeQueue(): void {
  memoryQueue = loadFromStorage();
  pruneExpiredMessages();
}

/**
 * Registers an event listener for queue state changes.
 *
 * @param listener - The callback function.
 * @returns An unsubscribe function.
 */
export function onQueueEvent(listener: QueueEventListener): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

/**
 * Generates a unique client-side transaction ID.
 * Combines timestamp with random entropy for uniqueness.
 */
export function generateClientId(): string {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 11);
  const counter = (Math.random() * 0xffff | 0).toString(16).padStart(4, '0');
  return `msg_${timestamp}_${random}_${counter}`;
}

/**
 * Enqueues a message for later delivery.
 * Call this when the socket is disconnected or offline.
 *
 * @param roomId - The target room.
 * @param content - The message content.
 * @param clientId - Optional pre-generated client ID (for optimistic UI linkage).
 * @returns The queued message object.
 */
export function enqueueMessage(
  roomId: string,
  content: string,
  clientId?: string
): QueuedMessage {
  if (memoryQueue.length >= MAX_QUEUE_SIZE) {
    memoryQueue.shift();
  }

  const message: QueuedMessage = {
    clientId: clientId || generateClientId(),
    roomId,
    content: content.trim(),
    timestamp: Date.now(),
    retryCount: 0,
    status: 'pending',
  };

  memoryQueue.push(message);
  saveToStorage();
  emit('enqueued', message);

  return message;
}

/**
 * Removes a specific message from the queue by its clientId.
 * Called when a message is confirmed delivered by the server.
 *
 * @param clientId - The client-side transaction ID.
 */
export function removeMessage(clientId: string): void {
  const index = memoryQueue.findIndex((m) => m.clientId === clientId);
  if (index !== -1) {
    const removed = memoryQueue.splice(index, 1)[0];
    saveToStorage();
    emit('sent', removed);
  }
}

/**
 * Marks a message as failed (exceeded retry limit).
 *
 * @param clientId - The client-side transaction ID.
 */
export function markFailed(clientId: string): void {
  const message = memoryQueue.find((m) => m.clientId === clientId);
  if (message) {
    message.status = 'failed';
    saveToStorage();
    emit('failed', message);
  }
}

/**
 * Returns all pending messages for a specific room.
 *
 * @param roomId - The room to filter by (optional — returns all if omitted).
 * @returns Array of queued messages.
 */
export function getPendingMessages(roomId?: string): QueuedMessage[] {
  const pending = memoryQueue.filter((m) => m.status !== 'failed');
  if (!roomId) return pending;
  return pending.filter((m) => m.roomId === roomId);
}

/**
 * Returns ALL messages in the queue regardless of status.
 */
export function getAllMessages(): QueuedMessage[] {
  return [...memoryQueue];
}

/**
 * Returns the total number of messages in the queue.
 */
export function getQueueSize(): number {
  return memoryQueue.length;
}

/**
 * Returns the number of pending (unsent) messages.
 */
export function getPendingCount(): number {
  return memoryQueue.filter((m) => m.status === 'pending').length;
}

/**
 * Removes expired messages from the queue.
 */
function pruneExpiredMessages(): void {
  const now = Date.now();
  const before = memoryQueue.length;
  memoryQueue = memoryQueue.filter((msg) => now - msg.timestamp < MAX_MESSAGE_AGE_MS);
  if (memoryQueue.length !== before) {
    saveToStorage();
  }
}

/**
 * Flushes the offline queue by attempting to send all pending messages.
 * Uses the provided sender function to actually emit each message.
 *
 * Messages are sent in chronological order with a small delay between
 * to avoid overwhelming the server on reconnection.
 *
 * @param sender - Async function that attempts to send a single message.
 * @returns The number of messages successfully sent.
 */
export async function flushQueue(sender: MessageSender): Promise<number> {
  if (isFlushing) return 0;

  isFlushing = true;
  emit('flushing');

  pruneExpiredMessages();

  const pending = memoryQueue
    .filter((m) => m.status === 'pending' || m.status === 'sending')
    .sort((a, b) => a.timestamp - b.timestamp);

  let sentCount = 0;

  for (let i = 0; i < pending.length; i += FLUSH_CONCURRENCY) {
    const batch = pending.slice(i, i + FLUSH_CONCURRENCY);

    const results = await Promise.allSettled(
      batch.map(async (message) => {
        message.status = 'sending';
        message.retryCount++;

        const success = await sender(message);

        if (success) {
          removeMessage(message.clientId);
          sentCount++;
          return true;
        }

        if (message.retryCount >= MAX_RETRY_COUNT) {
          markFailed(message.clientId);
        } else {
          message.status = 'pending';
        }

        return false;
      })
    );

    const allFailed = results.every(
      (r) => r.status === 'rejected' || (r.status === 'fulfilled' && !r.value)
    );

    if (allFailed && i + FLUSH_CONCURRENCY < pending.length) {
      break;
    }

    if (i + FLUSH_CONCURRENCY < pending.length) {
      await new Promise((resolve) => setTimeout(resolve, FLUSH_DELAY_BETWEEN_MS));
    }
  }

  saveToStorage();
  isFlushing = false;
  emit('flushed');

  return sentCount;
}

/**
 * Checks if the queue is currently being flushed.
 */
export function isCurrentlyFlushing(): boolean {
  return isFlushing;
}

/**
 * Clears all messages from the queue.
 * Use with caution — typically only for logout or explicit user action.
 */
export function clearQueue(): void {
  memoryQueue = [];
  saveToStorage();
}

/**
 * Clears only failed messages from the queue,
 * allowing the user to acknowledge failures.
 */
export function clearFailedMessages(): void {
  memoryQueue = memoryQueue.filter((m) => m.status !== 'failed');
  saveToStorage();
}

/**
 * Retries all failed messages by resetting their status to pending.
 */
export function retryFailedMessages(): void {
  for (const message of memoryQueue) {
    if (message.status === 'failed') {
      message.status = 'pending';
      message.retryCount = 0;
    }
  }
  saveToStorage();
}

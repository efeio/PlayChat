/**
 * ChatPanel — Real-Time Chat Container with Full Resilience
 * -----------------------------------------------------------
 * Core chat interface that integrates:
 * - Optimistic message rendering (BUG-021)
 * - Smart scroll-position management (BUG-008, BUG-024)
 * - Offline queue awareness (BUG-012)
 * - Network state feedback (BUG-011)
 * - Zero layout shift (CLS) on dynamic content changes (BUG-022)
 *
 * Scroll Behavior Contract:
 * - If user is at/near bottom: auto-scroll on new messages (smooth).
 * - If user has scrolled up: do NOT auto-scroll; show "New messages" badge.
 * - On own message send: always scroll to bottom.
 * - On room change: instant scroll to bottom.
 */

import { useState, useRef, useEffect, useCallback } from 'react';
import { useSocket } from '../../hooks/useSocket';
import { useAuth } from '../../hooks/useAuth';
import { useOptimisticMessages, type OptimisticMessage } from '../../hooks/useOptimisticMessages';
import {
  enqueueMessage,
  getPendingMessages,
  generateClientId,
} from '../../services/offlineQueue';
import { MessageBubble } from './MessageBubble';
import type { Message } from '../../types/room.types';

interface ChatPanelProps {
  roomId: string;
  messages: Message[];
}

/**
 * Distance in pixels from the bottom of the scroll container
 * within which we consider the user "at the bottom."
 */
const SCROLL_NEAR_BOTTOM_THRESHOLD = 150;

/**
 * Maximum message content length enforced client-side.
 */
const MAX_MESSAGE_LENGTH = 2000;

export function ChatPanel({ roomId, messages }: ChatPanelProps) {
  const [input, setInput] = useState('');
  const { socket, isConnected, isAuthenticated } = useSocket();
  const { user } = useAuth();

  /**
   * Scroll tracking refs.
   */
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const bottomAnchorRef = useRef<HTMLDivElement>(null);
  const isNearBottomRef = useRef(true);
  const previousScrollHeightRef = useRef<number>(0);
  const previousMessagesLengthRef = useRef<number>(0);

  /**
   * "New messages" badge visibility state.
   */
  const [showNewMessagesBadge, setShowNewMessagesBadge] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  /**
   * Optimistic messages hook.
   */
  const {
    optimisticMessages,
    addOptimistic,
    confirmOptimistic,
    failOptimistic,
    dismissOptimistic,
    retryOptimistic,
    reconcileWithServer,
    clearAll: clearOptimistic,
  } = useOptimisticMessages();

  /**
   * Determines if the scroll container is near the bottom.
   */
  const checkScrollPosition = useCallback(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const distanceFromBottom =
      container.scrollHeight - container.scrollTop - container.clientHeight;
    isNearBottomRef.current = distanceFromBottom <= SCROLL_NEAR_BOTTOM_THRESHOLD;

    if (isNearBottomRef.current) {
      setShowNewMessagesBadge(false);
      setUnreadCount(0);
    }
  }, []);

  /**
   * Scrolls to the bottom of the message container.
   */
  const scrollToBottom = useCallback((behavior: ScrollBehavior = 'smooth') => {
    const anchor = bottomAnchorRef.current;
    if (anchor) {
      anchor.scrollIntoView({ behavior, block: 'end' });
    }
    setShowNewMessagesBadge(false);
    setUnreadCount(0);
  }, []);

  /**
   * Handle incoming messages from the server.
   * Reconciles with optimistic messages to prevent duplicates.
   *
   * This effect watches the `messages` prop. When new messages arrive:
   * - If user is near bottom: auto-scroll smoothly.
   * - If user scrolled up: show badge, do not scroll.
   * - If message is from self: always scroll (user just sent it).
   */
  useEffect(() => {
    const currentLength = messages.length;
    const prevLength = previousMessagesLengthRef.current;

    if (currentLength <= prevLength) {
      previousMessagesLengthRef.current = currentLength;
      return;
    }

    const newMessages = messages.slice(prevLength);
    previousMessagesLengthRef.current = currentLength;

    for (const msg of newMessages) {
      reconcileWithServer(msg);
    }

    const lastMessage = messages[messages.length - 1];
    const isOwnMessage = lastMessage && lastMessage.userId === user?.id;

    if (isOwnMessage) {
      requestAnimationFrame(() => scrollToBottom('smooth'));
      return;
    }

    if (isNearBottomRef.current) {
      requestAnimationFrame(() => scrollToBottom('smooth'));
    } else {
      setUnreadCount((prev) => prev + newMessages.length);
      setShowNewMessagesBadge(true);
    }
  }, [messages, user?.id, scrollToBottom, reconcileWithServer]);

  /**
   * Initial scroll to bottom on mount or room change.
   */
  useEffect(() => {
    previousMessagesLengthRef.current = messages.length;
    clearOptimistic();
    setShowNewMessagesBadge(false);
    setUnreadCount(0);

    requestAnimationFrame(() => {
      scrollToBottom('instant');
    });
  }, [roomId, scrollToBottom, clearOptimistic, messages.length]);

  /**
   * Scroll position preservation for historical message loading.
   * When messages are prepended (future infinite scroll), the scroll
   * position must not jump. This effect detects prepending by comparing
   * scroll height changes and compensates.
   */
  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const currentScrollHeight = container.scrollHeight;
    const previousScrollHeight = previousScrollHeightRef.current;

    if (previousScrollHeight > 0 && currentScrollHeight > previousScrollHeight) {
      const heightDifference = currentScrollHeight - previousScrollHeight;

      if (!isNearBottomRef.current && container.scrollTop < 100) {
        container.scrollTop += heightDifference;
      }
    }

    previousScrollHeightRef.current = currentScrollHeight;
  });

  /**
   * Sends a message via socket with optimistic rendering.
   * Falls back to offline queue if socket is unavailable.
   */
  const handleSend = useCallback(() => {
    if (!input.trim() || !user) return;

    const content = input.trim();
    if (content.length > MAX_MESSAGE_LENGTH) return;

    setInput('');

    const userInfo = {
      id: user.id,
      username: user.username,
      displayName: user.displayName,
    };

    if (!socket || !isConnected || !isAuthenticated) {
      const clientId = generateClientId();
      addOptimistic(roomId, content, userInfo);
      enqueueMessage(roomId, content, clientId);
      requestAnimationFrame(() => scrollToBottom('smooth'));
      return;
    }

    const clientId = addOptimistic(roomId, content, userInfo);

    requestAnimationFrame(() => scrollToBottom('smooth'));

    socket.emit(
      'message:send',
      {
        clientId,
        roomId,
        content,
      },
      (res: { error?: string } | undefined) => {
        if (res?.error) {
          failOptimistic(clientId);
        } else {
          confirmOptimistic(clientId);
        }
      }
    );
  }, [
    input,
    user,
    socket,
    isConnected,
    isAuthenticated,
    roomId,
    addOptimistic,
    confirmOptimistic,
    failOptimistic,
    scrollToBottom,
  ]);

  /**
   * Retries a failed optimistic message.
   */
  const handleRetry = useCallback(
    (clientId: string) => {
      const message = retryOptimistic(clientId);
      if (!message || !socket || !isConnected || !isAuthenticated) {
        if (message) {
          enqueueMessage(roomId, message.content, message._clientId);
        }
        return;
      }

      socket.emit(
        'message:send',
        {
          clientId: message._clientId,
          roomId,
          content: message.content,
        },
        (res: { error?: string } | undefined) => {
          if (res?.error) {
            failOptimistic(message._clientId);
          } else {
            confirmOptimistic(message._clientId);
          }
        }
      );
    },
    [
      socket,
      isConnected,
      isAuthenticated,
      roomId,
      retryOptimistic,
      confirmOptimistic,
      failOptimistic,
    ]
  );

  /**
   * Keyboard handler for Enter-to-send.
   */
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleSend();
      }
    },
    [handleSend]
  );

  /**
   * Merges server messages with optimistic messages for rendering.
   * Optimistic messages appear after server messages to maintain
   * visual order (they'll be reconciled when server echoes them back).
   */
  const allMessages: (Message | OptimisticMessage)[] = [
    ...messages,
    ...optimisticMessages,
  ];

  /**
   * Remaining character count for the input.
   */
  const remainingChars = MAX_MESSAGE_LENGTH - input.length;
  const showCharCount = input.length > MAX_MESSAGE_LENGTH * 0.8;

  return (
    <div className="flex flex-col h-full chat-area w-full overflow-hidden">
      {/* Header */}
      <div className="h-12 flex items-center justify-between px-5 shrink-0 border-b border-border-default bg-bg-surface/60 backdrop-blur-sm">
        <div className="flex items-center gap-2">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-text-muted">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
          </svg>
          <span className="text-xs font-semibold text-text-primary uppercase tracking-wider">Chat</span>
        </div>
        {!isConnected && (
          <span className="text-[10px] text-status-error font-medium flex items-center gap-1.5 px-2 py-1 rounded-full bg-status-error/10 border border-status-error/20">
            <span className="w-1.5 h-1.5 rounded-full bg-status-error animate-pulse" />
            Offline
          </span>
        )}
        {isConnected && !isAuthenticated && (
          <span className="text-[10px] text-amber-400 font-medium flex items-center gap-1.5 px-2 py-1 rounded-full bg-amber-400/10 border border-amber-400/20">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
            Connecting
          </span>
        )}
      </div>

      {/* Messages container */}
      <div
        ref={scrollContainerRef}
        onScroll={checkScrollPosition}
        className="flex-1 overflow-y-auto p-4 space-y-1 relative scroll-smooth"
        style={{ scrollbarGutter: 'stable' }}
      >
        {/* Empty state */}
        {allMessages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full gap-3">
            <svg
              width="32"
              height="32"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              className="text-text-muted"
            >
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
            </svg>
            <p className="text-text-muted text-xs tracking-wide">Henüz mesaj yok</p>
          </div>
        )}

        {/* Message list */}
        {allMessages.map((msg) => {
          const isOptimistic = '_optimistic' in msg;
          const isPending = isOptimistic && (msg as OptimisticMessage)._status === 'pending';
          const isFailed = isOptimistic && (msg as OptimisticMessage)._status === 'failed';

          return (
            <div key={msg.id} className="animate-msg-in">
              <MessageBubble
                message={msg}
                isOwn={msg.userId === user?.id}
                isPending={isPending}
                isFailed={isFailed}
              />
              {/* Failed message action buttons */}
              {isFailed && (
                <div className="flex justify-end gap-2 mt-1 pr-1">
                  <button
                    onClick={() => handleRetry((msg as OptimisticMessage)._clientId)}
                    className="text-xs text-amber-400 hover:text-amber-300 transition-colors cursor-pointer"
                  >
                    Tekrar dene
                  </button>
                  <button
                    onClick={() => dismissOptimistic((msg as OptimisticMessage)._clientId)}
                    className="text-xs text-text-muted hover:text-text-secondary transition-colors cursor-pointer"
                  >
                    Kaldır
                  </button>
                </div>
              )}
            </div>
          );
        })}

        {/* Bottom anchor for scroll-to-bottom */}
        <div ref={bottomAnchorRef} className="h-0 w-0" />
      </div>

      {/* New messages badge — positioned above input */}
      {showNewMessagesBadge && (
        <div className="flex justify-center py-1 shrink-0">
          <button
            onClick={() => scrollToBottom('smooth')}
            className="px-4 py-1.5 bg-indigo-600/90 hover:bg-indigo-500 text-white text-xs font-medium rounded-full shadow-lg transition-all duration-200 cursor-pointer backdrop-blur-sm border border-indigo-400/20"
          >
            {unreadCount > 0
              ? `${unreadCount} yeni mesaj ↓`
              : 'Yeni mesajlar ↓'}
          </button>
        </div>
      )}

      {/* Input area */}
      <div className="p-3 shrink-0 border-t border-border-default bg-bg-surface/40 backdrop-blur-md">
        <div className="relative flex items-center">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={
              isConnected && isAuthenticated
                ? 'Bir mesaj yaz...'
                : 'Çevrimdışı — mesajlar sıraya alınacak'
            }
            maxLength={MAX_MESSAGE_LENGTH}
            className="w-full bg-bg-base/60 border border-border-default rounded-xl pl-4 pr-12 py-2.5 text-sm text-white placeholder-text-muted focus:outline-none focus:border-accent-primary/40 focus:ring-2 focus:ring-accent-primary/10 transition-all duration-200"
          />

          {/* Character count indicator */}
          {showCharCount && (
            <span
              className={`absolute right-14 text-[10px] font-mono ${
                remainingChars < 0
                  ? 'text-status-error'
                  : remainingChars < 100
                  ? 'text-amber-400'
                  : 'text-text-muted'
              }`}
            >
              {remainingChars}
            </span>
          )}

          {/* Send button */}
          <button
            onClick={handleSend}
            disabled={!input.trim() || input.length > MAX_MESSAGE_LENGTH}
            className="absolute right-1.5 w-8 h-8 rounded-lg flex items-center justify-center text-text-muted hover:text-white hover:bg-accent-primary/20 disabled:opacity-30 disabled:hover:text-text-muted disabled:hover:bg-transparent transition-all cursor-pointer disabled:cursor-not-allowed"
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="22" y1="2" x2="11" y2="13" />
              <polygon points="22 2 15 22 11 13 2 9 22 2" />
            </svg>
          </button>
        </div>

        {/* Offline queue indicator */}
        {!isConnected && getPendingMessages(roomId).length > 0 && (
          <p className="text-xs text-text-muted mt-2 pl-2">
            {getPendingMessages(roomId).length} message
            {getPendingMessages(roomId).length > 1 ? 's' : ''} queued — will send when online
          </p>
        )}
      </div>
    </div>
  );
}

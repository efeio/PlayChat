import { useState, useRef, useEffect } from 'react';
import { useSocket } from '../../hooks/useSocket';
import { useAuth } from '../../hooks/useAuth';
import { MessageBubble } from './MessageBubble';
import type { Message } from '../../types/room.types';

interface ChatPanelProps {
  roomId: string;
  messages: Message[];
}

export function ChatPanel({ roomId, messages }: ChatPanelProps) {
  const [input, setInput] = useState('');
  const { socket } = useSocket();
  const { user } = useAuth();
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = () => {
    if (!input.trim() || !socket) return;

    socket.emit('message:send', {
      roomId,
      content: input.trim(),
    });
    setInput('');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="h-12 flex items-center px-4 border-b border-border-subtle shrink-0">
        <span className="text-sm text-text-secondary font-medium tracking-wide">Chat</span>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-1">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full gap-3">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-text-faint">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
            </svg>
            <p className="text-text-muted text-xs tracking-wide">
              No messages yet
            </p>
          </div>
        )}
        {messages.map((msg) => (
          <MessageBubble
            key={msg.id}
            message={msg}
            isOwn={msg.userId === user?.id}
          />
        ))}
        <div ref={bottomRef} />
      </div>

      {/* Floating pill input */}
      <div className="p-3 shrink-0">
        <div className="flex gap-2 items-center rounded-full bg-input-bg border border-input-border" style={{ paddingLeft: '16px', paddingRight: '16px', paddingTop: '6px', paddingBottom: '6px' }}>
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type a message..."
            style={{ paddingTop: '6px', paddingBottom: '6px' }}
            className="flex-1 bg-transparent text-white text-sm placeholder-text-muted focus:outline-none"
          />
          <button
            onClick={handleSend}
            disabled={!input.trim()}
            style={{ paddingLeft: '20px', paddingRight: '20px', paddingTop: '6px', paddingBottom: '6px' }}
            className="bg-white text-black font-semibold rounded-full text-sm hover:bg-neutral-200 active:scale-[0.98] transition-all duration-200 disabled:opacity-30 cursor-pointer disabled:cursor-not-allowed"
          >
            Send
          </button>
        </div>
      </div>
    </div>
  );
}

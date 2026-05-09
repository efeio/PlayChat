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
      <div className="h-12 flex items-center px-4 border-b border-border shrink-0">
        <span className="text-sm text-text-secondary font-medium">Chat</span>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-1">
        {messages.length === 0 && (
          <p className="text-center text-text-muted text-xs mt-8">
            No messages yet. Say something!
          </p>
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

      {/* Input */}
      <div className="p-3 border-t border-border shrink-0">
        <div className="flex gap-2">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type a message..."
            className="flex-1 h-10 px-3 rounded-lg bg-bg-elevated border border-border text-text-primary placeholder:text-text-muted text-sm focus:border-text-primary focus:outline-none transition-colors"
          />
          <button
            onClick={handleSend}
            disabled={!input.trim()}
            className="h-10 px-4 rounded-lg bg-text-primary text-bg-base text-sm font-semibold hover:opacity-90 transition-opacity disabled:opacity-30 cursor-pointer disabled:cursor-not-allowed"
          >
            Send
          </button>
        </div>
      </div>
    </div>
  );
}

import { useState, useRef, useEffect } from 'react';
import { useSocket } from '../../hooks/useSocket';
import { useAuth } from '../../hooks/useAuth';
import { MessageBubble } from './MessageBubble';
import { Button } from '../ui/Button';
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
    <div className="flex flex-col h-full chat-area w-full overflow-hidden">
      {/* Header */}
      <div className="h-14 flex items-center px-6 shrink-0 border-b border-white/5 bg-transparent">
        <span className="text-sm font-semibold text-text-primary tracking-wide">Chat</span>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-1">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full gap-3">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-text-muted">
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

      {/* Input bar */}
      <div className="p-4 shrink-0 border-t border-white/5 bg-[#1B132B]/50 backdrop-blur-md">
        <div className="relative flex items-center">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type a message..."
            className="w-full bg-[#120A1F]/50 border border-white/5 rounded-full pl-5 pr-12 py-3 text-sm text-white placeholder-text-muted focus:outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/50 transition-all duration-200 backdrop-blur-md shadow-inner"
          />
          <button
            onClick={handleSend}
            disabled={!input.trim()}
            className="absolute right-2 p-2 rounded-full text-text-muted hover:text-cyan-400 disabled:opacity-40 disabled:hover:text-text-muted transition-colors"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="22" y1="2" x2="11" y2="13" />
              <polygon points="22 2 15 22 11 13 2 9 22 2" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}

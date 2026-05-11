import type { Message } from '../../types/room.types';

interface MessageBubbleProps {
  message: Message;
  isOwn: boolean;
}

export function MessageBubble({ message, isOwn }: MessageBubbleProps) {
  /* INV-007: Visually separate game log from chat */
  if (message.type === 'GAME_LOG') {
    return (
      <div className="flex justify-center py-1.5">
        <span className="text-[#8E8E93] text-[11px] italic">
          {message.content}
        </span>
      </div>
    );
  }

  return (
    <div className={`flex ${isOwn ? 'justify-end' : 'justify-start'} mb-2`}>
      <div className={`max-w-[70%] ${isOwn ? 'order-1' : ''}`}>
        {!isOwn && (
          <p className="text-xs text-text-muted mb-1 px-1">
            {message.user.displayName}
          </p>
        )}
        <div
          className={`px-3.5 py-2 rounded-2xl text-sm ${
            isOwn
              ? 'bg-white text-black rounded-br-sm'
              : 'bg-bg-card text-white border border-border-subtle rounded-bl-sm'
          }`}
        >
          {message.content}
        </div>
        <p className={`text-[10px] text-text-faint mt-0.5 px-1 ${isOwn ? 'text-right' : ''}`}>
          {new Date(message.createdAt).toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit',
          })}
        </p>
      </div>
    </div>
  );
}

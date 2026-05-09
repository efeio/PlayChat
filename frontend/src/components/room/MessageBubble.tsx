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
        <span className="text-text-muted text-xs italic">
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
          className={`px-3.5 py-2 rounded-xl text-sm ${
            isOwn
              ? 'bg-text-primary text-bg-base rounded-br-sm'
              : 'bg-bg-elevated text-text-primary border border-border rounded-bl-sm'
          }`}
        >
          {message.content}
        </div>
        <p className={`text-[10px] text-text-muted mt-0.5 px-1 ${isOwn ? 'text-right' : ''}`}>
          {new Date(message.createdAt).toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit',
          })}
        </p>
      </div>
    </div>
  );
}

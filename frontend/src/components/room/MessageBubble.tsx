import type { Message } from '../../types/room.types';

interface MessageBubbleProps {
  message: Message;
  isOwn: boolean;
}

export function MessageBubble({ message, isOwn }: MessageBubbleProps) {
  /* INV-007: Visually separate game log from chat */
  if (message.type === 'GAME_LOG') {
    return (
      <div className="msg-system">
        {message.content}
      </div>
    );
  }

  return (
    <div className={`flex ${isOwn ? 'justify-end' : 'justify-start'} mb-3`}>
      <div className={`max-w-[75%] ${isOwn ? 'order-1' : ''}`}>
        {!isOwn && (
          <p className="text-xs text-text-muted mb-1 px-1">
            {message.user.displayName}
          </p>
        )}
        <div
          className={`px-4 py-3 text-sm ${
            isOwn
              ? 'bg-gradient-to-br from-indigo-600 to-cyan-500 text-white rounded-2xl rounded-br-sm shadow-[0_4px_20px_rgba(56,189,248,0.3)]'
              : 'bg-[#1B132B]/80 text-white border border-white/5 rounded-2xl rounded-bl-sm shadow-[0_4px_20px_rgba(0,0,0,0.4)] backdrop-blur-xl'
          }`}
        >
          {message.content}
        </div>
        <p className={`text-xs text-gray-400 mt-1 px-1 ${isOwn ? 'text-right' : ''}`}>
          {new Date(message.createdAt).toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit',
          })}
        </p>
      </div>
    </div>
  );
}

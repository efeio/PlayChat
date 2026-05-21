import type { Message } from '../../types/room.types';

interface MessageBubbleProps {
  message: Message;
  isOwn: boolean;
  isPending?: boolean;
  isFailed?: boolean;
}

export function MessageBubble({ message, isOwn, isPending, isFailed }: MessageBubbleProps) {
  if (message.type === 'GAME_LOG') {
    return (
      <div className="flex justify-center my-3">
        <span className="text-[11px] text-text-muted bg-bg-card/60 px-3 py-1.5 rounded-full border border-border-subtle">
          {message.content}
        </span>
      </div>
    );
  }

  return (
    <div className={`flex ${isOwn ? 'justify-end' : 'justify-start'} mb-3 group`}>
      {/* Avatar for other users */}
      {!isOwn && (
        <div className="w-7 h-7 rounded-full bg-gradient-to-br from-accent-primary/80 to-accent-secondary/80 flex items-center justify-center text-[10px] text-white font-bold mr-2 mt-5 shrink-0">
          {(message.user?.displayName || 'S').charAt(0).toUpperCase()}
        </div>
      )}
      <div className={`max-w-[70%] min-w-[60px]`}>
        {!isOwn && (
          <p className="text-[11px] text-text-muted mb-1 font-medium">
            {message.user?.displayName || 'System'}
          </p>
        )}
        <div
          className={`px-3.5 py-2 text-[13px] leading-relaxed transition-opacity break-words ${
            isPending ? 'opacity-60' : isFailed ? 'opacity-80' : ''
          } ${
            isFailed
              ? 'bg-status-error/10 text-white border border-status-error/30 rounded-2xl rounded-br-md'
              : isOwn
              ? 'bg-gradient-to-br from-accent-primary to-indigo-600 text-white rounded-2xl rounded-br-sm'
              : 'bg-bg-elevated/80 text-text-primary border border-border-default rounded-2xl rounded-bl-sm'
          }`}
        >
          {message.content}
        </div>
        <div className={`flex items-center gap-2 mt-0.5 px-1 opacity-0 group-hover:opacity-100 transition-opacity ${isOwn ? 'justify-end' : ''}`}>
          <p className="text-[10px] text-text-muted">
            {new Date(message.createdAt).toLocaleTimeString([], {
              hour: '2-digit',
              minute: '2-digit',
            })}
          </p>
          {isPending && (
            <span className="text-[10px] text-text-muted">Gönderiliyor...</span>
          )}
          {isFailed && (
            <span className="text-[10px] text-status-error font-medium">Başarısız</span>
          )}
        </div>
      </div>
    </div>
  );
}

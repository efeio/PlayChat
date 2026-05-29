import type { ReactNode } from 'react';
import type { Message } from '../../types/room.types';

interface MessageBubbleProps {
  message: Message;
  isOwn: boolean;
  isPending?: boolean;
  isFailed?: boolean;
}

const GAME_NAME_MAP: Record<string, string> = {
  'TIC_TAC_TOE': 'XOX',
  'CONNECT_FOUR': 'Connect Four',
  'WORDLE': 'Wordle',
  'MEMORY_CARDS': 'Hafıza Kartları',
  'HANGMAN': 'Adam Asmaca',
  'NUMBER_GUESS': 'Sayı Tahmin',
  'ROCK_PAPER_SCISSORS': 'Taş Kağıt Makas',
};

function translateGameLog(content: string): string {
  let text = content;
  for (const [eng, tr] of Object.entries(GAME_NAME_MAP)) {
    text = text.replace(eng, tr);
  }
  return text;
}

function getLogStyle(content: string): { icon: ReactNode; style: string } {
  if (content.includes('Oyun başladı') || content.includes('Game started')) {
    return {
      icon: (
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-accent-secondary">
          <polygon points="5 3 19 12 5 21 5 3" />
        </svg>
      ),
      style: 'text-accent-secondary bg-accent-secondary/8 border-accent-secondary/20',
    };
  }
  if (content.includes('Oyun bitti') || content.includes('Kazanan') || content.includes('kazandı')) {
    return {
      icon: (
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-amber-400">
          <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5C7 4 7 7 7 7" />
          <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5C17 4 17 7 17 7" />
          <path d="M4 22h16" />
          <path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22" />
          <path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22" />
          <path d="M18 2H6v7a6 6 0 0 0 12 0V2Z" />
        </svg>
      ),
      style: 'text-amber-400 bg-amber-400/8 border-amber-400/20',
    };
  }
  if (content.includes('berabere')) {
    return {
      icon: (
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-sky-400">
          <path d="M8 12h8" />
          <circle cx="12" cy="12" r="10" />
        </svg>
      ),
      style: 'text-sky-400 bg-sky-400/8 border-sky-400/20',
    };
  }
  return {
    icon: (
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-text-muted">
        <circle cx="12" cy="12" r="10" />
        <path d="M12 16v-4" />
        <path d="M12 8h.01" />
      </svg>
    ),
    style: 'text-text-muted bg-bg-elevated/60 border-border-default',
  };
}

export function MessageBubble({ message, isOwn, isPending, isFailed }: MessageBubbleProps) {
  if (message.type === 'GAME_LOG') {
    const translated = translateGameLog(message.content);
    const { icon, style } = getLogStyle(translated);
    return (
      <div className="flex justify-center my-2">
        <span className={`inline-flex items-center gap-1.5 text-[11px] font-medium px-3 py-1.5 rounded-full border ${style}`}>
          {icon}
          {translated}
        </span>
      </div>
    );
  }

  return (
    <div className={`flex ${isOwn ? 'justify-end' : 'justify-start'} mb-3 group`}>
      {/* Avatar for other users */}
      {!isOwn && (
        <div className="w-7 h-7 rounded-full bg-gradient-to-br from-accent-primary/80 to-accent-secondary/80 flex items-center justify-center text-[10px] text-text-inverse font-bold mr-2 mt-5 shrink-0">
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
              ? 'bg-status-error/10 text-text-primary border border-status-error/30 rounded-2xl rounded-br-md'
              : isOwn
              ? 'bg-gradient-to-br from-accent-primary to-accent-primary/80 text-text-inverse rounded-2xl rounded-br-sm'
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

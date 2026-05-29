import { useEffect, useRef } from 'react';
import type { GameEndEvent, GamePlayer } from '../../types/game.types';
import { Button } from '../ui/Button';

interface GameResultProps {
  result: GameEndEvent;
  players: GamePlayer[];
  currentUserId: string;
  gameType: string;
  gameState?: Record<string, unknown> | null;
  onPlayAgain?: () => void;
  onClose: () => void;
}

const GAME_TYPE_LABELS: Record<string, string> = {
  TIC_TAC_TOE: 'XOX',
  CONNECT_FOUR: 'Dörtlü Bağla',
  ROCK_PAPER_SCISSORS: 'Taş Kağıt Makas',
  HANGMAN: 'Adam Asmaca',
  WORDLE: 'Wordle',
  MEMORY_CARDS: 'Hafıza Kartları',
  NUMBER_GUESS: 'Sayı Tahmin',
};

export function GameResult({ result, players, currentUserId, gameType, gameState, onPlayAgain, onClose }: GameResultProps) {
  const winner = players.find((p) => p.userId === result.winnerId);
  const isCurrentUserWinner = result.winnerId === currentUserId;
  const isDraw = result.result === 'draw';
  const activePlayers = players.filter((p) => p.role === 'PLAYER');
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
        return;
      }
      if (e.key === 'Tab') {
        const modal = modalRef.current;
        if (!modal) return;
        const focusable = modal.querySelectorAll<HTMLElement>(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        if (focusable.length === 0) return;
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    modalRef.current?.querySelector<HTMLElement>('button')?.focus();
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-bg-overlay backdrop-blur-md animate-modal-in" role="dialog" aria-modal="true" aria-label="Oyun sonucu">
      <div ref={modalRef} className="w-full max-w-sm mx-4 bg-bg-card border border-border-default rounded-2xl shadow-2xl overflow-hidden">
        {/* Result Banner */}
        <div className={`px-6 py-8 text-center ${
          isDraw
            ? 'bg-gradient-to-b from-amber-500/10 to-transparent'
            : isCurrentUserWinner
              ? 'bg-gradient-to-b from-emerald-500/10 to-transparent'
              : 'bg-gradient-to-b from-red-500/10 to-transparent'
        }`}>
          <div className="mb-3 flex justify-center">
            {isDraw ? (
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-amber-400">
                <path d="M18 12.5V10a2 2 0 0 0-2-2 2 2 0 0 0-2 2v1.4" /><path d="M14 11V9a2 2 0 0 0-2-2 2 2 0 0 0-2 2v2" /><path d="M10 10.5V5a2 2 0 0 0-2-2 2 2 0 0 0-2 2v9" /><path d="M18 12a2 2 0 0 1 2 2v1a8 8 0 0 1-8 8h-2a8 8 0 0 1-4-1.5" />
              </svg>
            ) : isCurrentUserWinner ? (
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-emerald-400">
                <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5C7 4 7 7 7 7" /><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5C17 4 17 7 17 7" /><path d="M4 22h16" /><path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22" /><path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22" /><path d="M18 2H6v7a6 6 0 0 0 12 0V2Z" />
              </svg>
            ) : (
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-red-400">
                <circle cx="12" cy="12" r="10" /><path d="M16 16s-1.5-2-4-2-4 2-4 2" /><line x1="9" y1="9" x2="9.01" y2="9" /><line x1="15" y1="9" x2="15.01" y2="9" />
              </svg>
            )}
          </div>
          <h2 className={`text-xl font-bold ${
            isDraw ? 'text-amber-400' : isCurrentUserWinner ? 'text-emerald-400' : 'text-red-400'
          }`}>
            {isDraw ? 'Berabere!' : isCurrentUserWinner ? 'Kazandın!' : 'Kaybettin'}
          </h2>
          {!isDraw && winner && (
            <p className="text-text-muted text-sm mt-1">
              {isCurrentUserWinner ? 'Tebrikler!' : `${winner.user.displayName} kazandı`}
            </p>
          )}
          {result.reason === 'disconnect_timeout' && (
            <p className="text-text-muted text-xs mt-2">Rakip bağlantısı kesildi</p>
          )}
          {gameType === 'WORDLE' && typeof gameState?.targetWord === 'string' && (
            <p className="text-text-muted text-sm mt-3">
              Kelime: <span className="text-text-primary font-bold uppercase tracking-widest">{gameState.targetWord}</span>
            </p>
          )}
          {gameType === 'HANGMAN' && typeof gameState?.revealedWord === 'string' && (
            <p className="text-text-muted text-sm mt-3">
              Kelime: <span className="text-text-primary font-bold uppercase tracking-widest">{gameState.revealedWord}</span>
            </p>
          )}
          {gameType === 'MEMORY_CARDS' && !!gameState?.scores && (
            <p className="text-text-muted text-sm mt-3">
              {'Skor: '}
              {Object.entries(gameState.scores as Record<string, number>)
                .map(([id, score]: [string, number]) => {
                  const p = players.find(pl => pl.userId === id);
                  return `${p?.user.displayName || id}: ${score}`;
                })
                .join(' — ')}
            </p>
          )}
        </div>

        {/* Game Info */}
        <div className="px-6 pb-4">
          <div className="flex items-center justify-between py-3 border-b border-border-subtle">
            <span className="text-xs text-text-muted">Oyun</span>
            <span className="text-sm text-text-primary font-medium">{GAME_TYPE_LABELS[gameType] || gameType}</span>
          </div>

          {/* Player Scores */}
          <div className="py-4 space-y-2">
            {activePlayers.map((player) => {
              const isWinner = player.userId === result.winnerId;
              return (
                <div
                  key={player.userId}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-xl ${
                    isWinner ? 'bg-emerald-500/10 border border-emerald-500/20' : 'bg-bg-elevated/50'
                  }`}
                >
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-accent-primary/80 to-accent-secondary/80 flex items-center justify-center text-[11px] text-text-inverse font-bold">
                    {player.user.displayName.charAt(0).toUpperCase()}
                  </div>
                  <span className="flex-1 text-sm text-text-primary truncate">
                    {player.user.displayName}
                    {player.userId === currentUserId && <span className="text-text-muted ml-1">(sen)</span>}
                  </span>
                  {isWinner && !isDraw && (
                    <span className="text-xs font-medium text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full">
                      Kazanan
                    </span>
                  )}
                  {isDraw && (
                    <span className="text-xs font-medium text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-full">
                      Berabere
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Actions */}
        <div className="px-6 pb-6 flex gap-3">
          {onPlayAgain && (
            <Button onClick={onPlayAgain} className="flex-1">
              Tekrar Oyna
            </Button>
          )}
          <Button variant="ghost" onClick={onClose} className={onPlayAgain ? '' : 'flex-1'}>
            Kapat
          </Button>
        </div>
      </div>
    </div>
  );
}

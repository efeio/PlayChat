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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in">
      <div className="w-full max-w-sm mx-4 bg-bg-card border border-border-default rounded-2xl shadow-2xl overflow-hidden">
        {/* Result Banner */}
        <div className={`px-6 py-8 text-center ${
          isDraw
            ? 'bg-gradient-to-b from-amber-500/10 to-transparent'
            : isCurrentUserWinner
              ? 'bg-gradient-to-b from-emerald-500/10 to-transparent'
              : 'bg-gradient-to-b from-red-500/10 to-transparent'
        }`}>
          <div className="text-4xl mb-3">
            {isDraw ? '🤝' : isCurrentUserWinner ? '🏆' : '😔'}
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
              Kelime: <span className="text-white font-bold uppercase tracking-widest">{gameState.targetWord}</span>
            </p>
          )}
        </div>

        {/* Game Info */}
        <div className="px-6 pb-4">
          <div className="flex items-center justify-between py-3 border-b border-border-subtle">
            <span className="text-xs text-text-muted">Oyun</span>
            <span className="text-sm text-white font-medium">{GAME_TYPE_LABELS[gameType] || gameType}</span>
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
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-accent-primary/80 to-accent-secondary/80 flex items-center justify-center text-[11px] text-white font-bold">
                    {player.user.displayName.charAt(0).toUpperCase()}
                  </div>
                  <span className="flex-1 text-sm text-white truncate">
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

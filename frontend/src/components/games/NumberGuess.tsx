import { useState, useEffect, useRef } from 'react';

interface GuessEntry {
  playerId: string;
  guess: number;
  hint: 'correct' | 'higher' | 'lower';
}

interface NumberGuessProps {
  gameState: {
    players: string[];
    guesses: GuessEntry[];
    currentPlayerIndex: number;
    winner: string | null;
    finished: boolean;
    minRange: number;
    maxRange: number;
    roundNumber: number;
    maxRounds: number;
  };
  onMove: (move: { guess: number }) => void;
  currentUserId: string;
  players: { userId: string; displayName: string }[];
}

export function NumberGuess({ gameState, onMove, currentUserId, players }: NumberGuessProps) {
  const [inputValue, setInputValue] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const { guesses, currentPlayerIndex, winner, finished, minRange, maxRange, roundNumber, maxRounds } = gameState;
  const isMyTurn = gameState.players[currentPlayerIndex] === currentUserId;

  const getPlayerName = (id: string) =>
    players.find((p) => p.userId === id)?.displayName || id;

  useEffect(() => {
    setIsProcessing(false);
  }, [gameState]);

  useEffect(() => {
    if (isMyTurn && !finished) {
      inputRef.current?.focus();
    }
  }, [isMyTurn, finished]);

  const handleSubmit = () => {
    if (!isMyTurn || isProcessing || finished) return;
    const num = parseInt(inputValue, 10);
    if (isNaN(num) || num < minRange || num > maxRange) return;

    setIsProcessing(true);
    onMove({ guess: num });
    setInputValue('');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSubmit();
  };

  const lastGuess = guesses.length > 0 ? guesses[guesses.length - 1] : null;

  return (
    <div className="flex flex-col items-center gap-6 w-full max-w-md p-6">
      {/* Title */}
      <div className="text-center">
        <h2 className="text-xl font-bold text-text-primary mb-1" style={{ fontFamily: 'var(--font-family-display)' }}>
          Sayı Tahmin
        </h2>
        {finished ? (
          <p className="text-accent-secondary font-semibold">
            {winner ? `${getPlayerName(winner)} buldu!` : 'Kimse bulamadı!'}
          </p>
        ) : (
          <p className="text-text-secondary text-sm">
            {isMyTurn ? (
              <span className="text-accent-secondary font-semibold">Tahmin sırası sende</span>
            ) : (
              `${getPlayerName(gameState.players[currentPlayerIndex])} bekleniyor...`
            )}
          </p>
        )}
      </div>

      {/* Range Display */}
      <div className="w-full bg-bg-card border border-border-default rounded-2xl p-6">
        <div className="flex items-center justify-center gap-4 mb-2">
          <span className="text-xs text-text-muted uppercase tracking-wider">Aralık</span>
          <span className="px-3 py-1 rounded-lg bg-bg-elevated text-sm font-medium text-text-muted">
            Tur {roundNumber} / {maxRounds}
          </span>
        </div>
        <div className="flex items-center justify-between mb-4">
          <span className="text-3xl font-bold text-text-primary">{minRange}</span>
          <span className="text-text-muted text-lg">—</span>
          <span className="text-3xl font-bold text-text-primary">{maxRange}</span>
        </div>
        <div className="relative h-3 bg-bg-elevated rounded-full overflow-hidden">
          <div
            className="absolute inset-y-0 left-0 bg-gradient-to-r from-accent-primary to-accent-secondary rounded-full transition-all duration-500"
            style={{
              left: `${((minRange - 1) / 99) * 100}%`,
              width: `${((maxRange - minRange) / 99) * 100}%`,
            }}
          />
        </div>
        {lastGuess && !finished && (
          <div className="mt-4 text-center">
            <span className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold ${
              lastGuess.hint === 'higher'
                ? 'text-amber-400 bg-amber-400/10'
                : 'text-sky-400 bg-sky-400/10'
            }`}>
              {lastGuess.hint === 'higher' ? (
                <><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="18 15 12 9 6 15"/></svg> Daha Yüksek</>
              ) : (
                <><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"/></svg> Daha Düşük</>
              )}
            </span>
          </div>
        )}
      </div>

      {/* Input */}
      {!finished && isMyTurn && (
        <div className="flex items-center gap-3 w-full">
          <input
            ref={inputRef}
            type="number"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={`${minRange}–${maxRange}`}
            min={minRange}
            max={maxRange}
            className="flex-1 px-4 py-3 bg-bg-elevated border border-border-default rounded-xl text-text-primary text-base placeholder:text-text-muted focus:outline-none focus:border-accent-primary focus:ring-2 focus:ring-accent-primary/10 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
            disabled={isProcessing}
          />
          <button
            onClick={handleSubmit}
            disabled={!inputValue || isProcessing}
            className="px-5 py-3 bg-accent-primary text-text-inverse text-sm font-semibold rounded-xl disabled:opacity-40 hover:bg-accent-primary/80 transition-colors cursor-pointer disabled:cursor-not-allowed"
          >
            Tahmin
          </button>
        </div>
      )}

      {/* Guess History */}
      {guesses.length > 0 && (
        <div className="w-full max-h-52 overflow-y-auto space-y-2 bg-bg-card border border-border-default rounded-2xl p-4">
          <p className="text-xs text-text-muted font-medium uppercase tracking-wider mb-2">Tahminler</p>
          {[...guesses].reverse().map((entry, idx) => (
            <div
              key={idx}
              className={`flex items-center justify-between px-4 py-2.5 rounded-xl text-sm ${
                entry.hint === 'correct'
                  ? 'bg-emerald-600/15 border border-emerald-500/30'
                  : 'bg-bg-elevated/60'
              }`}
            >
              <span className="text-text-secondary text-xs">
                {getPlayerName(entry.playerId)}
              </span>
              <span className="font-mono text-text-primary font-bold text-base">{entry.guess}</span>
              <span className={`font-bold ${
                entry.hint === 'correct'
                  ? 'text-emerald-400'
                  : entry.hint === 'higher'
                    ? 'text-amber-400'
                    : 'text-sky-400'
              }`}>
                {entry.hint === 'correct' ? '✓' : entry.hint === 'higher' ? '↑' : '↓'}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

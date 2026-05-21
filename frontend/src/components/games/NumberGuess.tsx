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
    <div className="flex flex-col items-center gap-6 w-full max-w-sm">
      {/* Status */}
      <div className="text-center">
        {finished ? (
          <p className="text-white font-bold text-lg" style={{ fontFamily: 'var(--font-family-display)' }}>
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
        <p className="text-text-muted text-xs mt-1">
          Tur {roundNumber} / {maxRounds}
        </p>
      </div>

      {/* Range Display */}
      <div className="w-full bg-bg-card border border-border-default rounded-xl p-5">
        <div className="flex items-center justify-between mb-3">
          <span className="text-2xl font-bold text-white">{minRange}</span>
          <span className="text-text-muted text-sm">–</span>
          <span className="text-2xl font-bold text-white">{maxRange}</span>
        </div>
        <div className="relative h-2 bg-bg-elevated rounded-full overflow-hidden">
          <div
            className="absolute inset-y-0 left-0 bg-gradient-to-r from-accent-primary to-accent-secondary rounded-full transition-all duration-500"
            style={{
              left: `${((minRange - 1) / 99) * 100}%`,
              width: `${((maxRange - minRange) / 99) * 100}%`,
            }}
          />
        </div>
        {lastGuess && !finished && (
          <div className="mt-3 text-center">
            <span className={`text-sm font-medium ${
              lastGuess.hint === 'higher' ? 'text-amber-400' : 'text-sky-400'
            }`}>
              {lastGuess.hint === 'higher' ? '📈 Daha Yüksek' : '📉 Daha Düşük'}
            </span>
          </div>
        )}
      </div>

      {/* Input */}
      {!finished && isMyTurn && (
        <div className="flex items-center gap-2 w-full">
          <input
            ref={inputRef}
            type="number"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={`${minRange}–${maxRange}`}
            min={minRange}
            max={maxRange}
            className="flex-1 px-3 py-2.5 bg-bg-elevated border border-border-default rounded-xl text-white text-sm placeholder:text-text-muted focus:outline-none focus:border-accent-primary [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
            disabled={isProcessing}
          />
          <button
            onClick={handleSubmit}
            disabled={!inputValue || isProcessing}
            className="px-4 py-2.5 bg-accent-primary text-white text-sm font-medium rounded-xl disabled:opacity-40 hover:bg-accent-primary/80 transition-colors cursor-pointer disabled:cursor-not-allowed"
          >
            Tahmin
          </button>
        </div>
      )}

      {/* Guess History */}
      {guesses.length > 0 && (
        <div className="w-full max-h-48 overflow-y-auto space-y-1.5">
          {[...guesses].reverse().map((entry, idx) => (
            <div
              key={idx}
              className={`flex items-center justify-between px-3 py-2 rounded-lg text-xs ${
                entry.hint === 'correct'
                  ? 'bg-emerald-600/15 border border-emerald-500/30'
                  : 'bg-bg-elevated/60 border border-border-subtle'
              }`}
            >
              <span className="text-text-secondary">
                {getPlayerName(entry.playerId)}
              </span>
              <span className="font-mono text-white font-medium">{entry.guess}</span>
              <span className={`font-medium ${
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

import { useState, useEffect, useRef } from 'react';

interface GuessResult {
  word: string;
  results: ('correct' | 'present' | 'absent')[];
  playerId: string;
}

interface WordleProps {
  gameState: {
    players: string[];
    guesses: GuessResult[];
    currentPlayerIndex: number;
    winner: string | null;
    finished: boolean;
    maxGuesses: number;
    targetWord?: string;
  };
  onMove: (move: { word: string }) => void;
  currentUserId: string;
  players: { userId: string; displayName: string }[];
}

const WORD_LENGTH = 5;

export function Wordle({ gameState, onMove, currentUserId, players }: WordleProps) {
  const [currentGuess, setCurrentGuess] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const { guesses, currentPlayerIndex, winner, finished, maxGuesses, targetWord } = gameState;
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
    if (currentGuess.length !== WORD_LENGTH) return;
    if (!/^[a-zA-Z]+$/.test(currentGuess)) return;

    setIsProcessing(true);
    onMove({ word: currentGuess.toLowerCase() });
    setCurrentGuess('');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSubmit();
    }
  };

  const usedLetters = new Map<string, 'correct' | 'present' | 'absent'>();
  for (const guess of guesses) {
    for (let i = 0; i < guess.word.length; i++) {
      const letter = guess.word[i];
      const result = guess.results[i];
      const existing = usedLetters.get(letter);
      if (!existing || result === 'correct' || (result === 'present' && existing === 'absent')) {
        usedLetters.set(letter, result);
      }
    }
  }

  return (
    <div className="flex flex-col items-center gap-6 w-full max-w-sm">
      {/* Status */}
      <div className="text-center">
        {finished ? (
          <>
            <p className="text-white font-bold text-lg" style={{ fontFamily: 'var(--font-family-display)' }}>
              {winner ? `${getPlayerName(winner)} bildi!` : 'Kimse bilemedi!'}
            </p>
            {targetWord && (
              <p className="text-accent-secondary font-bold text-base mt-1 uppercase tracking-widest">
                {targetWord}
              </p>
            )}
          </>
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
          {guesses.length} / {maxGuesses} tahmin
        </p>
      </div>

      {/* Guess Grid */}
      <div className="flex flex-col gap-1.5 w-full">
        {Array.from({ length: maxGuesses }).map((_, rowIdx) => {
          const guess = guesses[rowIdx];
          return (
            <div key={rowIdx} className="flex gap-1.5 justify-center">
              {Array.from({ length: WORD_LENGTH }).map((_, colIdx) => {
                if (guess) {
                  const letter = guess.word[colIdx];
                  const result = guess.results[colIdx];
                  return (
                    <div
                      key={colIdx}
                      className={`w-12 h-12 flex items-center justify-center rounded-lg text-white font-bold text-lg uppercase transition-all ${
                        result === 'correct'
                          ? 'bg-emerald-600 border border-emerald-500'
                          : result === 'present'
                            ? 'bg-amber-600 border border-amber-500'
                            : 'bg-zinc-700 border border-zinc-600'
                      }`}
                    >
                      {letter}
                    </div>
                  );
                }
                if (rowIdx === guesses.length && !finished) {
                  const letter = currentGuess[colIdx] || '';
                  return (
                    <div
                      key={colIdx}
                      className={`w-12 h-12 flex items-center justify-center rounded-lg text-white font-bold text-lg uppercase border ${
                        letter ? 'border-border-default bg-bg-elevated' : 'border-border-subtle bg-bg-card'
                      }`}
                    >
                      {letter}
                    </div>
                  );
                }
                return (
                  <div
                    key={colIdx}
                    className="w-12 h-12 flex items-center justify-center rounded-lg border border-border-subtle bg-bg-card"
                  />
                );
              })}
            </div>
          );
        })}
      </div>

      {/* Input */}
      {!finished && isMyTurn && (
        <div className="flex items-center gap-2 w-full max-w-xs">
          <input
            ref={inputRef}
            type="text"
            value={currentGuess}
            onChange={(e) => setCurrentGuess(e.target.value.replace(/[^a-zA-Z]/g, '').slice(0, WORD_LENGTH))}
            onKeyDown={handleKeyDown}
            placeholder="5 harfli kelime yaz"
            maxLength={WORD_LENGTH}
            className="flex-1 px-3 py-2.5 bg-bg-elevated border border-border-default rounded-xl text-white text-sm placeholder:text-text-muted focus:outline-none focus:border-accent-primary uppercase tracking-wider"
            disabled={isProcessing}
          />
          <button
            onClick={handleSubmit}
            disabled={currentGuess.length !== WORD_LENGTH || isProcessing}
            className="px-4 py-2.5 bg-accent-primary text-white text-sm font-medium rounded-xl disabled:opacity-40 hover:bg-accent-primary/80 transition-colors cursor-pointer disabled:cursor-not-allowed"
          >
            Tahmin
          </button>
        </div>
      )}

      {/* Keyboard hints */}
      <div className="flex flex-wrap gap-1 justify-center max-w-xs">
        {'abcdefghijklmnopqrstuvwxyz'.split('').map((letter) => {
          const status = usedLetters.get(letter);
          return (
            <div
              key={letter}
              className={`w-7 h-8 flex items-center justify-center rounded text-xs font-medium uppercase ${
                status === 'correct'
                  ? 'bg-emerald-600 text-white'
                  : status === 'present'
                    ? 'bg-amber-600 text-white'
                    : status === 'absent'
                      ? 'bg-zinc-800 text-zinc-500'
                      : 'bg-bg-elevated text-text-secondary border border-border-subtle'
              }`}
            >
              {letter}
            </div>
          );
        })}
      </div>
    </div>
  );
}

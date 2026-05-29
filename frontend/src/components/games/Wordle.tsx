import { useState, useEffect, useRef, useCallback } from 'react';

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
  onMove: (move: { word: string }, onError?: (error: string) => void) => void;
  currentUserId: string;
  players: { userId: string; displayName: string }[];
}

const WORD_LENGTH = 5;

const TURKISH_KEYBOARD_ROWS = [
  ['E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P', 'Ğ', 'Ü'],
  ['A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L', 'Ş', 'İ'],
  ['Z', 'C', 'V', 'B', 'N', 'M', 'Ö', 'Ç'],
];

function turkishUpper(str: string): string {
  return str
    .replace(/i/g, 'İ')
    .replace(/ı/g, 'I')
    .toUpperCase();
}

export function Wordle({ gameState, onMove, currentUserId, players }: WordleProps) {
  const [currentGuess, setCurrentGuess] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [shakeRow, setShakeRow] = useState(false);
  const [invalidMsg, setInvalidMsg] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const invalidTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

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

  useEffect(() => {
    return () => {
      if (invalidTimerRef.current) clearTimeout(invalidTimerRef.current);
    };
  }, []);

  const showInvalidFeedback = useCallback((msg: string) => {
    setInvalidMsg(msg);
    setShakeRow(true);
    setIsProcessing(false);
    if (invalidTimerRef.current) clearTimeout(invalidTimerRef.current);
    invalidTimerRef.current = setTimeout(() => {
      setShakeRow(false);
      setInvalidMsg(null);
    }, 1500);
  }, []);

  const handleSubmit = useCallback(() => {
    if (!isMyTurn || isProcessing || finished) return;
    if (currentGuess.length !== WORD_LENGTH) return;

    const submittedGuess = currentGuess;
    setIsProcessing(true);
    onMove({ word: submittedGuess }, (error: string) => {
      if (error === 'invalid_word') {
        setCurrentGuess(submittedGuess);
        showInvalidFeedback('Geçersiz kelime');
      } else {
        showInvalidFeedback(error);
      }
    });
    setCurrentGuess('');
  }, [isMyTurn, isProcessing, finished, currentGuess, onMove, showInvalidFeedback]);

  const handleKeyboardClick = useCallback((letter: string) => {
    if (!isMyTurn || isProcessing || finished) return;
    if (currentGuess.length >= WORD_LENGTH) return;
    const lower = letter
      .replace(/İ/g, 'i')
      .replace(/I/g, 'ı')
      .toLowerCase();
    setCurrentGuess(prev => prev + lower);
  }, [isMyTurn, isProcessing, finished, currentGuess]);

  const handleBackspace = useCallback(() => {
    setCurrentGuess(prev => prev.slice(0, -1));
  }, []);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSubmit();
    }
  };

  const usedLetters = new Map<string, 'correct' | 'present' | 'absent'>();
  for (const guess of guesses) {
    for (let i = 0; i < guess.word.length; i++) {
      const letter = turkishUpper(guess.word[i]);
      const result = guess.results[i];
      const existing = usedLetters.get(letter);
      if (!existing || result === 'correct' || (result === 'present' && existing === 'absent')) {
        usedLetters.set(letter, result);
      }
    }
  }

  return (
    <div className="flex flex-col items-center gap-5 w-full max-w-sm">
      {/* Status */}
      <div className="text-center">
        {finished ? (
          <>
            <p className="text-text-primary font-bold text-lg" style={{ fontFamily: 'var(--font-family-display)' }}>
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

      {/* Invalid word toast */}
      {invalidMsg && (
        <div className="px-4 py-2 rounded-lg bg-status-error/15 border border-status-error/30 text-status-error text-sm font-medium animate-fade-in">
          {invalidMsg}
        </div>
      )}

      {/* Guess Grid */}
      <div className="flex flex-col gap-1.5 w-full">
        {Array.from({ length: maxGuesses }).map((_, rowIdx) => {
          const guess = guesses[rowIdx];
          const isCurrentRow = rowIdx === guesses.length && !finished;
          const shouldShake = isCurrentRow && shakeRow;

          return (
            <div
              key={rowIdx}
              className={`flex gap-1.5 justify-center ${shouldShake ? 'animate-shake' : ''}`}
            >
              {Array.from({ length: WORD_LENGTH }).map((_, colIdx) => {
                if (guess) {
                  const letter = guess.word[colIdx];
                  const result = guess.results[colIdx];
                  return (
                    <div
                      key={colIdx}
                      className={`w-12 h-12 flex items-center justify-center rounded-lg font-bold text-lg uppercase transition-all ${
                        result === 'correct'
                          ? 'bg-emerald-600 border border-emerald-500 text-text-inverse'
                          : result === 'present'
                            ? 'bg-amber-600 border border-amber-500 text-text-inverse'
                            : 'bg-zinc-700 border border-zinc-600 text-text-inverse'
                      }`}
                    >
                      {letter}
                    </div>
                  );
                }
                if (isCurrentRow) {
                  const letter = currentGuess[colIdx] || '';
                  return (
                    <div
                      key={colIdx}
                      className={`w-12 h-12 flex items-center justify-center rounded-lg text-text-primary font-bold text-lg uppercase border transition-all ${
                        letter ? 'border-border-default bg-bg-elevated scale-105' : 'border-border-subtle bg-bg-card'
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

      {/* Hidden input for physical keyboard */}
      {!finished && isMyTurn && (
        <input
          ref={inputRef}
          type="text"
          value={currentGuess}
          onChange={(e) => {
            const filtered = e.target.value.replace(/[^a-zA-ZçğıöşüÇĞİÖŞÜ]/g, '').slice(0, WORD_LENGTH);
            const lower = filtered
              .replace(/İ/g, 'i')
              .replace(/I/g, 'ı')
              .toLowerCase();
            setCurrentGuess(lower);
          }}
          onKeyDown={handleKeyDown}
          className="sr-only"
          autoFocus
          disabled={isProcessing}
        />
      )}

      {/* Turkish Keyboard */}
      {!finished && isMyTurn && (
        <div className="flex flex-col gap-1.5 w-full items-center mt-2">
          {TURKISH_KEYBOARD_ROWS.map((row, rowIdx) => (
            <div key={rowIdx} className="flex gap-1 justify-center">
              {rowIdx === 2 && (
                <button
                  onClick={handleSubmit}
                  disabled={currentGuess.length !== WORD_LENGTH || isProcessing}
                  className="px-2.5 h-10 rounded-lg text-[10px] sm:text-xs font-bold bg-accent-primary text-text-inverse disabled:opacity-40 transition-all cursor-pointer disabled:cursor-not-allowed"
                >
                  GİR
                </button>
              )}
              {row.map((letter) => {
                const status = usedLetters.get(letter);
                return (
                  <button
                    key={letter}
                    onClick={() => handleKeyboardClick(letter)}
                    disabled={isProcessing}
                    className={`w-7 h-10 sm:w-8 sm:h-11 rounded-lg text-[10px] sm:text-xs font-medium transition-all cursor-pointer disabled:cursor-default ${
                      status === 'correct'
                        ? 'bg-emerald-600 text-text-inverse border border-emerald-500'
                        : status === 'present'
                          ? 'bg-amber-600 text-text-inverse border border-amber-500'
                          : status === 'absent'
                            ? 'bg-zinc-800 text-zinc-500 border border-zinc-700'
                            : 'bg-bg-elevated text-text-primary border border-border-default hover:bg-bg-card'
                    }`}
                  >
                    {letter}
                  </button>
                );
              })}
              {rowIdx === 2 && (
                <button
                  onClick={handleBackspace}
                  disabled={isProcessing || currentGuess.length === 0}
                  className="px-2.5 h-10 rounded-lg text-xs font-bold bg-bg-elevated text-text-primary border border-border-default disabled:opacity-40 transition-all cursor-pointer disabled:cursor-not-allowed"
                >
                  ⌫
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

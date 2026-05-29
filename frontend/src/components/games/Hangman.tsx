import { useState, useEffect, useCallback, useRef } from 'react';
import { Button } from '../ui/Button';

const MAX_WRONG = 6;

const TURKISH_ALPHABET = [
  'A', 'B', 'C', 'Ç', 'D', 'E', 'F', 'G', 'Ğ',
  'H', 'I', 'İ', 'J', 'K', 'L', 'M', 'N', 'O',
  'Ö', 'P', 'R', 'S', 'Ş', 'T', 'U', 'Ü', 'V', 'Y', 'Z',
];

function turkishUpper(str: string): string {
  return str
    .replace(/i/g, 'İ')
    .replace(/ı/g, 'I')
    .toUpperCase();
}

interface HangmanProps {
  gameState: {
    word?: string;
    maskedWord?: string;
    revealedWord?: string;
    players: string[];
    currentTurnIndex?: number;
    winner: string | null;
    draw?: boolean;
    playerStates: {
      [userId: string]: {
        guessedLetters: string[];
        wrongCount: number;
      };
    };
  };
  onMove: (move: { letter?: string; word?: string }) => void;
  currentUserId: string;
  players: { userId: string; displayName: string }[];
}

function HangmanFigure({ wrongCount }: { wrongCount: number }) {
  return (
    <svg
      viewBox="0 0 200 220"
      className="w-36 h-44 sm:w-40 sm:h-48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Gallows */}
      <line x1="20" y1="210" x2="180" y2="210" stroke="currentColor" strokeWidth="4" strokeLinecap="round" className="text-border-default" />
      <line x1="60" y1="210" x2="60" y2="20" stroke="currentColor" strokeWidth="4" strokeLinecap="round" className="text-border-default" />
      <line x1="60" y1="20" x2="140" y2="20" stroke="currentColor" strokeWidth="4" strokeLinecap="round" className="text-border-default" />
      <line x1="140" y1="20" x2="140" y2="50" stroke="currentColor" strokeWidth="4" strokeLinecap="round" className="text-border-default" />

      {/* Head */}
      {wrongCount >= 1 && (
        <circle cx="140" cy="70" r="20" stroke="currentColor" strokeWidth="3" className="text-indigo-400 transition-all duration-300" />
      )}

      {/* Body */}
      {wrongCount >= 2 && (
        <line x1="140" y1="90" x2="140" y2="150" stroke="currentColor" strokeWidth="3" strokeLinecap="round" className="text-indigo-400 transition-all duration-300" />
      )}

      {/* Left arm */}
      {wrongCount >= 3 && (
        <line x1="140" y1="105" x2="110" y2="130" stroke="currentColor" strokeWidth="3" strokeLinecap="round" className="text-indigo-400 transition-all duration-300" />
      )}

      {/* Right arm */}
      {wrongCount >= 4 && (
        <line x1="140" y1="105" x2="170" y2="130" stroke="currentColor" strokeWidth="3" strokeLinecap="round" className="text-indigo-400 transition-all duration-300" />
      )}

      {/* Left leg */}
      {wrongCount >= 5 && (
        <line x1="140" y1="150" x2="110" y2="185" stroke="currentColor" strokeWidth="3" strokeLinecap="round" className="text-indigo-400 transition-all duration-300" />
      )}

      {/* Right leg */}
      {wrongCount >= 6 && (
        <line x1="140" y1="150" x2="170" y2="185" stroke="currentColor" strokeWidth="3" strokeLinecap="round" className="text-status-error transition-all duration-300" />
      )}

      {/* Face (on death) */}
      {wrongCount >= 6 && (
        <>
          <line x1="132" y1="65" x2="137" y2="70" stroke="currentColor" strokeWidth="2" className="text-status-error" />
          <line x1="137" y1="65" x2="132" y2="70" stroke="currentColor" strokeWidth="2" className="text-status-error" />
          <line x1="143" y1="65" x2="148" y2="70" stroke="currentColor" strokeWidth="2" className="text-status-error" />
          <line x1="148" y1="65" x2="143" y2="70" stroke="currentColor" strokeWidth="2" className="text-status-error" />
          <path d="M132 80 Q140 76 148 80" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="text-status-error" />
        </>
      )}
    </svg>
  );
}

const PENDING_SAFETY_MS = 3000;

export function Hangman({ gameState, onMove, currentUserId, players }: HangmanProps) {
  const [wordGuess, setWordGuess] = useState('');
  const [pendingLetters, setPendingLetters] = useState<Set<string>>(new Set());
  const pendingSafetyRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const { maskedWord, revealedWord, winner, draw, playerStates } = gameState;
  const isFinished = !!winner || !!draw;

  const myState = playerStates[currentUserId] || { guessedLetters: [], wrongCount: 0 };
  const { guessedLetters, wrongCount } = myState;
  const remaining = MAX_WRONG - wrongCount;
  const isEliminated = wrongCount >= MAX_WRONG;

  const opponentId = gameState.players.find(id => id !== currentUserId) || '';
  const opponentState = playerStates[opponentId] || { guessedLetters: [], wrongCount: 0 };
  const opponentRemaining = MAX_WRONG - opponentState.wrongCount;

  useEffect(() => {
    setPendingLetters(new Set());
    if (pendingSafetyRef.current) {
      clearTimeout(pendingSafetyRef.current);
      pendingSafetyRef.current = null;
    }
  }, [gameState]);

  useEffect(() => {
    return () => {
      if (pendingSafetyRef.current) clearTimeout(pendingSafetyRef.current);
    };
  }, []);

  const getPlayerName = (id: string) =>
    players.find((p) => p.userId === id)?.displayName || id;

  const displayWord = isFinished && revealedWord
    ? revealedWord.split('').join(' ')
    : maskedWord
      ? maskedWord.split('').join(' ')
      : '';

  const handleLetterGuess = useCallback((letter: string) => {
    if (isFinished || guessedLetters.includes(letter) || pendingLetters.has(letter) || isEliminated) return;
    setPendingLetters(prev => new Set(prev).add(letter));
    if (pendingSafetyRef.current) clearTimeout(pendingSafetyRef.current);
    pendingSafetyRef.current = setTimeout(() => {
      setPendingLetters(new Set());
    }, PENDING_SAFETY_MS);
    onMove({ letter });
  }, [isFinished, guessedLetters, pendingLetters, isEliminated, onMove]);

  const handleWordGuess = useCallback(() => {
    if (isFinished || !wordGuess.trim() || isEliminated) return;
    onMove({ word: turkishUpper(wordGuess.trim()) });
    setWordGuess('');
  }, [isFinished, wordGuess, isEliminated, onMove]);

  useEffect(() => {
    setWordGuess('');
  }, [isFinished]);

  return (
    <div className="flex flex-col items-center gap-6 w-full">
      {/* Status */}
      <div className="text-center">
        {isFinished ? (
          <div className="space-y-2">
            <p className="text-text-primary font-bold text-lg" style={{ fontFamily: 'var(--font-family-display)' }}>
              {winner === currentUserId
                ? 'Kelimeyi bildin!'
                : winner
                ? `${getPlayerName(winner)} kelimeyi bildi!`
                : draw
                ? 'Berabere! Kimse bilemedi.'
                : 'Oyun bitti'}
            </p>
            {revealedWord && (
              <p className="text-accent-secondary font-semibold text-sm">
                Kelime: <span className="tracking-widest text-text-primary">{revealedWord}</span>
              </p>
            )}
          </div>
        ) : (
          <p className="text-text-secondary text-sm">
            {isEliminated ? (
              <span className="text-status-error font-medium">Tahmin hakkın bitti! Rakip bekleniyor...</span>
            ) : (
              <span className="text-accent-secondary font-medium">Rakibinden önce kelimeyi bul!</span>
            )}
          </p>
        )}
      </div>

      {/* Player status pills */}
      <div className="flex gap-4 text-xs">
        <div className="px-3 py-1.5 rounded-xl bg-bg-card border border-border-default text-text-secondary">
          <span className="text-text-muted">{getPlayerName(opponentId)}:</span>{' '}
          <span className="font-medium">{opponentRemaining} hak</span>
        </div>
        <div className={`px-3 py-1.5 rounded-xl border font-medium ${
          remaining <= 2
            ? 'bg-status-error/10 border-status-error/20 text-status-error'
            : 'bg-bg-card border-border-default text-text-secondary'
        }`}>
          Sen: {remaining} hak
        </div>
      </div>

      {/* SVG Hangman figure */}
      <div className="flex items-center justify-center drop-shadow-[0_0_12px_rgba(99,102,241,0.3)]">
        <HangmanFigure wrongCount={wrongCount} />
      </div>

      {/* Word display */}
      <div className="text-xl sm:text-2xl font-mono text-text-primary tracking-[0.2em] sm:tracking-[0.3em] select-none text-center px-4">
        {displayWord}
      </div>

      {/* Turkish keyboard */}
      {!isFinished && !isEliminated && (
        <>
          <div className="flex flex-wrap justify-center gap-1.5 sm:gap-2 max-w-md px-2">
            {TURKISH_ALPHABET.map((letter) => {
              const used = guessedLetters.includes(letter);
              const pending = pendingLetters.has(letter);
              const revealedMask = maskedWord || '';
              const isCorrect = used && revealedMask.includes(letter);
              const isWrong = used && !isCorrect;
              return (
                <button
                  key={letter}
                  onClick={() => handleLetterGuess(letter)}
                  disabled={used || pending}
                  className={`w-9 h-9 sm:w-10 sm:h-10 rounded-lg text-xs sm:text-sm font-medium transition-all duration-200 cursor-pointer disabled:cursor-default border ${
                    isCorrect
                      ? 'bg-accent-success/15 text-accent-success border-accent-success/30'
                      : isWrong
                      ? 'bg-bg-base/50 text-text-muted border-border-subtle opacity-40'
                      : 'bg-bg-card text-text-primary border-border-default hover:border-accent-primary/40 hover:bg-accent-primary/5'
                  }`}
                >
                  {letter}
                </button>
              );
            })}
          </div>

          {/* Word guess input */}
          <div className="flex gap-2 w-full max-w-xs items-center mt-2">
            <input
              value={wordGuess}
              onChange={(e) => setWordGuess(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleWordGuess()}
              placeholder="Kelimeyi tahmin et..."
              className="flex-1 bg-bg-base/60 border border-border-default rounded-xl px-4 py-2.5 text-sm text-text-primary placeholder-text-muted focus:outline-none focus:border-accent-primary/40 focus:ring-2 focus:ring-accent-primary/10 transition-all duration-200"
            />
            <Button
              onClick={handleWordGuess}
              disabled={!wordGuess.trim()}
            >
              Tahmin
            </Button>
          </div>
        </>
      )}
    </div>
  );
}

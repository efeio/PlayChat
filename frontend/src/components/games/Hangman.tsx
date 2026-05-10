import { useState, useEffect } from 'react';

const MAX_WRONG = 6;

interface HangmanProps {
  gameState: {
    word: string;
    guessedLetters: string[];
    wrongCount: number;
    players: string[];
    winner: string | null;
    setter: string;
    guesser: string;
    roles?: {
      [userId: string]: 'SETTER' | 'GUESSER';
    };
  };
  onMove: (move: { letter?: string; word?: string }) => void;
  currentUserId: string;
  players: { userId: string; displayName: string }[];
}

/**
 * Hangman Game Component
 * 
 * Role-Based Access Control:
 * - Word Setter: Assigned to player[0], cannot guess letters (UI prevents access)
 * - Word Guesser: Assigned to player[1], can guess letters and words
 * 
 * Error Handling:
 * - Client-side validation prevents invalid actions (UI is hidden for wrong roles)
 * - Server-side validation returns specific error messages if bypassed:
 *   - "Only the Word Guesser can guess letters"
 *   - "Only the Word Setter can submit the word"
 * - Error toasts are displayed by the parent Room component via onMove callback
 * 
 * Requirements: 2.4, 2.7
 */

const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');

export function Hangman({ gameState, onMove, currentUserId, players }: HangmanProps) {
  const [wordGuess, setWordGuess] = useState('');
  const { guessedLetters, wrongCount, winner, setter, guesser, roles } = gameState;
  const isGuesser = currentUserId === guesser;
  const isSetter = currentUserId === setter;
  const isFinished = !!winner;
  const remaining = MAX_WRONG - wrongCount;

  const getPlayerName = (id: string) =>
    players.find((p) => p.userId === id)?.displayName || id;

  const getUserRole = (userId: string): 'SETTER' | 'GUESSER' | null => {
    if (roles) {
      return roles[userId] || null;
    }
    if (userId === setter) return 'SETTER';
    if (userId === guesser) return 'GUESSER';
    return null;
  };

  const currentUserRole = getUserRole(currentUserId);

  /* Build masked word display - only show to guesser */
  const maskedWord = gameState.word
    .split('')
    .map((c) => (guessedLetters.includes(c) || isFinished ? c : '_'))
    .join(' ');

  const handleLetterGuess = (letter: string) => {
    if (!isGuesser || isFinished || guessedLetters.includes(letter)) return;
    onMove({ letter });
  };

  const handleWordGuess = () => {
    if (!isGuesser || isFinished || !wordGuess.trim()) return;
    onMove({ word: wordGuess.trim() });
    setWordGuess('');
  };

  useEffect(() => {
    if (isFinished) {
      setWordGuess('');
    }
    return () => {
      setWordGuess('');
    }
  }, [isFinished]);

  return (
    <div className="flex flex-col items-center gap-6">
      {/* Status */}
      <div className="text-center">
        {isFinished ? (
          <p className="text-white font-semibold text-lg">
            {winner === guesser
              ? `${getPlayerName(guesser)} guessed the word!`
              : `${getPlayerName(guesser)} couldn't guess — ${getPlayerName(setter)} wins!`}
          </p>
        ) : (
          <p className="text-text-secondary text-sm">
            {isGuesser ? (
              <span className="text-white font-medium">Guess the word!</span>
            ) : (
              `Waiting for ${getPlayerName(guesser)} to guess...`
            )}
          </p>
        )}
      </div>

      {/* Roles */}
      <div className="flex flex-col sm:flex-row gap-2 sm:gap-6 text-xs w-full max-w-md">
        <div className={`px-3 py-1.5 rounded-xl border transition-all duration-200 ${currentUserRole === 'SETTER' ? 'bg-bg-card text-white border-border-default' : 'bg-bg-elevated text-text-secondary border-border-subtle'}`}>
          <span className="opacity-60">Word Setter:</span>{' '}
          <span className="font-medium">{getPlayerName(setter)}</span>
          {currentUserRole === 'SETTER' && <span className="ml-1.5 text-emerald-400">(You)</span>}
        </div>
        <div className={`px-3 py-1.5 rounded-xl border transition-all duration-200 ${currentUserRole === 'GUESSER' ? 'bg-bg-card text-white border-border-default' : 'bg-bg-elevated text-text-secondary border-border-subtle'}`}>
          <span className="opacity-60">Word Guesser:</span>{' '}
          <span className="font-medium">{getPlayerName(guesser)}</span>
          {currentUserRole === 'GUESSER' && <span className="ml-1.5 text-emerald-400">(You)</span>}
        </div>
      </div>

      {/* Hangman figure */}
      <div className="w-32 h-40 sm:w-40 sm:h-48 bg-bg-elevated rounded-2xl flex items-center justify-center border border-border-subtle">
        <pre className="text-white text-center text-base sm:text-lg font-mono leading-tight select-none">
          {`  ┌───┐\n  │   ${wrongCount >= 1 ? 'O' : ' '}\n  │  ${wrongCount >= 3 ? '/' : ' '}${wrongCount >= 2 ? '|' : ' '}${wrongCount >= 4 ? '\\' : ' '}\n  │  ${wrongCount >= 5 ? '/' : ' '} ${wrongCount >= 6 ? '\\' : ' '}\n──┴──`}
        </pre>
      </div>

      {/* Wrong count */}
      <p className="text-text-muted text-xs">
        {remaining} guess{remaining !== 1 ? 'es' : ''} remaining
      </p>

      {/* Word display */}
      <div className="text-xl sm:text-2xl font-mono text-white tracking-[0.2em] sm:tracking-[0.3em] select-none">
        {maskedWord}
      </div>

      {/* Letter keyboard */}
      {!isFinished && isGuesser && (
        <>
          <div className="flex flex-wrap justify-center gap-1.5 sm:gap-2 max-w-md px-2">
            {ALPHABET.map((letter) => {
              const used = guessedLetters.includes(letter);
              const isWrong = used && !gameState.word.includes(letter);
              const isCorrect = used && gameState.word.includes(letter);
              return (
                <button
                  key={letter}
                  onClick={() => handleLetterGuess(letter)}
                  disabled={used}
                  className={`w-11 h-11 sm:w-12 sm:h-12 rounded-xl text-sm sm:text-base font-medium transition-all duration-200 cursor-pointer disabled:cursor-default border ${
                    isCorrect
                      ? 'bg-emerald-950 text-emerald-400 border-emerald-500/30'
                      : isWrong
                      ? 'bg-bg-base text-text-faint border-border-subtle'
                      : 'bg-bg-elevated text-white border-border-subtle hover:bg-bg-card hover:border-border-default'
                  }`}
                >
                  {letter}
                </button>
              );
            })}
          </div>

          {/* Word guess input */}
          <div className="flex gap-2 w-full max-w-xs" style={{ paddingLeft: '16px', paddingRight: '16px' }}>
            <input
              value={wordGuess}
              onChange={(e) => setWordGuess(e.target.value.toUpperCase())}
              onKeyDown={(e) => e.key === 'Enter' && handleWordGuess()}
              placeholder="Guess the word..."
              style={{ height: '44px', paddingLeft: '16px', paddingRight: '16px' }}
              className="flex-1 rounded-full bg-input-bg border border-input-border text-white placeholder-text-muted text-sm focus:border-input-focus focus:ring-1 focus:ring-input-focus focus:outline-none transition-all duration-200"
            />
            <button
              onClick={handleWordGuess}
              disabled={!wordGuess.trim()}
              style={{ height: '44px', paddingLeft: '20px', paddingRight: '20px' }}
              className="rounded-full bg-white text-black text-sm font-semibold hover:bg-neutral-200 active:scale-[0.98] disabled:opacity-30 cursor-pointer disabled:cursor-not-allowed transition-all duration-200"
            >
              Guess
            </button>
          </div>
        </>
      )}
    </div>
  );
}

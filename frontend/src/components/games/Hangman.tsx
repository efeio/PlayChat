import { useState } from 'react';

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

const HANGMAN_PARTS = [
  /* 0 wrong */ '',
  /* 1 wrong */ 'O',        /* head */
  /* 2 wrong */ '|',        /* body */
  /* 3 wrong */ '/|',       /* left arm + body */
  /* 4 wrong */ '/|\\',     /* both arms + body */
  /* 5 wrong */ '/',        /* left leg */
  /* 6 wrong */ '/ \\',     /* both legs */
];

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

  return (
    <div className="flex flex-col items-center gap-6">
      {/* Status */}
      <div className="text-center">
        {isFinished ? (
          <p className="text-text-primary font-semibold text-lg">
            {winner === guesser
              ? `${getPlayerName(guesser)} guessed the word!`
              : `${getPlayerName(guesser)} couldn't guess — ${getPlayerName(setter)} wins!`}
          </p>
        ) : (
          <p className="text-text-secondary text-sm">
            {isGuesser ? (
              <span className="text-text-primary font-medium">Guess the word!</span>
            ) : (
              `Waiting for ${getPlayerName(guesser)} to guess...`
            )}
          </p>
        )}
      </div>

      {/* Roles */}
      <div className="flex flex-col sm:flex-row gap-2 sm:gap-6 text-xs w-full max-w-md">
        <div className={`px-3 py-1.5 rounded-lg border ${currentUserRole === 'SETTER' ? 'bg-bg-elevated text-text-primary' : 'bg-bg-surface text-text-secondary'}`} style={{ borderColor: currentUserRole === 'SETTER' ? 'rgba(255, 255, 255, 0.2)' : '#222222' }}>
          <span className="opacity-60">Word Setter:</span>{' '}
          <span className="font-medium">{getPlayerName(setter)}</span>
          {currentUserRole === 'SETTER' && <span className="ml-1.5 text-accent-green">(You)</span>}
        </div>
        <div className={`px-3 py-1.5 rounded-lg border ${currentUserRole === 'GUESSER' ? 'bg-bg-elevated text-text-primary' : 'bg-bg-surface text-text-secondary'}`} style={{ borderColor: currentUserRole === 'GUESSER' ? 'rgba(255, 255, 255, 0.2)' : '#222222' }}>
          <span className="opacity-60">Word Guesser:</span>{' '}
          <span className="font-medium">{getPlayerName(guesser)}</span>
          {currentUserRole === 'GUESSER' && <span className="ml-1.5 text-accent-green">(You)</span>}
        </div>
      </div>

      {/* Hangman figure */}
      <div className="w-32 h-40 sm:w-40 sm:h-48 bg-bg-elevated rounded-xl flex items-center justify-center" style={{ borderWidth: '1px', borderColor: '#222222' }}>
        <pre className="text-text-primary text-center text-base sm:text-lg font-mono leading-tight select-none">
          {`  ┌───┐\n  │   ${wrongCount >= 1 ? 'O' : ' '}\n  │  ${wrongCount >= 3 ? '/' : ' '}${wrongCount >= 2 ? '|' : ' '}${wrongCount >= 4 ? '\\' : ' '}\n  │  ${wrongCount >= 5 ? '/' : ' '} ${wrongCount >= 6 ? '\\' : ' '}\n──┴──`}
        </pre>
      </div>

      {/* Wrong count */}
      <p className="text-text-muted text-xs">
        {remaining} guess{remaining !== 1 ? 'es' : ''} remaining
      </p>

      {/* Word display */}
      <div className="text-xl sm:text-2xl font-mono text-text-primary tracking-[0.2em] sm:tracking-[0.3em] select-none">
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
                  style={{
                    borderWidth: '1px',
                    borderColor: isCorrect ? 'rgba(74, 124, 89, 0.3)' : isWrong ? 'rgba(34, 34, 34, 0.5)' : '#222222'
                  }}
                  className={`w-11 h-11 sm:w-12 sm:h-12 rounded-lg text-sm sm:text-base font-medium transition-colors cursor-pointer disabled:cursor-default ${
                    isCorrect
                      ? 'bg-accent-green/20 text-accent-green'
                      : isWrong
                      ? 'bg-bg-base text-text-muted/30'
                      : 'bg-bg-elevated text-text-primary hover:bg-bg-surface'
                  }`}
                >
                  {letter}
                </button>
              );
            })}
          </div>

          {/* Word guess input */}
          <div className="flex gap-2 w-full max-w-xs px-4">
            <input
              value={wordGuess}
              onChange={(e) => setWordGuess(e.target.value.toUpperCase())}
              onKeyDown={(e) => e.key === 'Enter' && handleWordGuess()}
              placeholder="Guess the word..."
              style={{ borderWidth: '1px', borderColor: '#222222' }}
              className="flex-1 h-11 px-3 rounded-lg bg-bg-elevated text-text-primary placeholder:text-text-muted text-sm focus:border-text-primary focus:outline-none"
            />
            <button
              onClick={handleWordGuess}
              disabled={!wordGuess.trim()}
              className="h-11 px-4 rounded-lg bg-text-primary text-bg-base text-sm font-semibold hover:opacity-90 disabled:opacity-30 cursor-pointer disabled:cursor-not-allowed"
            >
              Guess
            </button>
          </div>
        </>
      )}
    </div>
  );
}

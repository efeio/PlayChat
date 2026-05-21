import { useState, useEffect } from 'react';
import { Button } from '../ui/Button';

const MAX_WRONG = 6;

interface HangmanProps {
  gameState: {
    word: string;
    players: string[];
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

const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');

export function Hangman({ gameState, onMove, currentUserId, players }: HangmanProps) {
  const [wordGuess, setWordGuess] = useState('');
  const { word, winner, draw, playerStates } = gameState;
  const isFinished = !!winner || draw;

  const myState = playerStates[currentUserId] || { guessedLetters: [], wrongCount: 0 };
  const { guessedLetters, wrongCount } = myState;
  const remaining = MAX_WRONG - wrongCount;

  const opponentId = gameState.players.find(id => id !== currentUserId) || '';
  const opponentState = playerStates[opponentId] || { guessedLetters: [], wrongCount: 0 };
  const opponentRemaining = MAX_WRONG - opponentState.wrongCount;

  const getPlayerName = (id: string) =>
    players.find((p) => p.userId === id)?.displayName || id;

  const maskedWord = word
    .split('')
    .map((c) => (guessedLetters.includes(c) || isFinished ? c : '_'))
    .join(' ');

  const handleLetterGuess = (letter: string) => {
    if (isFinished || guessedLetters.includes(letter) || wrongCount >= MAX_WRONG) return;
    onMove({ letter });
  };

  const handleWordGuess = () => {
    if (isFinished || !wordGuess.trim() || wrongCount >= MAX_WRONG) return;
    onMove({ word: wordGuess.trim() });
    setWordGuess('');
  };

  useEffect(() => {
    setWordGuess('');
  }, [gameState.word, isFinished]);

  return (
    <div className="flex flex-col items-center gap-6 w-full">
      {/* Status */}
      <div className="text-center">
        {isFinished ? (
          <p className="text-white font-bold text-lg" style={{ fontFamily: 'var(--font-family-display)' }}>
            {winner === currentUserId
              ? 'You guessed the word!'
              : winner
              ? `${getPlayerName(winner)} ilk bildi!`
              : draw
              ? 'Berabere!'
              : 'Oyun bitti'}
          </p>
        ) : (
          <p className="text-text-secondary text-sm">
            {wrongCount >= MAX_WRONG ? (
              <span className="text-status-error font-medium">Tahmin hakkın bitti! Rakip bekleniyor...</span>
            ) : (
              <span className="text-accent-secondary font-medium">Rakibinden önce kelimeyi bul!</span>
            )}
          </p>
        )}
      </div>

      {/* Opponent status */}
      <div className="flex gap-4 text-xs">
        <div className="px-3 py-1.5 rounded-xl bg-bg-card border border-border-default text-text-secondary">
          <span className="text-text-muted">{getPlayerName(opponentId)}:</span>{' '}
          <span className="font-medium">{opponentRemaining} kaldı</span>
        </div>
        <div className={`px-3 py-1.5 rounded-xl border font-medium ${
          remaining <= 2 ? 'bg-status-error/10 border-status-error/20 text-status-error' : 'bg-bg-card border-border-default text-text-secondary'
        }`}>
          Sen: {remaining} kaldı
        </div>
      </div>

      {/* Hangman figure */}
      <div className="w-36 h-44 sm:w-40 sm:h-48 game-board flex items-center justify-center">
        <pre className="text-indigo-400 drop-shadow-[0_0_8px_rgba(99,102,241,0.5)] text-center text-base sm:text-lg font-mono leading-tight select-none">
          {`  ┌───┐\n  │   ${wrongCount >= 1 ? 'O' : ' '}\n  │  ${wrongCount >= 3 ? '/' : ' '}${wrongCount >= 2 ? '|' : ' '}${wrongCount >= 4 ? '\\' : ' '}\n  │  ${wrongCount >= 5 ? '/' : ' '} ${wrongCount >= 6 ? '\\' : ' '}\n──┴──`}
        </pre>
      </div>

      {/* Word display */}
      <div className="text-xl sm:text-2xl font-mono text-white tracking-[0.2em] sm:tracking-[0.3em] select-none text-center px-4">
        {maskedWord}
      </div>

      {/* Letter keyboard */}
      {!isFinished && wrongCount < MAX_WRONG && (
        <>
          <div className="flex flex-wrap justify-center gap-1.5 sm:gap-2 max-w-md px-2">
            {ALPHABET.map((letter) => {
              const used = guessedLetters.includes(letter);
              const isWrong = used && !word.includes(letter);
              const isCorrect = used && word.includes(letter);
              return (
                <button
                  key={letter}
                  onClick={() => handleLetterGuess(letter)}
                  disabled={used}
                  className={`w-9 h-9 sm:w-10 sm:h-10 rounded-lg text-xs sm:text-sm font-medium transition-all duration-200 cursor-pointer disabled:cursor-default border ${
                    isCorrect
                      ? 'bg-accent-success/15 text-accent-success border-accent-success/30'
                      : isWrong
                      ? 'bg-bg-base/50 text-text-muted border-border-subtle opacity-40'
                      : 'bg-bg-card text-white border-border-default hover:border-accent-primary/40 hover:bg-accent-primary/5'
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
              onChange={(e) => setWordGuess(e.target.value.toUpperCase())}
              onKeyDown={(e) => e.key === 'Enter' && handleWordGuess()}
              placeholder="Kelimeyi tahmin et..."
              className="flex-1 bg-bg-base/60 border border-border-default rounded-xl px-4 py-2.5 text-sm text-white placeholder-text-muted focus:outline-none focus:border-accent-primary/40 focus:ring-2 focus:ring-accent-primary/10 transition-all duration-200"
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

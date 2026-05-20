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

  // The current player's state
  const myState = playerStates[currentUserId] || { guessedLetters: [], wrongCount: 0 };
  const { guessedLetters, wrongCount } = myState;
  const remaining = MAX_WRONG - wrongCount;

  // The opponent's state (for reference/UI)
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
          <p className="text-white font-semibold text-lg">
            {winner === currentUserId
              ? 'You guessed the word! You win!'
              : winner
              ? `${getPlayerName(winner)} guessed the word first!`
              : draw
              ? "It's a draw! Both players ran out of guesses."
              : 'Game over'}
          </p>
        ) : (
          <p className="text-text-secondary text-sm">
            {wrongCount >= MAX_WRONG ? (
              <span className="text-status-error font-medium">You are out of guesses! Waiting for opponent...</span>
            ) : (
              <span className="text-white font-medium">Guess the word before your opponent!</span>
            )}
          </p>
        )}
      </div>

      {/* Opponent Status */}
      <div className="flex flex-col sm:flex-row gap-2 sm:gap-6 text-xs w-full max-w-md justify-center">
        <div className={`px-3 py-1.5 rounded-xl border transition-all duration-200 bg-[#1B132B]/80 text-text-secondary border-white/5 backdrop-blur-md`}>
          <span className="opacity-60">{getPlayerName(opponentId)}:</span>{' '}
          <span className="font-medium">{opponentRemaining} guesses left</span>
        </div>
      </div>

      {/* Hangman figure */}
      <div className="w-32 h-40 sm:w-40 sm:h-48 bg-[#1B132B]/80 rounded-2xl flex items-center justify-center border border-white/5 backdrop-blur-xl shadow-[0_8px_32px_rgba(0,0,0,0.5)]">
        <pre className="text-cyan-400 drop-shadow-[0_0_8px_rgba(34,211,238,0.6)] text-center text-base sm:text-lg font-mono leading-tight select-none">
          {`  ┌───┐\n  │   ${wrongCount >= 1 ? 'O' : ' '}\n  │  ${wrongCount >= 3 ? '/' : ' '}${wrongCount >= 2 ? '|' : ' '}${wrongCount >= 4 ? '\\' : ' '}\n  │  ${wrongCount >= 5 ? '/' : ' '} ${wrongCount >= 6 ? '\\' : ' '}\n──┴──`}
        </pre>
      </div>

      {/* Wrong count */}
      <p className="text-text-muted text-xs">
        {remaining} guess{remaining !== 1 ? 'es' : ''} remaining
      </p>

      {/* Word display */}
      <div className="text-xl sm:text-2xl font-mono text-white tracking-[0.2em] sm:tracking-[0.3em] select-none text-center">
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
                  className={`w-11 h-11 sm:w-12 sm:h-12 rounded-xl text-sm sm:text-base font-medium transition-all duration-200 cursor-pointer disabled:cursor-default border ${
                    isCorrect
                      ? 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30 shadow-[0_0_12px_rgba(34,211,238,0.3)]'
                      : isWrong
                      ? 'bg-black/20 text-text-muted border-white/5 opacity-50'
                      : 'bg-[#1B132B]/80 text-white border-white/5 hover:border-cyan-500/30 hover:bg-[#1B132B] shadow-inner backdrop-blur-md'
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
              placeholder="Guess the word..."
              className="flex-1 bg-[#120A1F]/50 border border-white/5 rounded-xl px-4 py-3 text-sm text-white placeholder-text-muted focus:outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/50 transition-all duration-200 backdrop-blur-md shadow-inner"
            />
            <Button
              onClick={handleWordGuess}
              disabled={!wordGuess.trim()}
            >
              Guess
            </Button>
          </div>
        </>
      )}
    </div>
  );
}

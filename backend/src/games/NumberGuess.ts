import { GameEngine, type GameState, type Move } from './GameEngine.js';

const MIN_NUMBER = 1;
const MAX_NUMBER = 100;
const MAX_ROUNDS = 20;

interface GuessEntry {
  playerId: string;
  guess: number;
  hint: 'correct' | 'higher' | 'lower';
}

interface NumberGuessState extends GameState {
  players: string[];
  targetNumber: number;
  guesses: GuessEntry[];
  currentPlayerIndex: number;
  winner: string | null;
  finished: boolean;
  minRange: number;
  maxRange: number;
  roundNumber: number;
  maxRounds: number;
}

interface NumberGuessMove extends Move {
  guess: number;
}

export class NumberGuess extends GameEngine {
  initialize(players: string[]): NumberGuessState {
    const targetNumber = Math.floor(Math.random() * (MAX_NUMBER - MIN_NUMBER + 1)) + MIN_NUMBER;

    return {
      players: [...players],
      targetNumber,
      guesses: [],
      currentPlayerIndex: 0,
      winner: null,
      finished: false,
      minRange: MIN_NUMBER,
      maxRange: MAX_NUMBER,
      roundNumber: 0,
      maxRounds: MAX_ROUNDS,
    };
  }

  validateMove(state: GameState, move: Move, userId: string): boolean {
    const s = state as NumberGuessState;
    const m = move as NumberGuessMove;

    if (s.finished) return false;
    if (s.players[s.currentPlayerIndex] !== userId) return false;
    if (typeof m.guess !== 'number') return false;
    if (!Number.isInteger(m.guess)) return false;
    if (m.guess < s.minRange || m.guess > s.maxRange) return false;

    return true;
  }

  applyMove(state: GameState, move: Move, userId: string): NumberGuessState {
    const s = state as NumberGuessState;
    const m = move as NumberGuessMove;
    const guess = m.guess;

    let hint: 'correct' | 'higher' | 'lower';
    let winner: string | null = null;
    let finished = false;
    let minRange = s.minRange;
    let maxRange = s.maxRange;

    if (guess === s.targetNumber) {
      hint = 'correct';
      winner = userId;
      finished = true;
    } else if (guess < s.targetNumber) {
      hint = 'higher';
      if (guess >= minRange) {
        minRange = guess + 1;
      }
    } else {
      hint = 'lower';
      if (guess <= maxRange) {
        maxRange = guess - 1;
      }
    }

    const newGuesses: GuessEntry[] = [...s.guesses, { playerId: userId, guess, hint }];
    const newRound = s.roundNumber + 1;

    if (!finished && newRound >= s.maxRounds) {
      finished = true;
    }

    const nextPlayerIndex = finished
      ? s.currentPlayerIndex
      : (s.currentPlayerIndex + 1) % s.players.length;

    return {
      ...s,
      guesses: newGuesses,
      currentPlayerIndex: nextPlayerIndex,
      winner,
      finished,
      minRange,
      maxRange,
      roundNumber: newRound,
    };
  }

  checkResult(state: GameState): 'ongoing' | 'win' | 'draw' {
    const s = state as NumberGuessState;
    if (!s.finished) return 'ongoing';
    if (s.winner) return 'win';
    return 'draw';
  }

  getWinner(state: GameState): string | null {
    return (state as NumberGuessState).winner;
  }

  getGameLog(move: Move, _userId: string, state: GameState): string {
    const s = state as NumberGuessState;
    const m = move as NumberGuessMove;
    const lastGuess = s.guesses[s.guesses.length - 1];

    if (lastGuess.hint === 'correct') {
      return `${m.guess} tahmin etti — Doğru!`;
    }

    const direction = lastGuess.hint === 'higher' ? 'Daha yüksek' : 'Daha düşük';
    return `${m.guess} tahmin etti — ${direction} (aralık: ${s.minRange}–${s.maxRange})`;
  }
}

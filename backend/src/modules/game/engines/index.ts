import { GameEngine } from './GameEngine.js';
import { TicTacToe } from './TicTacToe.js';
import { ConnectFour } from './ConnectFour.js';
import { RockPaperScissors } from './RockPaperScissors.js';
import { Hangman } from './Hangman.js';
import { Wordle } from './Wordle.js';
import { MemoryCards } from './MemoryCards.js';
import { NumberGuess } from './NumberGuess.js';

export const GameRegistry: Record<string, GameEngine> = {
  TIC_TAC_TOE: new TicTacToe(),
  CONNECT_FOUR: new ConnectFour(),
  ROCK_PAPER_SCISSORS: new RockPaperScissors(),
  HANGMAN: new Hangman(),
  WORDLE: new Wordle(),
  MEMORY_CARDS: new MemoryCards(),
  NUMBER_GUESS: new NumberGuess(),
};

export { GameEngine } from './GameEngine.js';
export type { GameState, Move } from './GameEngine.js';
export { TicTacToe } from './TicTacToe.js';
export { ConnectFour } from './ConnectFour.js';
export { RockPaperScissors } from './RockPaperScissors.js';
export { Hangman } from './Hangman.js';
export { Wordle } from './Wordle.js';
export { MemoryCards } from './MemoryCards.js';
export { NumberGuess } from './NumberGuess.js';

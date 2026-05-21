import { GameEngine, type GameState, type Move } from './GameEngine.js';

const WORD_LENGTH = 5;
const MAX_GUESSES = 6;

const WORD_LIST: string[] = [
  'apple', 'beach', 'brain', 'brave', 'chair', 'charm', 'chess', 'climb',
  'cloud', 'crane', 'dance', 'dream', 'drive', 'earth', 'flame', 'flash',
  'float', 'ghost', 'globe', 'grace', 'grain', 'grape', 'green', 'grind',
  'guard', 'heart', 'house', 'human', 'juice', 'knock', 'laser', 'lemon',
  'light', 'lunar', 'magic', 'maple', 'marsh', 'medal', 'metal', 'model',
  'mount', 'music', 'nerve', 'noble', 'ocean', 'orbit', 'paint', 'panel',
  'pearl', 'phase', 'piano', 'pilot', 'pixel', 'plane', 'plant', 'plaza',
  'plumb', 'power', 'prime', 'prize', 'proof', 'proud', 'queen', 'quiet',
  'radar', 'raise', 'ranch', 'rapid', 'reach', 'realm', 'reign', 'river',
  'robot', 'round', 'royal', 'scale', 'scene', 'scope', 'score', 'scout',
  'shade', 'shake', 'shape', 'share', 'shark', 'sharp', 'shelf', 'shell',
  'shift', 'shine', 'sight', 'sigma', 'skill', 'slate', 'sleep', 'slice',
  'smart', 'smile', 'smoke', 'solid', 'solve', 'sound', 'space', 'spare',
  'spark', 'speak', 'speed', 'spice', 'spike', 'spine', 'squad', 'stack',
  'stage', 'stake', 'stand', 'stare', 'start', 'state', 'steal', 'steam',
  'steel', 'steep', 'stern', 'stick', 'stock', 'stone', 'store', 'storm',
  'story', 'stove', 'strap', 'straw', 'strip', 'study', 'stuff', 'style',
  'sugar', 'suite', 'surge', 'swamp', 'sweep', 'sweet', 'swing', 'sword',
  'table', 'theft', 'theme', 'thick', 'thing', 'think', 'thorn', 'those',
  'thumb', 'tiger', 'tired', 'title', 'toast', 'token', 'total', 'touch',
  'tower', 'trace', 'track', 'trade', 'trail', 'train', 'trait', 'trash',
  'treat', 'trend', 'trial', 'tribe', 'trick', 'troop', 'truck', 'truly',
  'trump', 'trunk', 'trust', 'truth', 'twist', 'ultra', 'under', 'unity',
  'upper', 'upset', 'urban', 'usage', 'valid', 'value', 'vapor', 'vault',
  'verse', 'vigor', 'vinyl', 'viral', 'virus', 'visit', 'vital', 'vivid',
  'vocal', 'voice', 'voter', 'watch', 'water', 'whale', 'wheat', 'wheel',
  'whole', 'width', 'world', 'wound', 'wrist', 'write', 'yacht', 'young',
];

type LetterResult = 'correct' | 'present' | 'absent';

interface GuessResult {
  word: string;
  results: LetterResult[];
  playerId: string;
}

interface WordleState extends GameState {
  players: string[];
  targetWord: string;
  guesses: GuessResult[];
  currentPlayerIndex: number;
  winner: string | null;
  finished: boolean;
  maxGuesses: number;
}

interface WordleMove extends Move {
  word: string;
}

export class Wordle extends GameEngine {
  initialize(players: string[]): WordleState {
    const targetWord = WORD_LIST[Math.floor(Math.random() * WORD_LIST.length)];

    return {
      players: [...players],
      targetWord,
      guesses: [],
      currentPlayerIndex: 0,
      winner: null,
      finished: false,
      maxGuesses: MAX_GUESSES,
    };
  }

  validateMove(state: GameState, move: Move, userId: string): boolean {
    const s = state as WordleState;
    const m = move as WordleMove;

    if (s.finished) return false;
    if (s.players[s.currentPlayerIndex] !== userId) return false;
    if (!m.word || typeof m.word !== 'string') return false;

    const word = m.word.toLowerCase().trim();
    if (word.length !== WORD_LENGTH) return false;
    if (!/^[a-z]+$/.test(word)) return false;

    return true;
  }

  applyMove(state: GameState, move: Move, userId: string): WordleState {
    const s = state as WordleState;
    const m = move as WordleMove;
    const word = m.word.toLowerCase().trim();

    const results = this._evaluateGuess(word, s.targetWord);

    const newGuesses: GuessResult[] = [...s.guesses, { word, results, playerId: userId }];

    const isCorrect = results.every((r) => r === 'correct');

    let winner: string | null = s.winner;
    let finished = s.finished;

    if (isCorrect) {
      winner = userId;
      finished = true;
    } else if (newGuesses.length >= s.maxGuesses) {
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
    };
  }

  checkResult(state: GameState): 'ongoing' | 'win' | 'draw' {
    const s = state as WordleState;
    if (!s.finished) return 'ongoing';
    if (s.winner) return 'win';
    return 'draw';
  }

  getWinner(state: GameState): string | null {
    return (state as WordleState).winner;
  }

  getGameLog(move: Move, _userId: string, state: GameState): string {
    const s = state as WordleState;
    const m = move as WordleMove;
    const word = m.word.toLowerCase().trim();

    if (s.winner) {
      return `guessed "${word}" correctly! 🎉`;
    }

    const lastGuess = s.guesses[s.guesses.length - 1];
    const correctCount = lastGuess.results.filter((r) => r === 'correct').length;
    const presentCount = lastGuess.results.filter((r) => r === 'present').length;

    return `guessed "${word}" — ${correctCount} correct, ${presentCount} misplaced`;
  }

  private _evaluateGuess(guess: string, target: string): LetterResult[] {
    const results: LetterResult[] = Array(WORD_LENGTH).fill('absent');
    const targetChars = target.split('');
    const guessChars = guess.split('');
    const used = Array(WORD_LENGTH).fill(false);

    // First pass: mark correct positions
    for (let i = 0; i < WORD_LENGTH; i++) {
      if (guessChars[i] === targetChars[i]) {
        results[i] = 'correct';
        used[i] = true;
      }
    }

    // Second pass: mark present (wrong position)
    for (let i = 0; i < WORD_LENGTH; i++) {
      if (results[i] === 'correct') continue;

      for (let j = 0; j < WORD_LENGTH; j++) {
        if (!used[j] && guessChars[i] === targetChars[j]) {
          results[i] = 'present';
          used[j] = true;
          break;
        }
      }
    }

    return results;
  }
}

import { describe, it, expect, beforeEach } from 'vitest';
import { Hangman } from './Hangman.js';

describe('Hangman Role Assignment and Validation', () => {
  let hangman: Hangman;

  beforeEach(() => {
    hangman = new Hangman();
  });

  describe('initialize() role assignment', () => {
    it('should assign player 0 as SETTER', () => {
      const players = ['player0', 'player1'];
      const state = hangman.initialize(players);

      expect(state.setter).toBe('player0');
      expect(state.roles['player0']).toBe('SETTER');
    });

    it('should assign player 1 as GUESSER', () => {
      const players = ['player0', 'player1'];
      const state = hangman.initialize(players);

      expect(state.guesser).toBe('player1');
      expect(state.roles['player1']).toBe('GUESSER');
    });

    it('should throw error if not exactly 2 players', () => {
      expect(() => hangman.initialize(['player0'])).toThrow('Hangman requires exactly 2 players');
      expect(() => hangman.initialize(['player0', 'player1', 'player2'])).toThrow('Hangman requires exactly 2 players');
      expect(() => hangman.initialize([])).toThrow('Hangman requires exactly 2 players');
    });

    it('should include roles map in returned state', () => {
      const players = ['alice', 'bob'];
      const state = hangman.initialize(players);

      expect(state.roles).toBeDefined();
      expect(state.roles).toEqual({
        alice: 'SETTER',
        bob: 'GUESSER',
      });
    });

    it('should initialize with guesser as current player', () => {
      const players = ['player0', 'player1'];
      const state = hangman.initialize(players);

      // currentPlayerIndex 1 means player1 (guesser) goes first
      expect(state.currentPlayerIndex).toBe(1);
    });
  });

  describe('validateMove() role enforcement', () => {
    it('should allow guesser to guess valid letters', () => {
      const state = hangman.initialize(['setter', 'guesser']);

      expect(hangman.validateMove(state, { letter: 'A' }, 'guesser')).toBe(true);
      expect(hangman.validateMove(state, { letter: 'z' }, 'guesser')).toBe(true);
      expect(hangman.validateMove(state, { letter: 'M' }, 'guesser')).toBe(true);
    });

    it('should not allow guesser to guess already-guessed letters', () => {
      const state = hangman.initialize(['setter', 'guesser']);
      state.guessedLetters = ['A', 'B', 'C'];

      expect(hangman.validateMove(state, { letter: 'A' }, 'guesser')).toBe(false);
      expect(hangman.validateMove(state, { letter: 'b' }, 'guesser')).toBe(false);
      expect(hangman.validateMove(state, { letter: 'C' }, 'guesser')).toBe(false);
    });

    it('should not allow guesser to guess invalid characters', () => {
      const state = hangman.initialize(['setter', 'guesser']);

      expect(hangman.validateMove(state, { letter: '1' }, 'guesser')).toBe(false);
      expect(hangman.validateMove(state, { letter: '@' }, 'guesser')).toBe(false);
      expect(hangman.validateMove(state, { letter: ' ' }, 'guesser')).toBe(false);
      expect(hangman.validateMove(state, { letter: '' }, 'guesser')).toBe(false);
      expect(hangman.validateMove(state, { letter: 'AB' }, 'guesser')).toBe(false);
    });

    it('should not allow setter to guess letters', () => {
      const state = hangman.initialize(['setter', 'guesser']);

      expect(hangman.validateMove(state, { letter: 'A' }, 'setter')).toBe(false);
      expect(hangman.validateMove(state, { letter: 'Z' }, 'setter')).toBe(false);
    });

    it('should not allow either player to move after game ends', () => {
      const state = hangman.initialize(['setter', 'guesser']);
      state.winner = 'guesser'; // Game has ended

      expect(hangman.validateMove(state, { letter: 'A' }, 'guesser')).toBe(false);
      expect(hangman.validateMove(state, { letter: 'B' }, 'setter')).toBe(false);
    });

    it('should validate letter format (single uppercase A-Z)', () => {
      const state = hangman.initialize(['setter', 'guesser']);

      // Valid single letters (case-insensitive input, normalized to uppercase)
      expect(hangman.validateMove(state, { letter: 'A' }, 'guesser')).toBe(true);
      expect(hangman.validateMove(state, { letter: 'z' }, 'guesser')).toBe(true);

      // Invalid: multiple characters
      expect(hangman.validateMove(state, { letter: 'AB' }, 'guesser')).toBe(false);
      expect(hangman.validateMove(state, { letter: 'ABC' }, 'guesser')).toBe(false);

      // Invalid: empty string
      expect(hangman.validateMove(state, { letter: '' }, 'guesser')).toBe(false);

      // Invalid: non-alphabetic
      expect(hangman.validateMove(state, { letter: '1' }, 'guesser')).toBe(false);
      expect(hangman.validateMove(state, { letter: '!' }, 'guesser')).toBe(false);
      expect(hangman.validateMove(state, { letter: ' ' }, 'guesser')).toBe(false);
    });

    it('should reject word submissions from any player', () => {
      const state = hangman.initialize(['setter', 'guesser']);

      // Word submissions are currently disabled (for future feature)
      expect(hangman.validateMove(state, { word: 'JAVASCRIPT' }, 'setter')).toBe(false);
      expect(hangman.validateMove(state, { word: 'JAVASCRIPT' }, 'guesser')).toBe(false);
    });

    it('should reject moves with no letter or word', () => {
      const state = hangman.initialize(['setter', 'guesser']);

      expect(hangman.validateMove(state, {}, 'guesser')).toBe(false);
      expect(hangman.validateMove(state, {}, 'setter')).toBe(false);
    });
  });

  describe('applyMove() game logic', () => {
    it('should add guessed letter to guessedLetters array', () => {
      const state = hangman.initialize(['setter', 'guesser']);
      const initialGuessed = state.guessedLetters.length;

      const newState = hangman.applyMove(state, { letter: 'A' }, 'guesser');

      expect(newState.guessedLetters).toContain('A');
      expect(newState.guessedLetters.length).toBe(initialGuessed + 1);
    });

    it('should increment wrongCount for incorrect letter', () => {
      const state = hangman.initialize(['setter', 'guesser']);
      state.word = 'JAVASCRIPT'; // Known word for testing
      const initialWrongCount = state.wrongCount;

      // Guess a letter not in the word
      const newState = hangman.applyMove(state, { letter: 'Q' }, 'guesser');

      expect(newState.wrongCount).toBe(initialWrongCount + 1);
    });

    it('should not increment wrongCount for correct letter', () => {
      const state = hangman.initialize(['setter', 'guesser']);
      state.word = 'JAVASCRIPT'; // Known word for testing
      const initialWrongCount = state.wrongCount;

      // Guess a letter in the word
      const newState = hangman.applyMove(state, { letter: 'J' }, 'guesser');

      expect(newState.wrongCount).toBe(initialWrongCount);
    });

    it('should set setter as winner when wrongCount reaches MAX_WRONG', () => {
      const state = hangman.initialize(['setter', 'guesser']);
      state.word = 'JAVASCRIPT';
      state.wrongCount = 5; // One away from MAX_WRONG (6)

      // Make one more wrong guess
      const newState = hangman.applyMove(state, { letter: 'Q' }, 'guesser');

      expect(newState.wrongCount).toBe(6);
      expect(newState.winner).toBe('setter');
    });

    it('should set guesser as winner when all letters are guessed', () => {
      const state = hangman.initialize(['setter', 'guesser']);
      state.word = 'CAT';
      state.guessedLetters = ['C', 'A']; // Only 'T' remaining

      // Guess the last letter
      const newState = hangman.applyMove(state, { letter: 'T' }, 'guesser');

      expect(newState.winner).toBe('guesser');
    });
  });

  describe('checkResult() and getWinner()', () => {
    it('should return "ongoing" when game is not finished', () => {
      const state = hangman.initialize(['setter', 'guesser']);

      expect(hangman.checkResult(state)).toBe('ongoing');
    });

    it('should return "win" when there is a winner', () => {
      const state = hangman.initialize(['setter', 'guesser']);
      state.winner = 'guesser';

      expect(hangman.checkResult(state)).toBe('win');
    });

    it('should return correct winner from getWinner()', () => {
      const state = hangman.initialize(['setter', 'guesser']);
      state.winner = 'setter';

      expect(hangman.getWinner(state)).toBe('setter');
    });

    it('should return null from getWinner() when no winner', () => {
      const state = hangman.initialize(['setter', 'guesser']);

      expect(hangman.getWinner(state)).toBeNull();
    });
  });

  describe('getGameLog()', () => {
    it('should generate log for correct letter guess', () => {
      const state = hangman.initialize(['setter', 'guesser']);
      state.word = 'JAVASCRIPT';

      const log = hangman.getGameLog({ letter: 'J' }, 'guesser', state);

      expect(log).toContain('guessed letter "J"');
      expect(log).toContain('correct');
    });

    it('should generate log for incorrect letter guess', () => {
      const state = hangman.initialize(['setter', 'guesser']);
      state.word = 'JAVASCRIPT';
      state.wrongCount = 2;

      const log = hangman.getGameLog({ letter: 'Q' }, 'guesser', state);

      expect(log).toContain('guessed letter "Q"');
      expect(log).toContain('wrong');
      expect(log).toContain('2/6');
    });
  });

  describe('edge cases', () => {
    it('should handle case-insensitive letter input', () => {
      const state = hangman.initialize(['setter', 'guesser']);

      // Both lowercase and uppercase should be valid
      expect(hangman.validateMove(state, { letter: 'a' }, 'guesser')).toBe(true);
      expect(hangman.validateMove(state, { letter: 'A' }, 'guesser')).toBe(true);
    });

    it('should normalize lowercase letters to uppercase in guessedLetters', () => {
      const state = hangman.initialize(['setter', 'guesser']);

      const newState = hangman.applyMove(state, { letter: 'a' }, 'guesser');

      expect(newState.guessedLetters).toContain('A');
      expect(newState.guessedLetters).not.toContain('a');
    });

    it('should prevent duplicate guesses regardless of case', () => {
      const state = hangman.initialize(['setter', 'guesser']);
      state.guessedLetters = ['A'];

      // Both 'a' and 'A' should be rejected
      expect(hangman.validateMove(state, { letter: 'A' }, 'guesser')).toBe(false);
      expect(hangman.validateMove(state, { letter: 'a' }, 'guesser')).toBe(false);
    });

    it('should maintain immutability of original state', () => {
      const state = hangman.initialize(['setter', 'guesser']);
      const originalGuessedLength = state.guessedLetters.length;
      const originalWrongCount = state.wrongCount;

      hangman.applyMove(state, { letter: 'A' }, 'guesser');

      // Original state should not be modified
      expect(state.guessedLetters.length).toBe(originalGuessedLength);
      expect(state.wrongCount).toBe(originalWrongCount);
    });
  });
});

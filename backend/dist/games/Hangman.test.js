import { describe, it, expect, beforeEach } from 'vitest';
import { Hangman } from './Hangman.js';
describe('Hangman Simultaneous Logic', () => {
    let hangman;
    beforeEach(() => {
        hangman = new Hangman();
    });
    describe('initialize()', () => {
        it('should initialize player states', () => {
            const players = ['player0', 'player1'];
            const state = hangman.initialize(players);
            expect(state.playerStates['player0']).toBeDefined();
            expect(state.playerStates['player1']).toBeDefined();
            expect(state.playerStates['player0'].wrongCount).toBe(0);
            expect(state.playerStates['player0'].guessedLetters).toEqual([]);
        });
        it('should throw error if not exactly 2 players', () => {
            expect(() => hangman.initialize(['player0'])).toThrow('Hangman requires exactly 2 players');
            expect(() => hangman.initialize(['player0', 'player1', 'player2'])).toThrow('Hangman requires exactly 2 players');
        });
    });
    describe('validateMove()', () => {
        it('should allow valid letters', () => {
            const state = hangman.initialize(['p1', 'p2']);
            expect(hangman.validateMove(state, { letter: 'A' }, 'p1')).toBe(true);
            expect(hangman.validateMove(state, { letter: 'z' }, 'p2')).toBe(true);
        });
        it('should not allow already-guessed letters', () => {
            const state = hangman.initialize(['p1', 'p2']);
            state.playerStates['p1'].guessedLetters = ['A', 'B'];
            expect(hangman.validateMove(state, { letter: 'A' }, 'p1')).toBe(false);
            expect(hangman.validateMove(state, { letter: 'A' }, 'p2')).toBe(true); // p2 hasn't guessed it yet
        });
    });
    describe('applyMove()', () => {
        it('should add guessed letter to guessedLetters array', () => {
            const state = hangman.initialize(['p1', 'p2']);
            const newState = hangman.applyMove(state, { letter: 'A' }, 'p1');
            expect(newState.playerStates['p1'].guessedLetters).toContain('A');
        });
        it('should increment wrongCount for incorrect letter', () => {
            const state = hangman.initialize(['p1', 'p2']);
            state.word = 'JAVASCRIPT';
            const newState = hangman.applyMove(state, { letter: 'Q' }, 'p1');
            expect(newState.playerStates['p1'].wrongCount).toBe(1);
            expect(newState.playerStates['p2'].wrongCount).toBe(0); // unaffected
        });
    });
    describe('checkResult() and getWinner()', () => {
        it('should return "ongoing" when game is not finished', () => {
            const state = hangman.initialize(['p1', 'p2']);
            expect(hangman.checkResult(state)).toBe('ongoing');
        });
        it('should return "win" when there is a winner', () => {
            const state = hangman.initialize(['p1', 'p2']);
            state.winner = 'p1';
            expect(hangman.checkResult(state)).toBe('win');
            expect(hangman.getWinner(state)).toBe('p1');
        });
        it('should return "draw" when draw flag is set', () => {
            const state = hangman.initialize(['p1', 'p2']);
            state.draw = true;
            expect(hangman.checkResult(state)).toBe('draw');
        });
    });
});
//# sourceMappingURL=Hangman.test.js.map
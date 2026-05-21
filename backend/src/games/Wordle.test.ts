import { describe, it, expect } from 'vitest';
import { Wordle } from './Wordle.js';

describe('Wordle GameEngine', () => {
  const engine = new Wordle();
  const players = ['player1', 'player2'];

  it('should initialize with correct state', () => {
    const state = engine.initialize(players);

    expect(state.players).toEqual(players);
    expect(state.targetWord).toHaveLength(5);
    expect(state.guesses).toEqual([]);
    expect(state.currentPlayerIndex).toBe(0);
    expect(state.winner).toBeNull();
    expect(state.finished).toBe(false);
    expect(state.maxGuesses).toBe(6);
  });

  it('should validate moves correctly', () => {
    const state = engine.initialize(players);

    // Correct player, valid word
    expect(engine.validateMove(state, { word: 'hello' }, 'player1')).toBe(true);

    // Wrong player
    expect(engine.validateMove(state, { word: 'hello' }, 'player2')).toBe(false);

    // Invalid word length
    expect(engine.validateMove(state, { word: 'hi' }, 'player1')).toBe(false);
    expect(engine.validateMove(state, { word: 'toolong' }, 'player1')).toBe(false);

    // Invalid characters
    expect(engine.validateMove(state, { word: 'he11o' }, 'player1')).toBe(false);

    // Empty
    expect(engine.validateMove(state, { word: '' }, 'player1')).toBe(false);
  });

  it('should apply moves and rotate players', () => {
    const state = engine.initialize(players);
    // Override target for predictable test
    (state as any).targetWord = 'apple';

    const newState = engine.applyMove(state, { word: 'grape' }, 'player1');

    expect(newState.guesses).toHaveLength(1);
    expect(newState.guesses[0].word).toBe('grape');
    expect(newState.guesses[0].playerId).toBe('player1');
    expect(newState.guesses[0].results).toHaveLength(5);
    expect(newState.currentPlayerIndex).toBe(1);
    expect(newState.finished).toBe(false);
  });

  it('should detect correct guess as win', () => {
    const state = engine.initialize(players);
    (state as any).targetWord = 'brain';

    const newState = engine.applyMove(state, { word: 'brain' }, 'player1');

    expect(newState.winner).toBe('player1');
    expect(newState.finished).toBe(true);
    expect(newState.guesses[0].results).toEqual([
      'correct', 'correct', 'correct', 'correct', 'correct',
    ]);
    expect(engine.checkResult(newState)).toBe('win');
    expect(engine.getWinner(newState)).toBe('player1');
  });

  it('should detect draw when max guesses exhausted', () => {
    const state = engine.initialize(players);
    (state as any).targetWord = 'brain';
    (state as any).maxGuesses = 2;

    let current = state;
    current = engine.applyMove(current, { word: 'hello' }, 'player1');
    current = engine.applyMove(current, { word: 'world' }, 'player2');

    expect(current.finished).toBe(true);
    expect(current.winner).toBeNull();
    expect(engine.checkResult(current)).toBe('draw');
  });

  it('should evaluate letter positions correctly', () => {
    const state = engine.initialize(players);
    (state as any).targetWord = 'apple';

    const newState = engine.applyMove(state, { word: 'alpha' }, 'player1');
    const results = newState.guesses[0].results;

    // a: correct (index 0 -> a in apple)
    expect(results[0]).toBe('correct');
    // l: present (l is in apple but not at index 1)
    expect(results[1]).toBe('present');
    // p: correct (p at index 2 in apple = p at index 2)
    expect(results[2]).toBe('correct');
    // h: absent
    expect(results[3]).toBe('absent');
    // a: absent (a already used at index 0)
    expect(results[4]).toBe('absent');
  });

  it('should not allow moves after game is finished', () => {
    const state = engine.initialize(players);
    (state as any).targetWord = 'brain';

    const winState = engine.applyMove(state, { word: 'brain' }, 'player1');
    expect(engine.validateMove(winState, { word: 'other' }, 'player2')).toBe(false);
  });

  it('should produce correct game log', () => {
    const state = engine.initialize(players);
    (state as any).targetWord = 'brain';

    const newState = engine.applyMove(state, { word: 'brain' }, 'player1');
    const log = engine.getGameLog({ word: 'brain' }, 'player1', newState);
    expect(log).toContain('correctly');

    const state2 = engine.initialize(players);
    (state2 as any).targetWord = 'brain';
    const newState2 = engine.applyMove(state2, { word: 'grape' }, 'player1');
    const log2 = engine.getGameLog({ word: 'grape' }, 'player1', newState2);
    expect(log2).toContain('guessed');
    expect(log2).toContain('grape');
  });
});

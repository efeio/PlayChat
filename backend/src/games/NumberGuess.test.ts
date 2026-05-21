import { describe, it, expect } from 'vitest';
import { NumberGuess } from './NumberGuess.js';

describe('NumberGuess GameEngine', () => {
  const engine = new NumberGuess();
  const players = ['player1', 'player2'];

  it('should initialize with correct state', () => {
    const state = engine.initialize(players);

    expect(state.players).toEqual(players);
    expect(state.targetNumber).toBeGreaterThanOrEqual(1);
    expect(state.targetNumber).toBeLessThanOrEqual(100);
    expect(state.guesses).toEqual([]);
    expect(state.currentPlayerIndex).toBe(0);
    expect(state.winner).toBeNull();
    expect(state.finished).toBe(false);
    expect(state.minRange).toBe(1);
    expect(state.maxRange).toBe(100);
    expect(state.roundNumber).toBe(0);
    expect(state.maxRounds).toBe(20);
  });

  it('should validate moves correctly', () => {
    const state = engine.initialize(players);

    expect(engine.validateMove(state, { guess: 50 }, 'player1')).toBe(true);

    // Wrong player
    expect(engine.validateMove(state, { guess: 50 }, 'player2')).toBe(false);

    // Out of range
    expect(engine.validateMove(state, { guess: 0 }, 'player1')).toBe(false);
    expect(engine.validateMove(state, { guess: 101 }, 'player1')).toBe(false);

    // Non-integer
    expect(engine.validateMove(state, { guess: 5.5 }, 'player1')).toBe(false);

    // Non-number
    expect(engine.validateMove(state, { guess: 'ten' }, 'player1')).toBe(false);
  });

  it('should give "higher" hint when guess is too low', () => {
    const state = engine.initialize(players);
    (state as any).targetNumber = 75;

    const newState = engine.applyMove(state, { guess: 30 }, 'player1');

    expect(newState.guesses).toHaveLength(1);
    expect(newState.guesses[0].hint).toBe('higher');
    expect(newState.minRange).toBe(31);
    expect(newState.maxRange).toBe(100);
    expect(newState.currentPlayerIndex).toBe(1);
    expect(newState.finished).toBe(false);
  });

  it('should give "lower" hint when guess is too high', () => {
    const state = engine.initialize(players);
    (state as any).targetNumber = 25;

    const newState = engine.applyMove(state, { guess: 60 }, 'player1');

    expect(newState.guesses[0].hint).toBe('lower');
    expect(newState.minRange).toBe(1);
    expect(newState.maxRange).toBe(59);
  });

  it('should detect correct guess as win', () => {
    const state = engine.initialize(players);
    (state as any).targetNumber = 42;

    const newState = engine.applyMove(state, { guess: 42 }, 'player1');

    expect(newState.guesses[0].hint).toBe('correct');
    expect(newState.winner).toBe('player1');
    expect(newState.finished).toBe(true);
    expect(engine.checkResult(newState)).toBe('win');
    expect(engine.getWinner(newState)).toBe('player1');
  });

  it('should rotate players', () => {
    const state = engine.initialize(players);
    (state as any).targetNumber = 50;

    const s1 = engine.applyMove(state, { guess: 30 }, 'player1');
    expect(s1.currentPlayerIndex).toBe(1);

    const s2 = engine.applyMove(s1, { guess: 70 }, 'player2');
    expect(s2.currentPlayerIndex).toBe(0);
  });

  it('should detect draw when max rounds exhausted', () => {
    const state = engine.initialize(players);
    (state as any).targetNumber = 99;
    (state as any).maxRounds = 2;

    let current = state;
    current = engine.applyMove(current, { guess: 10 }, 'player1');
    current = engine.applyMove(current, { guess: 20 }, 'player2');

    expect(current.finished).toBe(true);
    expect(current.winner).toBeNull();
    expect(engine.checkResult(current)).toBe('draw');
  });

  it('should narrow range progressively', () => {
    const state = engine.initialize(players);
    (state as any).targetNumber = 50;

    let current = engine.applyMove(state, { guess: 30 }, 'player1');
    expect(current.minRange).toBe(31);

    current = engine.applyMove(current, { guess: 80 }, 'player2');
    expect(current.maxRange).toBe(79);

    current = engine.applyMove(current, { guess: 40 }, 'player1');
    expect(current.minRange).toBe(41);
    expect(current.maxRange).toBe(79);
  });

  it('should not allow moves after game finished', () => {
    const state = engine.initialize(players);
    (state as any).targetNumber = 42;

    const winState = engine.applyMove(state, { guess: 42 }, 'player1');
    expect(engine.validateMove(winState, { guess: 50 }, 'player2')).toBe(false);
  });

  it('should not allow guess outside narrowed range', () => {
    const state = engine.initialize(players);
    (state as any).targetNumber = 50;

    const s1 = engine.applyMove(state, { guess: 30 }, 'player1');
    // minRange is now 31
    expect(engine.validateMove(s1, { guess: 25 }, 'player2')).toBe(false);
    expect(engine.validateMove(s1, { guess: 31 }, 'player2')).toBe(true);
  });

  it('should produce correct game logs', () => {
    const state = engine.initialize(players);
    (state as any).targetNumber = 50;

    const s1 = engine.applyMove(state, { guess: 30 }, 'player1');
    const log1 = engine.getGameLog({ guess: 30 }, 'player1', s1);
    expect(log1).toContain('30');
    expect(log1).toContain('Higher');

    const s2 = engine.applyMove(s1, { guess: 70 }, 'player2');
    const log2 = engine.getGameLog({ guess: 70 }, 'player2', s2);
    expect(log2).toContain('70');
    expect(log2).toContain('Lower');

    (state as any).targetNumber = 42;
    const winState = engine.applyMove(state, { guess: 42 }, 'player1');
    const logWin = engine.getGameLog({ guess: 42 }, 'player1', winState);
    expect(logWin).toContain('Correct');
  });
});

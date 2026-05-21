import { describe, it, expect } from 'vitest';
import { MemoryCards } from './MemoryCards.js';

describe('MemoryCards GameEngine', () => {
  const engine = new MemoryCards();
  const players = ['player1', 'player2'];

  it('should initialize with correct state for 2 players', () => {
    const state = engine.initialize(players);

    expect(state.players).toEqual(players);
    expect(state.cards).toHaveLength(16); // 8 pairs
    expect(state.currentPlayerIndex).toBe(0);
    expect(state.flippedCards).toEqual([]);
    expect(state.scores).toEqual({ player1: 0, player2: 0 });
    expect(state.winner).toBeNull();
    expect(state.finished).toBe(false);
    expect(state.pairCount).toBe(8);
    expect(state.matchedPairs).toBe(0);

    // All cards should start face-down
    expect(state.cards.every((c) => !c.isFlipped && !c.isMatched)).toBe(true);

    // Each symbol should appear exactly twice
    const symbolCounts: Record<string, number> = {};
    for (const card of state.cards) {
      symbolCounts[card.symbol] = (symbolCounts[card.symbol] || 0) + 1;
    }
    expect(Object.values(symbolCounts).every((c) => c === 2)).toBe(true);
  });

  it('should initialize with 12 pairs for 3+ players', () => {
    const state = engine.initialize(['p1', 'p2', 'p3']);
    expect(state.cards).toHaveLength(24); // 12 pairs
    expect(state.pairCount).toBe(12);
  });

  it('should validate moves correctly', () => {
    const state = engine.initialize(players);

    // Correct player, valid card
    expect(engine.validateMove(state, { cardId: 0 }, 'player1')).toBe(true);

    // Wrong player
    expect(engine.validateMove(state, { cardId: 0 }, 'player2')).toBe(false);

    // Invalid card index
    expect(engine.validateMove(state, { cardId: -1 }, 'player1')).toBe(false);
    expect(engine.validateMove(state, { cardId: 99 }, 'player1')).toBe(false);

    // Non-number
    expect(engine.validateMove(state, { cardId: 'a' }, 'player1')).toBe(false);
  });

  it('should flip first card without changing turn', () => {
    const state = engine.initialize(players);

    const newState = engine.applyMove(state, { cardId: 0 }, 'player1');

    expect(newState.cards[0].isFlipped).toBe(true);
    expect(newState.flippedCards).toEqual([0]);
    expect(newState.currentPlayerIndex).toBe(0); // same player
    expect(newState.lastAction).toBe('flip');
    expect(engine.checkResult(newState)).toBe('ongoing');
  });

  it('should not allow flipping already flipped card', () => {
    const state = engine.initialize(players);
    const afterFlip = engine.applyMove(state, { cardId: 0 }, 'player1');

    expect(engine.validateMove(afterFlip, { cardId: 0 }, 'player1')).toBe(false);
  });

  it('should handle matching pair', () => {
    const state = engine.initialize(players);

    // Find a matching pair
    const symbol = state.cards[0].symbol;
    const matchIndex = state.cards.findIndex((c, i) => i !== 0 && c.symbol === symbol);

    let current = engine.applyMove(state, { cardId: 0 }, 'player1');
    current = engine.applyMove(current, { cardId: matchIndex }, 'player1');

    expect(current.cards[0].isMatched).toBe(true);
    expect(current.cards[matchIndex].isMatched).toBe(true);
    expect(current.scores['player1']).toBe(1);
    expect(current.matchedPairs).toBe(1);
    expect(current.flippedCards).toEqual([]);
    expect(current.currentPlayerIndex).toBe(0); // same player goes again
    expect(current.lastAction).toBe('match');
  });

  it('should handle mismatched pair and rotate turn', () => {
    const state = engine.initialize(players);

    // Find two cards with different symbols
    let secondIndex = 1;
    while (state.cards[secondIndex].symbol === state.cards[0].symbol) {
      secondIndex++;
    }

    let current = engine.applyMove(state, { cardId: 0 }, 'player1');
    current = engine.applyMove(current, { cardId: secondIndex }, 'player1');

    expect(current.cards[0].isFlipped).toBe(false);
    expect(current.cards[secondIndex].isFlipped).toBe(false);
    expect(current.flippedCards).toEqual([]);
    expect(current.currentPlayerIndex).toBe(1); // turn passes
    expect(current.lastAction).toBe('mismatch');
  });

  it('should detect game end and winner', () => {
    const state = engine.initialize(players);
    // Manually set up near-end state
    const modifiedState = { ...state, pairCount: 1, matchedPairs: 0 };
    modifiedState.cards = [
      { id: 0, symbol: '🍎', isFlipped: false, isMatched: false },
      { id: 1, symbol: '🍎', isFlipped: false, isMatched: false },
    ];

    let current = engine.applyMove(modifiedState, { cardId: 0 }, 'player1');
    current = engine.applyMove(current, { cardId: 1 }, 'player1');

    expect(current.finished).toBe(true);
    expect(current.winner).toBe('player1');
    expect(engine.checkResult(current)).toBe('win');
    expect(engine.getWinner(current)).toBe('player1');
  });

  it('should detect draw when scores are equal', () => {
    const state = engine.initialize(players);
    // Set up a finished state with equal scores
    const finishedState = {
      ...state,
      finished: true,
      matchedPairs: state.pairCount,
      scores: { player1: 4, player2: 4 },
      winner: null,
    };

    expect(engine.checkResult(finishedState)).toBe('draw');
    expect(engine.getWinner(finishedState)).toBeNull();
  });

  it('should not allow moves on matched cards', () => {
    const state = engine.initialize(players);
    const modifiedState = { ...state };
    modifiedState.cards = state.cards.map((c) => ({ ...c }));
    modifiedState.cards[0].isMatched = true;

    expect(engine.validateMove(modifiedState, { cardId: 0 }, 'player1')).toBe(false);
  });

  it('should produce correct game logs', () => {
    const state = engine.initialize(players);

    const flipState = engine.applyMove(state, { cardId: 0 }, 'player1');
    expect(engine.getGameLog({ cardId: 0 }, 'player1', flipState)).toContain('flipped');

    const matchState = { ...flipState, lastAction: 'match' as const, finished: false };
    expect(engine.getGameLog({ cardId: 1 }, 'player1', matchState)).toContain('matching pair');

    const mismatchState = { ...flipState, lastAction: 'mismatch' as const };
    expect(engine.getGameLog({ cardId: 1 }, 'player1', mismatchState)).toContain('no match');
  });
});

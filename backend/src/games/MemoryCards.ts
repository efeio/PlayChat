import { GameEngine, type GameState, type Move } from './GameEngine.js';

const SYMBOLS = [
  '🍎', '🍊', '🍋', '🍇', '🍓', '🍒', '🥝', '🍑',
  '🌟', '🌙', '⚡', '🔥', '💎', '🎯', '🎵', '🎲',
  '🦊', '🐼', '🦁', '🐬', '🦋', '🌺', '🍀', '🌈',
];

interface CardState {
  id: number;
  symbol: string;
  isFlipped: boolean;
  isMatched: boolean;
}

interface MemoryCardsState extends GameState {
  players: string[];
  cards: CardState[];
  currentPlayerIndex: number;
  flippedCards: number[];
  scores: Record<string, number>;
  winner: string | null;
  finished: boolean;
  pairCount: number;
  matchedPairs: number;
  lastAction: 'flip' | 'match' | 'mismatch' | null;
  turnLocked: boolean;
  turnLockExpiry: number;
}

interface MemoryCardsMove extends Move {
  cardId: number;
}

const MISMATCH_LOCK_MS = 1200;

export class MemoryCards extends GameEngine {
  initialize(players: string[]): MemoryCardsState {
    const pairCount = players.length <= 2 ? 8 : 12;
    const selectedSymbols = SYMBOLS.slice(0, pairCount);

    const cardSymbols = [...selectedSymbols, ...selectedSymbols];
    const shuffled = this._shuffle(cardSymbols);

    const cards: CardState[] = shuffled.map((symbol, index) => ({
      id: index,
      symbol,
      isFlipped: false,
      isMatched: false,
    }));

    const scores: Record<string, number> = {};
    for (const player of players) {
      scores[player] = 0;
    }

    return {
      players: [...players],
      cards,
      currentPlayerIndex: 0,
      flippedCards: [],
      scores,
      winner: null,
      finished: false,
      pairCount,
      matchedPairs: 0,
      lastAction: null,
      turnLocked: false,
      turnLockExpiry: 0,
    };
  }

  validateMove(state: GameState, move: Move, userId: string): boolean {
    const s = state as MemoryCardsState;
    const m = move as MemoryCardsMove;

    if (s.finished) return false;

    if (s.players[s.currentPlayerIndex] !== userId) return false;

    if (s.turnLocked) {
      const now = Date.now();
      if (now < s.turnLockExpiry) return false;
    }

    if (typeof m.cardId !== 'number') return false;
    if (m.cardId < 0 || m.cardId >= s.cards.length) return false;

    const card = s.cards[m.cardId];
    if (card.isMatched) return false;
    if (card.isFlipped) return false;

    const effectiveFlipped = s.lastAction === 'mismatch' ? 0 : s.flippedCards.length;
    if (effectiveFlipped >= 2) return false;

    return true;
  }

  applyMove(state: GameState, move: Move, userId: string): MemoryCardsState {
    const s = state as MemoryCardsState;
    const m = move as MemoryCardsMove;

    const newCards = s.cards.map((c) => ({ ...c }));

    if (s.lastAction === 'mismatch' && s.flippedCards.length === 2) {
      newCards[s.flippedCards[0]].isFlipped = false;
      newCards[s.flippedCards[1]].isFlipped = false;
    }

    newCards[m.cardId].isFlipped = true;

    const currentFlipped =
      s.lastAction === 'mismatch' ? [] : [...s.flippedCards];
    const newFlipped = [...currentFlipped, m.cardId];

    if (newFlipped.length < 2) {
      return {
        ...s,
        cards: newCards,
        flippedCards: newFlipped,
        lastAction: 'flip',
        turnLocked: false,
        turnLockExpiry: 0,
      };
    }

    const [first, second] = newFlipped;
    const card1 = newCards[first];
    const card2 = newCards[second];

    if (card1.symbol === card2.symbol) {
      card1.isMatched = true;
      card2.isMatched = true;

      const newScores = { ...s.scores };
      newScores[userId] = (newScores[userId] || 0) + 1;
      const newMatchedPairs = s.matchedPairs + 1;

      const finished = newMatchedPairs >= s.pairCount;
      let winner: string | null = null;

      if (finished) {
        winner = this._determineWinner(newScores, s.players);
      }

      return {
        ...s,
        cards: newCards,
        flippedCards: [],
        scores: newScores,
        matchedPairs: newMatchedPairs,
        winner,
        finished,
        lastAction: 'match',
        turnLocked: false,
        turnLockExpiry: 0,
      };
    }

    const nextPlayerIndex = (s.currentPlayerIndex + 1) % s.players.length;

    return {
      ...s,
      cards: newCards,
      flippedCards: newFlipped,
      currentPlayerIndex: nextPlayerIndex,
      lastAction: 'mismatch',
      turnLocked: true,
      turnLockExpiry: Date.now() + MISMATCH_LOCK_MS,
    };
  }

  checkResult(state: GameState): 'ongoing' | 'win' | 'draw' {
    const s = state as MemoryCardsState;
    if (!s.finished) return 'ongoing';
    if (s.winner) return 'win';
    return 'draw';
  }

  getWinner(state: GameState): string | null {
    return (state as MemoryCardsState).winner;
  }

  getGameLog(move: Move, _userId: string, state: GameState): string {
    const s = state as MemoryCardsState;

    if (s.lastAction === 'flip') {
      return 'bir kart açtı';
    }

    if (s.lastAction === 'match') {
      if (s.finished) {
        return 'son eşi buldu! Oyun bitti!';
      }
      return 'eşleşen bir çift buldu! Tekrar oynuyor.';
    }

    return 'eşleşme yok. Sıra geçti.';
  }

  private _shuffle<T>(array: T[]): T[] {
    const arr = [...array];
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }

  private _determineWinner(
    scores: Record<string, number>,
    players: string[]
  ): string | null {
    let maxScore = -1;
    let winners: string[] = [];

    for (const player of players) {
      const score = scores[player] || 0;
      if (score > maxScore) {
        maxScore = score;
        winners = [player];
      } else if (score === maxScore) {
        winners.push(player);
      }
    }

    if (winners.length === 1) return winners[0];
    return null;
  }
}

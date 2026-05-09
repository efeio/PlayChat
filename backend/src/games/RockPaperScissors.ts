import { GameEngine, type GameState, type Move } from './GameEngine.js';

type RPSChoice = 'rock' | 'paper' | 'scissors';

interface RPSState extends GameState {
  players: string[];
  choices: Record<string, RPSChoice | null>;
  round: number;
  scores: Record<string, number>;
  lastRoundResult: string | null;
  winner: string | null;
  maxRounds: number;
}

interface RPSMove extends Move {
  choice: RPSChoice;
}

const VALID_CHOICES: RPSChoice[] = ['rock', 'paper', 'scissors'];

export class RockPaperScissors extends GameEngine {
  initialize(players: string[]): RPSState {
    const scores: Record<string, number> = {};
    const choices: Record<string, RPSChoice | null> = {};
    for (const p of players) {
      scores[p] = 0;
      choices[p] = null;
    }
    return {
      players: [...players],
      choices,
      round: 1,
      scores,
      lastRoundResult: null,
      winner: null,
      maxRounds: 3,
    };
  }

  validateMove(state: GameState, move: Move, userId: string): boolean {
    const s = state as RPSState;
    const m = move as RPSMove;

    if (s.winner) return false;
    if (!s.players.includes(userId)) return false;
    if (!VALID_CHOICES.includes(m.choice)) return false;
    if (s.choices[userId] !== null) return false;

    return true;
  }

  applyMove(state: GameState, move: Move, userId: string): RPSState {
    const s = state as RPSState;
    const m = move as RPSMove;
    const newChoices = { ...s.choices, [userId]: m.choice };

    const allChosen = s.players.every((p) => newChoices[p] !== null);

    if (!allChosen) {
      return { ...s, choices: newChoices };
    }

    const p1 = s.players[0];
    const p2 = s.players[1];
    const c1 = newChoices[p1] as RPSChoice;
    const c2 = newChoices[p2] as RPSChoice;
    const newScores = { ...s.scores };
    let result: string;

    if (c1 === c2) {
      result = 'Draw!';
    } else if (
      (c1 === 'rock' && c2 === 'scissors') ||
      (c1 === 'paper' && c2 === 'rock') ||
      (c1 === 'scissors' && c2 === 'paper')
    ) {
      newScores[p1] = (newScores[p1] || 0) + 1;
      result = `${p1} wins the round!`;
    } else {
      newScores[p2] = (newScores[p2] || 0) + 1;
      result = `${p2} wins the round!`;
    }

    const resetChoices: Record<string, RPSChoice | null> = {};
    for (const p of s.players) {
      resetChoices[p] = null;
    }

    const newRound = s.round + 1;
    let winner: string | null = null;

    if (newRound > s.maxRounds) {
      const s1 = newScores[p1] || 0;
      const s2 = newScores[p2] || 0;
      if (s1 > s2) winner = p1;
      else if (s2 > s1) winner = p2;
      else winner = null;
    }

    return {
      ...s,
      choices: winner ? newChoices : resetChoices,
      round: newRound,
      scores: newScores,
      lastRoundResult: result,
      winner,
    };
  }

  checkResult(state: GameState): 'ongoing' | 'win' | 'draw' {
    const s = state as RPSState;
    if (s.round > s.maxRounds) {
      return s.winner ? 'win' : 'draw';
    }
    return 'ongoing';
  }

  getWinner(state: GameState): string | null {
    return (state as RPSState).winner;
  }

  getGameLog(move: Move, _userId: string, state: GameState): string {
    const s = state as RPSState;
    if (s.lastRoundResult) {
      return `Round ${s.round - 1}: ${s.lastRoundResult}`;
    }
    return 'made their choice';
  }
}

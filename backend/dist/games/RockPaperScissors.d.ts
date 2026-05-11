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
export declare class RockPaperScissors extends GameEngine {
    initialize(players: string[]): RPSState;
    validateMove(state: GameState, move: Move, userId: string): boolean;
    applyMove(state: GameState, move: Move, userId: string): RPSState;
    checkResult(state: GameState): 'ongoing' | 'win' | 'draw';
    getWinner(state: GameState): string | null;
    getGameLog(_move: Move, _userId: string, state: GameState): string;
}
export {};
//# sourceMappingURL=RockPaperScissors.d.ts.map
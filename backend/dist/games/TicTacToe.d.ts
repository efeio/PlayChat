import { GameEngine, type GameState, type Move } from './GameEngine.js';
interface TicTacToeState extends GameState {
    board: (string | null)[];
    currentPlayerIndex: number;
    players: string[];
    winner: string | null;
}
export declare class TicTacToe extends GameEngine {
    initialize(players: string[]): TicTacToeState;
    validateMove(state: GameState, move: Move, userId: string): boolean;
    applyMove(state: GameState, move: Move, _userId: string): TicTacToeState;
    checkResult(state: GameState): 'ongoing' | 'win' | 'draw';
    getWinner(state: GameState): string | null;
    getGameLog(move: Move, _userId: string, state: GameState): string;
    private _checkWinner;
}
export {};
//# sourceMappingURL=TicTacToe.d.ts.map
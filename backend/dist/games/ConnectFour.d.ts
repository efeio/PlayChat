import { GameEngine, type GameState, type Move } from './GameEngine.js';
interface ConnectFourState extends GameState {
    board: number[][];
    currentPlayerIndex: number;
    players: string[];
    winner: string | null;
}
export declare class ConnectFour extends GameEngine {
    initialize(players: string[]): ConnectFourState;
    validateMove(state: GameState, move: Move, userId: string): boolean;
    applyMove(state: GameState, move: Move, _userId: string): ConnectFourState;
    checkResult(state: GameState): 'ongoing' | 'win' | 'draw';
    getWinner(state: GameState): string | null;
    getGameLog(move: Move, _userId: string, _state: GameState): string;
    private _hasConnect;
    private _countRun;
}
export {};
//# sourceMappingURL=ConnectFour.d.ts.map
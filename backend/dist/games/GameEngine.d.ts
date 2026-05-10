export interface GameState {
    [key: string]: unknown;
}
export interface Move {
    [key: string]: unknown;
}
export declare abstract class GameEngine {
    abstract initialize(players: string[]): GameState;
    abstract validateMove(state: GameState, move: Move, userId: string): boolean;
    abstract applyMove(state: GameState, move: Move, userId: string): GameState;
    abstract checkResult(state: GameState): 'ongoing' | 'win' | 'draw';
    abstract getWinner(state: GameState): string | null;
    abstract getGameLog(move: Move, userId: string, state: GameState): string;
}
//# sourceMappingURL=GameEngine.d.ts.map
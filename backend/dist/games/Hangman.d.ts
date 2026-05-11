import { GameEngine, type GameState, type Move } from './GameEngine.js';
interface HangmanState extends GameState {
    word: string;
    players: string[];
    winner: string | null;
    draw?: boolean;
    playerStates: {
        [userId: string]: {
            guessedLetters: string[];
            wrongCount: number;
        };
    };
}
export declare class Hangman extends GameEngine {
    initialize(players: string[]): HangmanState;
    validateMove(state: GameState, move: Move, userId: string): boolean;
    applyMove(state: GameState, move: Move, userId: string): HangmanState;
    checkResult(state: GameState): 'ongoing' | 'win' | 'draw';
    getWinner(state: GameState): string | null;
    getGameLog(move: Move, userId: string, state: GameState): string;
}
export {};
//# sourceMappingURL=Hangman.d.ts.map
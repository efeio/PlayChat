import { GameEngine, type GameState, type Move } from './GameEngine.js';
interface HangmanState extends GameState {
    word: string;
    guessedLetters: string[];
    wrongCount: number;
    currentPlayerIndex: number;
    players: string[];
    winner: string | null;
    setter: string;
    guesser: string;
    roles: {
        [userId: string]: 'SETTER' | 'GUESSER';
    };
}
export declare class Hangman extends GameEngine {
    initialize(players: string[]): HangmanState;
    validateMove(state: GameState, move: Move, userId: string): boolean;
    applyMove(state: GameState, move: Move, _userId: string): HangmanState;
    checkResult(state: GameState): 'ongoing' | 'win' | 'draw';
    getWinner(state: GameState): string | null;
    getGameLog(move: Move, _userId: string, state: GameState): string;
}
export {};
//# sourceMappingURL=Hangman.d.ts.map
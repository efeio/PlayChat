import { GameEngine } from './GameEngine.js';
const WORD_LIST = [
    'JAVASCRIPT', 'TYPESCRIPT', 'REACT', 'SOCKET', 'PRISMA',
    'FASTIFY', 'NODEJS', 'WEBPACK', 'VITE', 'TAILWIND',
    'DATABASE', 'FRONTEND', 'BACKEND', 'SERVER', 'CLIENT',
    'BROWSER', 'COMPONENT', 'FUNCTION', 'VARIABLE', 'MODULE',
];
const MAX_WRONG = 6;
export class Hangman extends GameEngine {
    initialize(players) {
        if (players.length !== 2) {
            throw new Error('Hangman requires exactly 2 players');
        }
        const word = WORD_LIST[Math.floor(Math.random() * WORD_LIST.length)];
        return {
            word,
            players: [...players],
            winner: null,
            draw: false,
            playerStates: {
                [players[0]]: { guessedLetters: [], wrongCount: 0 },
                [players[1]]: { guessedLetters: [], wrongCount: 0 },
            },
        };
    }
    validateMove(state, move, userId) {
        const s = state;
        const m = move;
        /* Game already ended */
        if (s.winner || s.draw) {
            return false;
        }
        const playerState = s.playerStates[userId];
        if (!playerState || playerState.wrongCount >= MAX_WRONG) {
            return false;
        }
        /* Check if move is a word guess */
        if (m.word !== undefined) {
            return true;
        }
        /* Check if move is a letter guess */
        if (m.letter !== undefined) {
            const letter = m.letter.toUpperCase();
            /* Validate letter format */
            if (letter.length !== 1 || !/^[A-Z]$/.test(letter)) {
                return false;
            }
            /* Check if letter already guessed */
            if (playerState.guessedLetters.includes(letter)) {
                return false;
            }
            return true;
        }
        /* No valid move type */
        return false;
    }
    applyMove(state, move, userId) {
        const s = state;
        const m = move;
        const playerState = s.playerStates[userId];
        if (m.word) {
            const guessWord = m.word.toUpperCase();
            if (guessWord === s.word) {
                return { ...s, winner: userId };
            }
            else {
                const newWrongCount = playerState.wrongCount + 1;
                const newPlayerStates = {
                    ...s.playerStates,
                    [userId]: { ...playerState, wrongCount: newWrongCount },
                };
                let draw = false;
                if (Object.values(newPlayerStates).every((ps) => ps.wrongCount >= MAX_WRONG)) {
                    draw = true;
                }
                return { ...s, playerStates: newPlayerStates, draw };
            }
        }
        const letter = m.letter.toUpperCase();
        const newGuessed = [...playerState.guessedLetters, letter];
        let newWrongCount = playerState.wrongCount;
        if (!s.word.includes(letter)) {
            newWrongCount++;
        }
        let winner = null;
        let draw = false;
        if (s.word.split('').every((c) => newGuessed.includes(c))) {
            winner = userId;
        }
        const newPlayerStates = {
            ...s.playerStates,
            [userId]: { guessedLetters: newGuessed, wrongCount: newWrongCount },
        };
        if (!winner && Object.values(newPlayerStates).every((ps) => ps.wrongCount >= MAX_WRONG)) {
            draw = true;
        }
        return {
            ...s,
            playerStates: newPlayerStates,
            winner,
            draw,
        };
    }
    checkResult(state) {
        const s = state;
        if (s.winner)
            return 'win';
        if (s.draw)
            return 'draw';
        return 'ongoing';
    }
    getWinner(state) {
        return state.winner;
    }
    getGameLog(move, userId, state) {
        const s = state;
        const m = move;
        const playerState = s.playerStates[userId];
        const prevWrongCount = playerState ? playerState.wrongCount : 0; // Rough approximation for logging
        if (m.word) {
            const guessWord = m.word.toUpperCase();
            return guessWord === s.word ? `guessed the word correctly!` : `guessed "${guessWord}" incorrectly`;
        }
        const letter = m.letter.toUpperCase();
        if (s.word.includes(letter)) {
            return `guessed letter "${letter}" — correct!`;
        }
        return `guessed letter "${letter}" — wrong!`;
    }
}
//# sourceMappingURL=Hangman.js.map
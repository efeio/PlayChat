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
        /* Deterministic role assignment: first player is setter, second is guesser */
        const setter = players[0];
        const guesser = players[1];
        const word = WORD_LIST[Math.floor(Math.random() * WORD_LIST.length)];
        return {
            word,
            guessedLetters: [],
            wrongCount: 0,
            currentPlayerIndex: 1,
            players: [...players],
            winner: null,
            setter,
            guesser,
            roles: {
                [setter]: 'SETTER',
                [guesser]: 'GUESSER',
            },
        };
    }
    validateMove(state, move, userId) {
        const s = state;
        const m = move;
        /* Game already ended */
        if (s.winner) {
            return false;
        }
        /* Check if move is a word guess */
        if (m.word !== undefined) {
            /* Only setter can submit word (for future word-setting feature) */
            /* Currently word is auto-generated, so reject word submissions */
            return false;
        }
        /* Check if move is a letter guess */
        if (m.letter !== undefined) {
            /* Only guesser can guess letters */
            if (userId !== s.guesser) {
                return false;
            }
            const letter = m.letter.toUpperCase();
            /* Validate letter format */
            if (letter.length !== 1 || !/^[A-Z]$/.test(letter)) {
                return false;
            }
            /* Check if letter already guessed */
            if (s.guessedLetters.includes(letter)) {
                return false;
            }
            return true;
        }
        /* No valid move type */
        return false;
    }
    applyMove(state, move, _userId) {
        const s = state;
        const m = move;
        if (m.word) {
            const guessWord = m.word.toUpperCase();
            if (guessWord === s.word) {
                return { ...s, winner: s.guesser };
            }
            else {
                return { ...s, wrongCount: s.wrongCount + 1, winner: s.wrongCount + 1 >= MAX_WRONG ? s.setter : null };
            }
        }
        const letter = m.letter.toUpperCase();
        const newGuessed = [...s.guessedLetters, letter];
        let newWrongCount = s.wrongCount;
        if (!s.word.includes(letter)) {
            newWrongCount++;
        }
        let winner = null;
        if (newWrongCount >= MAX_WRONG) {
            winner = s.setter;
        }
        else if (s.word.split('').every((c) => newGuessed.includes(c))) {
            winner = s.guesser;
        }
        return {
            ...s,
            guessedLetters: newGuessed,
            wrongCount: newWrongCount,
            winner,
        };
    }
    checkResult(state) {
        const s = state;
        if (s.winner)
            return 'win';
        return 'ongoing';
    }
    getWinner(state) {
        return state.winner;
    }
    getGameLog(move, _userId, state) {
        const s = state;
        const m = move;
        if (m.word) {
            const guessWord = m.word.toUpperCase();
            return guessWord === s.word ? `guessed the word correctly!` : `guessed "${guessWord}" incorrectly`;
        }
        const letter = m.letter.toUpperCase();
        if (s.word.includes(letter)) {
            return `guessed letter "${letter}" — correct!`;
        }
        return `guessed letter "${letter}" — wrong! (${s.wrongCount}/${MAX_WRONG})`;
    }
}
//# sourceMappingURL=Hangman.js.map
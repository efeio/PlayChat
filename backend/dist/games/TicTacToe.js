import { GameEngine } from './GameEngine.js';
const WINNING_LINES = [
    [0, 1, 2], [3, 4, 5], [6, 7, 8],
    [0, 3, 6], [1, 4, 7], [2, 5, 8],
    [0, 4, 8], [2, 4, 6],
];
export class TicTacToe extends GameEngine {
    initialize(players) {
        return {
            board: Array(9).fill(null),
            currentPlayerIndex: 0,
            players: [...players],
            winner: null,
        };
    }
    validateMove(state, move, userId) {
        const s = state;
        const m = move;
        if (s.winner)
            return false;
        if (s.players[s.currentPlayerIndex] !== userId)
            return false;
        if (m.position < 0 || m.position > 8)
            return false;
        if (s.board[m.position] !== null)
            return false;
        return true;
    }
    applyMove(state, move, userId) {
        const s = state;
        const m = move;
        const newBoard = [...s.board];
        const symbol = s.currentPlayerIndex === 0 ? 'X' : 'O';
        newBoard[m.position] = symbol;
        const winner = this._checkWinner(newBoard, s.players);
        return {
            ...s,
            board: newBoard,
            currentPlayerIndex: s.currentPlayerIndex === 0 ? 1 : 0,
            winner,
        };
    }
    checkResult(state) {
        const s = state;
        if (s.winner)
            return 'win';
        if (s.board.every((cell) => cell !== null))
            return 'draw';
        return 'ongoing';
    }
    getWinner(state) {
        return state.winner;
    }
    getGameLog(move, _userId, state) {
        const s = state;
        const m = move;
        const symbol = s.board[m.position];
        const row = Math.floor(m.position / 3) + 1;
        const col = (m.position % 3) + 1;
        return `placed ${symbol} at row ${row}, col ${col}`;
    }
    _checkWinner(board, players) {
        for (const [a, b, c] of WINNING_LINES) {
            if (board[a] && board[a] === board[b] && board[a] === board[c]) {
                return board[a] === 'X' ? players[0] : players[1];
            }
        }
        return null;
    }
}
//# sourceMappingURL=TicTacToe.js.map
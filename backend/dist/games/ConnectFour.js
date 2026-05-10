import { GameEngine } from './GameEngine.js';
const ROWS = 6;
const COLS = 7;
const CONNECT_N = 4;
const DIRECTIONS = [
    [0, 1], [1, 0], [1, 1], [1, -1],
];
export class ConnectFour extends GameEngine {
    initialize(players) {
        const board = [];
        for (let r = 0; r < ROWS; r++) {
            board.push(new Array(COLS).fill(0));
        }
        return {
            board,
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
        if (m.column < 0 || m.column >= COLS)
            return false;
        if (s.board[0][m.column] !== 0)
            return false;
        return true;
    }
    applyMove(state, move, _userId) {
        const s = state;
        const m = move;
        const newBoard = s.board.map((row) => [...row]);
        const playerNum = s.currentPlayerIndex + 1;
        let placedRow = -1;
        for (let r = ROWS - 1; r >= 0; r--) {
            if (newBoard[r][m.column] === 0) {
                newBoard[r][m.column] = playerNum;
                placedRow = r;
                break;
            }
        }
        let winner = null;
        if (placedRow >= 0 && this._hasConnect(newBoard, placedRow, m.column, playerNum)) {
            winner = s.players[s.currentPlayerIndex];
        }
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
        if (s.board[0].every((cell) => cell !== 0))
            return 'draw';
        return 'ongoing';
    }
    getWinner(state) {
        return state.winner;
    }
    getGameLog(move, _userId, _state) {
        const m = move;
        return `dropped a piece in column ${m.column + 1}`;
    }
    _hasConnect(board, row, col, player) {
        for (const [dr, dc] of DIRECTIONS) {
            let total = 1;
            total += this._countRun(board, row + dr, col + dc, player, dr, dc);
            total += this._countRun(board, row - dr, col - dc, player, -dr, -dc);
            if (total >= CONNECT_N)
                return true;
        }
        return false;
    }
    _countRun(board, row, col, player, dr, dc) {
        let count = 0;
        let r = row;
        let c = col;
        while (r >= 0 && r < ROWS && c >= 0 && c < COLS && board[r][c] === player) {
            count++;
            r += dr;
            c += dc;
        }
        return count;
    }
}
//# sourceMappingURL=ConnectFour.js.map
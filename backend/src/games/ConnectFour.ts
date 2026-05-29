import { GameEngine, type GameState, type Move } from './GameEngine.js';

const ROWS = 6;
const COLS = 7;
const CONNECT_N = 4;
const DIRECTIONS: [number, number][] = [
  [0, 1], [1, 0], [1, 1], [1, -1],
];

interface ConnectFourState extends GameState {
  board: number[][];
  currentPlayerIndex: number;
  players: string[];
  winner: string | null;
}

interface ConnectFourMove extends Move {
  column: number;
}

export class ConnectFour extends GameEngine {
  initialize(players: string[]): ConnectFourState {
    const board: number[][] = [];
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

  validateMove(state: GameState, move: Move, userId: string): boolean {
    const s = state as ConnectFourState;
    const m = move as ConnectFourMove;

    if (s.winner) return false;
    if (s.players[s.currentPlayerIndex] !== userId) return false;
    if (m.column < 0 || m.column >= COLS) return false;
    if (s.board[0][m.column] !== 0) return false;

    return true;
  }

  applyMove(state: GameState, move: Move, _userId: string): ConnectFourState {
    const s = state as ConnectFourState;
    const m = move as ConnectFourMove;
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

    let winner: string | null = null;
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

  checkResult(state: GameState): 'ongoing' | 'win' | 'draw' {
    const s = state as ConnectFourState;
    if (s.winner) return 'win';
    if (s.board[0].every((cell) => cell !== 0)) return 'draw';
    return 'ongoing';
  }

  getWinner(state: GameState): string | null {
    return (state as ConnectFourState).winner;
  }

  getGameLog(move: Move, _userId: string, _state: GameState): string {
    const m = move as ConnectFourMove;
    return `${m.column + 1}. sütuna taş koydu`;
  }

  private _hasConnect(
    board: number[][],
    row: number,
    col: number,
    player: number
  ): boolean {
    for (const [dr, dc] of DIRECTIONS) {
      let total = 1;
      total += this._countRun(board, row + dr, col + dc, player, dr, dc);
      total += this._countRun(board, row - dr, col - dc, player, -dr, -dc);
      if (total >= CONNECT_N) return true;
    }
    return false;
  }

  private _countRun(
    board: number[][],
    row: number,
    col: number,
    player: number,
    dr: number,
    dc: number
  ): number {
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

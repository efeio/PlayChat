import { Board, GameState, Player } from '../types';

const WINNING_LINES = [
  [0, 1, 2], [3, 4, 5], [6, 7, 8], // Satırlar
  [0, 3, 6], [1, 4, 7], [2, 5, 8], // Sütunlar
  [0, 4, 8], [2, 4, 6],            // Çaprazlar
];

export function checkWinner(board: Board): Player | "draw" | null {
  for (const [a, b, c] of WINNING_LINES) {
    if (board[a] && board[a] === board[b] && board[a] === board[c]) {
      return board[a] as Player;
    }
  }
  if (board.every((cell) => cell !== null)) return "draw";
  return null;
}

export function getWinningCells(board: Board): number[] {
  for (const [a, b, c] of WINNING_LINES) {
    if (board[a] && board[a] === board[b] && board[a] === board[c]) {
      return [a, b, c];
    }
  }
  return [];
}

export const PLAYERS = [
  { symbol: "X" as const, name: "Efe", isActive: true },
  { symbol: "O" as const, name: "Can", isActive: false },
];

export const initialState = (startingPlayer: Player = "X"): GameState => ({
  board: Array(9).fill(null),
  currentPlayer: startingPlayer,
  startingPlayer: startingPlayer,
  winner: null,
  scores: { X: 0, O: 0 },
  round: 1,
  status: "playing",
});

export type Player = "X" | "O";
export type CellValue = Player | null;
export type Board = CellValue[];

export interface GameState {
  board: Board;
  currentPlayer: Player;
  startingPlayer: Player;
  winner: Player | "draw" | null;
  scores: Record<Player, number>;
  round: number;
  status: "waiting" | "playing" | "finished";
}

export interface PlayerInfo {
  symbol: Player;
  name: string;
  isActive: boolean;
}

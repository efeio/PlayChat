export type GameType = 'TIC_TAC_TOE' | 'CONNECT_FOUR' | 'ROCK_PAPER_SCISSORS' | 'HANGMAN' | 'WORDLE' | 'MEMORY_CARDS' | 'NUMBER_GUESS';

export interface GamePlayer {
  id: string;
  gameId: string;
  userId: string;
  role: string;
  playerIndex: number;
  user: {
    id: string;
    username: string;
    displayName: string;
  };
}

export interface GameStartedEvent {
  gameId: string;
  gameType: GameType;
  state: Record<string, unknown>;
  players: GamePlayer[];
}

export interface GameStateEvent {
  gameId: string;
  state: Record<string, unknown>;
}

export interface GameEndEvent {
  gameId: string;
  result: 'win' | 'draw';
  winnerId: string | null;
  state?: Record<string, unknown>;
  reason?: string;
}

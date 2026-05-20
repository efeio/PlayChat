export interface Room {
  id: string;
  name: string;
  type: string;
  maxMembers: number;
  createdAt: string;
  members: RoomMember[];
  games?: GameSummary[];
}

export interface RoomMember {
  id: string;
  userId: string;
  roomId: string;
  role: string;
  isOnline?: boolean;
  user: {
    id: string;
    username: string;
    displayName: string;
  };
}

export interface GameSummary {
  id: string;
  gameType: string;
  status: string;
}

export interface Message {
  id: string;
  content: string;
  type: 'CHAT' | 'GAME_LOG';
  userId: string;
  roomId: string;
  createdAt: string;
  user: {
    id: string;
    username: string;
    displayName: string;
  };
}

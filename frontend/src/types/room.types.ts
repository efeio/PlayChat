export interface Room {
  id: string;
  name: string;
  description?: string;
  type: string;
  maxMembers: number;
  isActive?: boolean;
  creatorId?: string;
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
    avatarUrl?: string | null;
  };
}

export interface GameSummary {
  id: string;
  type?: string;
  gameType?: string;
  status: string;
}

export interface Message {
  id: string;
  content: string;
  type: 'CHAT' | 'GAME_LOG';
  userId: string | null;
  roomId: string;
  createdAt: string;
  user?: {
    id: string;
    username: string;
    displayName: string;
  };
}

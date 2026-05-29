import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import type { Server, Socket } from 'socket.io';
import { registerRoomHandlers } from './room.handler.js';
import prisma from '../../config/prisma.js';
import { getActiveGame } from '../../services/gameState.service.js';

vi.mock('../../config/prisma.js', () => ({
  default: {
    roomMember: {
      findFirst: vi.fn(),
    },
    room: {
      findUnique: vi.fn(),
    },
    game: {
      findFirst: vi.fn(),
    },
  },
}));

vi.mock('../../services/gameState.service.js', () => ({
  getActiveGame: vi.fn(),
}));

vi.mock('./game.handler.js', () => ({
  handlePlayerLeftRoom: vi.fn(),
}));

vi.mock('../authorizationGuard.js', () => ({
  trackSocketRoom: vi.fn(),
  untrackSocketRoom: vi.fn(),
  getSocketRoom: vi.fn(),
  sanitizeString: vi.fn((s: string) => s?.trim()),
}));

describe('room:get_state handler', () => {
  let mockSocket: Partial<Socket>;
  let mockIo: Partial<Server>;
  let roomGetStateHandler: (data: { roomId: string }, callback?: (res: any) => void) => void;

  beforeEach(() => {
    vi.clearAllMocks();

    /* Create mock socket */
    mockSocket = {
      data: {
        userId: 'user1',
        username: 'testuser',
      },
      on: vi.fn((event: string, handler: any) => {
        if (event === 'room:get_state') {
          roomGetStateHandler = handler;
        }
        return mockSocket;
      }) as any,
      emit: vi.fn(),
      to: vi.fn(() => mockSocket as any),
      join: vi.fn(),
      leave: vi.fn(),
      id: 'socket1',
    };

    /* Create mock io */
    mockIo = {
      to: vi.fn(() => mockIo as any),
      emit: vi.fn(),
      in: vi.fn(() => ({
        fetchSockets: vi.fn().mockResolvedValue([]),
      })) as any,
    };

    /* Register handlers to capture room:get_state */
    registerRoomHandlers(mockIo as Server, mockSocket as Socket);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should return complete state for valid room member', async () => {
    const roomId = 'room1';
    const mockMembership = { userId: 'user1', roomId, role: 'OWNER' };
    const mockRoom = {
      id: roomId,
      name: 'Test Room',
      type: 'PUBLIC',
      maxMembers: 10,
      members: [
        {
          userId: 'user1',
          role: 'OWNER',
          user: { id: 'user1', username: 'testuser', displayName: 'Test User' },
        },
        {
          userId: 'user2',
          role: 'MEMBER',
          user: { id: 'user2', username: 'user2', displayName: 'User 2' },
        },
      ],
      messages: [
        {
          id: 'msg1',
          content: 'Hello',
          type: 'CHAT',
          userId: 'user1',
          createdAt: new Date('2024-01-01T10:00:00Z'),
          user: { id: 'user1', username: 'testuser', displayName: 'Test User' },
        },
      ],
    };

    vi.mocked(prisma.roomMember.findFirst).mockResolvedValue(mockMembership as any);
    vi.mocked(prisma.room.findUnique).mockResolvedValue(mockRoom as any);
    vi.mocked(prisma.game.findFirst).mockResolvedValue(null);

    /* Mock fetchSockets to return online users */
    (mockIo.in as any).mockReturnValue({
      fetchSockets: vi.fn().mockResolvedValue([
        { data: { userId: 'user1' } },
      ]),
    });

    const callback = vi.fn();
    await roomGetStateHandler({ roomId }, callback);

    expect(callback).toHaveBeenCalledWith({
      room: {
        id: roomId,
        name: 'Test Room',
        type: 'PUBLIC',
        maxMembers: 10,
      },
      members: [
        {
          userId: 'user1',
          username: 'testuser',
          displayName: 'Test User',
          role: 'OWNER',
          isOnline: true,
        },
        {
          userId: 'user2',
          username: 'user2',
          displayName: 'User 2',
          role: 'MEMBER',
          isOnline: false,
        },
      ],
      messages: [
        {
          id: 'msg1',
          content: 'Hello',
          type: 'CHAT',
          userId: 'user1',
          username: 'testuser',
          displayName: 'Test User',
          createdAt: '2024-01-01T10:00:00.000Z',
        },
      ],
      activeGame: null,
      userRole: 'OWNER',
    });
  });

  it('should return error for non-member', async () => {
    const roomId = 'room1';

    vi.mocked(prisma.roomMember.findFirst).mockResolvedValue(null);

    const callback = vi.fn();
    await roomGetStateHandler({ roomId }, callback);

    expect(callback).toHaveBeenCalledWith({ error: 'Not a member of this room' });
    expect(prisma.room.findUnique).not.toHaveBeenCalled();
  });

  it('should return error for non-existent room', async () => {
    const roomId = 'nonexistent';
    const mockMembership = { userId: 'user1', roomId, role: 'MEMBER' };

    vi.mocked(prisma.roomMember.findFirst).mockResolvedValue(mockMembership as any);
    vi.mocked(prisma.room.findUnique).mockResolvedValue(null);

    const callback = vi.fn();
    await roomGetStateHandler({ roomId }, callback);

    expect(callback).toHaveBeenCalledWith({ error: 'Room not found' });
  });

  it('should correctly reconstruct online status from socket connections', async () => {
    const roomId = 'room1';
    const mockMembership = { userId: 'user1', roomId, role: 'MEMBER' };
    const mockRoom = {
      id: roomId,
      name: 'Test Room',
      type: 'PUBLIC',
      maxMembers: 10,
      members: [
        {
          userId: 'user1',
          role: 'MEMBER',
          user: { id: 'user1', username: 'user1', displayName: 'User 1' },
        },
        {
          userId: 'user2',
          role: 'MEMBER',
          user: { id: 'user2', username: 'user2', displayName: 'User 2' },
        },
        {
          userId: 'user3',
          role: 'MEMBER',
          user: { id: 'user3', username: 'user3', displayName: 'User 3' },
        },
      ],
      messages: [],
    };

    vi.mocked(prisma.roomMember.findFirst).mockResolvedValue(mockMembership as any);
    vi.mocked(prisma.room.findUnique).mockResolvedValue(mockRoom as any);
    vi.mocked(prisma.game.findFirst).mockResolvedValue(null);

    /* Mock fetchSockets - user1 and user3 are online */
    (mockIo.in as any).mockReturnValue({
      fetchSockets: vi.fn().mockResolvedValue([
        { data: { userId: 'user1' } },
        { data: { userId: 'user3' } },
      ]),
    });

    const callback = vi.fn();
    await roomGetStateHandler({ roomId }, callback);

    const response = callback.mock.calls[0][0];
    expect(response.members).toEqual([
      expect.objectContaining({ userId: 'user1', isOnline: true }),
      expect.objectContaining({ userId: 'user2', isOnline: false }),
      expect.objectContaining({ userId: 'user3', isOnline: true }),
    ]);
  });

  it('should handle missing active game (returns null)', async () => {
    const roomId = 'room1';
    const mockMembership = { userId: 'user1', roomId, role: 'MEMBER' };
    const mockRoom = {
      id: roomId,
      name: 'Test Room',
      type: 'PUBLIC',
      maxMembers: 10,
      members: [],
      messages: [],
    };

    vi.mocked(prisma.roomMember.findFirst).mockResolvedValue(mockMembership as any);
    vi.mocked(prisma.room.findUnique).mockResolvedValue(mockRoom as any);
    vi.mocked(prisma.game.findFirst).mockResolvedValue(null);

    (mockIo.in as any).mockReturnValue({
      fetchSockets: vi.fn().mockResolvedValue([]),
    });

    const callback = vi.fn();
    await roomGetStateHandler({ roomId }, callback);

    const response = callback.mock.calls[0][0];
    expect(response.activeGame).toBeNull();
  });

  it('should handle active game in memory', async () => {
    const roomId = 'room1';
    const gameId = 'game1';
    const mockMembership = { userId: 'user1', roomId, role: 'MEMBER' };
    const mockRoom = {
      id: roomId,
      name: 'Test Room',
      type: 'PUBLIC',
      maxMembers: 10,
      members: [],
      messages: [],
    };
    const mockGameRecord = {
      id: gameId,
      roomId,
      gameType: 'TIC_TAC_TOE',
      status: 'IN_PROGRESS',
      state: '{"board":[[null,null,null],[null,null,null],[null,null,null]]}',
      players: [
        {
          userId: 'user1',
          role: 'PLAYER',
          playerIndex: 0,
          user: { id: 'user1', username: 'user1', displayName: 'User 1' },
        },
        {
          userId: 'user2',
          role: 'PLAYER',
          playerIndex: 1,
          user: { id: 'user2', username: 'user2', displayName: 'User 2' },
        },
      ],
    };
    const mockGameState = {
      board: [[null, null, null], [null, null, null], [null, null, null]],
      currentPlayerIndex: 0,
      players: ['user1', 'user2'],
      winner: null,
    };

    vi.mocked(prisma.roomMember.findFirst).mockResolvedValue(mockMembership as any);
    vi.mocked(prisma.room.findUnique).mockResolvedValue(mockRoom as any);
    vi.mocked(prisma.game.findFirst).mockResolvedValue(mockGameRecord as any);

    vi.mocked(getActiveGame).mockReturnValue({
      engine: {} as any,
      state: mockGameState,
      gameId,
      roomId,
      gameType: 'TIC_TAC_TOE',
      lastUpdated: Date.now(),
      moveCount: 0,
    });

    (mockIo.in as any).mockReturnValue({
      fetchSockets: vi.fn().mockResolvedValue([]),
    });

    const callback = vi.fn();
    await roomGetStateHandler({ roomId }, callback);

    const response = callback.mock.calls[0][0];
    expect(response.activeGame).toEqual({
      gameId,
      gameType: 'TIC_TAC_TOE',
      status: 'IN_PROGRESS',
      state: mockGameState,
      players: [
        {
          userId: 'user1',
          username: 'user1',
          displayName: 'User 1',
          role: 'PLAYER',
          playerIndex: 0,
        },
        {
          userId: 'user2',
          username: 'user2',
          displayName: 'User 2',
          role: 'PLAYER',
          playerIndex: 1,
        },
      ],
    });
  });

  it('should handle active game in DB but not memory (server restart scenario)', async () => {
    const roomId = 'room1';
    const gameId = 'game1';
    const mockMembership = { userId: 'user1', roomId, role: 'MEMBER' };
    const mockRoom = {
      id: roomId,
      name: 'Test Room',
      type: 'PUBLIC',
      maxMembers: 10,
      members: [],
      messages: [],
    };
    const mockGameState = {
      board: [[null, 'X', null], [null, 'O', null], [null, null, null]],
      currentPlayerIndex: 0,
      players: ['user1', 'user2'],
      winner: null,
    };
    const mockGameRecord = {
      id: gameId,
      roomId,
      gameType: 'TIC_TAC_TOE',
      status: 'IN_PROGRESS',
      state: JSON.stringify(mockGameState),
      players: [
        {
          userId: 'user1',
          role: 'PLAYER',
          playerIndex: 0,
          user: { id: 'user1', username: 'user1', displayName: 'User 1' },
        },
        {
          userId: 'user2',
          role: 'PLAYER',
          playerIndex: 1,
          user: { id: 'user2', username: 'user2', displayName: 'User 2' },
        },
      ],
    };

    vi.mocked(prisma.roomMember.findFirst).mockResolvedValue(mockMembership as any);
    vi.mocked(prisma.room.findUnique).mockResolvedValue(mockRoom as any);
    vi.mocked(prisma.game.findFirst).mockResolvedValue(mockGameRecord as any);

    vi.mocked(getActiveGame).mockReturnValue(undefined);

    (mockIo.in as any).mockReturnValue({
      fetchSockets: vi.fn().mockResolvedValue([]),
    });

    const callback = vi.fn();
    await roomGetStateHandler({ roomId }, callback);

    const response = callback.mock.calls[0][0];
    expect(response.activeGame).toEqual({
      gameId,
      gameType: 'TIC_TAC_TOE',
      status: 'IN_PROGRESS',
      state: mockGameState,
      players: [
        {
          userId: 'user1',
          username: 'user1',
          displayName: 'User 1',
          role: 'PLAYER',
          playerIndex: 0,
        },
        {
          userId: 'user2',
          username: 'user2',
          displayName: 'User 2',
          role: 'PLAYER',
          playerIndex: 1,
        },
      ],
    });
  });
});

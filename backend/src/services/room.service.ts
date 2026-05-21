import prisma from '../config/prisma.js';
import { RoomType, MemberRole, GameStatus } from '@prisma/client';

export interface CreateRoomInput {
  name: string;
  description?: string;
  type?: RoomType;
  password?: string;
  maxMembers?: number;
  ownerId: string;
}

export async function createRoom(input: CreateRoomInput) {
  let passwordHash: string | undefined;
  if (input.type === RoomType.PRIVATE && input.password) {
    const bcrypt = await import('bcrypt');
    passwordHash = await bcrypt.hash(input.password, 10);
  }

  const room = await prisma.room.create({
    data: {
      name: input.name,
      description: input.description,
      type: input.type || RoomType.PUBLIC,
      passwordHash,
      maxMembers: input.maxMembers || 10,
      creatorId: input.ownerId,
      members: {
        create: {
          userId: input.ownerId,
          role: MemberRole.OWNER,
        },
      },
    },
    include: {
      members: {
        include: { user: { select: { id: true, username: true, displayName: true, avatarUrl: true } } },
      },
    },
  });

  return room;
}

export async function listRooms() {
  const rooms = await prisma.room.findMany({
    where: { isActive: true },
    include: {
      members: {
        include: { user: { select: { id: true, username: true, displayName: true, avatarUrl: true } } },
      },
      games: {
        where: { status: GameStatus.IN_PROGRESS },
        select: { id: true, type: true, status: true },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  return rooms.map((room) => ({
    ...room,
    isPrivate: room.type === RoomType.PRIVATE,
    passwordHash: undefined,
  }));
}

const membershipLocks = new Map<string, Promise<void>>();

async function acquireLock(key: string): Promise<() => void> {
  let release!: () => void;
  const newLock = new Promise<void>((resolve) => {
    release = resolve;
  });

  while (membershipLocks.has(key)) {
    await membershipLocks.get(key);
  }

  membershipLocks.set(key, newLock);

  return () => {
    membershipLocks.delete(key);
    release();
  };
}

export async function getRoomById(roomId: string) {
  const room = await prisma.room.findUnique({
    where: { id: roomId },
    include: {
      members: {
        include: { user: { select: { id: true, username: true, displayName: true, avatarUrl: true } } },
      },
      games: {
        orderBy: { createdAt: 'desc' },
        take: 1,
        include: {
          players: {
            include: { user: { select: { id: true, username: true, displayName: true } } },
          },
        },
      },
    },
  });

  return room;
}

export async function addMemberToRoom(
  roomId: string,
  userId: string,
  role: MemberRole = MemberRole.MEMBER
) {
  const lockKey = `${roomId}:${userId}`;
  const release = await acquireLock(lockKey);

  try {
    return await prisma.roomMember.upsert({
      where: { roomId_userId: { userId, roomId } },
      update: { role },
      create: { userId, roomId, role },
    });
  } finally {
    release();
  }
}

export async function removeMemberFromRoom(roomId: string, userId: string) {
  return prisma.roomMember.deleteMany({
    where: { userId, roomId },
  });
}

export async function getUserCurrentRoom(userId: string) {
  const membership = await prisma.roomMember.findFirst({
    where: { userId },
    include: { room: true },
  });
  return membership;
}

export async function verifyRoomPassword(roomId: string, password: string): Promise<boolean> {
  const room = await prisma.room.findUnique({
    where: { id: roomId },
    select: { passwordHash: true, type: true },
  });

  if (!room || room.type !== RoomType.PRIVATE || !room.passwordHash) {
    return false;
  }

  const bcrypt = await import('bcrypt');
  return bcrypt.compare(password, room.passwordHash);
}

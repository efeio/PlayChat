import prisma from '../config/prisma.js';

export interface CreateRoomInput {
  name: string;
  type?: string;
  maxMembers?: number;
  ownerId: string;
}

export async function createRoom(input: CreateRoomInput) {
  const room = await prisma.room.create({
    data: {
      name: input.name,
      type: input.type || 'PUBLIC',
      maxMembers: input.maxMembers || 10,
      members: {
        create: {
          userId: input.ownerId,
          role: 'OWNER',
        },
      },
    },
    include: {
      members: {
        include: { user: { select: { id: true, username: true, displayName: true } } },
      },
    },
  });

  return room;
}

export async function listRooms() {
  const rooms = await prisma.room.findMany({
    where: { type: 'PUBLIC' },
    include: {
      members: {
        include: { user: { select: { id: true, username: true, displayName: true } } },
      },
      games: {
        where: { status: 'IN_PROGRESS' },
        select: { id: true, gameType: true, status: true },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  return rooms;
}

export async function getRoomById(roomId: string) {
  const room = await prisma.room.findUnique({
    where: { id: roomId },
    include: {
      members: {
        include: { user: { select: { id: true, username: true, displayName: true } } },
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
  role: string = 'MEMBER'
) {
  return prisma.roomMember.upsert({
    where: { userId_roomId: { userId, roomId } },
    update: { role },
    create: { userId, roomId, role },
  });
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

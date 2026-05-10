import prisma from '../config/prisma.js';
export async function createRoom(input) {
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
const membershipLocks = new Map();
async function acquireLock(key) {
    let release;
    const newLock = new Promise((resolve) => {
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
export async function getRoomById(roomId) {
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
export async function addMemberToRoom(roomId, userId, role = 'MEMBER') {
    const lockKey = `${roomId}:${userId}`;
    const release = await acquireLock(lockKey);
    try {
        return await prisma.roomMember.upsert({
            where: { userId_roomId: { userId, roomId } },
            update: { role },
            create: { userId, roomId, role },
        });
    }
    finally {
        release();
    }
}
export async function removeMemberFromRoom(roomId, userId) {
    return prisma.roomMember.deleteMany({
        where: { userId, roomId },
    });
}
export async function getUserCurrentRoom(userId) {
    const membership = await prisma.roomMember.findFirst({
        where: { userId },
        include: { room: true },
    });
    return membership;
}
//# sourceMappingURL=room.service.js.map
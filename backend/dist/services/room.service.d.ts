export interface CreateRoomInput {
    name: string;
    type?: string;
    maxMembers?: number;
    ownerId: string;
}
export declare function createRoom(input: CreateRoomInput): Promise<{
    members: ({
        user: {
            username: string;
            id: string;
            displayName: string;
        };
    } & {
        userId: string;
        id: string;
        role: string;
        joinedAt: Date;
        roomId: string;
    })[];
} & {
    id: string;
    createdAt: Date;
    updatedAt: Date;
    name: string;
    type: string;
    maxMembers: number;
}>;
export declare function listRooms(): Promise<({
    members: ({
        user: {
            username: string;
            id: string;
            displayName: string;
        };
    } & {
        userId: string;
        id: string;
        role: string;
        joinedAt: Date;
        roomId: string;
    })[];
    games: {
        id: string;
        status: string;
        gameType: string;
    }[];
} & {
    id: string;
    createdAt: Date;
    updatedAt: Date;
    name: string;
    type: string;
    maxMembers: number;
})[]>;
export declare function getRoomById(roomId: string): Promise<({
    members: ({
        user: {
            username: string;
            id: string;
            displayName: string;
        };
    } & {
        userId: string;
        id: string;
        role: string;
        joinedAt: Date;
        roomId: string;
    })[];
    games: ({
        players: ({
            user: {
                username: string;
                id: string;
                displayName: string;
            };
        } & {
            userId: string;
            id: string;
            role: string;
            gameId: string;
            playerIndex: number;
        })[];
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        status: string;
        roomId: string;
        gameType: string;
        state: string;
        winnerId: string | null;
    })[];
} & {
    id: string;
    createdAt: Date;
    updatedAt: Date;
    name: string;
    type: string;
    maxMembers: number;
}) | null>;
export declare function addMemberToRoom(roomId: string, userId: string, role?: string): Promise<{
    userId: string;
    id: string;
    role: string;
    joinedAt: Date;
    roomId: string;
}>;
export declare function removeMemberFromRoom(roomId: string, userId: string): Promise<import("@prisma/client").Prisma.BatchPayload>;
export declare function getUserCurrentRoom(userId: string): Promise<({
    room: {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        name: string;
        type: string;
        maxMembers: number;
    };
} & {
    userId: string;
    id: string;
    role: string;
    joinedAt: Date;
    roomId: string;
}) | null>;
//# sourceMappingURL=room.service.d.ts.map
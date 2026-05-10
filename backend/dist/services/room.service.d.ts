export interface CreateRoomInput {
    name: string;
    type?: string;
    maxMembers?: number;
    ownerId: string;
}
export declare function createRoom(input: CreateRoomInput): Promise<any>;
export declare function listRooms(): Promise<any>;
export declare function getRoomById(roomId: string): Promise<any>;
export declare function addMemberToRoom(roomId: string, userId: string, role?: string): Promise<any>;
export declare function removeMemberFromRoom(roomId: string, userId: string): Promise<any>;
export declare function getUserCurrentRoom(userId: string): Promise<any>;
//# sourceMappingURL=room.service.d.ts.map
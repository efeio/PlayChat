import type { FastifyRequest, FastifyReply } from 'fastify';
interface CreateRoomBody {
    name: string;
    type?: string;
    maxMembers?: number;
}
interface RoomParams {
    id: string;
}
export declare function list(_request: FastifyRequest, reply: FastifyReply): Promise<never>;
export declare function create(request: FastifyRequest<{
    Body: CreateRoomBody;
}>, reply: FastifyReply): Promise<never>;
export declare function getById(request: FastifyRequest<{
    Params: RoomParams;
}>, reply: FastifyReply): Promise<never>;
export {};
//# sourceMappingURL=room.controller.d.ts.map
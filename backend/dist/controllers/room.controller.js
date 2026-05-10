import { createRoom, listRooms, getRoomById } from '../services/room.service.js';
export async function list(_request, reply) {
    const rooms = await listRooms();
    return reply.send(rooms);
}
export async function create(request, reply) {
    const { name, type, maxMembers } = request.body;
    if (!name) {
        return reply.status(400).send({ error: 'Room name is required' });
    }
    if (!request.user) {
        return reply.status(401).send({ error: 'Authentication required' });
    }
    try {
        const room = await createRoom({
            name,
            type,
            maxMembers,
            ownerId: request.user.userId,
        });
        return reply.status(201).send(room);
    }
    catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to create room';
        return reply.status(400).send({ error: message });
    }
}
export async function getById(request, reply) {
    const room = await getRoomById(request.params.id);
    if (!room) {
        return reply.status(404).send({ error: 'Room not found' });
    }
    return reply.send(room);
}
//# sourceMappingURL=room.controller.js.map
import { authenticate } from '../middleware/authenticate.js';
import { list, create, getById } from '../controllers/room.controller.js';
export async function roomRoutes(app) {
    app.get('/api/rooms', list);
    app.post('/api/rooms', { preHandler: [authenticate] }, create);
    app.get('/api/rooms/:id', getById);
}
//# sourceMappingURL=room.routes.js.map
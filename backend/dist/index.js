import Fastify from 'fastify';
import cors from '@fastify/cors';
import { register, login } from './controllers/auth.controller.js';
import { list, create, getById } from './controllers/room.controller.js';
import { authenticate } from './middleware/authenticate.js';
import { errorHandler } from './middleware/errorHandler.js';
import { initSocket } from './socket/index.js';
import env from './config/env.js';
async function main() {
    const app = Fastify({
        logger: true,
    });
    await app.register(cors, {
        origin: env.CORS_ORIGIN,
        credentials: true,
    });
    app.setErrorHandler(errorHandler);
    /* Auth routes */
    app.post('/api/auth/register', register);
    app.post('/api/auth/login', login);
    /* Room routes */
    app.get('/api/rooms', list);
    app.post('/api/rooms', { preHandler: [authenticate] }, create);
    app.get('/api/rooms/:id', getById);
    /* Health check */
    app.get('/api/health', async () => {
        return { status: 'ok', timestamp: new Date().toISOString() };
    });
    await app.listen({ port: env.PORT, host: '0.0.0.0' });
    /* Attach Socket.IO to the underlying http server */
    initSocket(app.server);
}
main().catch((err) => {
    process.stderr.write(`Failed to start server: ${err}\n`);
    process.exit(1);
});
//# sourceMappingURL=index.js.map
import { Server } from 'socket.io';
import jwt from 'jsonwebtoken';
import env from '../config/env.js';
import { registerRoomHandlers } from './handlers/room.handler.js';
import { registerGameHandlers, cancelDisconnectTimer } from './handlers/game.handler.js';
export function initSocket(httpServer) {
    const io = new Server(httpServer, {
        cors: {
            origin: env.CORS_ORIGIN,
            methods: ['GET', 'POST'],
            credentials: true,
        },
    });
    io.on('connection', (socket) => {
        socket.on('authenticate', (data, callback) => {
            if (socket.data.authenticated) {
                if (callback)
                    callback({});
                return;
            }
            try {
                const decoded = jwt.verify(data.token, env.JWT_SECRET);
                socket.data.userId = decoded.userId;
                socket.data.username = decoded.username;
                socket.data.authenticated = true;
                /* INV-008: Cancel any pending disconnect timer */
                cancelDisconnectTimer(decoded.userId);
                /* Register handlers after authentication */
                registerRoomHandlers(io, socket);
                registerGameHandlers(io, socket);
                socket.emit('authenticated', { userId: decoded.userId, username: decoded.username });
                if (callback)
                    callback({});
            }
            catch {
                socket.emit('error', { message: 'Authentication failed' });
                if (callback)
                    callback({ error: 'Invalid token' });
            }
        });
    });
    return io;
}
//# sourceMappingURL=index.js.map
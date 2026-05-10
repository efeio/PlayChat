import { Server } from 'socket.io';
import type { Server as HttpServer } from 'http';
import jwt from 'jsonwebtoken';
import env from '../config/env.js';
import type { JwtPayload } from '../middleware/authenticate.js';
import { registerRoomHandlers } from './handlers/room.handler.js';
import { registerGameHandlers, cancelDisconnectTimer } from './handlers/game.handler.js';

export function initSocket(httpServer: HttpServer): Server {
  const io = new Server(httpServer, {
    cors: {
      origin: env.CORS_ORIGIN,
      methods: ['GET', 'POST'],
      credentials: true,
    },
  });

  io.on('connection', (socket) => {
    socket.on('authenticate', (data: { token: string }, callback?: (res: { error?: string }) => void) => {
      if (socket.data.authenticated) {
        if (callback) callback({});
        return;
      }

      try {
        const decoded = jwt.verify(data.token, env.JWT_SECRET) as JwtPayload;
        socket.data.userId = decoded.userId;
        socket.data.username = decoded.username;
        socket.data.authenticated = true;

        /* INV-008: Cancel any pending disconnect timer */
        cancelDisconnectTimer(decoded.userId);

        /* Register handlers after authentication */
        registerRoomHandlers(io, socket);
        registerGameHandlers(io, socket);

        socket.emit('authenticated', { userId: decoded.userId, username: decoded.username });
        if (callback) callback({});
      } catch {
        socket.emit('error', { message: 'Authentication failed' });
        if (callback) callback({ error: 'Invalid token' });
      }
    });
  });

  return io;
}

import type { Server, Socket } from 'socket.io';
import { GameEngine, type GameState } from '../../games/GameEngine.js';
declare const activeGames: Map<string, {
    engine: GameEngine;
    state: GameState;
    gameId: string;
    roomId: string;
}>;
export declare function registerGameHandlers(io: Server, socket: Socket): void;
export declare function cancelDisconnectTimer(userId: string): void;
export declare function handlePlayerLeftRoom(io: Server, userId: string, roomId: string): Promise<void>;
export { activeGames };
//# sourceMappingURL=game.handler.d.ts.map
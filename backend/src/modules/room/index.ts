export { registerRoomRoutes } from './room.routes.js';
export { registerRoomSocketHandlers } from './room.socket-handler.js';
export {
  createRoom,
  listRooms,
  getRoomById,
  addMemberToRoom,
  removeMemberFromRoom,
  promoteNextOwner,
  verifyRoomPassword,
} from './room.service.js';
export type { CreateRoomInput } from './room.service.js';

export { registerGameSocketHandlers, sanitizeStateForClient, cancelDisconnectTimer, handlePlayerLeftRoom } from './game.socket-handler.js';
export {
  getActiveGames,
  getActiveGame,
  getGameEngine,
  registerGameEngine,
  registerActiveGame,
  updateAndPersistState,
  finishGame,
  removeFromMemory,
  rehydrateActiveGames,
  startSnapshotInterval,
  stopSnapshotInterval,
  clearAllSnapshots,
  getServiceStats,
} from './game-state.service.js';
export type { ActiveGameEntry } from './game-state.service.js';
export { GameRegistry, GameEngine, Wordle } from './engines/index.js';
export type { GameState, Move } from './engines/index.js';

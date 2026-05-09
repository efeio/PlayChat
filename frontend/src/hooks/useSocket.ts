import { useSocket as useSocketContext } from '../context/SocketContext';

export function useSocket() {
  return useSocketContext();
}

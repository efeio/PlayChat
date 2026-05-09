import { createContext, useContext, useEffect, useState, useRef, type ReactNode } from 'react';
import { io, type Socket } from 'socket.io-client';
import { useAuth } from './AuthContext';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:3001';

interface SocketContextValue {
  socket: Socket | null;
  isConnected: boolean;
  isAuthenticated: boolean;
}

const SocketContext = createContext<SocketContextValue>({
  socket: null,
  isConnected: false,
  isAuthenticated: false,
});

export function SocketProvider({ children }: { children: ReactNode }) {
  const { token, isAuthenticated: authReady } = useAuth();
  const [isConnected, setIsConnected] = useState(false);
  const [isSocketAuthenticated, setIsSocketAuthenticated] = useState(false);
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    if (!authReady || !token) {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
        setIsConnected(false);
        setIsSocketAuthenticated(false);
      }
      return;
    }

    const socket = io(SOCKET_URL, {
      transports: ['websocket', 'polling'],
      autoConnect: true,
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      setIsConnected(true);
      /* Immediately authenticate */
      socket.emit('authenticate', { token });
    });

    socket.on('authenticated', () => {
      setIsSocketAuthenticated(true);
    });

    socket.on('disconnect', () => {
      setIsConnected(false);
      setIsSocketAuthenticated(false);
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
      setIsConnected(false);
      setIsSocketAuthenticated(false);
    };
  }, [token, authReady]);

  return (
    <SocketContext.Provider
      value={{
        socket: socketRef.current,
        isConnected,
        isAuthenticated: isSocketAuthenticated,
      }}
    >
      {children}
    </SocketContext.Provider>
  );
}

export function useSocket() {
  return useContext(SocketContext);
}

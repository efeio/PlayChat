import { createContext, useContext, useEffect, useState, useRef, type ReactNode } from 'react';
import { io, type Socket } from 'socket.io-client';
import { useAuth } from './AuthContext';

function resolveSocketUrl(): string {
  if (import.meta.env.VITE_SOCKET_URL) return import.meta.env.VITE_SOCKET_URL;
  const { protocol, hostname } = window.location;
  return `${protocol}//${hostname}:3001`;
}

const SOCKET_URL = resolveSocketUrl();

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
  const { token, isAuthenticated: authReady, logout } = useAuth();
  const logoutRef = useRef(logout);
  logoutRef.current = logout;
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isSocketAuthenticated, setIsSocketAuthenticated] = useState(false);
  const socketRef = useRef<Socket | null>(null);
  const tokenRef = useRef<string | null>(null);

  tokenRef.current = token;

  useEffect(() => {
    if (!authReady || !token) {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
        setSocket(null);
        setIsConnected(false);
        setIsSocketAuthenticated(false);
      }
      return;
    }

    const s = io(SOCKET_URL, {
      transports: ['websocket'],
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
    });

    socketRef.current = s;
    setSocket(s);

    s.on('connect', () => {
      setIsConnected(true);
      setIsSocketAuthenticated(false);
      const currentToken = tokenRef.current;
      if (currentToken) {
        s.emit('authenticate', { token: currentToken });
      }
    });

    s.on('authenticated', () => {
      setIsSocketAuthenticated(true);
    });

    s.on('session:expired', () => {
      setIsSocketAuthenticated(false);
      s.disconnect();
      logoutRef.current();
    });

    s.on('disconnect', () => {
      setIsConnected(false);
      setIsSocketAuthenticated(false);
    });

    return () => {
      s.disconnect();
      socketRef.current = null;
      setSocket(null);
      setIsConnected(false);
      setIsSocketAuthenticated(false);
    };
  }, [token, authReady]);

  return (
    <SocketContext.Provider
      value={{
        socket,
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

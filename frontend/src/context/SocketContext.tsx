import { createContext, useContext, useEffect, useState, useRef, type ReactNode } from 'react';
import { io, type Socket } from 'socket.io-client';
import { useAuth } from './AuthContext';
import { useToast } from './ToastContext';

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
  const { addToast } = useToast();
  const [isConnected, setIsConnected] = useState(false);
  const [isSocketAuthenticated, setIsSocketAuthenticated] = useState(false);
  const socketRef = useRef<Socket | null>(null);
  // Track if we were previously connected to distinguish initial connect from reconnect
  const wasConnectedRef = useRef(false);

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

      if (wasConnectedRef.current) {
         addToast('success', 'Bağlantı tekrar sağlandı.');
      }
      wasConnectedRef.current = true;

      /* Immediately authenticate */
      socket.emit('authenticate', { token });
    });

    socket.on('authenticated', () => {
      setIsSocketAuthenticated(true);
    });

    socket.on('disconnect', (reason) => {
      setIsConnected(false);
      setIsSocketAuthenticated(false);
      if (reason === 'io server disconnect') {
        // the disconnection was initiated by the server
        addToast('error', 'Sunucu tarafından bağlantı kesildi.');
      } else if (reason === 'transport close' || reason === 'ping timeout') {
        addToast('error', 'Bağlantı koptu, yeniden bağlanılıyor...');
      }
    });

    socket.on('connect_error', (err) => {
      // Prevents spamming toast if we continuously fail to connect
      if (wasConnectedRef.current) {
         addToast('error', 'Bağlantı hatası: ' + err.message);
         wasConnectedRef.current = false;
      }
    });

    socket.on('error', (err: { message: string }) => {
      addToast('error', err.message || 'Soket hatası');
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

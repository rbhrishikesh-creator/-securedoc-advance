import React, { createContext, useContext, useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuth } from './AuthContext';
import { useToast } from './ToastContext';

interface SocketContextType {
  socket: Socket | null;
  isConnected: boolean;
  joinDocument: (documentId: string) => void;
  leaveDocument: (documentId: string) => void;
}

const SocketContext = createContext<SocketContextType | undefined>(undefined);

export const SocketProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const { token } = useAuth();
  const { showToast } = useToast();

  useEffect(() => {
    if (!token) {
      if (socket) {
        socket.disconnect();
        setSocket(null);
        setIsConnected(false);
      }
      return;
    }

    // Connect using relative origin through Vite proxy
    const s = io(window.location.origin, {
      path: '/socket.io',
      auth: { token },
      autoConnect: true,
      transports: ['websocket', 'polling'],
    });

    s.on('connect', () => {
      setIsConnected(true);
    });

    s.on('disconnect', () => {
      setIsConnected(false);
    });

    // Listen for direct user notifications
    s.on('notification', (payload: any) => {
      showToast({
        type: 'info',
        title: payload.title || 'Security Notification',
        message: payload.message || 'You have a new collaboration event.',
      });
    });

    setSocket(s);

    return () => {
      s.disconnect();
    };
  }, [token]);

  const joinDocument = (documentId: string) => {
    if (socket) {
      socket.emit('join:document', documentId);
    }
  };

  const leaveDocument = (documentId: string) => {
    if (socket) {
      socket.emit('leave:document', documentId);
    }
  };

  return (
    <SocketContext.Provider value={{ socket, isConnected, joinDocument, leaveDocument }}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) throw new Error('useSocket must be used within SocketProvider');
  return context;
};

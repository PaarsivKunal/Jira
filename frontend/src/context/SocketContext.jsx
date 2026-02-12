import { createContext, useContext, useEffect, useState, useRef } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';
import { useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';

const SocketContext = createContext();

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
};

export const SocketProvider = ({ children }) => {
  const { user } = useAuth();
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const queryClient = useQueryClient();
  const socketRef = useRef(null);

  useEffect(() => {
    if (!user) {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
        setSocket(null);
        setIsConnected(false);
      }
      return;
    }

    // Connect to same domain in production
    const socketUrl = window.location.origin;

    const newSocket = io(socketUrl, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5,
    });

    socketRef.current = newSocket;
    setSocket(newSocket);

    newSocket.on('connect', () => {
      setIsConnected(true);
      console.log('Socket connected');
    });

    newSocket.on('disconnect', () => {
      setIsConnected(false);
      console.log('Socket disconnected');
    });

    newSocket.on('connect_error', (error) => {
      console.error('Socket connection error:', error);
    });

    // Example real-time events
    newSocket.on('issue:created', (issue) => {
      queryClient.invalidateQueries(['issues']);
      toast.success(`New issue created: ${issue.title}`);
    });

    newSocket.on('issue:updated', () => {
      queryClient.invalidateQueries(['issues']);
    });

    newSocket.on('issue:deleted', () => {
      queryClient.invalidateQueries(['issues']);
      toast.success('Issue deleted');
    });

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current.removeAllListeners();
      }
      socketRef.current = null;
      setSocket(null);
      setIsConnected(false);
    };
  }, [user, queryClient]);

  const joinProject = (projectId) => {
    if (socketRef.current && projectId) {
      socketRef.current.emit('join-project', projectId);
    }
  };

  const leaveProject = (projectId) => {
    if (socketRef.current && projectId) {
      socketRef.current.emit('leave-project', projectId);
    }
  };

  return (
    <SocketContext.Provider value={{ socket, isConnected, joinProject, leaveProject }}>
      {children}
    </SocketContext.Provider>
  );
};

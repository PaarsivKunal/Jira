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
      // Disconnect if user logs out
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
        setSocket(null);
        setIsConnected(false);
      }
      return;
    }

    // Get API URL from environment or default
    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
    const socketUrl = API_URL.replace('/api', ''); // Remove /api if present

    // Create socket connection
    const newSocket = io(socketUrl, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5,
    });

    socketRef.current = newSocket;
    setSocket(newSocket);

    // Connection event handlers
    newSocket.on('connect', () => {
      setIsConnected(true);
      if (import.meta.env.DEV) {
        console.log('Socket connected');
      }
    });

    newSocket.on('disconnect', () => {
      setIsConnected(false);
      if (import.meta.env.DEV) {
        console.log('Socket disconnected');
      }
    });

    newSocket.on('connect_error', (error) => {
      if (import.meta.env.DEV) {
        console.error('Socket connection error:', error);
      }
    });

    // Real-time event handlers
    newSocket.on('issue:created', (issue) => {
      // Invalidate issues queries to refetch
      queryClient.invalidateQueries(['issues']);
      queryClient.invalidateQueries(['issues', issue.projectId?._id || issue.projectId]);
      
      // Show notification
      toast.success(`New issue created: ${issue.title}`, {
        duration: 3000,
      });
    });

    newSocket.on('issue:updated', (issue) => {
      // Invalidate specific issue and issues list
      queryClient.invalidateQueries(['issue', issue._id]);
      queryClient.invalidateQueries(['issues']);
      queryClient.invalidateQueries(['issues', issue.projectId?._id || issue.projectId]);
    });

    newSocket.on('issue:status_updated', (issue) => {
      queryClient.invalidateQueries(['issue', issue._id]);
      queryClient.invalidateQueries(['issues']);
      queryClient.invalidateQueries(['issues', issue.projectId?._id || issue.projectId]);
      
      toast.success(`Issue status updated: ${issue.title}`, {
        duration: 2000,
      });
    });

    newSocket.on('issue:deleted', ({ issueId, projectId }) => {
      queryClient.invalidateQueries(['issue', issueId]);
      queryClient.invalidateQueries(['issues']);
      queryClient.invalidateQueries(['issues', projectId]);
      
      toast.success('Issue deleted', {
        duration: 2000,
      });
    });

    newSocket.on('issue:approved', (issue) => {
      queryClient.invalidateQueries(['issue', issue._id]);
      queryClient.invalidateQueries(['issues']);
      
      toast.success(`Issue approved: ${issue.title}`, {
        duration: 3000,
      });
    });

    newSocket.on('issue:rejected', (issue) => {
      queryClient.invalidateQueries(['issue', issue._id]);
      queryClient.invalidateQueries(['issues']);
      
      toast.error(`Issue rejected: ${issue.title}`, {
        duration: 3000,
      });
    });

    newSocket.on('comment:created', (comment) => {
      queryClient.invalidateQueries(['comments', comment.issueId]);
      queryClient.invalidateQueries(['issue', comment.issueId]);
    });

    newSocket.on('comment:updated', (comment) => {
      queryClient.invalidateQueries(['comments', comment.issueId]);
    });

    newSocket.on('comment:deleted', ({ commentId, issueId }) => {
      queryClient.invalidateQueries(['comments', issueId]);
    });

    newSocket.on('worklog:created', (workLog) => {
      queryClient.invalidateQueries(['workLogs', workLog.issueId]);
      queryClient.invalidateQueries(['issue', workLog.issueId]);
    });

    newSocket.on('worklog:updated', (workLog) => {
      queryClient.invalidateQueries(['workLogs', workLog.issueId]);
      queryClient.invalidateQueries(['issue', workLog.issueId]);
    });

    newSocket.on('worklog:deleted', ({ workLogId, issueId }) => {
      queryClient.invalidateQueries(['workLogs', issueId]);
      queryClient.invalidateQueries(['issue', issueId]);
    });

    // Cleanup on unmount
    return () => {
      newSocket.disconnect();
      socketRef.current = null;
      setSocket(null);
      setIsConnected(false);
    };
  }, [user, queryClient]);

  // Function to join a project room
  const joinProject = (projectId) => {
    if (socketRef.current && projectId) {
      socketRef.current.emit('join-project', projectId);
    }
  };

  // Function to leave a project room
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


import React, { createContext, useContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';

// Create SocketContext
const SocketContext = createContext({});

// Custom hook to use SocketContext
export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
};

// SocketProvider component
export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const [connected, setConnected] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const { user, idToken } = useAuth();

  useEffect(() => {
    if (user && idToken) {
      // Initialize socket connection with authentication
      const newSocket = io('http://localhost:3001', {
        auth: {
          token: idToken
        }
      });

      newSocket.on('connect', () => {
        console.log('Connected to server');
        setConnected(true);
        
        // Emit user online status
        newSocket.emit('user_online');
      });

      newSocket.on('disconnect', () => {
        console.log('Disconnected from server');
        setConnected(false);
      });

      newSocket.on('connect_error', (error) => {
        console.error('Socket connection error:', error);
        setConnected(false);
      });

      // Handle user status updates
      newSocket.on('user_status', (data) => {
        console.log('User status update:', data);
        setOnlineUsers(prev => {
          if (data.status === 'online') {
            return [...prev.filter(u => u.userId !== data.userId), data];
          } else {
            return prev.filter(u => u.userId !== data.userId);
          }
        });
      });

      setSocket(newSocket);

      return () => {
        newSocket.close();
        setSocket(null);
        setConnected(false);
      };
    }
  }, [user, idToken]);

  // Send message function
  const sendMessage = (receiverId, content) => {
    if (socket && connected) {
      socket.emit('send_message', { receiverId, content });
    }
  };

  // Get message history function
  const getMessages = (friendId, limit = 50) => {
    if (socket && connected) {
      socket.emit('get_messages', { friendId, limit });
    }
  };

  // Typing indicators
  const startTyping = (receiverId) => {
    if (socket && connected) {
      socket.emit('typing_start', { receiverId });
    }
  };

  const stopTyping = (receiverId) => {
    if (socket && connected) {
      socket.emit('typing_stop', { receiverId });
    }
  };

  const value = {
    socket,
    connected,
    onlineUsers,
    sendMessage,
    getMessages,
    startTyping,
    stopTyping
  };

  return (
    <SocketContext.Provider value={value}>
      {children}
    </SocketContext.Provider>
  );
};
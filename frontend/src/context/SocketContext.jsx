import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';

// Buat SocketContext untuk mengelola koneksi real-time
const SocketContext = createContext({});

// Custom hook untuk menggunakan SocketContext
export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket harus digunakan di dalam SocketProvider');
  }
  return context;
};

// SocketProvider component - Provider untuk socket connection
export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const [connected, setConnected] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [messages, setMessages] = useState({}); // Format: { friendId: [messages] }
  const [chatRooms, setChatRooms] = useState([]); // Untuk sidebar WA-like
  const [typingUsers, setTypingUsers] = useState({}); // Format: { userId: true/false }
  const { user, idToken } = useAuth();

  // Setup socket connection saat user login
  useEffect(() => {
    if (user && idToken) {
      console.log('🔌 [SOCKET] Menghubungkan socket untuk user:', user.email);

      // Reset messages saat user berubah (login baru)
      console.log('🔄 [SOCKET] Reset messages untuk user baru');
      setMessages({});

      // Inisialisasi koneksi socket dengan autentikasi
      const newSocket = io(import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001', {
        auth: {
          token: idToken
        },
        transports: ['websocket', 'polling'], // Fallback transport
        reconnection: true, // Auto reconnect
        reconnectionAttempts: 5,
        reconnectionDelay: 1000
      });

      // Event: Berhasil terhubung
      newSocket.on('connect', () => {
        console.log('✅ [SOCKET] Berhasil terhubung ke server');
        setConnected(true);

        // Emit status user online
        newSocket.emit('user_online');
      });

      // Event: Koneksi terputus
      newSocket.on('disconnect', (reason) => {
        console.log('🔴 [SOCKET] Koneksi terputus:', reason);
        setConnected(false);
      });

      // Event: Error koneksi
      newSocket.on('connect_error', (error) => {
        console.error('❌ [SOCKET] Error koneksi:', error);
        setConnected(false);
      });

      // Event: Reconnecting
      newSocket.on('reconnect', (attemptNumber) => {
        console.log('🔄 [SOCKET] Reconnected setelah', attemptNumber, 'percobaan');
        setConnected(true);
        newSocket.emit('user_online');
      });

      // Event: Update status user (online/offline)
      newSocket.on('user_status', (data) => {
        console.log('👤 [SOCKET] Update status user:', data);
        setOnlineUsers(prev => {
          if (data.status === 'online') {
            return [...prev.filter(u => u.userId !== data.userId), data];
          } else {
            return prev.filter(u => u.userId !== data.userId);
          }
        });
      });

      // Event: Terima pesan baru
      newSocket.on('receive_message', (messageData) => {
        console.log('📨 [SOCKET] Terima pesan baru:', messageData);

        // Tambahkan pesan ke state messages
        setMessages(prev => {
          const senderId = messageData.senderId;
          const currentMessages = prev[senderId] || [];

          // Cek duplikasi berdasarkan ID pesan
          const isDuplicate = currentMessages.some(msg => msg.id === messageData.id);
          if (isDuplicate) {
            console.log('⚠️ [SOCKET] Pesan duplikat diabaikan:', messageData.id);
            return prev;
          }

          return {
            ...prev,
            [senderId]: [...currentMessages, messageData]
          };
        });

        // Update daftar chat/sidebar (last message + unread)
        setChatRooms(prev => {
          const friendId = messageData.senderId;
          const existing = prev.find(r => r.friendId === friendId);
          const updated = {
            friendId,
            lastMessage: messageData.content,
            lastMessageAt: messageData.createdAt,
            unreadCount: (existing?.unreadCount || 0) + 1,
            chatRoomId: messageData.chatRoomId,
          };
          const others = prev.filter(r => r.friendId !== friendId);
          return [updated, ...others].sort((a, b) => new Date(b.lastMessageAt) - new Date(a.lastMessageAt));
        });

        // Play notification sound (opsional)
        // playNotificationSound();
      });

      // Event: Konfirmasi pesan terkirim
      newSocket.on('message_sent', (messageData) => {
        console.log('✅ [SOCKET] Pesan berhasil terkirim:', messageData);

        // Update status pesan di UI jadi "sent"
        setMessages(prev => {
          const receiverId = messageData.receiverId;
          const currentMessages = prev[receiverId] || [];

          // Ganti optimistic message berdasarkan tempId jika ada
          let replaced = false;
          const replacedList = currentMessages.map(msg => {
            if (messageData.tempId && msg.tempId === messageData.tempId) {
              replaced = true;
              return { ...msg, ...messageData, id: messageData.id, status: 'sent' };
            }
            return msg;
          });

          // Jika tidak ada yang terganti (mis. refresh), hindari duplikasi id
          const alreadyExists = replacedList.some(m => m.id === messageData.id);
          const nextList = replaced
            ? replacedList
            : (alreadyExists ? replacedList : [...replacedList, { ...messageData, status: 'sent' }]);

          return { ...prev, [receiverId]: nextList };
        });
      });

      // Event: Riwayat pesan
      newSocket.on('messages_history', (data) => {
        console.log('📋 [SOCKET] Terima riwayat pesan:', data);

        // Pastikan list unik berdasarkan id
        const unique = [];
        const seen = new Set();
        for (const m of data.messages || []) {
          if (m.id && !seen.has(m.id)) {
            seen.add(m.id);
            unique.push(m);
          } else if (!m.id) {
            unique.push(m);
          }
        }

        setMessages(prev => ({
          ...prev,
          [data.friendId]: unique
        }));

        // Reset unread count secara optimistic saat membuka chat
        setChatRooms(prev => prev.map(r => r.friendId === data.friendId ? { ...r, unreadCount: 0 } : r));
      });

      // Event: User sedang mengetik
      newSocket.on('user_typing', (data) => {
        console.log('⌨️ [SOCKET] User typing:', data);

        setTypingUsers(prev => ({
          ...prev,
          [data.userId]: data.isTyping
        }));

        // Auto clear typing setelah 3 detik
        if (data.isTyping) {
          setTimeout(() => {
            setTypingUsers(prev => ({
              ...prev,
              [data.userId]: false
            }));
          }, 3000);
        }
      });

      // Event: Error pesan
      newSocket.on('message_error', (error) => {
        console.error('❌ [SOCKET] Error pesan:', error);
        alert(`Error: ${error.message}`);
      });

      // Event: Error messages
      newSocket.on('messages_error', (error) => {
        console.error('❌ [SOCKET] Error mengambil pesan:', error);
      });

      // Event: Pesan sudah dibaca
      newSocket.on('message_read', (data) => {
        console.log('👀 [SOCKET] Pesan sudah dibaca:', data);

        // Update status pesan di UI
        setMessages(prev => {
          const updatedMessages = {};

          Object.keys(prev).forEach(friendId => {
            updatedMessages[friendId] = prev[friendId].map(msg =>
              msg.id === data.messageId
                ? { ...msg, isRead: true, readAt: data.readAt }
                : msg
            );
          });

          return updatedMessages;
        });
      });

      setSocket(newSocket);

      // Cleanup saat component unmount
      return () => {
        console.log('🔌 [SOCKET] Menutup koneksi socket');
        newSocket.close();
        setSocket(null);
        setConnected(false);
        setMessages({});
  setTypingUsers({});
  setChatRooms([]);
      };
    } else {
      // Reset state saat user logout
      console.log('🔄 [SOCKET] User logout - reset socket state');
      setSocket(null);
      setConnected(false);
      setMessages({});
      setTypingUsers({});
    setOnlineUsers([]);
    setChatRooms([]);
    }
  }, [user, idToken]);

  // Fungsi: Kirim pesan
  const sendMessage = useCallback((receiverId, content, messageType = 'text') => {
    if (!socket || !connected) {
      console.error('❌ [SOCKET] Tidak dapat mengirim pesan - socket tidak terhubung');
      return;
    }

    console.log(`📤 [SOCKET] Mengirim pesan ke ${receiverId}:`, content);

    // Buat temporary ID untuk optimistic UI
    const tempId = `temp_${Date.now()}_${Math.random()}`;

    // Tambahkan pesan ke UI secara optimistic
    const optimisticMessage = {
      id: tempId,
      tempId,
      senderId: user.uid,
      receiverId,
      content,
      messageType,
      createdAt: new Date().toISOString(),
      status: 'sending' // Status sementara
    };

    setMessages(prev => ({
      ...prev,
      [receiverId]: [...(prev[receiverId] || []), optimisticMessage]
    }));

    // Update chatRooms locally
    setChatRooms(prev => {
      const existing = prev.find(r => r.friendId === receiverId);
      const updated = {
        friendId: receiverId,
        lastMessage: content,
        lastMessageAt: optimisticMessage.createdAt,
        unreadCount: 0,
        chatRoomId: existing?.chatRoomId,
      };
      const others = prev.filter(r => r.friendId !== receiverId);
      return [updated, ...others].sort((a, b) => new Date(b.lastMessageAt) - new Date(a.lastMessageAt));
    });

    // Kirim pesan ke server
    socket.emit('send_message', { receiverId, content, messageType, tempId });

  }, [socket, connected, user?.uid]);

  // Fungsi: Ambil riwayat pesan
  const getMessages = useCallback((friendId, limit = 50) => {
    if (!socket || !connected) {
      console.error('❌ [SOCKET] Tidak dapat mengambil pesan - socket tidak terhubung');
      return;
    }

    console.log(`📋 [SOCKET] Mengambil riwayat pesan dengan ${friendId}`);
    socket.emit('get_messages', { friendId, limit });
  }, [socket, connected]);

  // Ambil daftar chat rooms (untuk sidebar)
  const fetchChatRooms = useCallback(async () => {
    if (!user) return;
    try {
      const res = await fetch(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001'}/api/chat/rooms`, {
        headers: { Authorization: `Bearer ${await user.getIdToken()}` }
      });
      const data = await res.json();
      if (data.success) {
        // Sort desc by lastMessageAt
        const sorted = (data.data || []).sort((a, b) => new Date(b.lastMessageAt || 0) - new Date(a.lastMessageAt || 0));
        setChatRooms(sorted);
      }
    } catch (e) {
      console.error('❌ [SOCKET] Gagal mengambil chat rooms:', e);
    }
  }, [user]);

  // Reset unread untuk friend tertentu (server + client)
  const resetUnreadForFriend = useCallback(async (friendId) => {
    setChatRooms(prev => prev.map(r => r.friendId === friendId ? { ...r, unreadCount: 0 } : r));
    if (!user) return;
    try {
      await fetch(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001'}/api/chat/read-all/${friendId}`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${await user.getIdToken()}` }
      });
    } catch (e) {
      console.error('❌ [SOCKET] Gagal reset unread:', e);
    }
  }, [user]);

  // Fungsi: Mulai mengetik
  const startTyping = useCallback((receiverId) => {
    if (!socket || !connected) return;

    console.log(`⌨️ [SOCKET] Mulai mengetik ke ${receiverId}`);
    socket.emit('typing_start', { receiverId });
  }, [socket, connected]);

  // Fungsi: Berhenti mengetik
  const stopTyping = useCallback((receiverId) => {
    if (!socket || !connected) return;

    console.log(`⌨️ [SOCKET] Berhenti mengetik ke ${receiverId}`);
    socket.emit('typing_stop', { receiverId });
  }, [socket, connected]);

  // Fungsi: Tandai pesan sudah dibaca
  const markAsRead = useCallback((messageId, senderId) => {
    if (!socket || !connected) return;

    console.log(`👀 [SOCKET] Tandai pesan ${messageId} sudah dibaca`);
    socket.emit('mark_as_read', { messageId, senderId });
  }, [socket, connected]);

  // Fungsi: Clear messages untuk friend tertentu
  const clearMessages = useCallback((friendId) => {
    setMessages(prev => ({
      ...prev,
      [friendId]: []
    }));
  }, []);

  // Value yang akan diberikan ke context consumer
  const value = {
    socket,
    connected,
    onlineUsers,
    messages,
    chatRooms,
    typingUsers,
    sendMessage,
    getMessages,
    fetchChatRooms,
    resetUnreadForFriend,
    startTyping,
    stopTyping,
    markAsRead,
    clearMessages
  };

  return (
    <SocketContext.Provider value={value}>
      {children}
    </SocketContext.Provider>
  );
};

export default SocketContext;
import React, { useState, useEffect, useRef } from 'react';
import { LogOut, Users, MessageCircle, Send } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import Navigation from '../components/Navigation';
import { apiCallWithAuth } from '../utils/api';

const ChatPage = () => {
  // State untuk komponen chat
  const [selectedFriend, setSelectedFriend] = useState(null);
  const [friends, setFriends] = useState([]);
  const [messageText, setMessageText] = useState('');
  const [loadingFriends, setLoadingFriends] = useState(true);

  // Ref untuk auto scroll
  const messagesEndRef = useRef(null);

  // Context hooks
  const { user, logout } = useAuth();
  const {
    connected,
    onlineUsers,
    messages,
    chatRooms,
    fetchChatRooms,
    resetUnreadForFriend,
    sendMessage,
    getMessages
  } = useSocket();

  // Auto scroll ke pesan terbaru
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Load daftar teman saat component mount atau user berubah
  useEffect(() => {
    if (user) {
      console.log('👥 [CHAT PAGE] User login detected, loading friends & chat rooms...');
      loadFriends();
      fetchChatRooms();
    }
  }, [user, fetchChatRooms]);

  // Load riwayat pesan saat pilih teman
  useEffect(() => {
    if (selectedFriend) {
      console.log(`📋 [CHAT PAGE] Memuat pesan untuk teman: ${selectedFriend.uid}`);
      getMessages(selectedFriend.uid);
      resetUnreadForFriend(selectedFriend.uid);
    }
  }, [selectedFriend, getMessages, resetUnreadForFriend]);

  // Auto scroll saat ada pesan baru
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Fungsi: Load daftar teman
  const loadFriends = async () => {
    try {
      console.log('👥 [CHAT PAGE] Memuat daftar teman...');
      setLoadingFriends(true);

      const response = await apiCallWithAuth('/api/friends/list', {}, user);

      if (response.success) {
        setFriends(response.friends || []);
        console.log(`✅ [CHAT PAGE] Berhasil memuat ${response.friends?.length || 0} teman`);
      }
    } catch (error) {
      console.error('❌ [CHAT PAGE] Error memuat teman:', error);
    } finally {
      setLoadingFriends(false);
    }
  };

  // Fungsi: Handle logout
  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('❌ [CHAT PAGE] Logout error:', error);
    }
  };

  // Fungsi: Kirim pesan
  const handleSendMessage = (e) => {
    e.preventDefault();

    if (!messageText.trim() || !selectedFriend) {
      return;
    }

    console.log(`📤 [CHAT PAGE] Mengirim pesan ke ${selectedFriend.displayName}: ${messageText}`);

    // Kirim pesan via socket
    sendMessage(selectedFriend.uid, messageText.trim());

    // Clear input
    setMessageText('');
  };

  // Fungsi: Check apakah user sedang online
  const isUserOnline = (userId) => {
    return onlineUsers.some(user => user.userId === userId);
  };

  // Get current friend's messages and ensure uniqueness by id
  const currentMessages = (() => {
    if (!selectedFriend) return [];
    const list = messages[selectedFriend.uid] || [];
    const seen = new Set();
    const unique = [];
    for (const m of list) {
      const key = m.id || m.tempId || `${m.senderId}-${m.createdAt}`;
      if (!seen.has(key)) {
        seen.add(key);
        unique.push(m);
      }
    }
    return unique;
  })();

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      <div className="h-screen flex bg-white">
        {/* Sidebar - Daftar Teman */}
        <div className="w-80 bg-gray-50 border-r border-gray-200 flex flex-col">
          {/* Header */}
          <div className="p-4 border-b border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center">
                <div className="bg-blue-600 p-2 rounded-full mr-3">
                  <MessageCircle className="h-5 w-5 text-white" />
                </div>
                <h1 className="text-xl font-bold text-gray-900">ChatKuy</h1>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => window.location.href = '/friends'}
                  className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-200 rounded-md"
                  title="Kelola Teman"
                >
                  <Users className="h-4 w-4" />
                </button>
                <button
                  onClick={handleLogout}
                  className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-200 rounded-md"
                  title="Logout"
                >
                  <LogOut className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* User Info */}
            <div className="flex items-center">
              <img
                src={user?.photoURL || '/default-avatar.png'}
                alt={user?.displayName}
                className="w-10 h-10 rounded-full mr-3"
              />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {user?.displayName}
                </p>
                <p className="text-xs text-gray-500 truncate">{user?.email}</p>
              </div>
              <div className={`w-3 h-3 rounded-full ${connected ? 'bg-green-400' : 'bg-gray-400'}`}></div>
            </div>
          </div>

          {/* Daftar Chat ala WhatsApp */}
          <div className="flex-1 overflow-y-auto">
            {loadingFriends ? (
              <div className="p-4 text-center">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto"></div>
                <p className="text-sm text-gray-500 mt-2">Memuat teman...</p>
              </div>
            ) : friends.length === 0 ? (
              <div className="p-4 text-center">
                <Users className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                <p className="text-sm text-gray-500">Belum ada teman</p>
                <button
                  onClick={() => window.location.href = '/friends'}
                  className="text-blue-600 text-sm font-medium mt-2 hover:underline"
                >
                  Tambah Teman
                </button>
              </div>
            ) : (
              <div className="py-2">
                {chatRooms.map((room) => {
                  const friend = friends.find(f => f.uid === room.friendId) || { uid: room.friendId, displayName: 'Unknown', photoURL: '' };
                  const active = selectedFriend?.uid === friend.uid;
                  return (
                    <div
                      key={room.chatRoomId || friend.uid}
                      onClick={() => setSelectedFriend(friend)}
                      className={`flex items-center p-3 hover:bg-gray-100 cursor-pointer border-l-4 ${active ? 'bg-blue-50 border-blue-500' : 'border-transparent'}`}
                    >
                      <div className="relative">
                        <img
                          src={friend.photoURL || '/default-avatar.png'}
                          alt={friend.displayName}
                          className="w-12 h-12 rounded-full"
                        />
                        <div className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-white ${isUserOnline(friend.uid) ? 'bg-green-400' : 'bg-gray-300'}`}></div>
                      </div>
                      <div className="ml-3 flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-medium text-gray-900 truncate">{friend.displayName}</p>
                          {room.lastMessageAt && (
                            <span className="text-[10px] text-gray-400 ml-2">
                              {new Date(room.lastMessageAt).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center justify-between">
                          <p className="text-xs text-gray-500 truncate max-w-[180px]">{room.lastMessage || ''}</p>
                          {room.unreadCount > 0 && (
                            <span className="ml-2 bg-green-500 text-white text-[10px] px-2 py-0.5 rounded-full min-w-[20px] text-center">
                              {room.unreadCount}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Area Chat */}
        <div className="flex-1 flex flex-col">
          {selectedFriend ? (
            <>
              {/* Header Chat */}
              <div className="bg-white border-b border-gray-200 px-6 py-4">
                <div className="flex items-center">
                  <img
                    src={selectedFriend.photoURL || '/default-avatar.png'}
                    alt={selectedFriend.displayName}
                    className="w-10 h-10 rounded-full mr-3"
                  />
                  <div>
                    <h2 className="text-lg font-semibold text-gray-900">
                      {selectedFriend.displayName}
                    </h2>
                    <p className="text-sm text-gray-500">
                      {isUserOnline(selectedFriend.uid) ? 'Online' : 'Offline'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Area Pesan */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
                {currentMessages.length === 0 ? (
                  <div className="text-center text-gray-500 mt-20">
                    <MessageCircle className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                    <p>Mulai percakapan dengan {selectedFriend.displayName}</p>
                  </div>
                ) : (
                  currentMessages.map((message) => {
                    const isMe = message.senderId === user?.uid;

                    return (
                      <div
                        key={message.id || message.tempId || `${message.senderId}-${message.createdAt}`}
                        className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}
                      >
                        <div className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${isMe
                            ? 'bg-blue-600 text-white'
                            : 'bg-white text-gray-900 border'
                          }`}>
                          <p className="text-sm">{message.content}</p>
                          <p className={`text-xs mt-1 ${isMe ? 'text-blue-200' : 'text-gray-400'
                            }`}>
                            {new Date(message.createdAt).toLocaleTimeString('id-ID', {
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </p>
                        </div>
                      </div>
                    );
                  })
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Form Input Pesan */}
              <div className="bg-white border-t border-gray-200 p-4">
                <form onSubmit={handleSendMessage} className="flex items-center space-x-3">
                  <input
                    type="text"
                    value={messageText}
                    onChange={(e) => setMessageText(e.target.value)}
                    placeholder={`Ketik pesan untuk ${selectedFriend.displayName}...`}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <button
                    type="submit"
                    disabled={!messageText.trim() || !connected}
                    className={`p-2 rounded-full ${messageText.trim() && connected
                        ? 'bg-blue-600 text-white hover:bg-blue-700'
                        : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                      }`}
                  >
                    <Send className="h-6 w-6" />
                  </button>
                </form>
              </div>
            </>
          ) : (
            /* Placeholder saat belum pilih teman */
            <div className="flex-1 flex items-center justify-center bg-gray-50">
              <div className="text-center">
                <MessageCircle className="h-24 w-24 text-gray-300 mx-auto mb-6" />
                <h2 className="text-2xl font-semibold text-gray-600 mb-2">
                  ChatKuy
                </h2>
                <p className="text-gray-500 mb-6">
                  Pilih teman untuk memulai percakapan
                </p>
                {friends.length === 0 && (
                  <button
                    onClick={() => window.location.href = '/friends'}
                    className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Tambah Teman
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ChatPage;

import React, { useState } from 'react';
import { LogOut, Settings, Users, Search, MessageCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';

const ChatPage = () => {
  const [selectedFriend, setSelectedFriend] = useState(null);
  const [searchEmail, setSearchEmail] = useState('');
  const [searchResult, setSearchResult] = useState(null);
  const [searching, setSearching] = useState(false);
  const { user, logout, idToken } = useAuth();
  const { connected, onlineUsers } = useSocket();

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const handleSearchUser = async (e) => {
    e.preventDefault();
    if (!searchEmail.trim()) return;

    try {
      setSearching(true);
      const response = await fetch(`http://localhost:3001/api/users/search?email=${encodeURIComponent(searchEmail)}`, {
        headers: {
          'Authorization': `Bearer ${idToken}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setSearchResult(data.user);
      } else {
        const error = await response.json();
        alert(error.message || 'User not found');
        setSearchResult(null);
      }
    } catch (error) {
      console.error('Search error:', error);
      alert('Failed to search user');
    } finally {
      setSearching(false);
    }
  };

  return (
    <div className="h-screen flex bg-white">
      {/* Sidebar */}
      <div className="w-80 bg-gray-50 border-r border-gray-200 flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center">
              <div className="bg-primary-600 p-2 rounded-full mr-3">
                <MessageCircle className="h-5 w-5 text-white" />
              </div>
              <h1 className="text-xl font-bold text-gray-900">ChatKuy</h1>
            </div>
            <div className="flex items-center space-x-2">
              <button className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-200 rounded-md">
                <Settings className="h-4 w-4" />
              </button>
              <button 
                onClick={handleLogout}
                className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-200 rounded-md"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* User Info */}
          <div className="flex items-center mb-4">
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

          {/* Search Users */}
          <form onSubmit={handleSearchUser} className="mb-4">
            <div className="relative">
              <Search className="h-4 w-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="email"
                placeholder="Search friends by email..."
                value={searchEmail}
                onChange={(e) => setSearchEmail(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm"
              />
            </div>
            {searching && (
              <div className="mt-2 text-xs text-gray-500">Searching...</div>
            )}
          </form>

          {/* Search Result */}
          {searchResult && (
            <div className="mb-4 p-3 bg-white rounded-md border border-gray-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <img
                    src={searchResult.photoURL || '/default-avatar.png'}
                    alt={searchResult.displayName}
                    className="w-8 h-8 rounded-full mr-2"
                  />
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      {searchResult.displayName}
                    </p>
                    <p className="text-xs text-gray-500">{searchResult.email}</p>
                  </div>
                </div>
                <button className="px-3 py-1 bg-primary-600 text-white text-xs rounded-md hover:bg-primary-700">
                  Add Friend
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Friends List */}
        <div className="flex-1 overflow-y-auto">
          <div className="p-4">
            <div className="flex items-center mb-3">
              <Users className="h-4 w-4 text-gray-500 mr-2" />
              <h2 className="text-sm font-medium text-gray-700">Friends</h2>
              <span className="ml-auto text-xs text-gray-500">
                {onlineUsers.length} online
              </span>
            </div>
            
            {/* No friends message */}
            <div className="text-center py-8">
              <Users className="h-12 w-12 text-gray-300 mx-auto mb-3" />
              <p className="text-sm text-gray-500 mb-2">No friends yet</p>
              <p className="text-xs text-gray-400">
                Search for friends by email to start chatting
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        {selectedFriend ? (
          // Chat with selected friend
          <div className="flex-1 flex flex-col">
            {/* Chat Header */}
            <div className="p-4 border-b border-gray-200 bg-white">
              <div className="flex items-center">
                <img
                  src={selectedFriend.photoURL || '/default-avatar.png'}
                  alt={selectedFriend.displayName}
                  className="w-10 h-10 rounded-full mr-3"
                />
                <div>
                  <h3 className="font-medium text-gray-900">
                    {selectedFriend.displayName}
                  </h3>
                  <p className="text-sm text-gray-500">Online</p>
                </div>
              </div>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-4 bg-gray-50">
              <div className="text-center py-8">
                <MessageCircle className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                <p className="text-sm text-gray-500">
                  Start your conversation with {selectedFriend.displayName}
                </p>
              </div>
            </div>

            {/* Message Input */}
            <div className="p-4 border-t border-gray-200 bg-white">
              <div className="flex items-center space-x-3">
                <input
                  type="text"
                  placeholder="Type your message..."
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-full focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
                <button className="px-6 py-2 bg-primary-600 text-white rounded-full hover:bg-primary-700 font-medium">
                  Send
                </button>
              </div>
            </div>
          </div>
        ) : (
          // Welcome screen
          <div className="flex-1 flex items-center justify-center bg-gray-50">
            <div className="text-center">
              <div className="bg-primary-100 p-6 rounded-full mb-6 inline-block">
                <MessageCircle className="h-12 w-12 text-primary-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                Welcome to ChatKuy!
              </h2>
              <p className="text-gray-600 mb-6 max-w-md">
                Connect with friends and start chatting in real-time. Search for friends by email to begin.
              </p>
              <div className="flex items-center justify-center space-x-4 text-sm text-gray-500">
                <div className="flex items-center">
                  <div className={`w-2 h-2 rounded-full mr-2 ${connected ? 'bg-green-400' : 'bg-red-400'}`}></div>
                  {connected ? 'Connected' : 'Disconnected'}
                </div>
                <div className="flex items-center">
                  <Users className="h-4 w-4 mr-1" />
                  {onlineUsers.length} online
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ChatPage;
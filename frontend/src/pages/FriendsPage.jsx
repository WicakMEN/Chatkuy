import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import LoadingSpinner from '../components/LoadingSpinner';
import Navigation from '../components/Navigation';
import { apiCallWithAuth } from '../utils/api';

const FriendsPage = () => {
  const { user } = useAuth();
  const [friends, setFriends] = useState([]);
  const [searchEmail, setSearchEmail] = useState('');
  const [searchResult, setSearchResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [activeTab, setActiveTab] = useState('friends'); // 'friends' or 'search'

  // Load friends list when component mounts
  useEffect(() => {
    loadFriends();
  }, []);

  const loadFriends = async () => {
    try {
      setLoading(true);
      const data = await apiCallWithAuth('/api/friends/list', {}, user);
      
      if (data.success) {
        setFriends(data.friends);
      } else {
        setError('Failed to load friends');
      }
    } catch (error) {
      console.error('Error loading friends:', error);
      setError('Failed to load friends');
    } finally {
      setLoading(false);
    }
  };

  const searchUser = async (e) => {
    e.preventDefault();
    if (!searchEmail.trim()) return;
    
    try {
      setLoading(true);
      setError('');
      setSearchResult(null);
      
      const data = await apiCallWithAuth(`/api/friends/search?email=${encodeURIComponent(searchEmail)}`, {}, user);
      
      if (data.success) {
        setSearchResult(data.user);
      } else {
        setError(data.message || 'User not found');
      }
    } catch (error) {
      console.error('Error searching user:', error);
      setError('Failed to search user');
    } finally {
      setLoading(false);
    }
  };

  const addFriend = async (friendUid) => {
    try {
      setLoading(true);
      setError('');
      
      const data = await apiCallWithAuth('/api/friends/add', {
        method: 'POST',
        body: JSON.stringify({ friendUid })
      }, user);
      
      if (data.success) {
        setSuccess('Friend added successfully!');
        setSearchResult(null);
        setSearchEmail('');
        loadFriends(); // Refresh friends list
        
        // Clear success message after 3 seconds
        setTimeout(() => setSuccess(''), 3000);
      } else {
        setError(data.message || 'Failed to add friend');
      }
    } catch (error) {
      console.error('Error adding friend:', error);
      setError('Failed to add friend');
    } finally {
      setLoading(false);
    }
  };

  const removeFriend = async (friendUid) => {
    if (!confirm('Are you sure you want to remove this friend?')) return;
    
    try {
      setLoading(true);
      setError('');
      
      const data = await apiCallWithAuth('/api/friends/remove', {
        method: 'DELETE',
        body: JSON.stringify({ friendUid })
      }, user);
      
      if (data.success) {
        setSuccess('Friend removed successfully!');
        loadFriends(); // Refresh friends list
        
        // Clear success message after 3 seconds
        setTimeout(() => setSuccess(''), 3000);
      } else {
        setError(data.message || 'Failed to remove friend');
      }
    } catch (error) {
      console.error('Error removing friend:', error);
      setError('Failed to remove friend');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      <div className="p-4">
        <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h1 className="text-2xl font-bold text-gray-800 mb-4">Friends</h1>
          
          {/* Tabs */}
          <div className="flex space-x-1 bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setActiveTab('friends')}
              className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                activeTab === 'friends'
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              My Friends ({friends.length})
            </button>
            <button
              onClick={() => setActiveTab('search')}
              className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                activeTab === 'search'
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              Add Friend
            </button>
          </div>
        </div>

        {/* Messages */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
            <p className="text-red-600">{error}</p>
          </div>
        )}
        
        {success && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
            <p className="text-green-600">{success}</p>
          </div>
        )}

        {/* Tab Content */}
        {activeTab === 'friends' && (
          <div className="bg-white rounded-lg shadow-md">
            {loading ? (
              <div className="flex justify-center items-center p-8">
                <LoadingSpinner />
              </div>
            ) : friends.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                <p>You don't have any friends yet.</p>
                <p className="text-sm mt-2">Use the "Add Friend" tab to find and add friends!</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-200">
                {friends.map((friend) => (
                  <div key={friend.uid} className="p-4 flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <img
                        src={friend.photoURL || '/default-avatar.png'}
                        alt={friend.displayName}
                        className="w-12 h-12 rounded-full"
                      />
                      <div>
                        <h3 className="font-semibold text-gray-800">{friend.displayName}</h3>
                        <p className="text-sm text-gray-600">{friend.email}</p>
                      </div>
                    </div>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => {/* TODO: Navigate to chat */}}
                        className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg text-sm"
                      >
                        Chat
                      </button>
                      <button
                        onClick={() => removeFriend(friend.uid)}
                        className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg text-sm"
                        disabled={loading}
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'search' && (
          <div className="bg-white rounded-lg shadow-md p-6">
            <form onSubmit={searchUser} className="mb-6">
              <div className="flex space-x-3">
                <input
                  type="email"
                  value={searchEmail}
                  onChange={(e) => setSearchEmail(e.target.value)}
                  placeholder="Enter friend's email address"
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
                <button
                  type="submit"
                  disabled={loading}
                  className="bg-blue-500 hover:bg-blue-600 disabled:bg-blue-300 text-white px-6 py-2 rounded-lg"
                >
                  {loading ? <LoadingSpinner size="small" /> : 'Search'}
                </button>
              </div>
            </form>

            {/* Search Result */}
            {searchResult && (
              <div className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <img
                      src={searchResult.photoURL || '/default-avatar.png'}
                      alt={searchResult.displayName}
                      className="w-12 h-12 rounded-full"
                    />
                    <div>
                      <h3 className="font-semibold text-gray-800">{searchResult.displayName}</h3>
                      <p className="text-sm text-gray-600">{searchResult.email}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => addFriend(searchResult.uid)}
                    disabled={loading || searchResult.alreadyFriends}
                    className={`px-4 py-2 rounded-lg text-sm ${
                      searchResult.alreadyFriends
                        ? 'bg-gray-300 text-gray-600 cursor-not-allowed'
                        : 'bg-green-500 hover:bg-green-600 text-white'
                    }`}
                  >
                    {searchResult.alreadyFriends ? 'Already Friends' : 'Add Friend'}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
        </div>
      </div>
    </div>
  );
};

export default FriendsPage;
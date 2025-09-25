import React, { createContext, useContext, useEffect, useState } from 'react';
import { 
  onAuthStateChanged, 
  signInWithPopup, 
  signOut, 
  getIdToken 
} from 'firebase/auth';
import { auth, googleProvider } from '../firebase';

// Create AuthContext
const AuthContext = createContext({});

// Custom hook to use AuthContext
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

// AuthProvider component
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [idToken, setIdToken] = useState(null);

  // Login with Google
  const loginWithGoogle = async () => {
    try {
      setLoading(true);
      console.log('🔐 Starting Google login...');
      
      const result = await signInWithPopup(auth, googleProvider);
      console.log('✅ Google login successful, user:', result.user.email);
      
      const token = await getIdToken(result.user);
      console.log('🎫 Got ID token:', token ? 'Token received' : 'No token');
      console.log('🎫 Token preview:', token ? token.substring(0, 50) + '...' : 'null');
      
      setIdToken(token);
      
      // Send token to backend for user creation/verification
      console.log('📤 Sending token to backend...');
      const response = await fetch('http://localhost:3001/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        console.log('✅ Backend login successful');
      } else {
        console.error('❌ Backend login failed:', response.status, response.statusText);
      }
      
      return result.user;
    } catch (error) {
      console.error('❌ Login error:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Logout
  const logout = async () => {
    try {
      setLoading(true);
      
      // Call backend logout endpoint if needed
      if (idToken) {
        await fetch('http://localhost:3001/api/auth/logout', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${idToken}`
          }
        });
      }
      
      await signOut(auth);
      setIdToken(null);
    } catch (error) {
      console.error('Logout error:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Get fresh ID token
  const getToken = async () => {
    console.log('🔄 Getting fresh token...');
    if (user) {
      try {
        const token = await getIdToken(user, true);
        console.log('✅ Fresh token received:', token ? token.substring(0, 50) + '...' : 'null');
        setIdToken(token);
        return token;
      } catch (error) {
        console.error('❌ Get token error:', error);
        return null;
      }
    }
    console.log('❌ No user available for token');
    return null;
  };

  useEffect(() => {
    console.log('🔍 Setting up auth state listener...');
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      console.log('🔄 Auth state changed:', user ? `User: ${user.email}` : 'No user');
      setUser(user);
      
      if (user) {
        try {
          console.log('🎫 Getting initial token for user...');
          const token = await getIdToken(user);
          console.log('✅ Initial token received:', token ? token.substring(0, 50) + '...' : 'null');
          setIdToken(token);
        } catch (error) {
          console.error('❌ Error getting initial ID token:', error);
          setIdToken(null);
        }
      } else {
        console.log('🚪 User logged out, clearing token');
        setIdToken(null);
      }
      
      setLoading(false);
      console.log('✅ Auth state update complete');
    });

    return () => {
      console.log('🧹 Cleaning up auth listener');
      unsubscribe();
    };
  }, []);

  const value = {
    user,
    idToken,
    loading,
    loginWithGoogle,
    logout,
    getToken
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
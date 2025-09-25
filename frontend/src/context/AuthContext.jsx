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

  // Login with Google - Login dengan Google
  const loginWithGoogle = async () => {
    try {
      setLoading(true);
      console.log('🔐 Memulai login dengan Google...');
      
      const result = await signInWithPopup(auth, googleProvider);
      console.log('✅ Login Google berhasil, user:', result.user.email);
      
      const token = await getIdToken(result.user);
      console.log('🎫 Token ID didapat:', token ? 'Token berhasil diterima' : 'Token tidak ada');
      console.log('🎫 Preview token:', token ? token.substring(0, 50) + '...' : 'null');
      
      setIdToken(token);
      
      // Send token to backend for user creation/verification - Kirim token ke backend untuk buat/verifikasi user
      console.log('📤 Mengirim token ke backend untuk daftarkan user...');
      const response = await fetch('http://localhost:3001/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        console.log('✅ Backend login berhasil:', data.message);
        console.log('👤 User terdaftar di Firestore:', data.user);
      } else {
        console.error('❌ Backend login gagal:', response.status, response.statusText);
        const errorData = await response.json().catch(() => ({}));
        console.error('❌ Detail error:', errorData);
      }
      
      return result.user;
    } catch (error) {
      console.error('❌ Error saat login:', error);
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
    console.log('🔍 Mengatur listener perubahan status auth...');
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      console.log('🔄 Status auth berubah:', user ? `User: ${user.email}` : 'Tidak ada user');
      setUser(user);
      
      if (user) {
        try {
          console.log('🎫 Mengambil token awal untuk user...');
          const token = await getIdToken(user);
          console.log('✅ Token awal berhasil diterima:', token ? token.substring(0, 50) + '...' : 'null');
          setIdToken(token);
          
          // Automatically register/update user in backend when auth state changes
          // Otomatis daftarkan/update user di backend saat status auth berubah
          console.log('📤 Mengirim data user ke backend untuk pendaftaran otomatis...');
          const response = await fetch('http://localhost:3001/api/auth/login', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            }
          });
          
          if (response.ok) {
            const data = await response.json();
            console.log('✅ User berhasil terdaftar otomatis di Firestore:', data.message);
          } else {
            console.error('❌ Gagal mendaftarkan user otomatis:', response.status);
          }
        } catch (error) {
          console.error('❌ Error saat mendapat token awal:', error);
          setIdToken(null);
        }
      } else {
        console.log('🚪 User logout, menghapus token');
        setIdToken(null);
      }
      
      setLoading(false);
      console.log('✅ Update status auth selesai');
    });

    return () => {
      console.log('🧹 Membersihkan listener auth');
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
const admin = require('firebase-admin');

// Initialize Firebase Admin if not already initialized
if (!admin.apps.length) {
  try {
    const serviceAccount = require('./firebase-service-account.json');
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      databaseURL: process.env.FIREBASE_DATABASE_URL
    });
    console.log('🔥 Firebase Admin initialized successfully');
  } catch (error) {
    console.error('❌ Firebase Admin initialization failed:', error.message);
    console.log('📝 Make sure firebase-service-account.json exists in config/ folder');
    process.exit(1);
  }
}

// Get Firestore instance
const getFirestore = () => {
  return admin.firestore();
};

// Initialize Firestore lazily
let db = null;
const getDB = () => {
  if (!db) {
    db = getFirestore();
  }
  return db;
};

// Collections references
const getCollections = () => {
  const db = getDB();
  return {
    users: db.collection('users'),
    messages: db.collection('messages'),
    friendRequests: db.collection('friendRequests')
  };
};

// Helper functions for Firestore operations
const firestoreHelpers = {
  // Create or update user profile
  async createOrUpdateUser(uid, userData) {
    try {
      const collections = getCollections();
      const userRef = collections.users.doc(uid);
      await userRef.set({
        uid,
        displayName: userData.displayName || '',
        email: userData.email || '',
        photoURL: userData.photoURL || '',
        friends: userData.friends || [],
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      }, { merge: true });
      
      return { success: true, uid };
    } catch (error) {
      console.error('Error creating/updating user:', error);
      throw error;
    }
  },

  // Get user by UID
  async getUser(uid) {
    try {
      const collections = getCollections();
      const userDoc = await collections.users.doc(uid).get();
      if (userDoc.exists) {
        return userDoc.data();
      }
      return null;
    } catch (error) {
      console.error('Error getting user:', error);
      throw error;
    }
  },

  // Search users by email
  async searchUserByEmail(email) {
    try {
      const collections = getCollections();
      const usersSnapshot = await collections.users
        .where('email', '==', email)
        .limit(1)
        .get();
      
      if (!usersSnapshot.empty) {
        return usersSnapshot.docs[0].data();
      }
      return null;
    } catch (error) {
      console.error('Error searching user by email:', error);
      throw error;
    }
  },

  // Save message
  async saveMessage(senderId, receiverId, content) {
    try {
      const collections = getCollections();
      const messageRef = await collections.messages.add({
        senderId,
        receiverId,
        content,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        read: false
      });
      
      return messageRef.id;
    } catch (error) {
      console.error('Error saving message:', error);
      throw error;
    }
  },

  // Get messages between two users
  async getMessages(userId1, userId2, limit = 50) {
    try {
      const collections = getCollections();
      const messagesSnapshot = await collections.messages
        .where('senderId', 'in', [userId1, userId2])
        .where('receiverId', 'in', [userId1, userId2])
        .orderBy('createdAt', 'desc')
        .limit(limit)
        .get();
      
      const messages = messagesSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate()
      }));
      
      return messages.reverse(); // Return in chronological order
    } catch (error) {
      console.error('Error getting messages:', error);
      throw error;
    }
  }
};

module.exports = {
  getDB,
  getCollections,
  ...firestoreHelpers
};
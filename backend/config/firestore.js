const admin = require("firebase-admin");

// Initialize Firebase Admin if not already initialized
if (!admin.apps.length) {
  try {
    const serviceAccount = require("./firebase-service-account.json");

    // Inisialisasi sederhana dan robust
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      projectId: serviceAccount.project_id,
    });

    console.log("🔥 Firebase Admin initialized successfully");
    console.log("📍 Project ID:", serviceAccount.project_id);
    console.log("📧 Service Account Email:", serviceAccount.client_email);
  } catch (error) {
    console.error("❌ Firebase Admin initialization failed:", error.message);
    console.error("❌ Full error:", error);
    console.log(
      "📝 Make sure firebase-service-account.json exists in config/ folder"
    );
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
    users: db.collection("users"),
    messages: db.collection("messages"),
    friendRequests: db.collection("friendRequests"),
  };
};

// Helper functions for Firestore operations
const firestoreHelpers = {
  // Create or update user profile - Buat atau update profil user
  async createOrUpdateUser(uid, userData) {
    try {
      console.log("🔍 createOrUpdateUser called with:", { uid, userData });

      // Gunakan admin.firestore() langsung
      const db = admin.firestore();
      const userRef = db.collection("users").doc(uid);

      // Data yang akan disimpan
      const userDataToSave = {
        uid,
        displayName: userData.displayName || "",
        email: userData.email || "",
        photoURL: userData.photoURL || "",
        friends: userData.friends || [],
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      };

      console.log("💾 Data yang akan disimpan:", userDataToSave);

      // Set data dengan merge untuk upsert
      await userRef.set(userDataToSave, { merge: true });
      console.log("✅ Data berhasil disimpan ke Firestore");

      console.log(
        "🎉 User berhasil terdaftar/diupdate di Firestore:",
        userData.email
      );

      return { success: true, uid };
    } catch (error) {
      console.error("❌ Error saat membuat/update user di Firestore:", error);
      console.error("❌ Error details:", error.message);
      console.error("❌ Error stack:", error.stack);
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
      console.error("Error getting user:", error);
      throw error;
    }
  },

  // Search users by email
  async searchUserByEmail(email) {
    try {
      const collections = getCollections();
      const usersSnapshot = await collections.users
        .where("email", "==", email)
        .limit(1)
        .get();

      if (!usersSnapshot.empty) {
        return usersSnapshot.docs[0].data();
      }
      return null;
    } catch (error) {
      console.error("Error searching user by email:", error);
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
        read: false,
      });

      return messageRef.id;
    } catch (error) {
      console.error("Error saving message:", error);
      throw error;
    }
  },

  // Get messages between two users
  async getMessages(userId1, userId2, limit = 50) {
    try {
      const collections = getCollections();
      const messagesSnapshot = await collections.messages
        .where("senderId", "in", [userId1, userId2])
        .where("receiverId", "in", [userId1, userId2])
        .orderBy("createdAt", "desc")
        .limit(limit)
        .get();

      const messages = messagesSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate(),
      }));

      return messages.reverse(); // Return in chronological order
    } catch (error) {
      console.error("Error getting messages:", error);
      throw error;
    }
  },

  // Add Friend System Functions

  // Add friend (mutual friendship, no approval needed)
  async addFriend(userUid, friendUid) {
    try {
      const collections = getCollections();
      const db = getDB();

      // Check if users exist
      const userDoc = await collections.users.doc(userUid).get();
      const friendDoc = await collections.users.doc(friendUid).get();

      if (!userDoc.exists || !friendDoc.exists) {
        throw new Error("User or friend not found");
      }

      // Check if already friends
      const userData = userDoc.data();
      if (userData.friends && userData.friends.includes(friendUid)) {
        throw new Error("Already friends");
      }

      // Check if trying to add self
      if (userUid === friendUid) {
        throw new Error("Cannot add yourself as friend");
      }

      const batch = db.batch();

      // Add friend to user's friends array
      const userRef = collections.users.doc(userUid);
      batch.update(userRef, {
        friends: admin.firestore.FieldValue.arrayUnion(friendUid),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      // Add user to friend's friends array (mutual friendship)
      const friendRef = collections.users.doc(friendUid);
      batch.update(friendRef, {
        friends: admin.firestore.FieldValue.arrayUnion(userUid),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      await batch.commit();

      return {
        success: true,
        message: "Friend added successfully",
        friendData: friendDoc.data(),
      };
    } catch (error) {
      console.error("Error adding friend:", error);
      throw error;
    }
  },

  // Get user's friends list with details
  async getFriends(userUid) {
    try {
      const user = await this.getUser(userUid);
      if (!user || !user.friends || user.friends.length === 0) {
        return [];
      }

      const collections = getCollections();
      const friendsData = [];

      // Get friend details
      for (const friendUid of user.friends) {
        const friendDoc = await collections.users.doc(friendUid).get();
        if (friendDoc.exists) {
          friendsData.push({
            uid: friendUid,
            ...friendDoc.data(),
          });
        }
      }

      return friendsData;
    } catch (error) {
      console.error("Error getting friends:", error);
      throw error;
    }
  },

  // Check if two users are friends
  async areFriends(userUid, friendUid) {
    try {
      const user = await this.getUser(userUid);
      return user && user.friends && user.friends.includes(friendUid);
    } catch (error) {
      console.error("Error checking friendship:", error);
      return false;
    }
  },

  // Remove friend (mutual removal)
  async removeFriend(userUid, friendUid) {
    try {
      const collections = getCollections();
      const db = getDB();

      const batch = db.batch();

      // Remove friend from user's friends array
      const userRef = collections.users.doc(userUid);
      batch.update(userRef, {
        friends: admin.firestore.FieldValue.arrayRemove(friendUid),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      // Remove user from friend's friends array
      const friendRef = collections.users.doc(friendUid);
      batch.update(friendRef, {
        friends: admin.firestore.FieldValue.arrayRemove(userUid),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      await batch.commit();

      return { success: true, message: "Friend removed successfully" };
    } catch (error) {
      console.error("Error removing friend:", error);
      throw error;
    }
  },

  // Search users by email (excluding current user)
  async searchUserByEmailExcludingSelf(email, currentUserUid) {
    try {
      const user = await this.searchUserByEmail(email);
      if (user && user.uid !== currentUserUid) {
        return user;
      }
      return null;
    } catch (error) {
      console.error("Error searching user by email:", error);
      throw error;
    }
  },

  // Get all users (for development/admin purposes)
  async getAllUsers(limit = 20) {
    try {
      const collections = getCollections();
      const usersSnapshot = await collections.users.limit(limit).get();

      const users = usersSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      return users;
    } catch (error) {
      console.error("Error getting all users:", error);
      throw error;
    }
  },
};

module.exports = {
  getDB,
  getCollections,
  ...firestoreHelpers,
};

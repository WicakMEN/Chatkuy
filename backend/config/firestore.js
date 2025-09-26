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
    chats: db.collection("chats"), // Tambahan untuk chat rooms
    messages: db.collection("messages"), // Untuk pesan individual (backward compatibility)
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

      // Cek apakah dokumen user sudah ada untuk mencegah overwrite tidak sengaja
      const existingSnap = await userRef.get();
      const exists = existingSnap.exists;
      const existingData = exists ? existingSnap.data() : {};

      // Bangun payload update secara hati-hati agar tidak mengosongkan field lama
      const userDataToSave = {
        uid,
        // Set hanya jika ada nilai yang diberikan; jika dokumen belum ada, inisialisasi string kosong
        ...(userData.displayName !== undefined
          ? { displayName: userData.displayName }
          : exists
          ? {}
          : { displayName: "" }),
        ...(userData.email !== undefined
          ? { email: userData.email }
          : exists
          ? {}
          : { email: "" }),
        ...(userData.photoURL !== undefined
          ? { photoURL: userData.photoURL }
          : exists
          ? {}
          : { photoURL: "" }),
        // createdAt hanya diset saat pertama kali dibuat
        ...(exists
          ? {}
          : { createdAt: admin.firestore.FieldValue.serverTimestamp() }),
        // Selalu update updatedAt
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      };

      // Penting: jangan overwrite friends saat login kalau tidak dikirimkan
      if (userData.friends !== undefined) {
        userDataToSave.friends = userData.friends;
      } else if (!exists) {
        // Inisialisasi kosong hanya pada pembuatan pertama
        userDataToSave.friends = [];
      }

      console.log("💾 Data yang akan disimpan:", userDataToSave);

      // Set data dengan merge untuk upsert
      await userRef.set(userDataToSave, { merge: true });
      console.log("✅ Data berhasil disimpan ke Firestore");

      console.log(
        "🎉 User berhasil terdaftar/diupdate di Firestore:",
        userData.email || existingData.email || "(tanpa email)"
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

  // === FUNGSI CHAT REALTIME === //

  // Buat atau dapatkan chat room antara dua user
  async createOrGetChatRoom(userId1, userId2) {
    try {
      console.log(
        `💬 [CHAT ROOM] Mencari/membuat chat room untuk ${userId1} dan ${userId2}`
      );

      const db = getDB();

      // Buat ID chat room yang konsisten (user dengan ID lebih kecil di depan)
      const participants = [userId1, userId2].sort();
      const chatRoomId = `${participants[0]}_${participants[1]}`;

      console.log(`📝 [CHAT ROOM] ID chat room: ${chatRoomId}`);

      // Cek apakah chat room sudah ada
      const chatRef = db.collection("chats").doc(chatRoomId);
      const chatDoc = await chatRef.get();

      if (!chatDoc.exists) {
        // Buat chat room baru
        await chatRef.set({
          participants,
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
          lastMessage: "",
          lastMessageAt: admin.firestore.FieldValue.serverTimestamp(),
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });

        console.log(`✅ [CHAT ROOM] Chat room baru dibuat: ${chatRoomId}`);
      } else {
        console.log(`📋 [CHAT ROOM] Chat room sudah ada: ${chatRoomId}`);
      }

      return chatRoomId;
    } catch (error) {
      console.error(`❌ [CHAT ROOM] Error:`, error);
      throw error;
    }
  },

  // Simpan pesan ke database dengan struktur yang lebih baik
  async saveMessage({
    senderId,
    receiverId,
    content,
    messageType = "text",
    chatRoomId,
  }) {
    try {
      console.log(
        `💾 [SAVE MESSAGE] Menyimpan pesan dari ${senderId} ke ${receiverId}`
      );

      const db = getDB();

      // Data pesan yang akan disimpan
      const messageData = {
        senderId,
        receiverId,
        content,
        messageType,
        chatRoomId,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        isRead: false,
        deliveredAt: null,
        readAt: null,
      };

      // Simpan pesan ke subcollection messages di dalam chat room
      const messageRef = await db
        .collection("chats")
        .doc(chatRoomId)
        .collection("messages")
        .add(messageData);

      // Update chat room dengan pesan terakhir
      await db
        .collection("chats")
        .doc(chatRoomId)
        .update({
          lastMessage: content,
          lastMessageAt: admin.firestore.FieldValue.serverTimestamp(),
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
          // Tambah/unset unreadCount per user
          [`unreadCount.${receiverId}`]:
            admin.firestore.FieldValue.increment(1),
        });

      console.log(
        `✅ [SAVE MESSAGE] Pesan disimpan dengan ID: ${messageRef.id}`
      );

      // Return data pesan dengan ID
      return {
        id: messageRef.id,
        ...messageData,
        createdAt: new Date().toISOString(), // Untuk response langsung
      };
    } catch (error) {
      console.error(`❌ [SAVE MESSAGE] Error:`, error);
      throw error;
    }
  },

  // Ambil daftar chat rooms untuk user beserta metadata ringkas
  async getChatRoomsForUser(userId) {
    try {
      const db = getDB();

      const snapshot = await db
        .collection("chats")
        .where("participants", "array-contains", userId)
        .get();

      const rooms = [];
      for (const doc of snapshot.docs) {
        const data = doc.data();
        const friendId = (data.participants || []).find((id) => id !== userId);
        rooms.push({
          chatRoomId: doc.id,
          friendId,
          lastMessage: data.lastMessage || "",
          lastMessageAt: data.lastMessageAt?.toDate()?.toISOString() || null,
          unreadCount: (data.unreadCount && data.unreadCount[userId]) || 0,
          participants: data.participants || [],
        });
      }

      // Urutkan di sisi server berdasarkan lastMessageAt desc
      rooms.sort((a, b) => {
        const ta = a.lastMessageAt ? new Date(a.lastMessageAt).getTime() : 0;
        const tb = b.lastMessageAt ? new Date(b.lastMessageAt).getTime() : 0;
        return tb - ta;
      });

      return rooms;
    } catch (error) {
      console.error("❌ [CHAT ROOMS] Error:", error);
      throw error;
    }
  },

  // Reset unread count untuk user tertentu dalam chat room
  async resetUnreadCount(chatRoomId, userId) {
    try {
      const db = getDB();
      await db
        .collection("chats")
        .doc(chatRoomId)
        .set(
          {
            unreadCount: { [userId]: 0 },
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
          },
          { merge: true }
        );
    } catch (error) {
      console.error("❌ [RESET UNREAD] Error:", error);
      throw error;
    }
  },

  // Tandai semua pesan dari friend -> user sebagai dibaca dan reset unreadCount
  async markAllMessagesAsRead(userId, friendId) {
    try {
      const db = getDB();

      // Tentukan chatRoomId
      const participants = [userId, friendId].sort();
      const chatRoomId = `${participants[0]}_${participants[1]}`;

      const messagesRef = db
        .collection("chats")
        .doc(chatRoomId)
        .collection("messages")
        .where("receiverId", "==", userId)
        .where("isRead", "==", false);

      const snapshot = await messagesRef.get();

      if (!snapshot.empty) {
        // Batch update (maks 500 per batch)
        let batch = db.batch();
        let opCount = 0;
        const commits = [];
        for (const doc of snapshot.docs) {
          batch.update(doc.ref, {
            isRead: true,
            readAt: admin.firestore.FieldValue.serverTimestamp(),
          });
          opCount++;
          if (opCount >= 450) {
            commits.push(batch.commit());
            batch = db.batch();
            opCount = 0;
          }
        }
        commits.push(batch.commit());
        await Promise.all(commits);
      }

      // Reset unread counter
      await firestoreHelpers.resetUnreadCount(chatRoomId, userId);

      return { chatRoomId, updated: snapshot.size };
    } catch (error) {
      console.error("❌ [MARK ALL READ] Error:", error);
      throw error;
    }
  },

  // Ambil riwayat pesan antara dua user
  async getMessages(userId1, userId2, limit = 50, lastMessageId = null) {
    try {
      console.log(
        `📋 [GET MESSAGES] Mengambil pesan antara ${userId1} dan ${userId2}, limit: ${limit}`
      );

      const db = getDB();

      // Buat chat room ID
      const participants = [userId1, userId2].sort();
      const chatRoomId = `${participants[0]}_${participants[1]}`;

      let query = db
        .collection("chats")
        .doc(chatRoomId)
        .collection("messages")
        .orderBy("createdAt", "desc")
        .limit(limit);

      // Jika ada lastMessageId untuk pagination
      if (lastMessageId) {
        const lastMessageDoc = await db
          .collection("chats")
          .doc(chatRoomId)
          .collection("messages")
          .doc(lastMessageId)
          .get();

        if (lastMessageDoc.exists) {
          query = query.startAfter(lastMessageDoc);
        }
      }

      const messagesSnapshot = await query.get();

      const messages = messagesSnapshot.docs.map((doc) => {
        const data = doc.data();
        return {
          id: doc.id,
          senderId: data.senderId,
          receiverId: data.receiverId,
          content: data.content,
          messageType: data.messageType || "text",
          createdAt:
            data.createdAt?.toDate()?.toISOString() || new Date().toISOString(),
          isRead: data.isRead || false,
          deliveredAt: data.deliveredAt?.toDate()?.toISOString() || null,
          readAt: data.readAt?.toDate()?.toISOString() || null,
        };
      });

      // Balik urutan agar pesan lama di atas, pesan baru di bawah
      const sortedMessages = messages.reverse();

      console.log(
        `📨 [GET MESSAGES] Ditemukan ${sortedMessages.length} pesan untuk chat room ${chatRoomId}`
      );

      return sortedMessages;
    } catch (error) {
      console.error(`❌ [GET MESSAGES] Error:`, error);
      throw error;
    }
  },

  // Tandai pesan sudah dibaca
  async markMessageAsRead(messageId, chatRoomId, readerId) {
    try {
      console.log(
        `👀 [MARK READ] Menandai pesan ${messageId} sudah dibaca oleh ${readerId}`
      );

      const db = getDB();

      await db
        .collection("chats")
        .doc(chatRoomId)
        .collection("messages")
        .doc(messageId)
        .update({
          isRead: true,
          readAt: admin.firestore.FieldValue.serverTimestamp(),
        });

      console.log(`✅ [MARK READ] Pesan ${messageId} ditandai sudah dibaca`);
    } catch (error) {
      console.error(`❌ [MARK READ] Error:`, error);
      throw error;
    }
  },

  // === FUNGSI YANG SUDAH ADA (DIPERBARUI) === //

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

  // Get user's friends list with details - Ambil daftar teman dengan detail lengkap
  async getFriends(userUid) {
    try {
      console.log(
        `👥 [GET FRIENDS] Mengambil daftar teman untuk user: ${userUid}`
      );

      const collections = getCollections();
      const userDoc = await collections.users.doc(userUid).get();

      if (!userDoc.exists) {
        console.log(`❌ [GET FRIENDS] User ${userUid} tidak ditemukan`);
        return [];
      }

      const userData = userDoc.data();
      console.log(`📊 [GET FRIENDS] User data:`, {
        email: userData.email,
        friendsCount: userData.friends ? userData.friends.length : 0,
      });

      if (!userData.friends || userData.friends.length === 0) {
        console.log(`📭 [GET FRIENDS] User ${userUid} tidak memiliki teman`);
        return [];
      }

      const friendsData = [];

      // Ambil detail setiap teman
      for (const friendUid of userData.friends) {
        console.log(`🔍 [GET FRIENDS] Mengambil detail teman: ${friendUid}`);
        const friendDoc = await collections.users.doc(friendUid).get();
        if (friendDoc.exists) {
          const friendData = friendDoc.data();
          friendsData.push({
            uid: friendUid,
            displayName: friendData.displayName,
            email: friendData.email,
            photoURL: friendData.photoURL,
            createdAt: friendData.createdAt,
            updatedAt: friendData.updatedAt,
          });
          console.log(
            `✅ [GET FRIENDS] Detail teman berhasil diambil: ${friendData.email}`
          );
        } else {
          console.log(
            `⚠️ [GET FRIENDS] Teman ${friendUid} tidak ditemukan di database`
          );
        }
      }

      console.log(
        `🎉 [GET FRIENDS] Berhasil mengambil ${friendsData.length} teman untuk ${userData.email}`
      );
      return friendsData;
    } catch (error) {
      console.error(`❌ [GET FRIENDS] Error:`, error);
      throw error;
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
      const user = await firestoreHelpers.searchUserByEmail(email);
      if (user && user.uid !== currentUserUid) {
        return user;
      }
      return null;
    } catch (error) {
      console.error("Error searching user by email:", error);
      throw error;
    }
  },

  // Cek apakah dua user sudah berteman
  async areFriends(userUid, friendUid) {
    try {
      console.log(
        `🤝 [ARE FRIENDS] Cek pertemanan antara ${userUid} dan ${friendUid}`
      );

      const collections = getCollections();
      const userDoc = await collections.users.doc(userUid).get();

      if (!userDoc.exists) {
        console.log(`❌ [ARE FRIENDS] User ${userUid} tidak ditemukan`);
        return false;
      }

      const userData = userDoc.data();
      const isFriend = userData.friends && userData.friends.includes(friendUid);

      console.log(
        `${isFriend ? "✅" : "❌"} [ARE FRIENDS] ${userUid} dan ${friendUid} ${
          isFriend ? "sudah" : "belum"
        } berteman`
      );

      return isFriend;
    } catch (error) {
      console.error(`❌ [ARE FRIENDS] Error:`, error);
      return false;
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

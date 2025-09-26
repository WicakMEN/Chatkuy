const express = require("express");
const router = express.Router();
const {
  getMessages,
  createOrGetChatRoom,
  areFriends,
  markMessageAsRead,
  getChatRoomsForUser,
  markAllMessagesAsRead,
} = require("../config/firestore");
const verifyFirebaseToken = require("../config/auth");

// Middleware untuk verifikasi autentikasi
router.use(verifyFirebaseToken);

// GET /api/chat/history/:friendId - Ambil riwayat chat dengan teman
router.get("/history/:friendId", async (req, res) => {
  console.log(
    `📋 [CHAT API] User ${req.user.uid} minta riwayat chat dengan ${req.params.friendId}`
  );

  try {
    const userId = req.user.uid;
    const { friendId } = req.params;
    const { limit = 50, lastMessageId = null } = req.query;

    // Validasi input
    if (!friendId) {
      console.log(`❌ [CHAT API] Friend ID tidak ada`);
      return res.status(400).json({
        success: false,
        message: "ID teman wajib diisi",
      });
    }

    // Cek apakah mereka berteman
    const isFriends = await areFriends(userId, friendId);
    if (!isFriends) {
      console.log(`❌ [CHAT API] User ${userId} dan ${friendId} bukan teman`);
      return res.status(403).json({
        success: false,
        message: "Hanya bisa melihat chat dengan teman",
      });
    }

    // Ambil riwayat pesan
    const messages = await getMessages(
      userId,
      friendId,
      parseInt(limit),
      lastMessageId
    );

    console.log(
      `✅ [CHAT API] Berhasil mengambil ${messages.length} pesan untuk ${userId}`
    );

    res.json({
      success: true,
      data: {
        friendId,
        messages,
        hasMore: messages.length === parseInt(limit),
        lastMessageId:
          messages.length > 0 ? messages[messages.length - 1].id : null,
      },
    });
  } catch (error) {
    console.error(`❌ [CHAT API] Error mengambil riwayat chat:`, error);
    res.status(500).json({
      success: false,
      message: "Gagal mengambil riwayat chat",
      error: error.message,
    });
  }
});

// POST /api/chat/read/:messageId - Tandai pesan sudah dibaca
router.post("/read/:messageId", async (req, res) => {
  console.log(
    `👀 [CHAT API] User ${req.user.uid} tandai pesan ${req.params.messageId} sudah dibaca`
  );

  try {
    const userId = req.user.uid;
    const { messageId } = req.params;
    const { chatRoomId } = req.body;

    if (!messageId || !chatRoomId) {
      console.log(`❌ [CHAT API] Data tidak lengkap`);
      return res.status(400).json({
        success: false,
        message: "Message ID dan Chat Room ID wajib diisi",
      });
    }

    // Tandai pesan sudah dibaca
    await markMessageAsRead(messageId, chatRoomId, userId);

    console.log(
      `✅ [CHAT API] Pesan ${messageId} berhasil ditandai sudah dibaca`
    );

    res.json({
      success: true,
      message: "Pesan berhasil ditandai sudah dibaca",
    });
  } catch (error) {
    console.error(`❌ [CHAT API] Error menandai pesan sudah dibaca:`, error);
    res.status(500).json({
      success: false,
      message: "Gagal menandai pesan sudah dibaca",
      error: error.message,
    });
  }
});

// GET /api/chat/rooms - Ambil daftar chat rooms user
router.get("/rooms", async (req, res) => {
  console.log(`📋 [CHAT API] User ${req.user.uid} minta daftar chat rooms`);

  try {
    const userId = req.user.uid;
    const chatRooms = await getChatRoomsForUser(userId);

    console.log(
      `✅ [CHAT API] Berhasil mengambil ${chatRooms.length} chat rooms untuk ${userId}`
    );

    res.json({
      success: true,
      data: chatRooms,
    });
  } catch (error) {
    console.error(`❌ [CHAT API] Error mengambil chat rooms:`, error);
    res.status(500).json({
      success: false,
      message: "Gagal mengambil daftar chat rooms",
      error: error.message,
    });
  }
});

// POST /api/chat/read-all/:friendId - Tandai semua pesan dari friend sudah dibaca
router.post("/read-all/:friendId", async (req, res) => {
  try {
    const userId = req.user.uid;
    const { friendId } = req.params;
    if (!friendId) {
      return res
        .status(400)
        .json({ success: false, message: "friendId wajib diisi" });
    }

    // Cek teman dulu
    const isFriends = await areFriends(userId, friendId);
    if (!isFriends) {
      return res
        .status(403)
        .json({
          success: false,
          message: "Hanya bisa membaca chat dengan teman",
        });
    }

    const result = await markAllMessagesAsRead(userId, friendId);
    return res.json({ success: true, data: result });
  } catch (error) {
    console.error("❌ [CHAT API] read-all error:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;

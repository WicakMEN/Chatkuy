const {
  saveMessage,
  getMessages,
  createOrGetChatRoom,
  areFriends,
} = require("../config/firestore");

// Handler untuk semua event chat di Socket.IO
const chatSocket = (io, socket) => {
  console.log(
    `💬 Chat socket handler initialized untuk user: ${socket.userId} (${socket.userEmail})`
  );

  // Event: Kirim pesan baru
  socket.on("send_message", async (data) => {
    console.log(
      `📤 [SEND MESSAGE] User ${socket.userId} mencoba kirim pesan:`,
      data
    );

    try {
      const { receiverId, content, messageType = "text" } = data;
      const senderId = socket.userId;

      // Validasi input
      if (!receiverId || !content) {
        console.log(
          `❌ [SEND MESSAGE] Validasi gagal - receiverId: ${receiverId}, content: ${content}`
        );
        socket.emit("message_error", {
          message: "ID penerima dan konten pesan wajib diisi",
          code: "INVALID_INPUT",
        });
        return;
      }

      // Cek apakah mereka berteman
      const isFriends = await areFriends(senderId, receiverId);
      if (!isFriends) {
        console.log(
          `❌ [SEND MESSAGE] User ${senderId} dan ${receiverId} bukan teman`
        );
        socket.emit("message_error", {
          message: "Hanya bisa mengirim pesan ke teman",
          code: "NOT_FRIENDS",
        });
        return;
      }

      // Buat atau dapatkan chat room
      const chatRoomId = await createOrGetChatRoom(senderId, receiverId);
      console.log(`💬 [SEND MESSAGE] Chat room ID: ${chatRoomId}`);

      // Simpan pesan ke database
      const messageData = await saveMessage({
        senderId,
        receiverId,
        content,
        messageType,
        chatRoomId,
      });

      console.log(
        `✅ [SEND MESSAGE] Pesan berhasil disimpan dengan ID: ${messageData.id}`
      );

      // Kirim pesan ke penerima (jika online)
      const isReceiverOnline = io.sockets.adapter.rooms.has(receiverId);
      console.log(
        `🔍 [SEND MESSAGE] Status penerima ${receiverId}: ${
          isReceiverOnline ? "ONLINE" : "OFFLINE"
        }`
      );

      if (isReceiverOnline) {
        io.to(receiverId).emit("receive_message", {
          ...messageData,
          senderName: socket.userName,
          senderPhoto: socket.userPhoto,
        });
        console.log(
          `📨 [SEND MESSAGE] Pesan dikirim ke penerima ${receiverId}`
        );
      }

      // Kirim konfirmasi ke pengirim (sertakan tempId dari request agar UI bisa mengganti optimistic message)
      socket.emit("message_sent", {
        ...messageData,
        tempId: data.tempId,
        status: "sent",
        deliveredAt: new Date().toISOString(),
      });

      console.log(
        `🎉 [SEND MESSAGE] Berhasil! Pesan dari ${senderId} ke ${receiverId}`
      );
    } catch (error) {
      console.error(`❌ [SEND MESSAGE] Error:`, error);
      socket.emit("message_error", {
        message: "Gagal mengirim pesan",
        code: "SEND_FAILED",
        details: error.message,
      });
    }
  });

  // Event: Ambil riwayat pesan
  socket.on("get_messages", async (data) => {
    console.log(
      `📋 [GET MESSAGES] User ${socket.userId} minta riwayat pesan:`,
      data
    );

    try {
      const { friendId, limit = 50, lastMessageId = null } = data;
      const userId = socket.userId;

      if (!friendId) {
        console.log(`❌ [GET MESSAGES] Friend ID tidak ada`);
        socket.emit("messages_error", {
          message: "ID teman wajib diisi",
          code: "INVALID_FRIEND_ID",
        });
        return;
      }

      // Cek apakah mereka berteman
      const isFriends = await areFriends(userId, friendId);
      if (!isFriends) {
        console.log(
          `❌ [GET MESSAGES] User ${userId} dan ${friendId} bukan teman`
        );
        socket.emit("messages_error", {
          message: "Hanya bisa melihat pesan dengan teman",
          code: "NOT_FRIENDS",
        });
        return;
      }

      // Ambil pesan dari database
      const messages = await getMessages(
        userId,
        friendId,
        limit,
        lastMessageId
      );
      console.log(
        `📨 [GET MESSAGES] Ditemukan ${messages.length} pesan untuk chat ${userId}-${friendId}`
      );

      socket.emit("messages_history", {
        friendId,
        messages,
        hasMore: messages.length === limit,
        lastMessageId:
          messages.length > 0 ? messages[messages.length - 1].id : null,
      });

      console.log(
        `✅ [GET MESSAGES] Riwayat pesan berhasil dikirim ke ${userId}`
      );
    } catch (error) {
      console.error(`❌ [GET MESSAGES] Error:`, error);
      socket.emit("messages_error", {
        message: "Gagal mengambil riwayat pesan",
        code: "FETCH_FAILED",
        details: error.message,
      });
    }
  });

  // Event: User mulai mengetik
  socket.on("typing_start", (data) => {
    const { receiverId } = data;
    console.log(
      `⌨️ [TYPING START] ${socket.userId} mulai mengetik ke ${receiverId}`
    );

    if (receiverId) {
      io.to(receiverId).emit("user_typing", {
        userId: socket.userId,
        userName: socket.userName,
        isTyping: true,
      });
    }
  });

  // Event: User berhenti mengetik
  socket.on("typing_stop", (data) => {
    const { receiverId } = data;
    console.log(
      `⌨️ [TYPING STOP] ${socket.userId} berhenti mengetik ke ${receiverId}`
    );

    if (receiverId) {
      io.to(receiverId).emit("user_typing", {
        userId: socket.userId,
        userName: socket.userName,
        isTyping: false,
      });
    }
  });

  // Event: User online
  socket.on("user_online", () => {
    console.log(
      `🟢 [USER ONLINE] ${socket.userId} (${socket.userName}) online`
    );
    socket.broadcast.emit("user_status", {
      userId: socket.userId,
      userName: socket.userName,
      status: "online",
      timestamp: new Date().toISOString(),
    });
  });

  // Event: Tandai pesan sudah dibaca
  socket.on("mark_as_read", async (data) => {
    console.log(
      `👀 [MARK READ] User ${socket.userId} tandai pesan dibaca:`,
      data
    );

    try {
      const { messageId, senderId } = data;

      if (!messageId || !senderId) {
        console.log(`❌ [MARK READ] Data tidak lengkap`);
        return;
      }

      // Update status pesan di database (implementasi bisa ditambahkan di firestore.js)
      // await markMessageAsRead(messageId, socket.userId);

      // Kirim notifikasi ke pengirim bahwa pesan sudah dibaca
      io.to(senderId).emit("message_read", {
        messageId,
        readBy: socket.userId,
        readAt: new Date().toISOString(),
      });

      console.log(
        `✅ [MARK READ] Pesan ${messageId} ditandai sudah dibaca oleh ${socket.userId}`
      );
    } catch (error) {
      console.error(`❌ [MARK READ] Error:`, error);
    }
  });

  // Event: User disconnect
  socket.on("disconnect", () => {
    console.log(
      `🔴 [DISCONNECT] User ${socket.userId} (${socket.userName}) disconnect`
    );

    socket.broadcast.emit("user_status", {
      userId: socket.userId,
      userName: socket.userName,
      status: "offline",
      timestamp: new Date().toISOString(),
    });
  });
};

module.exports = chatSocket;

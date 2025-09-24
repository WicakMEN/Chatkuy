const { saveMessage, getMessages } = require('../config/firestore');

// Socket.IO chat event handlers
const chatSocket = (io, socket) => {
  
  // Handle sending messages
  socket.on('send_message', async (data) => {
    try {
      const { receiverId, content } = data;
      const senderId = socket.userId;
      
      if (!receiverId || !content) {
        socket.emit('error', { message: 'Receiver ID and content are required' });
        return;
      }
      
      // Save message to Firestore
      const messageId = await saveMessage(senderId, receiverId, content);
      
      const messageData = {
        id: messageId,
        senderId,
        receiverId,
        content,
        createdAt: new Date(),
        senderName: socket.userName,
        senderPhoto: socket.userPhoto
      };
      
      // Send message to receiver if they're online
      io.to(receiverId).emit('receive_message', messageData);
      
      // Send confirmation back to sender
      socket.emit('message_sent', messageData);
      
      console.log(`Message sent from ${senderId} to ${receiverId}`);
      
    } catch (error) {
      console.error('Send message error:', error);
      socket.emit('error', { message: 'Failed to send message' });
    }
  });
  
  // Handle getting message history
  socket.on('get_messages', async (data) => {
    try {
      const { friendId, limit = 50 } = data;
      const userId = socket.userId;
      
      if (!friendId) {
        socket.emit('error', { message: 'Friend ID is required' });
        return;
      }
      
      // Get messages between user and friend
      const messages = await getMessages(userId, friendId, limit);
      
      socket.emit('messages_history', {
        friendId,
        messages
      });
      
      console.log(`Message history sent to ${userId} for chat with ${friendId}`);
      
    } catch (error) {
      console.error('Get messages error:', error);
      socket.emit('error', { message: 'Failed to get messages' });
    }
  });
  
  // Handle user typing indicator
  socket.on('typing_start', (data) => {
    const { receiverId } = data;
    if (receiverId) {
      io.to(receiverId).emit('user_typing', {
        userId: socket.userId,
        userName: socket.userName,
        isTyping: true
      });
    }
  });
  
  socket.on('typing_stop', (data) => {
    const { receiverId } = data;
    if (receiverId) {
      io.to(receiverId).emit('user_typing', {
        userId: socket.userId,
        userName: socket.userName,
        isTyping: false
      });
    }
  });
  
  // Handle user online status
  socket.on('user_online', () => {
    socket.broadcast.emit('user_status', {
      userId: socket.userId,
      userName: socket.userName,
      status: 'online'
    });
  });
  
  // Handle disconnect
  socket.on('disconnect', () => {
    socket.broadcast.emit('user_status', {
      userId: socket.userId,
      userName: socket.userName,
      status: 'offline'
    });
    console.log(`User ${socket.userId} disconnected`);
  });
};

module.exports = chatSocket;
const admin = require('firebase-admin');

// Socket.IO authentication middleware
const socketAuth = async (socket, next) => {
  try {
    const token = socket.handshake.auth.token;
    
    if (!token) {
      console.log('Socket connection rejected: No token provided');
      return next(new Error('Authentication error: No token provided'));
    }
    
    // Verify Firebase ID token
    const decodedToken = await admin.auth().verifyIdToken(token);
    
    // Add user info to socket object
    socket.userId = decodedToken.uid;
    socket.userEmail = decodedToken.email;
    socket.userName = decodedToken.name;
    socket.userPhoto = decodedToken.picture;
    
    console.log(`Socket authenticated for user: ${socket.userEmail} (${socket.userId})`);
    next();
    
  } catch (error) {
    console.error('Socket authentication error:', error);
    next(new Error('Authentication error: Invalid token'));
  }
};

module.exports = socketAuth;
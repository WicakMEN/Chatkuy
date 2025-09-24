const express = require("express");
const http = require("http");
const socketIo = require("socket.io");
const cors = require("cors");
require("dotenv").config();

// Import Firebase config (this will initialize Firebase Admin)
require("./config/firestore");

// Import routes
const authRoutes = require("./routes/auth");
const userRoutes = require("./routes/user");
const friendsRoutes = require("./routes/friends");

// Import socket handlers
const socketAuth = require("./sockets/auth");
const chatSocket = require("./sockets/chat");

const app = express();
const server = http.createServer(app);

// Configure CORS
const corsOptions = {
  origin: [
    process.env.FRONTEND_URL || "http://localhost:5173",
    "http://192.168.88.124:5173", // Add your IP address
    "http://localhost:5173",
  ],
  credentials: true,
};

app.use(cors(corsOptions));
app.use(express.json());

// Socket.IO setup with CORS
const io = socketIo(server, {
  cors: corsOptions,
});

// Make io available globally
app.set("io", io);

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/friends", friendsRoutes);

// Basic health check
app.get("/", (req, res) => {
  res.json({
    message: "ChatKuy Backend API is running!",
    status: "healthy",
    timestamp: new Date().toISOString(),
  });
});

// Socket.IO connection handling
io.use(socketAuth); // Authentication middleware for Socket.IO

io.on("connection", (socket) => {
  console.log(`User connected: ${socket.userId}`);

  // Join user to their own room for private messages
  socket.join(socket.userId);

  // Handle chat events
  chatSocket(io, socket);

  socket.on("disconnect", () => {
    console.log(`User disconnected: ${socket.userId}`);
  });
});

const PORT = process.env.PORT || 3001;

server.listen(PORT, () => {
  console.log(`🚀 ChatKuy Backend running on port ${PORT}`);
  console.log(`📱 CORS enabled for: ${corsOptions.origin}`);
});

module.exports = { app, server, io };

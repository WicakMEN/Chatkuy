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
const chatRoutes = require("./routes/chat"); // Tambahan untuk chat API

// Import socket handlers
const socketAuth = require("./sockets/auth");
const chatSocket = require("./sockets/chat");

const app = express();

// Debug middleware untuk melihat semua request
app.use((req, res, next) => {
  console.log(`🌐 ${req.method} ${req.url}`);
  console.log(`🔍 Content-Type:`, req.headers["content-type"]);
  console.log(`🔍 Headers:`, JSON.stringify(req.headers, null, 2));
  next();
});

app.use(express.json());

// Debug middleware untuk melihat parsed body
app.use((req, res, next) => {
  console.log(`📦 Parsed Body:`, JSON.stringify(req.body, null, 2));
  next();
});

const server = http.createServer(app);

// Configure CORS
const corsOptions = {
  origin: [
    process.env.FRONTEND_URL || "http://localhost:5173",
    "http://192.168.88.124:5173", // Add your IP address
    "http://192.168.56.1:5173", // Add new IP address dari error
    "http://172.24.16.1:5173", // Add additional network interfaces
    "http://localhost:5173",
  ],
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "authorization"],
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
app.use("/api/chat", chatRoutes); // Tambahan untuk chat API

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

// Graceful error handling for common server errors
server.on("error", (err) => {
  if (err && err.code === "EADDRINUSE") {
    console.error(`\n❌ Port ${PORT} sudah dipakai (EADDRINUSE).`);
    console.error("👉 Solusi cepat (Windows PowerShell):");
    console.error("  1) Cari PID:   netstat -ano | findstr :" + PORT);
    console.error("  2) Kill PID:   taskkill /PID <PID> /F");
    console.error(
      "  Atau jalankan di terminal yang masih berjalan server sebelumnya: Ctrl+C untuk menghentikan."
    );
    console.error(
      "  Alternatif sementara: set PORT lain, mis. $env:PORT=3002; node server.js (jangan lupa update VITE_API_BASE_URL di frontend)."
    );
    process.exit(1);
  }
  console.error("Server error:", err);
  process.exit(1);
});

module.exports = { app, server, io };

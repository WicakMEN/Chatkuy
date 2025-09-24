# 🚀 ChatKuy - Modern Chat App

ChatKuy adalah aplikasi chat modern yang dibangun dengan **React** (frontend) dan **Node.js + Express + Socket.IO** (backend), menggunakan **Firebase Authentication** untuk login Google dan **Firestore** sebagai database.

## ✨ Fitur

- 🔐 **Authentication**: Login dengan Google (Firebase Auth)
- 💬 **Real-time Chat**: Messaging real-time dengan Socket.IO
- 👥 **Friend System**: Cari dan tambah teman berdasarkan email
- 🟢 **Online Status**: Indikator status online/offline user
- 📱 **Responsive Design**: UI modern dengan TailwindCSS
- 🔒 **Secure**: Token-based authentication dengan Firebase

## 🏗️ Arsitektur

```
/ChatKuy
├── /backend          # Node.js + Express + Socket.IO
│   ├── /config       # Firebase Admin SDK, Auth middleware
│   ├── /controllers  # Business logic
│   ├── /routes       # API routes
│   ├── /sockets      # Socket.IO event handlers
│   └── server.js     # Entry point
├── /frontend         # React + Vite + TailwindCSS
│   └── /src
│       ├── /components  # UI components
│       ├── /pages      # Login & Chat pages
│       ├── /context    # Auth & Socket context
│       ├── /services   # API services
│       └── firebase.js # Firebase config
```

## 🛠️ Tech Stack

### Frontend
- **React 18** + **Vite** - Modern React development
- **TailwindCSS** - Utility-first CSS framework
- **Firebase SDK** - Authentication & Firestore
- **Socket.IO Client** - Real-time communication
- **React Router** - Client-side routing
- **Lucide React** - Modern icons

### Backend
- **Node.js** + **Express** - Server framework
- **Socket.IO** - Real-time bidirectional communication
- **Firebase Admin SDK** - Server-side Firebase integration
- **Firestore** - NoSQL database for storing users, messages
- **CORS** - Cross-origin resource sharing

## 📋 Prerequisites

Sebelum menjalankan aplikasi, pastikan Anda memiliki:

1. **Node.js** (v16 atau lebih baru)
2. **npm** atau **yarn**
3. **Firebase Project** dengan Authentication & Firestore enabled
4. **Firebase Service Account Key**

## 🚀 Setup & Installation

### 1. Clone Repository
```bash
git clone <repository-url>
cd ChatKuy
```

### 2. Setup Backend

```bash
cd backend
npm install
```

**Configure Firebase:**
1. Buat project baru di [Firebase Console](https://console.firebase.google.com)
2. Enable Authentication (Google provider) dan Firestore
3. Download Service Account Key dari Project Settings > Service Accounts
4. Rename file menjadi `firebase-service-account.json` dan letakkan di `backend/config/`
5. Copy `.env.example` menjadi `.env` dan sesuaikan konfigurasi

```bash
cp .env.example .env
# Edit file .env dengan konfigurasi Firebase Anda
```

### 3. Setup Frontend

```bash
cd frontend
npm install
```

**Configure Firebase:**
1. Copy konfigurasi Firebase Web App dari Firebase Console
2. Update file `src/firebase.js` dengan konfigurasi Anda

```javascript
const firebaseConfig = {
  apiKey: "your-api-key",
  authDomain: "your-project-id.firebaseapp.com",
  projectId: "your-project-id",
  storageBucket: "your-project-id.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abcdef123456789"
};
```

## 🏃‍♂️ Running the Application

### Development Mode

**Terminal 1 - Backend:**
```bash
cd backend
npm run dev
# Server will run on http://localhost:3001
```

**Terminal 2 - Frontend:**
```bash
cd frontend
npm run dev
# App will run on http://localhost:5173
```

### Production Build

**Backend:**
```bash
cd backend
npm start
```

**Frontend:**
```bash
cd frontend
npm run build
npm run preview
```

## 📊 Database Structure (Firestore)

### Users Collection
```javascript
{
  uid: "firebase-user-id",
  displayName: "John Doe",
  email: "john@example.com",
  photoURL: "https://...",
  friends: ["uid1", "uid2"],
  createdAt: timestamp,
  updatedAt: timestamp
}
```

### Messages Collection
```javascript
{
  id: "auto-generated-id",
  senderId: "sender-uid",
  receiverId: "receiver-uid", 
  content: "Hello!",
  createdAt: timestamp,
  read: false
}
```

### FriendRequests Collection (untuk future development)
```javascript
{
  id: "auto-generated-id",
  requesterId: "requester-uid",
  receiverId: "receiver-uid",
  status: "pending | accepted | rejected",
  createdAt: timestamp
}
```

## 🔌 API Endpoints

### Authentication
- `POST /api/auth/login` - Login dengan Google token
- `GET /api/auth/me` - Get current user info
- `POST /api/auth/logout` - Logout user

### Users
- `GET /api/users/search?email=` - Search user by email
- `GET /api/users/profile/:uid` - Get user profile

### Socket.IO Events

**Client → Server:**
- `send_message` - Kirim pesan
- `get_messages` - Get riwayat pesan
- `typing_start` / `typing_stop` - Typing indicators
- `user_online` - Set status online

**Server → Client:**
- `receive_message` - Terima pesan baru
- `message_sent` - Konfirmasi pesan terkirim
- `messages_history` - Riwayat pesan
- `user_typing` - User sedang mengetik
- `user_status` - Status online/offline user

## 🎨 Features

### ✅ Implemented (Phase 1)
- [x] Google Authentication dengan Firebase
- [x] User profile management
- [x] Search users by email
- [x] Real-time Socket.IO connection
- [x] Modern responsive UI
- [x] Online status indicators
- [x] Basic chat interface

### 🚧 Coming Soon (Phase 2)
- [ ] Send/receive messages
- [ ] Message history
- [ ] Friend request system
- [ ] Typing indicators
- [ ] Message read status
- [ ] File/image sharing
- [ ] Push notifications

## 🚀 Deployment

### Backend Deployment (Render/Railway)
1. Push kode ke Git repository
2. Connect ke platform deployment
3. Set environment variables
4. Deploy

### Frontend Deployment (Vercel/Netlify)
1. Build project: `npm run build`
2. Deploy `dist` folder
3. Update Firebase CORS settings

## 🤝 Contributing

1. Fork the project
2. Create feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 👨‍💻 Author

**WicakMEN**
- GitHub: [@WicakMEN](https://github.com/WicakMEN)

---

## 🐞 Troubleshooting

### Common Issues

**1. Firebase Authentication Error**
- Pastikan Firebase config sudah benar
- Check domain authorization di Firebase Console

**2. Socket.IO Connection Failed**
- Pastikan backend server berjalan
- Check CORS configuration

**3. Firestore Permission Denied**
- Pastikan Firestore rules sudah configured
- Check service account permissions

**4. Build Errors**
- Delete `node_modules` dan `package-lock.json`
- Run `npm install` ulang

---

🎉 **Happy Chatting with ChatKuy!**
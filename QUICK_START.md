# 🚀 Quick Start Guide - ChatKuy

## Phase 1: Login/Register System (Current)

Ikuti langkah-langkah ini untuk menjalankan aplikasi ChatKuy dengan sistem login Google:

### 1. Install Dependencies

**Backend:**
```powershell
cd D:\nnnnssssffffwwww\Chatkuy\backend
npm install
```

**Frontend:**
```powershell
cd D:\nnnnssssffffwwww\Chatkuy\frontend
npm install
```

### 2. Setup Firebase (WAJIB!)

Sebelum menjalankan aplikasi, Anda HARUS setup Firebase terlebih dahulu:

1. **Baca file `FIREBASE_SETUP.md`** untuk panduan lengkap
2. Buat Firebase project baru
3. Enable Authentication (Google) dan Firestore
4. Download service account key → `backend/config/firebase-service-account.json`
5. Update config di `frontend/src/firebase.js`
6. Buat file `backend/.env` sesuai template

### 3. Run Development Server

**Terminal 1 - Backend:**
```powershell
cd D:\nnnnssssffffwwww\Chatkuy\backend
npm run dev
```

**Terminal 2 - Frontend:**
```powershell
cd D:\nnnnssssffffwwww\Chatkuy\frontend
npm run dev
```

### 4. Test the App

1. Open browser: `http://localhost:5173`
2. Click "Continue with Google"
3. Login dengan akun Google Anda
4. Seharusnya redirect ke halaman chat

## 🎯 Current Features (Phase 1)

✅ **Authentication System**
- Login dengan Google (Firebase Auth)
- Automatic user profile creation di Firestore
- Token-based authentication
- Protected routes dengan React Router

✅ **Basic UI**
- Modern login page dengan TailwindCSS
- Chat dashboard dengan sidebar
- User profile display
- Search friends by email (UI ready)
- Responsive design

✅ **Real-time Connection**
- Socket.IO connection dengan authentication
- Online status indicators
- Connection status display

## 🔜 Next Steps (Phase 2)

Setelah Phase 1 berjalan dengan baik, berikutnya akan dikembangkan:

- ⏳ Send/receive messages functionality
- ⏳ Friend request system
- ⏳ Message history dengan Firestore
- ⏳ Typing indicators
- ⏳ Message read status
- ⏳ File/image sharing

## 🐞 Troubleshooting

**Backend tidak bisa start:**
- Pastikan file `firebase-service-account.json` ada di `backend/config/`
- Check environment variables di `.env`

**Frontend tidak bisa login:**
- Pastikan Firebase config sudah benar di `firebase.js`
- Check domain authorization di Firebase Console

**Socket connection failed:**
- Pastikan backend server berjalan di port 3001
- Check CORS configuration

**Permission denied Firestore:**
- Set Firestore rules ke test mode untuk development
- Pastikan user sudah login

## 📱 Demo Flow

1. **Landing** → `http://localhost:5173` (redirect to `/login`)
2. **Login Page** → Click "Continue with Google"
3. **Google OAuth** → Select Google account
4. **Chat Page** → Dashboard dengan sidebar dan chat area
5. **Search Friends** → Type email untuk cari user lain
6. **Real-time Status** → Lihat indikator online/offline

## 📁 Project Structure

```
ChatKuy/
├── backend/           # Node.js + Express + Socket.IO
│   ├── config/        # Firebase config & auth middleware
│   ├── routes/        # API endpoints (auth, users)
│   ├── sockets/       # Socket.IO handlers
│   └── server.js      # Main server file
├── frontend/          # React + Vite + TailwindCSS
│   └── src/
│       ├── components/  # UI components
│       ├── pages/      # Login & Chat pages
│       ├── context/    # Auth & Socket providers
│       └── firebase.js # Firebase client config
├── README.md          # Full documentation
├── FIREBASE_SETUP.md  # Firebase configuration guide
└── QUICK_START.md     # This file
```

## 🎉 You're All Set!

Setelah Phase 1 berhasil, aplikasi ChatKuy Anda sudah memiliki:
- ✅ Modern authentication system
- ✅ Real-time connection infrastructure  
- ✅ Beautiful responsive UI
- ✅ User management dengan Firestore

Ready untuk Phase 2! 🚀
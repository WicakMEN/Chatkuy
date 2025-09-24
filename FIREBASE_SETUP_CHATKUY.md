# 🔥 Firebase Setup untuk ChatKuy Project

## Project Details
- **Project ID**: `chatkuy-fe604`
- **Project Name**: ChatKuy
- **Region**: Default (us-central)

## 📋 Langkah Setup

### 1. Firebase Console Setup

1. **Buka Firebase Console**: https://console.firebase.google.com
2. **Pilih Project**: `chatkuy-fe604`
3. **Enable Authentication**:
   - Go to Authentication > Sign-in method
   - Enable Google provider
   - Tambahkan domain authorized: `localhost`, `127.0.0.1`

4. **Enable Firestore Database**:
   - Go to Firestore Database
   - Create database
   - Start in **test mode** (untuk development)
   - Choose location: `us-central`

### 2. Download Service Account Key

1. Go to **Project Settings** (⚙️ icon)
2. Go to **Service accounts** tab
3. Click **Generate new private key**
4. Download JSON file
5. **Rename** file menjadi `firebase-service-account.json`
6. **Move** file ke folder `backend/config/firebase-service-account.json`

⚠️ **PENTING**: Jangan commit file service account ke Git!

### 3. Firestore Security Rules (Development)

```javascript
rules_version = '2';

service cloud.firestore {
  match /databases/{database}/documents {
    // Allow read/write access to all users (for development only)
    match /{document=**} {
      allow read, write: if request.auth != null;
    }
  }
}
```

### 4. Install Dependencies

```bash
# Backend
cd backend
npm install

# Frontend  
cd frontend
npm install
```

### 5. Test Setup

**Terminal 1 - Backend:**
```bash
cd backend
npm run dev
```

**Terminal 2 - Frontend:**
```bash  
cd frontend
npm run dev
```

### 6. Verify Login Flow

1. Open `http://localhost:5173`
2. Click "Continue with Google"
3. Login dengan Google account
4. Check Firestore Console:
   - Collection: `users`
   - Document ID: Firebase UID
   - Data: displayName, email, photoURL, friends[]

## 📊 Expected Firestore Structure

### Users Collection
```
/users/{firebaseUID}
{
  uid: "firebase-user-uid",
  displayName: "John Doe", 
  email: "john@gmail.com",
  photoURL: "https://lh3.googleusercontent.com/...",
  friends: [],
  createdAt: timestamp,
  updatedAt: timestamp
}
```

### Messages Collection (akan dibuat nanti)
```
/messages/{messageID}
{
  senderId: "user-uid-1",
  receiverId: "user-uid-2", 
  content: "Hello!",
  createdAt: timestamp,
  read: false
}
```

## 🐞 Troubleshooting

### Error: "Service account key not found"
- Pastikan file `firebase-service-account.json` ada di `backend/config/`
- Check file permissions

### Error: "Firebase config invalid"
- Verify config di `frontend/src/firebase.js`
- Pastikan semua field config benar

### Error: "Authentication failed"
- Check Google provider enabled di Firebase Console
- Verify authorized domains include `localhost`

### Error: "Firestore permission denied"
- Set Firestore rules ke test mode
- Pastikan user sudah authenticated

## ✅ Success Indicators

✅ Backend server starts without errors  
✅ Frontend loads login page  
✅ Google OAuth popup appears  
✅ User data created in Firestore after login  
✅ Socket.IO connection established  
✅ User redirected to chat page  

## 🚀 Next Steps

Setelah login berhasil:
1. Test search user by email
2. Implement send/receive messages  
3. Add friend request system
4. Deploy to production

---

**Firebase Project**: chatkuy-fe604  
**Status**: Ready for Development 🎉
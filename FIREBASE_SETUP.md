# Firebase Setup Guide 🔥

## 1. Create Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Click "Create a project"
3. Enter project name: `chatkuy-your-name`
4. Enable Google Analytics (optional)
5. Create project

## 2. Enable Authentication

1. Go to **Authentication** > **Sign-in method**
2. Enable **Google** provider
3. Add your domain to authorized domains:
   - `localhost` (for development)
   - Your production domain (for deployment)

## 3. Setup Firestore Database

1. Go to **Firestore Database**
2. Click "Create database"
3. Choose **Start in test mode** (for development)
4. Select location (closest to your users)

### Firestore Security Rules (for development)
```javascript
// Allow read/write for authenticated users
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if request.auth != null;
    }
  }
}
```

## 4. Get Firebase Config

### For Frontend (Web Config)
1. Go to **Project Settings** > **General**
2. Scroll to "Your apps" section
3. Click "Add app" > Web app
4. Register app name: `chatkuy-frontend`
5. Copy the config object and update `frontend/src/firebase.js`:

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

### For Backend (Service Account)
1. Go to **Project Settings** > **Service accounts**
2. Click "Generate new private key"
3. Download the JSON file
4. Rename to `firebase-service-account.json`
5. Place in `backend/config/` folder

⚠️ **Important**: Never commit service account key to Git!

## 5. Update Backend Environment

Create `backend/.env` file:
```env
NODE_ENV=development
PORT=3001
FRONTEND_URL=http://localhost:5173
FIREBASE_DATABASE_URL=https://your-project-id-default-rtdb.firebaseio.com/
```

## 6. Test Firebase Connection

### Test Frontend Auth
1. Start frontend: `npm run dev`
2. Click "Continue with Google"
3. Should redirect to Google OAuth
4. After login, should see user info in chat page

### Test Backend API
1. Start backend: `npm run dev`
2. Visit: `http://localhost:3001`
3. Should see: "ChatKuy Backend API is running!"

## 7. Firestore Collections Structure

Your Firestore will have these collections:

### `users`
- Document ID: Firebase UID
- Fields: uid, displayName, email, photoURL, friends[], createdAt, updatedAt

### `messages`
- Document ID: Auto-generated
- Fields: senderId, receiverId, content, createdAt, read

### `friendRequests` (for future)
- Document ID: Auto-generated  
- Fields: requesterId, receiverId, status, createdAt

## 8. Production Setup

### Firestore Security Rules (Production)
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users can only read/write their own profile
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Messages: users can read/write messages they're involved in
    match /messages/{messageId} {
      allow read, write: if request.auth != null && 
        (request.auth.uid == resource.data.senderId || 
         request.auth.uid == resource.data.receiverId);
    }
    
    // Friend requests: users can read requests for them
    match /friendRequests/{requestId} {
      allow read, write: if request.auth != null &&
        (request.auth.uid == resource.data.requesterId ||
         request.auth.uid == resource.data.receiverId);
    }
  }
}
```

### Domain Authorization
Add your production domains to:
- Firebase Authentication > Settings > Authorized domains
- Google Cloud Console > OAuth consent screen

## 9. Troubleshooting

### Common Errors

**"Firebase config not found"**
- Check if `firebase.js` config is correct
- Ensure all keys are properly copied

**"Permission denied on Firestore"**
- Check Firestore security rules
- Ensure user is authenticated

**"Google sign-in popup blocked"**
- Allow popups in browser
- Check if domain is authorized

**"Service account error"**
- Check if `firebase-service-account.json` exists
- Verify file permissions
- Ensure service account has proper roles

### Verify Setup
Run these tests to ensure everything works:

1. **Frontend auth test**: Can login with Google
2. **Backend API test**: Can call `/api/auth/me` with token
3. **Socket connection test**: Real-time connection works
4. **Firestore test**: Can read/write user data

## 🎉 You're Ready!

Once all steps are completed, your ChatKuy app should be fully functional with Firebase backend!
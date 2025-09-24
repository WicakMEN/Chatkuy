# 📝 LANGKAH WAJIB: Download Firebase Service Account

## ⚠️ PENTING: Tanpa file ini, backend tidak bisa jalan!

### 1. Akses Firebase Console
1. Buka: https://console.firebase.google.com
2. Pilih project: **chatkuy-fe604**

### 2. Download Service Account Key
1. Klik **⚙️ Settings** (kiri bawah)
2. Pilih **Project settings**
3. Tab **Service accounts**
4. Klik **Generate new private key**
5. Konfirmasi **Generate key**
6. File JSON akan ter-download

### 3. Setup File di Project
1. **Rename** file yang ter-download menjadi: `firebase-service-account.json`
2. **Copy** file ke folder: `D:\nnnnssssffffwwww\Chatkuy\backend\config\firebase-service-account.json`

### 4. Verifikasi File Structure
```
backend/
├── config/
│   ├── auth.js
│   ├── firestore.js
│   ├── firebase-service-account.json ← FILE INI HARUS ADA!
│   └── firebase-service-account.json.example
├── server.js
└── ...
```

### 5. Test Backend
```bash
cd backend
node server.js
```

**Expected Output:**
```
🚀 ChatKuy Backend running on port 3001
📱 CORS enabled for: http://localhost:5173
```

## 🚨 Jika Masih Error

### Error: "Cannot find module firebase-service-account.json"
- Pastikan file ada di `backend/config/firebase-service-account.json`
- Check nama file harus persis: `firebase-service-account.json`
- Jangan ada spasi atau karakter lain

### Error: "Service account key is invalid"
- Download ulang service account key dari Firebase Console
- Pastikan project ID di file JSON = `chatkuy-fe604`

### Error: "Permission denied"
- Di Firebase Console, pastikan service account punya role: 
  - **Firebase Admin SDK Administrator Service Agent**
  - **Editor** atau **Owner**

## ✅ File Service Account Berhasil

Jika berhasil, file JSON akan terlihat seperti ini:
```json
{
  "type": "service_account",
  "project_id": "chatkuy-fe604",
  "private_key_id": "abc123...",
  "private_key": "-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n",
  "client_email": "firebase-adminsdk-xxxxx@chatkuy-fe604.iam.gserviceaccount.com",
  ...
}
```

---

**📋 Next Step:** Setelah file service account sudah ada, jalankan:
1. `cd backend && node server.js`
2. `cd frontend && npm run dev` 
3. Test login di `http://localhost:5173`
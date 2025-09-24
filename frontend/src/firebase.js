// Import the functions you need from the SDKs you need
import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getAnalytics } from 'firebase/analytics';

// Your web app's Firebase configuration
// For Firebase JS SDK v9-compat or v9
const firebaseConfig = {
  apiKey: "AIzaSyDeNFBWOtlqS4hmMrF1A2oJ4x-Iwcqhzfs",
  authDomain: "chatkuy-fe604.firebaseapp.com",
  projectId: "chatkuy-fe604",
  storageBucket: "chatkuy-fe604.firebasestorage.app",
  messagingSenderId: "300262767908",
  appId: "1:300262767908:web:c38b343a49c20336f647b1",
  measurementId: "G-5310M8L4YW"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase Authentication and get a reference to the service
export const auth = getAuth(app);

// Initialize Google Auth Provider
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({
  prompt: 'select_account'
});

// Initialize Cloud Firestore and get a reference to the service
export const db = getFirestore(app);

// Initialize Analytics (optional)
export const analytics = getAnalytics(app);

export default app;
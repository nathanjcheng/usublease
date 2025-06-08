import { initializeApp } from 'firebase/app';
import {
  getFirestore,
  connectFirestoreEmulator,
  initializeFirestore,
  persistentLocalCache
} from 'firebase/firestore';
import { getAuth, connectAuthEmulator } from 'firebase/auth';

// Debug: Log environment variables
console.log('Firebase Config:', {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID,
  storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.REACT_APP_FIREBASE_APP_ID
});

const firebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY || 'AIzaSyCySoNBl-z7A5lRo__juJsDwFOFoXuqIuY',
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN || 'usublease.firebaseapp.com',
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID || 'usublease',
  storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET || 'usublease.appspot.com',
  messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID || '189860137417',
  appId: process.env.REACT_APP_FIREBASE_APP_ID || '1:189860137417:web:109d204f3c716918bfc018'
};

// Initialize Firebase *once*
const app = initializeApp(firebaseConfig);
console.log('Firebase initialized successfully');

// Initialize Auth
const auth = getAuth(app);

// Initialize Firestore with persistent local cache (modern API)
let db;
try {
  db = initializeFirestore(app, {
    localCache: persistentLocalCache(),
    experimentalForceLongPolling: true
  });
  console.log('Firestore initialized with persistence successfully');
} catch (error) {
  console.warn('Failed to initialize Firestore with persistence, falling back to default:', error);
  db = getFirestore(app);
}

// Connect to emulators in development
if (process.env.NODE_ENV === 'development' && process.env.REACT_APP_USE_EMULATOR === 'true') {
  try {
    connectFirestoreEmulator(db, 'localhost', 8080);
    connectAuthEmulator(auth, 'http://localhost:9099', { disableWarnings: true });
    console.log('Connected to Firebase emulators');
  } catch (error) {
    console.warn('Failed to connect to emulators:', error);
  }
}

export { app, db, auth }; 
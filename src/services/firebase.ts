import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyC9HEWcvrUzxWMyx3d8EXGyrXxUcir0Et0",
  authDomain: "ringed-object-08gvj.firebaseapp.com",
  projectId: "ringed-object-08gvj",
  storageBucket: "ringed-object-08gvj.firebasestorage.app",
  messagingSenderId: "530315738111",
  appId: "1:530315738111:web:43aade83d79176c74245ca"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app, "ai-studio-bc0945a5-a60b-4f0f-b53e-ccaa109aa525");

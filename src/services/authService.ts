import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut,
  User as FirebaseUser
} from 'firebase/auth';
import { 
  doc, 
  setDoc, 
  getDoc, 
  updateDoc, 
  serverTimestamp 
} from 'firebase/firestore';
import { auth, db, handleFirestoreError, OperationType } from './firebase';
import { User } from '../types';

export interface FirebaseUserProfile extends User {
  uid: string;
  streak: number;
  badges: string[];
  lastQuizDate?: string;
  lastDailyDate?: string;
  quizCount: number;
  createdAt?: any;
  updatedAt?: any;
}

export const authService = {
  // 1. Sign up flow
  signup: async (name: string, email: string, pass: string): Promise<FirebaseUserProfile> => {
    if (!auth || !db) {
      // Fallback if Firebase not configured
      const localUser: FirebaseUserProfile = {
        uid: "local_temp_uid",
        name,
        email,
        streak: 0,
        badges: [],
        quizCount: 0
      };
      localStorage.setItem('user', JSON.stringify(localUser));
      return localUser;
    }

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, pass);
      const firebaseUser = userCredential.user;
      
      const userProfile: FirebaseUserProfile = {
        uid: firebaseUser.uid,
        name,
        email,
        streak: 0,
        badges: [],
        lastQuizDate: "",
        lastDailyDate: "",
        quizCount: 0,
      };

      // Create profile document in Firestore
      const userDocPath = `users/${firebaseUser.uid}`;
      try {
        await setDoc(doc(db, 'users', firebaseUser.uid), {
          ...userProfile,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        });
      } catch (fsError) {
        handleFirestoreError(fsError, OperationType.CREATE, userDocPath);
      }

      localStorage.setItem('user', JSON.stringify(userProfile));
      return userProfile;
    } catch (error: any) {
      console.error("Firebase Auth Signup Error:", error);
      throw error;
    }
  },

  // 2. Sign in/Login flow
  login: async (email: string, pass: string): Promise<FirebaseUserProfile> => {
    if (!auth || !db) {
      // Fallback if Firebase not configured
      const name = email.split('@')[0];
      const localUser: FirebaseUserProfile = {
        uid: "local_temp_uid",
        name,
        email,
        streak: 0,
        badges: [],
        quizCount: 0
      };
      localStorage.setItem('user', JSON.stringify(localUser));
      return localUser;
    }

    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, pass);
      const firebaseUser = userCredential.user;
      
      // Fetch profile document from Firestore
      const userDocPath = `users/${firebaseUser.uid}`;
      let profile: FirebaseUserProfile;
      
      try {
        const docSnap = await getDoc(doc(db, 'users', firebaseUser.uid));
        if (docSnap.exists()) {
          const data = docSnap.data();
          profile = {
            uid: firebaseUser.uid,
            name: data.name || firebaseUser.displayName || email.split('@')[0],
            email: firebaseUser.email || email,
            streak: data.streak || 0,
            badges: data.badges || [],
            lastQuizDate: data.lastQuizDate || "",
            lastDailyDate: data.lastDailyDate || "",
            quizCount: data.quizCount || 0,
          };
        } else {
          // Fallback if profile wasn't fully created
          profile = {
            uid: firebaseUser.uid,
            name: firebaseUser.displayName || email.split('@')[0],
            email: firebaseUser.email || email,
            streak: 0,
            badges: [],
            quizCount: 0,
          };
          await setDoc(doc(db, 'users', firebaseUser.uid), {
            ...profile,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp()
          });
        }
      } catch (fsError) {
        handleFirestoreError(fsError, OperationType.GET, userDocPath);
        throw fsError;
      }

      localStorage.setItem('user', JSON.stringify(profile));
      return profile;
    } catch (error: any) {
      console.error("Firebase Auth Login Error:", error);
      throw error;
    }
  },

  // 3. Logout flow
  logout: async (): Promise<void> => {
    localStorage.removeItem('user');
    if (auth) {
      await signOut(auth);
    }
  },

  // 4. Retrieve current session cached profile
  getCurrentUser: (): FirebaseUserProfile | null => {
    const userStr = localStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
  },

  // 5. Update user profile database details (streak, stats)
  updateProfile: async (uid: string, updates: Partial<FirebaseUserProfile>): Promise<void> => {
    // Sync local storage cache
    const current = authService.getCurrentUser();
    if (current && current.uid === uid) {
      const merged = { ...current, ...updates };
      localStorage.setItem('user', JSON.stringify(merged));
    }

    if (!db || uid === "local_temp_uid") return;

    const userDocPath = `users/${uid}`;
    try {
      await updateDoc(doc(db, 'users', uid), {
        ...updates,
        updatedAt: serverTimestamp()
      });
    } catch (fsError) {
      handleFirestoreError(fsError, OperationType.UPDATE, userDocPath);
    }
  }
};

// Backwards compatibility export
export const mockAuth = authService;

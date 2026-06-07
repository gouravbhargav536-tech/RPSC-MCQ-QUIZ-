import { initializeApp, getApp, getApps } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore, doc, getDocFromServer } from 'firebase/firestore';
import { getDatabase, ref, get } from 'firebase/database';
import firebaseConfig from '../../firebase-applet-config.json';

// Support dynamic local storage configurations with robust sanitization
const getSanitizedLocalStorage = (key: string): string | null => {
  if (typeof window === 'undefined') return null;
  const val = localStorage.getItem(key);
  if (!val) return null;
  const trimmed = val.trim();
  if (
    trimmed === '' || 
    trimmed === 'undefined' || 
    trimmed === 'null' || 
    trimmed === '[object Object]' ||
    trimmed.includes('<YOUR') ||
    trimmed.includes('YOUR_') ||
    trimmed.includes('<') ||
    trimmed.includes('>')
  ) {
    return null;
  }
  return trimmed;
};

export const getActiveFirebaseConfig = () => {
  const localProject = getSanitizedLocalStorage('firebase_project_id');
  const localApiKey = getSanitizedLocalStorage('firebase_api_key');
  const localAppId = getSanitizedLocalStorage('firebase_app_id');
  const localRtdbUrl = getSanitizedLocalStorage('firebase_rtdb_url');

  const projectId = localProject || firebaseConfig.projectId || 'rpscquizapp';
  
  let databaseURL = localRtdbUrl || (firebaseConfig as any).databaseURL;
  if (
    !databaseURL || 
    !databaseURL.startsWith('https://') || 
    databaseURL.includes('<') || 
    databaseURL.includes('>') || 
    databaseURL.includes('YOUR_') ||
    databaseURL === 'undefined' ||
    databaseURL === 'null'
  ) {
    databaseURL = `https://${projectId}-default-rtdb.firebaseio.com`;
  }

  return {
    projectId,
    appId: localAppId || firebaseConfig.appId,
    apiKey: localApiKey || firebaseConfig.apiKey,
    authDomain: `${projectId}.firebaseapp.com`,
    firestoreDatabaseId: firebaseConfig.firestoreDatabaseId || '(default)',
    storageBucket: `${projectId}.firebasestorage.app`,
    messagingSenderId: firebaseConfig.messagingSenderId,
    measurementId: firebaseConfig.measurementId,
    databaseURL
  };
};

const activeConfig = getActiveFirebaseConfig();

// Initialize Firebase using the active configuration
let app;
try {
  app = getApps().length === 0 ? initializeApp(activeConfig) : getApp();
} catch (e) {
  console.warn("Firebase App initialization failed, using mock placeholder fallback.", e);
  try {
    app = getApp();
  } catch {
    app = null;
  }
}

export const hasFirebaseVars = !!(activeConfig && activeConfig.projectId && activeConfig.apiKey);

// Ensure the db is initialized with our custom enterprise firestore database instance ID
export const db = app ? getFirestore(app, activeConfig.firestoreDatabaseId) : null;
export const auth = app ? getAuth(app) : null;

let rtdbInstance = null;
if (app) {
  try {
    const rtdbUrl = activeConfig.databaseURL;
    if (rtdbUrl && rtdbUrl.startsWith('https://')) {
      rtdbInstance = getDatabase(app, rtdbUrl);
    } else {
      rtdbInstance = getDatabase(app);
    }
  } catch (error) {
    console.error("Firebase Realtime Database failed to initialize safely:", error);
    try {
      rtdbInstance = getDatabase(app);
    } catch (_) {
      rtdbInstance = null;
    }
  }
}
export const rtdb = rtdbInstance;

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
  };
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth?.currentUser?.uid || "anonymous_user",
      email: auth?.currentUser?.email || "anonymous@example.com",
      emailVerified: auth?.currentUser?.emailVerified || false,
      isAnonymous: auth?.currentUser?.isAnonymous || false,
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

/**
 * Validate connection to Firestore by fetching a dummy or connection document
 */
export async function testFirebaseConnection(): Promise<{
  configured: boolean;
  active: boolean;
  error?: string;
}> {
  if (!db) {
    return {
      configured: false,
      active: false,
      error: "Firestore is not initialized"
    };
  }

  try {
    await getDocFromServer(doc(db, 'system_vitals', 'connection_ping'));
    return { configured: true, active: true };
  } catch (error: any) {
    const msg = error?.message || String(error);
    return {
      configured: true,
      active: false,
      error: msg
    };
  }
}

/**
 * Validate connection to Realtime Database by attempting to ping the active db ref
 */
export async function testRtdbConnection(): Promise<{
  configured: boolean;
  active: boolean;
  error?: string;
}> {
  if (!rtdb) {
    return {
      configured: false,
      active: false,
      error: "Realtime Database is not initialized"
    };
  }

  try {
    // Attempting to query the connection status node
    const connectedRef = ref(rtdb, '.info/connected');
    const snapshot = await get(connectedRef);
    if (snapshot.exists()) {
      return { configured: true, active: true };
    }
    return { configured: true, active: true };
  } catch (error: any) {
    return {
      configured: true,
      active: false,
      error: error?.message || String(error)
    };
  }
}

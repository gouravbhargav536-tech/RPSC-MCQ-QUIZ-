import { initializeApp, getApp, getApps } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore, doc, getDocFromServer } from 'firebase/firestore';
import { getDatabase, ref, get } from 'firebase/database';
import firebaseConfig from '../../firebase-applet-config.json';

// Support dynamic local storage configurations
export const getActiveFirebaseConfig = () => {
  const localProject = typeof window !== 'undefined' ? localStorage.getItem('firebase_project_id') : null;
  const localApiKey = typeof window !== 'undefined' ? localStorage.getItem('firebase_api_key') : null;
  const localAppId = typeof window !== 'undefined' ? localStorage.getItem('firebase_app_id') : null;
  const localRtdbUrl = typeof window !== 'undefined' ? localStorage.getItem('firebase_rtdb_url') : null;

  // If local values exist, respect them. Otherwise fall back to workspace config or default placeholders.
  const projId = localProject !== null ? localProject : (firebaseConfig.projectId || 'rpscquizapp');
  const apiKey = localApiKey !== null ? localApiKey : (firebaseConfig.apiKey || '');
  const appId = localAppId !== null ? localAppId : (firebaseConfig.appId || '');

  const defaultRtdbUrl = `https://${projId}-default-rtdb.asia-southeast1.firebasedatabase.app`;
  const resolvedRtdbUrl = localRtdbUrl !== null ? localRtdbUrl : ((firebaseConfig as any).databaseURL || defaultRtdbUrl);

  return {
    projectId: projId,
    appId: appId,
    apiKey: apiKey,
    authDomain: `${projId}.firebaseapp.com`,
    firestoreDatabaseId: firebaseConfig.firestoreDatabaseId || '(default)',
    storageBucket: `${projId}.firebasestorage.app`,
    messagingSenderId: firebaseConfig.messagingSenderId,
    measurementId: firebaseConfig.measurementId,
    databaseURL: resolvedRtdbUrl
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
export const rtdb = app ? getDatabase(app, activeConfig.databaseURL) : null;

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

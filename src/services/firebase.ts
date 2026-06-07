import { initializeApp, getApp, getApps } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore, doc, getDocFromServer } from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';

// Initialize Firebase using the provisioned applet metadata config
let app;
try {
  app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
} catch (e) {
  console.warn("Firebase App initialization failed, using mock placeholder fallback.", e);
  app = null;
}

export const hasFirebaseVars = !!(firebaseConfig && firebaseConfig.projectId && firebaseConfig.apiKey);

// Ensure the db is initialized with our custom enterprise firestore database instance ID
export const db = app ? getFirestore(app, firebaseConfig.firestoreDatabaseId) : null;
export const auth = app ? getAuth(app) : null;

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

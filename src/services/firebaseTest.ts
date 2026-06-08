import { db } from '../lib/firebase';
import { collection, addDoc, getDoc, doc, serverTimestamp } from 'firebase/firestore';

export interface TestResult {
  status: 'connected' | 'error';
  message: string;
  details?: string;
}

export async function checkFirebaseHealth(): Promise<TestResult> {
  console.log("Health check started");
  try {
    if (!db) {
      console.error("DB not defined");
      return { status: 'error', message: 'Firebase not initialized.' };
    }
    console.log("DB defined");
    return { status: 'connected', message: 'Firebase Connected' };
  } catch (error: any) {
    console.error("Health check error", error);
    return { status: 'error', message: 'Firebase Not Connected', details: error.message };
  }
}

export async function runFirebaseTest(): Promise<{
  connected: boolean;
  writeSuccess: boolean;
  readSuccess: boolean;
  errorMessage?: string;
}> {
  console.log("Run Firebase Test started");
  try {
    // 1. Write
    console.log("Attempting write...");
    const testCol = collection(db, 'quiz_test');
    const docRef = await addDoc(testCol, {
      title: "Firebase Test Quiz",
      question: "What is the capital of India?",
      options: ["Delhi", "Mumbai", "Jaipur", "Kolkata"],
      answer: "Delhi",
      timestamp: serverTimestamp()
    });
    console.log("Write success, docRef ID:", docRef.id);
    
    // 2. Read
    console.log("Attempting read...");
    const docSnap = await getDoc(doc(db, 'quiz_test', docRef.id));
    
    if (!docSnap.exists()) {
        console.error("Read failed: Document not found");
        throw new Error("Read Failed: Document not found after write");
    }
    console.log("Read success");

    // 3. Log result
    await addDoc(collection(db, 'system_logs'), {
      testTime: serverTimestamp(),
      status: 'success',
      errorMessage: null
    });

    console.log("Firebase Tests Passed");
    return { connected: true, writeSuccess: true, readSuccess: true };
  } catch (error: any) {
    console.error("Firebase Test Failed", error);
    
    return { 
        connected: false, 
        writeSuccess: false, 
        readSuccess: false, 
        errorMessage: error.message 
    };
  }
}

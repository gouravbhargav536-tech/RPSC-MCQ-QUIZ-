import { 
  collection, 
  doc, 
  setDoc, 
  deleteDoc, 
  getDocs, 
  orderBy, 
  query, 
  serverTimestamp 
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from './firebase';
import { Question, QuizConfig } from '../types';

export interface DbQuizAttempt {
  subject: string;
  difficulty: string;
  language: string;
  questionCount: number;
  pattern: string;
  topic?: string;
  score: number;
  timeSpent: number;
  createdAt: any;
}

export interface DbBookmark {
  question: string;
  options: {
    A: string;
    B: string;
    C: string;
    D: string;
  };
  correctAnswer: 'A' | 'B' | 'C' | 'D';
  explanation: string;
  teacherInsight: string;
  wrongOptionsAnalysis: {
    A: string;
    B: string;
    C: string;
    D: string;
  };
  patternYear: string;
  bookmarkedAt: any;
}

export const firebaseService = {
  // 1. Save an RPSC exam attempt
  saveQuizAttempt: async (
    userId: string, 
    config: QuizConfig, 
    score: number, 
    timeSpent: number
  ): Promise<void> => {
    if (!db || userId === 'local_temp_uid') return;

    const attemptId = `attempt-${Date.now()}`;
    const path = `users/${userId}/quiz_attempts/${attemptId}`;

    const attemptData: DbQuizAttempt = {
      subject: config.subject,
      difficulty: config.difficulty,
      language: config.language,
      questionCount: config.questionCount,
      pattern: config.pattern,
      topic: config.topic || "",
      score,
      timeSpent,
      createdAt: serverTimestamp()
    };

    try {
      await setDoc(doc(db, 'users', userId, 'quiz_attempts', attemptId), attemptData);
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, path);
    }
  },

  // 2. Fetch all quiz history attempts for list rendering
  getQuizAttempts: async (userId: string): Promise<DbQuizAttempt[]> => {
    if (!db || userId === 'local_temp_uid') return [];

    const path = `users/${userId}/quiz_attempts`;
    try {
      const q = query(
        collection(db, 'users', userId, 'quiz_attempts'), 
        orderBy('createdAt', 'desc')
      );
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => doc.data() as DbQuizAttempt);
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, path);
      return [];
    }
  },

  // 3. Add a bookmarked question
  addBookmark: async (
    userId: string, 
    questionId: string, 
    q: Question
  ): Promise<void> => {
    if (!db || userId === 'local_temp_uid') return;

    // Sanitize document ID
    const sanitizedId = questionId.replace(/[^a-zA-Z0-9_\-]/g, '_');
    const path = `users/${userId}/bookmarks/${sanitizedId}`;

    const bookmarkData: DbBookmark = {
      question: q.question,
      options: q.options,
      correctAnswer: q.correctAnswer,
      explanation: q.explanation,
      teacherInsight: q.teacherInsight || "",
      wrongOptionsAnalysis: q.wrongOptionsAnalysis || { A: "", B: "", C: "", D: "" },
      patternYear: q.patternYear || "RPSC Standard",
      bookmarkedAt: serverTimestamp()
    };

    try {
      await setDoc(doc(db, 'users', userId, 'bookmarks', sanitizedId), bookmarkData);
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, path);
    }
  },

  // 4. Remove a bookmarked question
  removeBookmark: async (userId: string, questionId: string): Promise<void> => {
    if (!db || userId === 'local_temp_uid') return;

    const sanitizedId = questionId.replace(/[^a-zA-Z0-9_\-]/g, '_');
    const path = `users/${userId}/bookmarks/${sanitizedId}`;

    try {
      await deleteDoc(doc(db, 'users', userId, 'bookmarks', sanitizedId));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, path);
    }
  },

  // 5. Fetch all bookmarks
  getBookmarks: async (userId: string): Promise<Record<string, DbBookmark>> => {
    if (!db || userId === 'local_temp_uid') return {};

    const path = `users/${userId}/bookmarks`;
    try {
      const snapshot = await getDocs(collection(db, 'users', userId, 'bookmarks'));
      const bookmarksMap: Record<string, DbBookmark> = {};
      snapshot.docs.forEach(doc => {
        bookmarksMap[doc.id] = doc.data() as DbBookmark;
      });
      return bookmarksMap;
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, path);
      return {};
    }
  }
};

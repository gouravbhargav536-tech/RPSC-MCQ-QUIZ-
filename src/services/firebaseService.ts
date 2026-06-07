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
import { ref, query as dbQuery, orderByChild, equalTo, get, set } from 'firebase/database';
import { db, rtdb, handleFirestoreError, OperationType } from './firebase';
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
  },

  // 6. Fetch quizzes by category from Realtime Database
  fetchQuizzesByCategory: async (category: string): Promise<Question[]> => {
    if (!rtdb) {
      throw new Error("Firebase Realtime Database is not initialized");
    }

    try {
      const dbRef = ref(rtdb, 'quizzes');
      const q = dbQuery(dbRef, orderByChild('category'), equalTo(category));
      const snapshot = await get(q);

      if (!snapshot.exists()) {
        return [];
      }

      const data = snapshot.val();
      
      // Realtime Database might return an object with keys or an array of objects
      const rawList: any[] = [];
      if (Array.isArray(data)) {
        data.forEach((item, index) => {
          if (item) {
            rawList.push({ ...item, _key: index.toString() });
          }
        });
      } else if (typeof data === 'object' && data !== null) {
        Object.entries(data).forEach(([key, val]: [string, any]) => {
          if (val && typeof val === 'object') {
            rawList.push({ ...val, _key: key });
          }
        });
      }

      // Map raw records database JSON to strictly typed Question objects
      return rawList.map((item, index) => {
        // Parse options gracefully (could be Array of 4 strings or object A/B/C/D)
        let parsedOptions = { A: "", B: "", C: "", D: "" };
        if (Array.isArray(item.options)) {
          parsedOptions = {
            A: item.options[0] || "",
            B: item.options[1] || "",
            C: item.options[2] || "",
            D: item.options[3] || ""
          };
        } else if (item.options && typeof item.options === 'object') {
          parsedOptions = {
            A: item.options.A || item.options.a || "",
            B: item.options.B || item.options.b || "",
            C: item.options.C || item.options.c || "",
            D: item.options.D || item.options.d || ""
          };
        }

        // Parse correctAnswer ('A' | 'B' | 'C' | 'D')
        // It could be 'A' / 'B' / 'C' / 'D', or indices 0, 1, 2, 3 or the actual value text itself
        let resolvedAnswer: 'A' | 'B' | 'C' | 'D' = 'A';
        const rawAns = item.correctAnswer ?? item.correct_answer ?? item.answer ?? 'A';
        
        if (typeof rawAns === 'number') {
          if (rawAns === 0 || rawAns === 1 || rawAns === 2 || rawAns === 3) {
            resolvedAnswer = ['A', 'B', 'C', 'D'][rawAns] as 'A' | 'B' | 'C' | 'D';
          }
        } else if (typeof rawAns === 'string') {
          const cleanAns = rawAns.trim().toUpperCase();
          if (['A', 'B', 'C', 'D'].includes(cleanAns)) {
            resolvedAnswer = cleanAns as 'A' | 'B' | 'C' | 'D';
          } else {
            // Find option matching literal text of rawAns
            const foundKey = Object.entries(parsedOptions).find(([key, val]) => {
              return val.trim() === rawAns.trim() || val.trim().toLowerCase() === rawAns.trim().toLowerCase();
            });
            if (foundKey) {
              resolvedAnswer = foundKey[0] as 'A' | 'B' | 'C' | 'D';
            }
          }
        }

        return {
          id: item.id || item._key || `rtdb-q-${index}-${Math.floor(Math.random() * 10000)}`,
          question: item.question || item.text || "No Question Text Found",
          options: parsedOptions,
          correctAnswer: resolvedAnswer,
          explanation: item.explanation || item.details || "RPSC Standard Mock Explanation Provided.",
          teacherInsight: item.teacherInsight || item.insight || item.teacher_insight || "",
          patternYear: item.patternYear || item.year || item.pattern_year || "RPSC Standard",
          wrongOptionsAnalysis: item.wrongOptionsAnalysis || item.wrong_options_analysis || {
            A: item.wrongOptionsAnalysis?.A || "",
            B: item.wrongOptionsAnalysis?.B || "",
            C: item.wrongOptionsAnalysis?.C || "",
            D: item.wrongOptionsAnalysis?.D || ""
          }
        };
      });
    } catch (error) {
      console.error("Error fetching quizzes by category from RTDB:", error);
      throw error;
    }
  },

  // 7. Seed sample quizzes to Realtime Database
  seedSampleQuizzes: async (quizzes: any[]): Promise<void> => {
    if (!rtdb) {
      throw new Error("Firebase Realtime Database is not initialized");
    }
    try {
      const dbRef = ref(rtdb, 'quizzes');
      const formattedQuizzes = quizzes.map((q, idx) => ({
        id: q.id || `rtdb-q-${idx}-${Date.now()}`,
        category: q.category,
        question: q.question,
        options: q.options,
        correctAnswer: q.correctAnswer,
        explanation: q.explanation,
        teacherInsight: q.teacherInsight,
        wrongOptionsAnalysis: q.wrongOptionsAnalysis,
        patternYear: q.patternYear || "RPSC Standard"
      }));
      await set(dbRef, formattedQuizzes);
    } catch (error) {
      console.error("Error seeding quizzes to RTDB:", error);
      throw error;
    }
  }
};

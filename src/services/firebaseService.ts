import { initializeApp, getApp, getApps } from 'firebase/app';
import { getDatabase, ref, get, set, push, update } from 'firebase/database';
import axios from 'axios';
import { Question, QuizConfig, User } from '../types';
import firebaseConfig from '../../firebase-applet-config.json';

// Define the Pool of API Keys as requested
export const API_KEYS_POOL: string[] = [
  ((import.meta as any).env?.VITE_GEMINI_API_KEY as string) || "",
  (typeof process !== 'undefined' ? process.env.GEMINI_API_KEY : "") || "",
  (typeof process !== 'undefined' ? process.env.GEMINI_API_KEY_2 : "") || "",
  (typeof process !== 'undefined' ? process.env.GEMINI_API_KEY_3 : "") || "",
].filter(key => key && key.trim() !== "");

// Fallback to config key if pool is empty
if (API_KEYS_POOL.length === 0 && firebaseConfig.apiKey) {
  API_KEYS_POOL.push(firebaseConfig.apiKey);
}

// Resilient DB URL for Singapore region (asia-southeast1)
const DATABASE_URL = 
  ((import.meta as any).env?.VITE_DATABASE_URL as string) ||
  (typeof process !== 'undefined' ? process.env.DATABASE_URL : "") ||
  `https://${firebaseConfig.projectId}-default-rtdb.asia-southeast1.firebasedatabase.app`;

// Initialize Firebase App gracefully
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
export const db = getDatabase(app, DATABASE_URL);

/**
 * 1. AUTOMATED API KEY DETECTION (POOL ROTATOR)
 * Sequential health-check method to automatically detect and return the first active, unblocked API Key
 */
export async function getWorkingApiKey(): Promise<string> {
  if (API_KEYS_POOL.length === 0) {
    throw new Error("No Gemini API keys found in the pool. Please define one in Settings > Secrets.");
  }

  for (let i = 0; i < API_KEYS_POOL.length; i++) {
    const key = API_KEYS_POOL[i];
    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash:generateContent?key=${key}`;
      
      // Perform a minimal, fast healthcheck using raw axios
      await axios.post(url, {
        contents: [{ parts: [{ text: "ping" }] }]
      }, { 
        headers: { "Content-Type": "application/json" },
        timeout: 4000 // 4 seconds timeout limit for snappy detection
      });

      console.log(`[Resilience Engine] API Key index ${i} is ACTIVE and verified.`);
      return key;
    } catch (err: any) {
      console.warn(`[Resilience Engine] API Key index ${i} failed or hit rate limit:`, err?.message || err);
    }
  }

  // Self-heal: return first key if all fail health checks
  console.error("[Resilience Engine] All API keys in the pool failed health checks. Defaulting to the primary key.");
  return API_KEYS_POOL[0];
}

/**
 * Helper to sanitize userId for Firebase Realtime Database paths (must not contain dots, etc.)
 */
export function getSanitizedUserId(user: User | null): string {
  if (!user || !user.email) return 'anonymous';
  return user.email.replace(/[@.#$\[\]]/g, '_');
}

/**
 * Internal helper to run the prompt generator using the verified working key.
 */
async function callGeminiToGenerate(apiKey: string, config: QuizConfig, count: number): Promise<Question[]> {
  const { subject, difficulty, language, pattern, topic } = config;

  const patternScope = pattern === '2012-2020' 
    ? 'Old Pattern (2012–2020): Direct factual questions, simple recall-based.' 
    : 'New Pattern (2021–Present): Statement-based, confusing options, analytical, modern exam style.';

  const prompt = `
    Persona: You are an expert RPSC (Rajasthan Public Service Commission) and competitive exam teacher.
    Subject: ${subject}
    ${topic ? `Focus Topic: ${topic}` : ''}
    Exam Level: ${difficulty}
    Pattern Goal: ${patternScope}
    Number of Questions: ${count}
    Requested Language: ${language}
    
    CRITICAL INSTRUCTIONS:
    1. LATEST DATA: Use real concepts, syllabus details, and actual factual events from Rajasthan and India.
    2. TRICKY QUESTIONS: Keep them very concise. Use simple, direct, or concise statement-based questions that test understanding with confusing options without using bloated text.
    3. SPECIAL FOCUS:
       - If 'Rajasthan Current Affairs' or 'Rajasthan GK': Emphasize regional history, geography, sports, cabinet changes, schemes, and bills.
       - If 'National Current Affairs' or others: Emphasize awards, schemes, indexes, and key syllabus elements.
    4. TEACHER STYLE: Use a "Guruji" tone for insights—supportive yet strict about accuracy.
    5. STRICT BREVITY & CONCISENESS (KAM SE KAM SHABD): Write the questions using the absolute minimum words possible. They must be extremely short, direct, and straightforward. Avoid long, complicated, or wordy prompts.
    
    Each JSON object must follow this structure exactly:
    - 'question': Extremely short, concise, and direct question (minimum words / kam se kam shabdon mein).
    - 'options': A, B, C, D option values (keep these concise too).
    - 'correctAnswer': String "A" | "B" | "C" | "D".
    - 'explanation': Clear factual explanation.
    - 'teacherInsight': "Guruji" style insight in Hinglish (Hindi+English Mixed) or the selected language with logic/mnemonics.
    - 'wrongOptionsAnalysis': A JSON object mapping A, B, C, D keys to short explanations of why that option is wrong (or why it's a trap).
    - 'extraFacts': Array of 2-3 related facts.
    - 'videoUrl': Relevant YouTube video ID or search string for concept.
    - 'imageUrl': Descriptive image search query.
    - 'patternYear': Specific exam style (e.g. "RPSC 2024 Mixed").
  `;

  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash:generateContent?key=${apiKey}`;

  const response = await axios.post(url, {
    contents: [{ parts: [{ text: prompt }] }],
    generationConfig: {
      responseMimeType: "application/json",
      responseSchema: {
        type: "ARRAY",
        items: {
          type: "OBJECT",
          properties: {
            question: { type: "STRING" },
            options: {
              type: "OBJECT",
              properties: {
                A: { type: "STRING" },
                B: { type: "STRING" },
                C: { type: "STRING" },
                D: { type: "STRING" },
              },
              required: ["A", "B", "C", "D"],
            },
            correctAnswer: { type: "STRING", enum: ["A", "B", "C", "D"] },
            explanation: { type: "STRING" },
            teacherInsight: { type: "STRING" },
            wrongOptionsAnalysis: {
              type: "OBJECT",
              properties: {
                A: { type: "STRING" },
                B: { type: "STRING" },
                C: { type: "STRING" },
                D: { type: "STRING" },
              },
              required: ["A", "B", "C", "D"],
            },
            extraFacts: {
              type: "ARRAY",
              items: { type: "STRING" }
            },
            videoUrl: { type: "STRING" },
            imageUrl: { type: "STRING" },
            patternYear: { type: "STRING" },
          },
          required: ["question", "options", "correctAnswer", "explanation", "teacherInsight", "wrongOptionsAnalysis", "extraFacts"],
        }
      }
    }
  }, {
    headers: { "Content-Type": "application/json" }
  });

  const textOutput = response.data?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!textOutput) {
    throw new Error("No payload was generated by Gemini.");
  }

  const parsedQuestions = JSON.parse(textOutput);
  if (!Array.isArray(parsedQuestions)) {
    throw new Error("Invalid output format: not an array");
  }

  return parsedQuestions.map((q: any, index: number) => ({
    id: `q-${index}-${Date.now()}`,
    question: q.question || "",
    options: q.options || { A: "", B: "", C: "", D: "" },
    correctAnswer: (q.correctAnswer && ["A", "B", "C", "D"].includes(q.correctAnswer)) ? q.correctAnswer : "A",
    explanation: q.explanation || "",
    teacherInsight: q.teacherInsight || "",
    wrongOptionsAnalysis: q.wrongOptionsAnalysis || { A: "", B: "", C: "", D: "" },
    extraFacts: Array.isArray(q.extraFacts) ? q.extraFacts : [],
    videoUrl: q.videoUrl || "",
    imageUrl: q.imageUrl || "",
    patternYear: q.patternYear || "RPSC Standard"
  }));
}

/**
 * 2 & 3. 60-QUIZ ALLOCATION AND AUTOMATIC FALLBACK SYSTEM
 * Returns a set of questions (generated or historical) corresponding to quota limits.
 * Implements automated key detection, count tracking, saving to RTDB, and fallback logic perfectly.
 */
export async function getQuizQuestionsWithAllocation(user: User | null, config: QuizConfig): Promise<Question[]> {
  const userId = getSanitizedUserId(user);
  const rawSubject = config.subject || "General";
  // Create sanitized path name for Firebase keys
  const subjectCategory = rawSubject.replace(/[@.#$\[\]]/g, '_');

  // Fetch current user progress count for that subject
  const progressPath = `user_progress/${userId}/${subjectCategory}`;
  const progressSnap = await get(ref(db, progressPath));
  const progressData = progressSnap.val();
  const currentCount = progressData?.count || 0;

  console.log(`[Allocation Engine] User: ${userId} | Subject: ${rawSubject} | Allocated generated count: ${currentCount}`);

  // Fetch index list of previously played quiz IDs for filtering fallback
  const playedPath = `user_progress/${userId}/played_quizzes`;
  const playedSnap = await get(ref(db, playedPath));
  let playedQuizzes: string[] = playedSnap.val() || [];
  if (!Array.isArray(playedQuizzes)) {
    playedQuizzes = [];
  }

  // --- FALLBACK INITIATION (3. AUTOMATIC FALLBACK AFTER 60 QUESTIONS) ---
  if (currentCount >= 60) {
    console.log("[Allocation Engine] Fallback Triggered. Quota of 60 questions reached for this subject.");
    
    // Fetch historical questions from "/quizzes" path
    const quizzesSnap = await get(ref(db, 'quizzes'));
    const allQuizzesMap = quizzesSnap.val() || {};
    
    const historicalList: Question[] = [];
    Object.keys(allQuizzesMap).forEach((key) => {
      const q = allQuizzesMap[key];
      // Match category and make sure user previously generated/played it
      const matchesSubject = q.subjectCategory === subjectCategory;
      const isPlayedByUser = playedQuizzes.includes(q.id);
      
      if (matchesSubject && isPlayedByUser) {
        historicalList.push(q);
      }
    });

    if (historicalList.length > 0) {
      console.log(`[Allocation Engine] Delivering ${historicalList.length} historically played questions.`);
      // Self-heal: Shuffle lists or return a curated set matching config count
      const slicedList = historicalList.sort(() => 0.5 - Math.random()).slice(0, config.questionCount);
      return slicedList;
    } else {
      // Self-heal redundancy check: if played_quizzes constraint filtered out everything,
      // offer any historical questions matching this subject as a fallback
      const fallbackList: Question[] = [];
      Object.keys(allQuizzesMap).forEach((key) => {
        const q = allQuizzesMap[key];
        if (q.subjectCategory === subjectCategory) {
          fallbackList.push(q);
        }
      });
      if (fallbackList.length > 0) {
        console.log(`[Allocation Engine] played_quizzes filter returned nothing. Self-healed to return ${fallbackList.length} generic matching quizzes.`);
        return fallbackList.sort(() => 0.5 - Math.random()).slice(0, config.questionCount);
      } else {
        throw new Error("No cached questions exist for fallback. Generating fresh ones instead.");
      }
    }
  }

  // --- GEMINI AI GENERATION (2. 60-QUIZ ALLOCATION GENERATION & SAVING) ---
  console.log(`[Allocation Engine] Under quota (${currentCount}/60). Launching Gemini generation...`);
  
  // 1. Detect and rotate functional API key
  const activeKey = await getWorkingApiKey();

  // 2. We batch-generate 5 questions
  const generatedQuestions = await callGeminiToGenerate(activeKey, config, 5);

  // 3. Save generated questions under the main '/quizzes' path
  const updates: { [path: string]: any } = {};
  const newPlayedIds = [...playedQuizzes];

  for (const question of generatedQuestions) {
    const quizId = question.id;
    updates[`quizzes/${quizId}`] = {
      ...question,
      subjectCategory: subjectCategory, // store clean category for filtering
      createdAt: Date.now()
    };
    newPlayedIds.push(quizId);
  }

  // 4. Update progress path count by +5 and append newly played quiz IDs
  updates[progressPath] = {
    count: currentCount + 5,
    lastUpdate: Date.now()
  };
  updates[playedPath] = newPlayedIds;

  // Execute database batch update atomically
  await update(ref(db), updates);
  console.log(`[Allocation Engine] Save completed. Progress updated to ${currentCount + 5}.`);

  return generatedQuestions;
}

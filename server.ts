import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI, Type } from '@google/genai';

const app = express();
const PORT = 3000;

app.use(express.json());

// Initialize official @google/genai SDK
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    }
  }
});

// API health route
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Server-side RPSC quiz generation route
app.post('/api/generate-quiz', async (req, res) => {
  try {
    const { config } = req.body;
    if (!config) {
      return res.status(400).json({ error: 'Config is required' });
    }

    const { subject, difficulty, language, questionCount, topic, pattern } = config;

    const patternScope = pattern === '2012-2020' 
      ? 'Old Pattern (2012–2020): Direct factual questions, simple recall-based.' 
      : 'New Pattern (2021–Present): Statement-based, confusing options, analytical, modern exam style.';

    const prompt = `
      Persona: You are an expert RPSC (Rajasthan Public Service Commission) and competitive exam teacher.
      Subject: ${subject}
      ${topic ? `Focus Topic: ${topic}` : ''}
      Exam Level: ${difficulty}
      Pattern Goal: ${patternScope}
      Number of Questions: ${questionCount}
      Requested Language: ${language}
      
      CRITICAL INSTRUCTIONS FOR PREVENTING UI LAYOUT BREAKING:
      1. NO METADATA: Absolutely do not include category headings, subject lines, hashtags, or text like "RAJASTHAN CURRENT AFFAIRS" or "GEOGRAPHY" in the output fields (especially 'question' and 'teacherInsight').
      2. CONCISE QUESTION: Keep the question strictly limited to 1 or 2 short sentences. Avoid long paragraphs or excessive wording.
      3. SHORT OPTIONS: Every option (A, B, C, D) must be short, punchy, and under 15 words. Do not write long explanations or rationale inside the options themselves.
      4. LATEST DATA: Use real concepts, syllabus details, and actual factual events from Rajasthan and India.
      5. TRICKY QUESTIONS: For the New Pattern, use statement-based questions (e.g., "Which of these statements about X is INCORRECT?"). Use confusing options that test deep understanding.
      6. SPECIAL FOCUS:
         - If 'Rajasthan Current Affairs' or 'Rajasthan GK': Emphasize regional history, geography, sports, cabinet changes, schemes, and bills.
         - If 'National Current Affairs' or others: Emphasize awards, schemes, indexes, and key syllabus elements.
      7. TEACHER STYLE: Use a "Guruji" tone for insights—supportive yet strict about accuracy. Do not prefix insights with metadata labels.
      
      Each JSON object must follow this structure exactly:
      - 'question': Tricky question (strictly 1 or 2 short sentences).
      - 'options': A, B, C, D option values (each option must be under 15 words).
      - 'correctAnswer': String "A" | "B" | "C" | "D".
      - 'explanation': Clear factual explanation.
      - 'teacherInsight': "Guruji" style insight in Hinglish (Hindi+English Mixed) or the selected language with logic/mnemonics. No metadata headings.
      - 'wrongOptionsAnalysis': A JSON object mapping A, B, C, D keys to short explanations of why that option is wrong.
      - 'extraFacts': Array of 2-3 related facts.
      - 'videoUrl': Relevant YouTube video ID or search string for concept.
      - 'imageUrl': Descriptive image search query.
      - 'patternYear': Specific exam style (e.g. "RPSC 2024 Mixed").
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-3.5-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              question: { type: Type.STRING },
              options: {
                type: Type.OBJECT,
                properties: {
                  A: { type: Type.STRING },
                  B: { type: Type.STRING },
                  C: { type: Type.STRING },
                  D: { type: Type.STRING },
                },
                required: ['A', 'B', 'C', 'D'],
              },
              correctAnswer: { type: Type.STRING, enum: ['A', 'B', 'C', 'D'] },
              explanation: { type: Type.STRING },
              teacherInsight: { type: Type.STRING },
              wrongOptionsAnalysis: {
                type: Type.OBJECT,
                properties: {
                  A: { type: Type.STRING },
                  B: { type: Type.STRING },
                  C: { type: Type.STRING },
                  D: { type: Type.STRING },
                },
                required: ['A', 'B', 'C', 'D'],
              },
              extraFacts: {
                type: Type.ARRAY,
                items: { type: Type.STRING }
              },
              videoUrl: { type: Type.STRING },
              imageUrl: { type: Type.STRING },
              patternYear: { type: Type.STRING },
            },
            required: ['question', 'options', 'correctAnswer', 'explanation', 'teacherInsight', 'wrongOptionsAnalysis', 'extraFacts'],
          }
        }
      }
    });

    const textOutput = response.text;
    if (!textOutput) {
      throw new Error('Emply or invalid response from Gemini API');
    }

    const parsedQuestions = JSON.parse(textOutput.trim());
    res.json({ questions: parsedQuestions });
  } catch (error: any) {
    console.error('Error in /api/generate-quiz:', error);
    res.status(500).json({ error: error?.message || 'Failed to generate quiz' });
  }
});

// Vite middleware setup
async function setupVite() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

setupVite();

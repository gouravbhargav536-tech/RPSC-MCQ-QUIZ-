import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI, Type } from '@google/genai';

const app = express();
const PORT = 3000;

app.use(express.json());

// Helper function to lazily initialize GoogleGenAI with either the custom key or default key.
function getAIInstance(customApiKey?: string): GoogleGenAI {
  const apiKey = customApiKey || process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('No API key provided. Please configure GEMINI_API_KEY or provide a custom API key.');
  }
  return new GoogleGenAI({
    apiKey: apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      }
    }
  });
}

// Robust content generation helper with exponential backoff retries and model fallback.
async function generateContentWithRetryAndFallback(
  ai: GoogleGenAI,
  options: {
    contents: any;
    config?: any;
    initialModel?: string;
  }
) {
  const modelsToTry = [options.initialModel || 'gemini-3.5-flash', 'gemini-3.1-flash-lite'];
  let lastError: any = null;

  for (const model of modelsToTry) {
    let delay = 1000; // start with 1s delay
    const maxRetries = 3;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        console.log(`[Gemini API] Requesting model ${model} (attempt ${attempt}/${maxRetries})...`);
        const response = await ai.models.generateContent({
          model: model,
          contents: options.contents,
          config: options.config,
        });
        return response;
      } catch (error: any) {
        lastError = error;
        const errStr = String(error?.message || error).toLowerCase();
        const status = error?.status || error?.code || (error?.error && error?.error?.code);
        
        // Treat 503, 429, unavailable, overload, rate limit, quota, and demand errors as transient
        const isTransient = 
          status === 503 || 
          status === 429 || 
          status === 'UNAVAILABLE' ||
          errStr.includes('demand') || 
          errStr.includes('limit') || 
          errStr.includes('rate') || 
          errStr.includes('temporary') || 
          errStr.includes('unavailable') ||
          errStr.includes('overload') ||
          errStr.includes('busy');

        if (isTransient && attempt < maxRetries) {
          console.warn(`[Gemini API] Transient error on model ${model}: ${error?.message || error}. Retrying in ${delay}ms...`);
          await new Promise((resolve) => setTimeout(resolve, delay));
          delay *= 2; // exponential backoff
        } else {
          console.error(`[Gemini API] Failed on model ${model} (attempt ${attempt}/${maxRetries}): ${error?.message || error}`);
          break; // break the attempt loop to try the next model
        }
      }
    }
  }

  // If we reach here, both models failed after all retries
  throw lastError || new Error('All model attempts and retries failed');
}

// API health route
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Endpoint to validate a custom Gemini API key
app.post('/api/test-api-key', async (req, res) => {
  try {
    const { apiKey } = req.body;
    if (!apiKey) {
      return res.status(400).json({ status: 'invalid', error: 'API Key is empty.' });
    }

    // Attempt a minimal validation API call
    const testAi = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });

    // Hit the models using our retry/fallback helper to verify API key authenticity
    await generateContentWithRetryAndFallback(testAi, {
      initialModel: 'gemini-3.5-flash',
      contents: 'Ping',
    });

    return res.json({ status: 'valid' });
  } catch (error: any) {
    console.error('Error validation in /api/test-api-key:', error);
    // Be robust with error structure
    const errMsg = error?.message || 'API Key is invalid or expired.';
    return res.json({ status: 'invalid', error: errMsg });
  }
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

    const customApiKey = req.headers['x-custom-api-key'] as string | undefined;
    const activeAi = getAIInstance(customApiKey);

    const response = await generateContentWithRetryAndFallback(activeAi, {
      initialModel: 'gemini-3.5-flash',
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

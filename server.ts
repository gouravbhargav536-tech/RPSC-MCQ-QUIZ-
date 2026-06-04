import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI, Type } from '@google/genai';
import axios from 'axios';

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

    const { subject, difficulty, language, questionCount, topic, pattern, selectedSubjects } = config;

    const patternScope = pattern === '2012-2020' 
      ? 'Old Pattern (2012–2020): Direct factual questions, simple recall-based.' 
      : 'New Pattern (2021–Present): Statement-based, confusing options, analytical, modern exam style.';

    let subjectScope = '';
    if (subject === 'Balanced Mock Test' && Array.isArray(selectedSubjects) && selectedSubjects.length > 0) {
      subjectScope = `Balanced Mock Test consisting of an EVEN distribution of questions from the following subjects: ${selectedSubjects.join(', ')}.
      Generate exactly ${questionCount} questions in total. Across the selected subjects, distribute the question count as evenly as mathematically possible. For example, if there are 10 questions and 5 subjects, generate exactly 2 questions per subject. State which subject a question belongs to in the 'patternYear' field (e.g. "RPSC GK - Rajasthan GK Style" or "RPSC GK - Geography Style").`;
    } else {
      subjectScope = `Subject Focus: ${subject}`;
    }

    const prompt = `
      Role & Persona: You are an expert RPSC (Rajasthan Public Service Commission) Exam Paper Setter.
      Your task is to generate high-quality, concept-based Multiple Choice Questions (MCQs) exactly matching the latest RPSC temporary exam patterns (like RAS, Junior Accountant, or LDC).
      
      Topic and Subjects:
      - ${subjectScope}
      - ${topic ? `Specific area / syllabus topic requested: ${topic}` : ''}
      - Difficulty Level: ${difficulty} (Adjust depth of syllabus accordingly)
      - Exam Pattern: ${patternScope}
      - Total Number of Questions of this Quiz: ${questionCount}
      - Language constraint: Output all questions and explanations in ${language}.
      
      CRITICAL INSTRUCTIONS FOR PREVENTING UI LAYOUT BREAKING:
      1. NO METADATA IN TITLES: Do not prefix or suffix questions, titles or teacher insights with hashtags, block categories or brackets (e.g. do not write "# Rajasthan History" or "[Reasoning]"). Keep them clean.
      2. CONCISE QUESTION TEXT: Ensure the main question text is strictly 1 or 2 clear, punchy sentences.
      3. CONCISE SHORT OPTIONS: Every option (A, B, C, D) MUST be short, descriptive, and under 15 words.
      4. CONCEPTUAL DEPTH: Questions should test solid concepts, RPSC trends, and state government schemes (e.g. Chiranjeevi, Indira Gandhi Urban Employment, etc.) or historical facts accurately.
      5. GURUJI'S SMART TIP: Provide an insightful "Guru-Mantra" / "Teacher Insight" in Hinglish or ${language} that acts as an easy mnemonic or smart elimination logic. Do not make it generic.
      
      Format the response as a standard, raw JSON array of objects conforming to the schema below.
      
      JSON Schema of each question:
      {
        "question": "Tricky conceptual question",
        "options": {
          "A": "Option A text",
          "B": "Option B text",
          "C": "Option C text",
          "D": "Option D text"
        },
        "correctAnswer": "A" or "B" or "C" or "D",
        "explanation": "Detailed explanation of facts based on official documents, budgets or bills.",
        "teacherInsight": "Supportive mnemonic or tip. (strictly no headings)",
        "wrongOptionsAnalysis": {
          "A": "Why option A lacks validity or factual correctness in this context",
          "B": "Why option B is incorrect",
          "C": "Why option C is incorrect",
          "D": "Why option D is incorrect"
        },
        "extraFacts": [
          "Fact 1: relevant statistical database or historical year",
          "Fact 2: another quick fact to remember"
        ],
        "videoUrl": "A YouTube search query or ID (e.g., 'RPSC Rajasthan GK budget summaries')",
        "imageUrl": "Descriptive image search query matching the question theme",
        "patternYear": "Topic / Subject style pattern context (e.g. 'RPSC RAS 2024 Current GK')"
      }
    `;

    // Try OpenRouter if active key exists
    const openRouterApiKey = process.env.OPENROUTER_API_KEY || process.env.VITE_OPENROUTER_API_KEY;
    if (openRouterApiKey && openRouterApiKey.trim().length > 0) {
      console.log('OpenRouter API key detected. Directing request entirely through OpenRouter.');
      try {
        const response = await axios.post('https://openrouter.ai/api/v1/chat/completions', {
          model: 'google/gemini-2.5-flash',
          messages: [
            {
              role: 'system',
              content: 'You are an elite RPSC exam paper setter. You always output valid, raw JSON arrays conforming strictly to the requested schema, with no markdown code block formatting or commentary.'
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          response_format: { type: 'json_object' }
        }, {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${openRouterApiKey}`,
            'HTTP-Referer': process.env.APP_URL || 'https://ai.studio/build',
            'X-Title': 'RPSC AI MCQ Master'
          },
          timeout: 45000
        });

        const choiceText = response?.data?.choices?.[0]?.message?.content;
        if (!choiceText) {
          throw new Error('Emply response content returned from OpenRouter.');
        }

        let sanitizedText = choiceText.trim();
        if (sanitizedText.startsWith('```json')) {
          sanitizedText = sanitizedText.replace(/^```json/, '').replace(/```$/, '');
        } else if (sanitizedText.startsWith('```')) {
          sanitizedText = sanitizedText.replace(/^```/, '').replace(/```$/, '');
        }

        let parsedJson = JSON.parse(sanitizedText.trim());
        if (!Array.isArray(parsedJson) && parsedJson.questions && Array.isArray(parsedJson.questions)) {
          parsedJson = parsedJson.questions;
        }

        return res.json({ questions: parsedJson });
      } catch (err: any) {
        console.error('OpenRouter call failed, falling back to official SDK:', err?.message || err);
      }
    }

    // Default official Google SDK fallback
    console.log('Using official GoogleGenAI SDK.');
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

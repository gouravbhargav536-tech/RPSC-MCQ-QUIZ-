import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API Route FIRST
  app.post("/api/generate-quiz", async (req, res) => {
    try {
      const config = req.body;
      const { subject, difficulty, language, questionCount, topic, pattern } = config;

      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        return res.status(400).json({
          error: "GEMINI_API_KEY environment variable is not set. Please navigate to Settings > Secrets in the top editor bar and add GEMINI_API_KEY to start generating quizzes flawlessly."
        });
      }

      // Initialize GoogleGenAI SDK with key and user-agent for telemetry analytics
      const ai = new GoogleGenAI({
        apiKey: apiKey,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          }
        }
      });

      const patternScope = pattern === '2012-2020' 
        ? 'Old Pattern (2012–2020): Direct factual questions, simple recall-based.' 
        : 'New Pattern (2021–Present): Statement-based, confusing options, analytical, modern exam style.';

      const prompt = `
        Persona: You are an expert RPSC (Rajasthan Public Service Commission) and competitive exam teacher. Always generate high-quality multiple-choice questions in Hindi and English as requested.
        Subject: ${subject}
        ${topic ? `Focus Topic: ${topic}` : ''}
        Exam Level: ${difficulty}
        Pattern Goal: ${patternScope}
        Number of Questions: ${questionCount}
        Requested Language: ${language}
        
        CRITICAL INSTRUCTIONS:
        1. LATEST DATA: Use real concepts, syllabus details, and actual factual events from Rajasthan and India.
        2. TRICKY QUESTIONS: For the New Pattern, use statement-based questions (e.g., "Which of these statements about X is INCORRECT?"). Use confusing options that test deep understanding.
        3. SPECIAL FOCUS:
           - If 'Rajasthan Current Affairs' or 'Rajasthan GK': Emphasize regional history, geography, sports, cabinet changes, schemes, and bills.
           - If 'National Current Affairs' or others: Emphasize awards, schemes, indexes, and key syllabus elements.
        4. TEACHER STYLE: Use a "Guruji" tone for insights—supportive yet strict about accuracy. Always speak like an authentic mentor who understands the candidate's mind.
        
        Each JSON object must follow this structure exactly:
        - 'question': Tricky question.
        - 'options': A, B, C, D option values.
        - 'correctAnswer': String "A" | "B" | "C" | "D".
        - 'explanation': Clear factual explanation.
        - 'teacherInsight': "Guruji" style insight in Hinglish (Hindi+English Mixed) or the selected language with logic/mnemonics.
        - 'wrongOptionsAnalysis': A JSON object mapping A, B, C, D keys to short explanations of why that option is wrong (or why it's a trap).
        - 'extraFacts': Array of 2-3 related facts.
        - 'videoUrl': Relevant YouTube video ID or search string for concept.
        - 'imageUrl': Descriptive image search query.
        - 'patternYear': Specific exam style (e.g. "RPSC 2024 Mixed").
      `;

      // Supported modern, allowed models
      const models = ['gemini-3.5-flash', 'gemini-3.1-flash-lite'];
      let lastError: any = null;
      let textOutput: string | undefined = undefined;

      for (const model of models) {
        let retries = 3;
        while (retries > 0) {
          try {
            console.log(`Running generation on server with ${model} (Retries left: ${retries - 1})...`);
            
            const response = await ai.models.generateContent({
              model: model,
              contents: prompt,
              config: {
                responseMimeType: "application/json",
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
                        required: ["A", "B", "C", "D"],
                      },
                      correctAnswer: { type: Type.STRING },
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
                        required: ["A", "B", "C", "D"],
                      },
                      extraFacts: {
                        type: Type.ARRAY,
                        items: { type: Type.STRING }
                      },
                      videoUrl: { type: Type.STRING },
                      imageUrl: { type: Type.STRING },
                      patternYear: { type: Type.STRING },
                    },
                    required: [
                      "question",
                      "options",
                      "correctAnswer",
                      "explanation",
                      "teacherInsight",
                      "wrongOptionsAnalysis",
                      "extraFacts",
                      "videoUrl",
                      "imageUrl",
                      "patternYear"
                    ],
                  }
                }
              }
            });

            textOutput = response.text;
            if (textOutput) {
              console.log(`Successfully generated content using model: ${model}`);
              break;
            }
          } catch (err: any) {
            lastError = err;
            console.warn(`Server model generation failed for ${model}: status ${err.status || err.statusCode}. Message: ${err.message}`);
            retries--;
            if (retries > 0) {
              // Pause with exponential delay (1s, 2s)
              await new Promise(resolve => setTimeout(resolve, 1000 * (3 - retries)));
            }
          }
        }
        if (textOutput) break;
      }

      if (!textOutput) {
        const errorMsg = lastError?.message || lastError?.response?.data?.error?.message || lastError || "All backend models failed.";
        return res.status(503).json({
          error: `Failed to generate paper blueprint. Gemini API reported a 503 error or temporary overload. ${errorMsg}`
        });
      }

      const parsedQuestions = JSON.parse(textOutput);
      return res.json(parsedQuestions);

    } catch (err: any) {
      console.error("Quiz creation error:", err);
      return res.status(500).json({ error: err?.message || "Internal Server Error" });
    }
  });

  app.get("/api/check-key", async (req, res) => {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return res.json({ status: "invalid", message: "API Key missing in environment" });
    }
    
    // Quick test
    try {
      const ai = new GoogleGenAI({ apiKey });
      await ai.models.generateContent({
        model: "gemini-3.1-flash-lite",
        contents: "hi"
      });
      return res.json({ status: "ok", message: "API key is working perfectly." });
    } catch (err: any) {
      return res.json({ status: "error", message: `API Key check failed: ${err.message || 'Unknown error'}`.substring(0, 50) });
    }
  });

  // Serve static assets in production, mount Vite in development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();

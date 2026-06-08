import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import * as admin from "firebase-admin";

admin.initializeApp();
const db = admin.firestore();

async function checkApiKey(apiKey: string): Promise<{ status: string; message: string; responseTime: number }> {
    const startTime = Date.now();
    try {
        const ai = new GoogleGenAI({ apiKey });
        await ai.models.generateContent({
            model: "gemini-3.1-flash-lite",
            contents: "Generate 1 sample quiz question",
        });
        return { status: "active", message: "Working perfectly", responseTime: Date.now() - startTime };
    } catch (err: any) {
        let failureReason = "UNKNOWN_ERROR";
        const msg = err.message || "";
        if (msg.includes("401") || msg.includes("INVALID_ARGUMENT")) failureReason = "INVALID_KEY";
        else if (msg.includes("429")) failureReason = "RATE_LIMITED";
        else if (msg.includes("QUOTA")) failureReason = "QUOTA_EXCEEDED";
        else if (msg.includes("403")) failureReason = "MODEL_NOT_AVAILABLE";
        else if (msg.includes("Network")) failureReason = "NETWORK_ERROR";
        
        return { status: "failed", message: failureReason, responseTime: Date.now() - startTime };
    }
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());
  console.log("Registered JSON middleware");

  // API Route FIRST
  app.post("/api/generate-quiz", async (req, res) => {
    console.log("Received request to /api/generate-quiz");
    try {
      const { subject, difficulty, language, questionCount, topic, pattern } = req.body;
      console.log("Quiz config:", { subject, difficulty });

      // Get keys
      const keysSnapshot = await db.collection("apiKeys").where("status", "==", "active").get();
      const keys = keysSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() as any }));
      
      if (keys.length === 0) {
         console.error("No active keys available");
         return res.status(500).json({ error: "No active API keys available." });
      }

      const patternScope = pattern === '2012-2020' 
        ? 'Old Pattern (2012–2020): Direct factual questions.' 
        : 'New Pattern (2021–Present): Statement-based, analytical.';

      const prompt = `Generate ${questionCount} multiple choice questions about ${subject}. ${topic ? 'Focus topic: ' + topic : ''}. Difficulty: ${difficulty}. Language: ${language}. Exam Pattern: ${patternScope}. Output as JSON.`;

      for (const key of keys) {
          try {
              console.log("Attempting generation with key:", key.id);
              const ai = new GoogleGenAI({ apiKey: key.value });
              
              const response = await ai.models.generateContent({
                model: "gemini-3.1-flash-lite",
                contents: prompt,
                config: { responseMimeType: "application/json" }
              });

              const textOutput = response.text;
              if (textOutput) {
                  return res.json(JSON.parse(textOutput));
              }
          } catch (error: any) {
              console.warn(`Key ${key.id} failed: ${error.message}`);
              // Mark as failed
              await db.collection("apiKeys").doc(key.id).update({ 
                  status: 'failed', 
                  failureReason: error.message.substring(0, 50), 
                  lastChecked: new Date() 
              });
              await db.collection("apiFailures").add({
                  userId: 'system',
                  time: new Date(),
                  keyId: key.id,
                  errorReason: error.message
              });
              continue; // try next key
          }
      }
      return res.status(503).json({ error: "All API keys failed" });
    } catch (err: any) {
      console.error("Quiz creation error:", err);
      return res.status(500).json({ error: err?.message || "Internal Server Error" });
    }
  });

  app.get("/api/check-key", async (req, res) => {
    // 1. First check environment key (legacy)
    const envKey = process.env.GEMINI_API_KEY;
    if (envKey) {
        return res.json(await checkApiKey(envKey));
    }

    // 2. Otherwise check keys in Firestore
    const snapshot = await db.collection("apiKeys").get();
    if (snapshot.empty) {
      return res.json({ status: "invalid", message: "No API Keys found in Environment or Database" });
    }
    
    // For now, check first key found
    const keyData = snapshot.docs[0].data();
    return res.json(await checkApiKey(keyData.value));
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

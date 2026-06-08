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

  // API Route FIRST
  app.post("/api/generate-quiz", async (req, res) => {
    try {
      const config = req.body;
      const { subject, difficulty, language, questionCount, topic, pattern } = config;

      // Find an active key
      const activeKeysSnapshot = await db.collection("apiKeys")
        .where("status", "==", "active")
        .where("lastChecked", ">", new Date(Date.now() - 10 * 60 * 1000))
        .get();
      
      let apiKey = activeKeysSnapshot.docs.length > 0 ? activeKeysSnapshot.docs[0].data().value : null;

      if (!apiKey) {
         // Optionally try to find any key not recently checked? 
         // For now, simplify and ask for a key.
         return res.status(400).json({ error: "No active working API key. Please check Admin view." });
      }

      // Initialize AI
      const ai = new GoogleGenAI({ apiKey });
      
      // Generation logic... 
      // (Simplified for brevity, I will re-implement the generation part using the found apiKey)
      
      // If generation fails with a specific error, mark key as failed in Firestore and retry
      
      // ... Generation logic as before but with key management ...
      
      return res.json({ status: "success" }); // Need to fill in actual generation
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

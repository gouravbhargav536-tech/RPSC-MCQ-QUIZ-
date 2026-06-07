// सबसे ऊपर axios इम्पोर्ट करें ताकि fetch का नाम न आए
// @ts-ignore
import axios from 'axios';
import { Question, QuizConfig } from "../types";

export async function generateQuizQuestions(config: QuizConfig): Promise<Question[]> {
  const { subject, difficulty, language, questionCount, topic, pattern } = config;

  // Safely resolve the API key across potential Vite/process environments
  const apiKey = 
    ((import.meta as any).env?.VITE_GEMINI_API_KEY as string) || 
    ((import.meta as any).env?.GEMINI_API_KEY as string) || 
    (typeof process !== 'undefined' ? process.env.GEMINI_API_KEY : undefined) ||
    "";

  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is not defined. Please configure your API key in Settings > Secrets.");
  }

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
    
    CRITICAL INSTRUCTIONS:
    1. LATEST DATA: Use real concepts, syllabus details, and actual factual events from Rajasthan and India.
    2. TRICKY QUESTIONS: For the New Pattern, use statement-based questions (e.g., "Which of these statements about X is INCORRECT?"). Use confusing options that test deep understanding.
    3. SPECIAL FOCUS:
       - If 'Rajasthan Current Affairs' or 'Rajasthan GK': Emphasize regional history, geography, sports, cabinet changes, schemes, and bills.
       - If 'National Current Affairs' or others: Emphasize awards, schemes, indexes, and key syllabus elements.
    4. TEACHER STYLE: Use a "Guruji" tone for insights—supportive yet strict about accuracy.
    
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

  // URL Setup
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash:generateContent?key=${apiKey}`;

  try {
    // 💡 FETCH की जगह AXIOS का उपयोग किया गया है ताकि Google AI Studio प्रीव्यू एरर न दे
    const response = await axios.post(url, {
      contents: [
        {
          parts: [
            {
              text: prompt
            }
          ]
        }
      ],
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
      headers: {
        "Content-Type": "application/json",
      }
    });

    const data = response.data;
    const textOutput = data?.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!textOutput) {
      console.error("Incompatible or empty response from Gemini API:", data);
      throw new Error("No response content generated by Gemini.");
    }

    const parsedQuestions = JSON.parse(textOutput);
    
    if (!Array.isArray(parsedQuestions)) {
      throw new Error("Gemini did not return an array of questions.");
    }

    const questions: Question[] = parsedQuestions.map((q: any, index: number) => ({
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

    return questions;
  } catch (error) {
    console.error("Error generating quiz:", error);
    throw new Error("Failed to generate quiz questions. Please check your API key configuration and network connectivity and try again.");
  }
}

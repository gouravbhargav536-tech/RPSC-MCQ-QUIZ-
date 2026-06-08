import axios from 'axios';
import { Question, QuizConfig } from "../types";

export async function generateQuizQuestions(config: QuizConfig): Promise<Question[]> {
  const { subject, difficulty, language, questionCount, topic, pattern } = config;

  try {
    console.log("Calling secure backend server endpoint to generate quiz questions...", config);

    const response = await axios.post("/api/generate-quiz", config, {
      headers: {
        "Content-Type": "application/json"
      }
    });

    const parsedQuestions = response.data;
    
    if (!Array.isArray(parsedQuestions)) {
      throw new Error("Gemini server proxy did not return an array of questions.");
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
  } catch (error: any) {
    console.error("Error generating quiz in frontend service:", error);
    
    // Extract precise error message returned by server if any
    const serverError = error?.response?.data?.error || error?.message || "Failed to establish server connection.";
    throw new Error(serverError);
  }
}

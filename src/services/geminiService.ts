import axios from 'axios';
import { Question, QuizConfig } from "../types";

export async function generateQuizQuestions(config: QuizConfig): Promise<Question[]> {
  try {
    const useCustomKey = localStorage.getItem('rpsc_use_custom_key') === 'true';
    const customKey = localStorage.getItem('rpsc_custom_api_key') || '';
    
    const headers: Record<string, string> = {};
    if (useCustomKey && customKey.trim()) {
      headers['x-custom-api-key'] = customKey.trim();
    }

    const response = await axios.post('/api/generate-quiz', { config }, { headers });
    const parsedQuestions = response.data.questions;
    
    if (!Array.isArray(parsedQuestions)) {
      throw new Error("Backend did not return an array of questions.");
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
    console.error("Error generating quiz in client service:", error);
    throw new Error("Failed to generate quiz questions. Please try again.");
  }
}

import React from 'react';
import { motion } from 'motion/react';
import { Trophy, Clock, BrainCircuit, CheckCircle2, Info, BookOpen } from 'lucide-react';
import { Question, QuizConfig, ThemeType } from '../types';

interface ResultsPanelProps {
  questions: Question[];
  config: QuizConfig;
  getScore: () => number;
  getIncorrectCount: () => number;
  getSkippedCount: () => number;
  quizTimer: number;
  formatTime: (secs: number) => string;
  theme: ThemeType;
  handleStartQuiz: () => void;
  setScreen: (screenName: any) => void;
  userAnswers: (string | null)[];
}

export default function ResultsPanel({
  questions,
  config,
  getScore,
  getIncorrectCount,
  getSkippedCount,
  quizTimer,
  formatTime,
  theme,
  handleStartQuiz,
  setScreen,
  userAnswers
}: ResultsPanelProps) {
  const successRate = questions.length > 0 
    ? Math.round((getScore() / questions.length) * 100) 
    : 0;

  return (
    <motion.div
      key="results"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="max-w-xl mx-auto w-full text-left font-sans"
    >
      <div className="text-center mb-6 border-b border-border-theme pb-4">
        <h2 className="text-base font-bold uppercase tracking-wider text-main">Session Result Sheet</h2>
        <p className="text-slate-400 continental-spacing uppercase tracking-widest text-[8px] font-bold mt-1 select-none">Official Candidate Performance Assessment</p>
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-5">
        <div className="border border-border-theme bg-[var(--card-bg)] p-4 text-center">
          <h4 className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 select-none">Accuracy Profile</h4>
          <p className="text-lg font-mono font-bold text-main">{getScore()} / {questions.length}</p>
          <p className="text-[8px] text-slate-400 mt-1 uppercase font-bold">({successRate}% Success Rate)</p>
        </div>

        <div className="border border-border-theme bg-[var(--card-bg)] p-4 text-center">
          <h4 className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 select-none">Marks Breakdown</h4>
          <div className="flex justify-center gap-3 text-xs font-mono font-bold mt-1">
             <div>
                <p className="text-green-600">{getScore()}</p>
                <p className="text-[8px] uppercase font-bold text-slate-400">Correct</p>
             </div>
             <div>
                <p className="text-red-505 text-red-650 text-red-500">{getIncorrectCount()}</p>
                <p className="text-[8px] uppercase font-bold text-slate-400">Wrong</p>
             </div>
             <div>
                <p className="text-slate-400">{getSkippedCount()}</p>
                <p className="text-[8px] uppercase font-bold text-slate-400">Skipped</p>
             </div>
          </div>
        </div>

        <div className="border border-border-theme bg-[var(--card-bg)] p-4 text-center">
          <h4 className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 select-none">Time Logged</h4>
          <p className="text-lg font-mono font-bold text-main">{formatTime(quizTimer)}</p>
          <p className="text-[8px] text-slate-400 uppercase font-bold mt-1">Total Duration</p>
        </div>
      </div>

      <div className="border border-border-theme bg-[var(--card-bg)] p-4 mb-5 text-left">
         <h3 className="text-[9px] font-bold text-slate-400 uppercase tracking-widest border-b border-border-theme pb-1.5 mb-2 select-none">AI Subject Metric Assessment</h3>
         <p className="text-[11px] text-slate-500 leading-relaxed font-sans font-medium">
           Practice evaluation complete for <strong className="text-main">"{config.subject}"</strong>. Your processing pace was approximately <strong>{questions.length > 0 ? Math.round(quizTimer / questions.length) : 0} seconds per item</strong>. Recommended action: return to the subject units index to target specific syllabi areas or review in incorrect notebook.
         </p>
      </div>

      <div className="grid grid-cols-2 gap-3 mb-8">
         <button 
           type="button"
           onClick={handleStartQuiz}
           className="py-2.5 border border-slate-900 bg-slate-900 text-white font-bold text-[10px] uppercase tracking-widest hover:bg-slate-800 transition-colors rounded-none cursor-pointer"
         >
           Restart Booklet
         </button>
         <button 
           type="button"
           onClick={() => setScreen('HOME')}
           className="py-2.5 border border-slate-200 bg-[var(--card-bg)] hover:bg-slate-50 text-slate-700 font-bold text-[10px] uppercase tracking-widest transition-colors rounded-none cursor-pointer"
         >
           Return to Library
         </button>
      </div>

      {/* Review Section */}
      <div className="mt-8 border-t border-border-theme pt-6">
        <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-4">
          Itemized Answer Sheet & Explanations {(config.feedbackMode || 'Instant Feedback') === 'Submit at End' && "(Submit at End Mode)"}
        </h3>
        
        <div className="space-y-6">
          {questions.map((question, index) => {
            const userAnswer = userAnswers[index];
            const isCorrect = userAnswer === question.correctAnswer;
            const isSkipped = userAnswer === 'SKIPPED' || userAnswer === null;

            return (
              <div key={question.id || index} className="border border-border-theme bg-[var(--card-bg)] p-5 rounded-none space-y-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1">
                    <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">
                      Question {index + 1}
                    </span>
                    <h4 className="text-sm font-semibold text-main italic">
                      {question.question}
                    </h4>
                  </div>
                  <span className={`px-2 py-1 text-[9px] font-bold uppercase tracking-widest ${
                    isCorrect 
                      ? 'bg-green-100 text-green-800' 
                      : isSkipped 
                        ? 'bg-slate-100 text-slate-500' 
                        : 'bg-red-100 text-red-800'
                  }`}>
                    {isCorrect ? 'Correct' : isSkipped ? 'Skipped' : 'Incorrect'}
                  </span>
                </div>

                {/* Options list */}
                <div className="grid grid-cols-1 gap-2.5">
                  {Object.entries(question.options).map(([key, value]) => {
                    const optionCorrect = key === question.correctAnswer;
                    const optionSelected = key === userAnswer;
                    
                    let bgStyle = "bg-white border-slate-200";
                    let textStyle = "text-slate-700";
                    let prefixBg = "bg-slate-100 text-slate-500";

                    if (optionCorrect) {
                      bgStyle = "bg-green-50 border-green-300 ring-1 ring-green-200";
                      textStyle = "text-green-950 font-semibold";
                      prefixBg = "bg-green-500 text-white";
                    } else if (optionSelected && !optionCorrect) {
                      bgStyle = "bg-red-50 border-red-350 ring-1 ring-red-200";
                      textStyle = "text-red-950 font-semibold";
                      prefixBg = "bg-red-500 text-white";
                    } else if (optionSelected && optionCorrect) {
                      bgStyle = "bg-green-50 border-green-350 ring-1 ring-green-200";
                      textStyle = "text-green-950 font-semibold";
                      prefixBg = "bg-green-500 text-white";
                    }

                    return (
                      <div key={key} className={`border p-2.5 flex items-center gap-3 text-xs rounded-none ${bgStyle}`}>
                        <span className={`w-6 h-6 shrink-0 rounded-md font-bold flex items-center justify-center text-[10px] ${prefixBg}`}>
                          {key}
                        </span>
                        <span className={textStyle}>{value}</span>
                        {optionCorrect && (
                          <span className="text-[10px] text-green-700 font-bold ml-auto uppercase tracking-tighter">Correct Option</span>
                        )}
                        {optionSelected && !optionCorrect && (
                          <span className="text-[10px] text-red-700 font-bold ml-auto uppercase tracking-tighter">Your Choice</span>
                        )}
                        {optionSelected && optionCorrect && (
                          <span className="text-[10px] text-green-700 font-bold ml-auto uppercase tracking-tighter">Your Choice (Correct)</span>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Explanations */}
                <div className="pt-3 border-t border-dashed border-slate-200 space-y-2 text-xs">
                  {question.teacherInsight && (
                    <div className="bg-amber-50/50 p-3 rounded text-slate-800 border-l-2 border-amber-500/50">
                      <strong className="text-amber-700 block text-[9px] uppercase tracking-wider mb-0.5">Guruji's Smart Tip (Guru-Mantra)</strong>
                      <p className="italic font-medium leading-relaxed">{question.teacherInsight}</p>
                    </div>
                  )}

                  <div className="bg-slate-50 p-3 rounded text-slate-600 border-l-2 border-slate-400/30">
                    <strong className="text-slate-500 block text-[9px] uppercase tracking-wider mb-0.5">Explanatory Facts</strong>
                    <p className="leading-relaxed">{question.explanation}</p>
                  </div>

                  {question.extraFacts && question.extraFacts.length > 0 && (
                    <div className="bg-indigo-50/50 p-3 rounded text-indigo-900 border-l-2 border-indigo-500/50">
                      <strong className="text-indigo-600 block text-[9px] uppercase tracking-wider mb-0.5">Extra Facts</strong>
                      <ul className="list-disc pl-4 space-y-1 mt-1 font-medium">
                        {question.extraFacts.map((fact, i) => (
                          <li key={i}>{fact}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </motion.div>
  );
}

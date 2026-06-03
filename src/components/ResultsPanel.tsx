import React from 'react';
import { motion } from 'motion/react';
import { Trophy, Clock } from 'lucide-react';
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
  setScreen
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

      <div className="grid grid-cols-2 gap-3">
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
    </motion.div>
  );
}

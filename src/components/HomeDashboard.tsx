import React from 'react';
import { motion } from 'motion/react';
import { ChevronRight, Sun, Award, BrainCircuit, Activity } from 'lucide-react';
import { Subject, SubjectMeta, User, ThemeType } from '../types';

interface HomeDashboardProps {
  user: User | null;
  streak: number;
  badges: string[];
  dailyDone: boolean;
  hasSavedQuiz: boolean;
  mistakes: any[];
  subjects: SubjectMeta[];
  startSetup: (subjectName: Subject) => void;
  startDailyChallenge: () => void;
  startMistakeReview: () => void;
  restoreQuiz: () => void;
  theme: ThemeType;
}

export default function HomeDashboard({
  user,
  streak,
  badges,
  dailyDone,
  hasSavedQuiz,
  mistakes,
  subjects,
  startSetup,
  startDailyChallenge,
  startMistakeReview,
  restoreQuiz,
  theme
}: HomeDashboardProps) {
  return (
    <motion.div
      key="home-grid"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="max-w-xl mx-auto w-full text-left font-sans"
    >
      <div className="flex flex-col gap-3 mb-5 border-b border-border-theme pb-4">
        <div className="flex justify-between items-start flex-wrap gap-2">
          <div>
            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">RPSC AI MCQ Practice Suite</span>
            <h2 className="text-base md:text-lg font-bold text-main mt-0.5">Rajasthan State Competitive Portal</h2>
          </div>
          {user && (
            <div className="flex items-center gap-1.5 px-3 py-1 bg-[var(--card-bg)] border border-border-theme text-main text-[11px] font-semibold">
              <span>Candidate: <span className="font-bold">{user.name}</span></span>
            </div>
          )}
        </div>

        {/* Top Summary Bar */}
        <div className="flex flex-wrap gap-2.5 text-[9px] font-bold uppercase tracking-wider text-slate-500">
          <span className="flex items-center gap-1">🔥 Streak: <strong className="text-orange-600 font-bold">{streak} Days</strong></span>
          <span>•</span>
          <span>🏆 Badges Unlocked: <strong className="text-slate-800 font-bold">{badges.length}</strong></span>
        </div>
      </div>

      {/* Instant Actions & Daily / Resume Panel */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-5">
        {/* Daily Challenge Flat Card */}
        <div className="border border-border-theme bg-[var(--card-bg)] p-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-1 text-[9px] font-bold text-amber-600 uppercase tracking-widest mb-1.5">
              <Sun size={11} className="shrink-0" /> Daily Rapid Challenge
            </div>
            <h3 className="text-xs font-bold text-main">10 MCQs Rapid Fire</h3>
            <p className="text-[11px] text-slate-400 mt-1 leading-normal">
              {dailyDone ? "Already completed today's official challenge. Great job!" : "Answer 10 mixed syllabus GK questions under timed conditions."}
            </p>
          </div>
          <div className="mt-4">
            {!dailyDone ? (
              <button 
                type="button"
                onClick={startDailyChallenge}
                className="w-full text-center py-2 bg-slate-900 border border-slate-900 text-white font-bold text-[10px] uppercase tracking-wider hover:bg-slate-800 transition-colors cursor-pointer"
              >
                Join Daily Challenge
              </button>
            ) : (
              <div className="flex items-center gap-1.5 text-xs text-emerald-600 font-bold select-none">
                <span className="text-emerald-500">✓</span> Today's Session Completed
              </div>
            )}
          </div>
        </div>

        {/* Resume Session or Mistakes review */}
        <div className="border border-border-theme bg-[var(--card-bg)] p-4 flex flex-col justify-between">
          <div>
            <span className="text-[9px] font-bold text-red-500 uppercase tracking-widest block mb-1.5">Session Notebook</span>
            <h3 className="text-xs font-bold text-main">Incorrect Answers Library</h3>
            <p className="text-[11px] text-slate-400 mt-1 leading-normal">
              Review {mistakes.length} mistakes, or resume any active, in-progress examinations.
            </p>
          </div>
          <div className="mt-4 flex gap-1.5">
            {hasSavedQuiz && (
              <button 
                type="button"
                onClick={restoreQuiz}
                className="flex-1 text-center py-2 border border-slate-800 text-slate-800 bg-[var(--card-bg)] font-bold text-[10px] uppercase tracking-wider hover:bg-slate-50 transition-colors cursor-pointer"
              >
                Resume
              </button>
            )}
            {mistakes.length > 0 ? (
              <button 
                type="button"
                onClick={startMistakeReview}
                className="flex-1 text-center py-2 bg-red-650 bg-red-600 text-white font-bold text-[10px] uppercase tracking-wider hover:bg-red-700 transition-colors cursor-pointer"
              >
                Review ({mistakes.length})
              </button>
            ) : (
              <div className="text-[10px] text-slate-400 italic py-1.5 select-none">No incorrect entries in notebook yet.</div>
            )}
          </div>
        </div>
      </div>

      {/* Syllabus & Testing Topics Index */}
      <div className="border border-border-theme bg-[var(--card-bg)] p-4 md:p-5">
        <h3 className="text-[9px] font-bold text-slate-400 uppercase tracking-widest border-b border-border-theme pb-2 mb-3 select-none">
          Select Examination Paper (Syllabus Units)
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {subjects.map((sub, idx) => (
            <button
              key={sub.name}
              type="button"
              onClick={() => startSetup(sub.name)}
              className="flex items-center justify-between p-2.5 border border-border-theme bg-[var(--card-bg)] hover:bg-slate-50 hover:border-slate-800 transition-all text-left group cursor-pointer"
            >
              <div className="flex items-center gap-2">
                <span className="font-mono text-[10px] text-slate-400 group-hover:text-primary select-none">{(idx + 1).toString().padStart(2, '0')}.</span>
                <div>
                  <span className="text-xs font-bold text-main group-hover:text-primary block">{sub.name}</span>
                  <span className="text-[9px] text-slate-400 italic font-medium">{sub.desc}</span>
                </div>
              </div>
              <ChevronRight size={12} className="text-slate-300 group-hover:text-primary transition-transform duration-100 group-hover:translate-x-0.5" />
            </button>
          ))}
        </div>
      </div>
    </motion.div>
  );
}

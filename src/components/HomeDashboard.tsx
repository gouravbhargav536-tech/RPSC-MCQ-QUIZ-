import React, { useState } from 'react';
import { motion } from 'motion/react';
import { 
  ChevronRight, 
  Sun, 
  Award, 
  BrainCircuit, 
  Activity, 
  Star, 
  ShieldCheck, 
  Loader2, 
  CheckCircle2, 
  XCircle, 
  AlertCircle, 
  Key,
  Terminal
} from 'lucide-react';
import { Subject, SubjectMeta, User, ThemeType, Question } from '../types';

interface HomeDashboardProps {
  user: User | null;
  streak: number;
  badges: string[];
  dailyDone: boolean;
  hasSavedQuiz: boolean;
  mistakes: any[];
  bookmarks: Question[];
  subjects: SubjectMeta[];
  startSetup: (subjectName: Subject) => void;
  startDailyChallenge: () => void;
  startMistakeReview: () => void;
  startBookmarksReview: () => void;
  toggleBookmark: (q: Question) => void;
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
  bookmarks = [],
  subjects,
  startSetup,
  startDailyChallenge,
  startMistakeReview,
  startBookmarksReview,
  toggleBookmark,
  restoreQuiz,
  theme
}: HomeDashboardProps) {
  // Key diagnostics states
  const [diagLoading, setDiagLoading] = useState(false);
  const [diagResults, setDiagResults] = useState<any | null>(null);
  const [showDiagPanel, setShowDiagPanel] = useState(false);

  const runKeyDiagnostics = async () => {
    setDiagLoading(true);
    setDiagResults(null);
    try {
      const response = await fetch('/api/check-keys-status', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      if (!response.ok) {
        throw new Error(`Diagnostic API returned error status: ${response.status}`);
      }
      const data = await response.json();
      setDiagResults(data);
    } catch (err: any) {
      console.error("Failed running diagnostic checks:", err);
      setDiagResults({
        error: err?.message || "Could not reach diagnostic server."
      });
    } finally {
      setDiagLoading(false);
    }
  };
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

      {/* Bookmarks Vault section */}
      <div className="border border-border-theme bg-[var(--card-bg)] p-4 md:p-5 mb-5 text-left font-sans">
        <div className="flex justify-between items-center border-b border-border-theme pb-2.5 mb-3">
          <div className="flex items-center gap-1.5">
            <Star size={11} className="text-amber-500 fill-amber-500 shrink-0" />
            <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest select-none">
              Bookmarks Archive ({bookmarks.length})
            </h3>
          </div>
          {bookmarks.length > 0 && (
            <button
              type="button"
              onClick={startBookmarksReview}
              className="text-[10px] font-bold text-slate-900 border border-slate-900 px-2.5 py-1 bg-[var(--card-bg)] uppercase tracking-wider hover:bg-slate-50 transition-colors cursor-pointer"
            >
              Review Bookmarks
            </button>
          )}
        </div>

        {bookmarks.length === 0 ? (
          <p className="text-[11px] text-slate-400 italic leading-relaxed">
            No bookmarked questions saved yet. Click the Star icon on any MCQ card during your test to bookmark it.
          </p>
        ) : (
          <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1">
            {bookmarks.map((q, idx) => (
              <div 
                key={q.id || idx} 
                className="p-2.5 border border-border-theme bg-[var(--card-bg)] hover:bg-slate-50 hover:border-slate-800 transition-all flex justify-between items-start gap-3 rounded-none group"
              >
                <div className="flex-1 min-w-0 text-left">
                  <span className="text-[9px] font-mono font-bold text-amber-600 uppercase tracking-tighter block mb-0.5">
                    Bookmark #{(idx + 1).toString().padStart(2, '0')}
                  </span>
                  <p className="text-xs font-semibold text-main leading-relaxed">
                    {q.question}
                  </p>
                  <p className="text-[10px] text-slate-500 mt-1">
                    Correct Answer: <span className="font-mono font-bold text-emerald-600">{q.correctAnswer}</span> — <span className="italic">{q.options[q.correctAnswer]}</span>
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => toggleBookmark(q)}
                    className="text-[9px] font-bold text-red-500 hover:text-red-700 opacity-60 hover:opacity-100 transition-opacity cursor-pointer px-1.5 py-1 border border-transparent hover:border-red-200 hover:bg-red-50"
                    title="Remove Bookmark"
                  >
                    Remove
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* API Connection Diagnostics Console */}
      <div className="border border-border-theme bg-[var(--card-bg)] p-4 md:p-5 mb-5 text-left font-sans">
        <div className="flex justify-between items-center border-b border-border-theme pb-2.5 mb-3">
          <div className="flex items-center gap-1.5">
            <ShieldCheck size={12} className="text-emerald-500 shrink-0" />
            <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest select-none">
              API Engine & Key Diagnostics
            </h3>
          </div>
          <button
            type="button"
            onClick={runKeyDiagnostics}
            disabled={diagLoading}
            className={`text-[10px] font-bold border border-slate-900 px-3 py-1 uppercase tracking-wider transition-colors cursor-pointer flex items-center gap-1.5 ${
              diagLoading ? 'bg-slate-100 text-slate-400 border-slate-300' : 'bg-slate-950 text-white hover:bg-slate-800'
            }`}
          >
            {diagLoading && <Loader2 size={10} className="animate-spin" />}
            {diagLoading ? 'Testing Live...' : 'Check API Keys Now'}
          </button>
        </div>

        <p className="text-[11px] text-slate-500 leading-normal mb-3">
          Verifies if your configured environment keys (Google Gemini & OpenRouter fallback) can connect successfully and possess enough credits to process RPSC syllabus requests.
        </p>

        {diagResults ? (
          <div className="space-y-3 animate-fade-in">
            {/* Primary Key */}
            <div className={`p-3 border rounded-none ${diagResults.primaryGemini?.working ? 'border-green-200 bg-green-50/20' : 'border-slate-200 bg-slate-50/30'}`}>
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-slate-700 uppercase tracking-wide flex items-center gap-1">
                  <Key size={10} className="text-slate-400" /> Primary Google SDK (GEMINI_API_KEY)
                </span>
                <span className={`px-2 py-0.5 text-[9px] font-bold uppercase tracking-widest rounded-none ${
                  diagResults.primaryGemini?.working 
                    ? 'bg-green-100 text-green-700' 
                    : diagResults.primaryGemini?.configured 
                      ? 'bg-red-100 text-red-700' 
                      : 'bg-slate-100 text-slate-400'
                }`}>
                  {diagResults.primaryGemini?.working 
                    ? 'Working perfectly' 
                    : diagResults.primaryGemini?.configured 
                      ? 'Failed' 
                      : 'Not configured'}
                </span>
              </div>
              <p className="text-[10px] text-slate-500 mt-1 leading-snug">
                {diagResults.primaryGemini?.details}
              </p>
              {diagResults.primaryGemini?.error && (
                <div className="mt-1.5 p-1.5 bg-red-50 border border-red-100 rounded-none text-[9px] font-mono text-red-600 break-words font-medium">
                  Error Details: {diagResults.primaryGemini.error}
                </div>
              )}
            </div>

            {/* Backup Key */}
            <div className={`p-3 border rounded-none ${diagResults.backupGemini?.working ? 'border-green-200 bg-green-50/20' : 'border-slate-200 bg-slate-50/30'}`}>
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-slate-700 uppercase tracking-wide flex items-center gap-1">
                  <Key size={10} className="text-slate-400" /> Backup Google SDK (BACKUP_GEMINI_API_KEY)
                </span>
                <span className={`px-2 py-0.5 text-[9px] font-bold uppercase tracking-widest rounded-none ${
                  diagResults.backupGemini?.working 
                    ? 'bg-green-100 text-green-700' 
                    : diagResults.backupGemini?.configured 
                      ? 'bg-red-100 text-red-700' 
                      : 'bg-slate-100 text-slate-400'
                }`}>
                  {diagResults.backupGemini?.working 
                    ? 'Working perfectly' 
                    : diagResults.backupGemini?.configured 
                      ? 'Failed' 
                      : 'Not configured'}
                </span>
              </div>
              <p className="text-[10px] text-slate-500 mt-1 leading-snug">
                {diagResults.backupGemini?.details}
              </p>
              {diagResults.backupGemini?.error && (
                <div className="mt-1.5 p-1.5 bg-red-50 border border-red-100 rounded-none text-[9px] font-mono text-red-600 break-words font-medium">
                  Error Details: {diagResults.backupGemini.error}
                </div>
              )}
            </div>

            {/* OpenRouter Key */}
            <div className={`p-3 border rounded-none ${diagResults.openRouter?.working ? 'border-green-200 bg-green-50/20' : 'border-slate-200 bg-slate-50/30'}`}>
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-slate-700 uppercase tracking-wide flex items-center gap-1">
                  <Terminal size={10} className="text-slate-400" /> OpenRouter Multi-LLM (OPENROUTER_API_KEY)
                </span>
                <span className={`px-2 py-0.5 text-[9px] font-bold uppercase tracking-widest rounded-none ${
                  diagResults.openRouter?.working 
                    ? 'bg-green-100 text-green-700' 
                    : diagResults.openRouter?.configured 
                      ? 'bg-red-100 text-red-700' 
                      : 'bg-slate-100 text-slate-400'
                }`}>
                  {diagResults.openRouter?.working 
                    ? 'Working perfectly' 
                    : diagResults.openRouter?.configured 
                      ? 'Failed' 
                      : 'Not configured'}
                </span>
              </div>
              <p className="text-[10px] text-slate-500 mt-1 leading-snug">
                {diagResults.openRouter?.details}
              </p>
              {diagResults.openRouter?.error && (
                <div className="mt-1.5 p-1.5 bg-red-50 border border-red-100 rounded-none text-[9px] font-mono text-red-600 break-words font-medium">
                  Error Details: {diagResults.openRouter.error}
                </div>
              )}
            </div>

            {diagResults.error && (
              <div className="flex items-center gap-1.5 text-red-500 text-[10px] font-bold">
                <AlertCircle size={12} /> {diagResults.error}
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-5 border border-dashed border-slate-200 bg-slate-50/30 rounded-none">
            <button
              type="button"
              onClick={runKeyDiagnostics}
              className="text-[10px] text-slate-500 hover:text-slate-800 font-bold uppercase tracking-wider flex items-center gap-2 mx-auto cursor-pointer"
            >
              <Activity size={12} className="animate-pulse text-slate-400" />
              Diagnostics Idle. Click to diagnose active connection keys.
            </button>
          </div>
        )}
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

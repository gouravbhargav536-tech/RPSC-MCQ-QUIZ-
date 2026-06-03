import React from 'react';
import { motion } from 'motion/react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { QuizConfig, Subject, SubjectMeta, ExamPattern, Language, Difficulty } from '../types';

interface SetupPanelProps {
  config: QuizConfig;
  setConfig: React.Dispatch<React.SetStateAction<QuizConfig>>;
  onBack: () => void;
  onStartQuiz: () => void;
  subjects: SubjectMeta[];
}

export default function SetupPanel({
  config,
  setConfig,
  onBack,
  onStartQuiz,
  subjects
}: SetupPanelProps) {
  return (
    <motion.div
      key="setup-form"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="max-w-xl mx-auto w-full text-left font-sans"
    >
      <button 
        type="button"
        onClick={onBack}
        className="flex items-center text-[10px] font-bold text-slate-400 uppercase tracking-widest hover:text-primary transition-colors mb-5 cursor-pointer"
      >
        <ChevronLeft size={12} /> Back to Subject Units
      </button>
      
      <div className="border border-border-theme bg-[var(--card-bg)] p-5 md:p-6 shadow-none">
        <div className="mb-5 border-b border-border-theme pb-4">
          <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block">Unit Configuration Settings</span>
          <h2 className="text-base font-bold text-main mt-1 italic font-sans">{config.subject}</h2>
        </div>

        <div className="grid gap-4">
          <div>
             <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 select-none">Exam Pattern Reference Year</label>
             <div className="grid grid-cols-2 gap-1.5">
               {(['2012-2020', '2021-Present'] as ExamPattern[]).map(p => (
                 <button
                   key={p}
                   type="button"
                   onClick={() => setConfig({ ...config, pattern: p })}
                   className={`py-2 text-xs border transition-colors font-bold rounded-none cursor-pointer ${
                     config.pattern === p 
                       ? 'border-slate-800 bg-slate-900 text-white' 
                       : 'border-slate-200 text-slate-500 hover:border-slate-400 bg-[var(--card-bg)]'
                   }`}
                 >
                   {p}
                 </button>
               ))}
             </div>
          </div>

          <div>
             <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 select-none">Examination Medium (Language)</label>
             <div className="grid grid-cols-3 gap-1.5">
               {(['English', 'Hindi', 'Hinglish'] as Language[]).map(lang => (
                 <button
                   key={lang}
                   type="button"
                   onClick={() => setConfig({ ...config, language: lang })}
                   className={`py-2 text-[10px] border font-bold transition-all uppercase tracking-wider rounded-none cursor-pointer ${
                     config.language === lang 
                       ? 'border-slate-800 bg-slate-900 text-white' 
                       : 'border-slate-200 text-slate-500 hover:border-slate-400 bg-[var(--card-bg)]'
                   }`}
                 >
                   {lang}
                 </button>
               ))}
             </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
               <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5 select-none">Subject Difficulty</label>
               <select 
                 value={config.difficulty}
                 onChange={(e) => setConfig({ ...config, difficulty: e.target.value as Difficulty })}
                 className="w-full bg-[var(--card-bg)] text-main border border-border-theme p-2 text-xs font-semibold focus:border-slate-800 outline-none appearance-none rounded-none"
               >
                 <option value="Easy">EASY GRADE</option>
                 <option value="Medium">MEDIUM GRADE</option>
                 <option value="Hard">HARD GRADE</option>
               </select>
            </div>
            <div>
               <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5 select-none">Questions Limit</label>
               <select 
                 value={config.questionCount}
                 onChange={(e) => setConfig({ ...config, questionCount: parseInt(e.target.value) })}
                 className="w-full bg-[var(--card-bg)] text-main border border-border-theme p-2 text-xs font-semibold focus:border-slate-800 outline-none appearance-none rounded-none"
               >
                 <option value={5}>05 QUESTIONS</option>
                 <option value={10}>10 QUESTIONS</option>
                 <option value={15}>15 QUESTIONS</option>
               </select>
            </div>
          </div>

          <div>
             <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 select-none">Syllabus Sub-Focus Keyword (Optional)</label>
             <input 
               type="text"
               placeholder="e.g. River origins, Aravalli soil..."
               value={config.topic}
               onChange={(e) => setConfig({ ...config, topic: e.target.value })}
               className="w-full bg-[var(--card-bg)] border border-border-theme p-2 text-xs text-main outline-none focus:border-slate-800 rounded-none font-sans"
             />
          </div>

          <button
            type="button"
            onClick={onStartQuiz}
            className="w-full h-11 bg-slate-900 text-white font-bold tracking-widest uppercase text-xs hover:bg-slate-800 transition-colors flex items-center justify-center gap-1.5 mt-2 rounded-none cursor-pointer"
          >
            Generate AI MCQ Booklet <ChevronRight size={14} />
          </button>
        </div>
      </div>
    </motion.div>
  );
}

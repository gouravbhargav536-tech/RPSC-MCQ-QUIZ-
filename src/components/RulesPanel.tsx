import React from 'react';
import { motion } from 'motion/react';
import { Info, ChevronRight } from 'lucide-react';

interface RulesPanelProps {
  rulesAccepted: boolean;
  setRulesAccepted: (accepted: boolean) => void;
  onBack: () => void;
  onConfirm: () => void;
}

export default function RulesPanel({
  rulesAccepted,
  setRulesAccepted,
  onBack,
  onConfirm
}: RulesPanelProps) {
  return (
    <motion.div
      key="rules"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="max-w-xl mx-auto w-full text-left font-sans"
    >
      <div className="border border-border-theme bg-[var(--card-bg)] p-5 md:p-6 shadow-none">
        <div className="flex items-center gap-3 mb-5 border-b border-border-theme pb-4 select-none">
           <div className="text-slate-800 shrink-0">
              <Info size={18} />
           </div>
           <div>
              <h2 className="text-sm font-bold text-main uppercase tracking-wider">Instructions to Candidates</h2>
              <p className="text-[9px] text-slate-400 uppercase tracking-widest font-bold">RPSC AI Compliance Registry</p>
           </div>
        </div>

        <div className="space-y-2.5 mb-5 font-sans text-xs">
           {[
             "The session time is tracked. Submitting leaves current uncompleted questions unchecked.",
             "Questions match official RPSC competitive syllabus specifications & marking scheme rules.",
             "Explanation and Guruji's smart tips are instantly unlocked upon choosing options.",
             "Avoid changing tabs during standard practice sessions for simulation fidelity."
           ].map((rule, i) => (
             <div key={i} className="flex gap-2 font-medium text-slate-600 leading-relaxed border-b border-dashed border-slate-100 pb-2">
                <span className="font-bold text-primary font-mono">{i+1}.</span>
                <p>{rule}</p>
             </div>
           ))}
        </div>

        <label className="flex items-start gap-2 p-3 bg-slate-50 border border-slate-100 rounded-none cursor-pointer hover:bg-slate-100 transition-colors mb-5 select-none">
           <input 
             type="checkbox" 
             checked={rulesAccepted}
             className="w-4 h-4 rounded-none border-slate-300 text-slate-800 focus:ring-slate-800 shrink-0 mt-0.5"
             onChange={(e) => setRulesAccepted(e.target.checked)}
           />
           <span className="text-[11px] font-semibold text-slate-600 leading-normal">I have read and agree to follow the official simulation guidelines.</span>
        </label>

        <div className="grid grid-cols-2 gap-3">
           <button 
             type="button"
             onClick={onBack}
             className="py-2.5 border border-slate-200 hover:bg-slate-50 text-[10px] font-bold uppercase tracking-wider text-slate-500 transition-all rounded-none cursor-pointer"
           >
              Back
           </button>
           <button 
             type="button"
             disabled={!rulesAccepted}
             onClick={onConfirm}
             className="py-2.5 bg-slate-900 text-white text-[10px] font-bold uppercase tracking-wider disabled:opacity-40 transition-all flex items-center justify-center gap-1.5 rounded-none cursor-pointer"
           >
              Start Booklet <ChevronRight size={12} />
           </button>
        </div>
      </div>
    </motion.div>
  );
}

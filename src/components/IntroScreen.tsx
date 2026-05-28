import React, { useState } from 'react';
import { motion } from 'motion/react';
import { BookOpen, Languages, ChevronRight } from 'lucide-react';
import { useFeedback } from '../hooks/useFeedback';

interface IntroScreenProps {
  onStart: () => void;
}

export default function IntroScreen({ onStart }: IntroScreenProps) {
  const [lang, setLang] = useState<'EN' | 'HI'>('EN');
  const { feedback } = useFeedback();

  const handleStart = () => {
    feedback('click');
    onStart();
  };

  const toggleLang = () => {
    feedback('click');
    setLang(lang === 'EN' ? 'HI' : 'EN');
  };

  const content = {
    EN: {
      heading: "RPSC AI MCQ Practice Portal",
      subheading: "Official Rajasthan Competitive Exam Simulation",
      body: "Conduct rapid sessions with AI-curated testing patterns aligning strictly with the RPSC commission syllabus guidelines. Clear questions, rigorous format, professional answers.",
      button: "Start Practice System",
      footer: "Rajasthan Public Service Commission • AI MCQ Portal Practice Suite"
    },
    HI: {
      heading: "RPSC AI MCQ अभ्यास पोर्टल",
      subheading: "आधिकारिक राजस्थान प्रतियोगी परीक्षा सिमुलेशन",
      body: "राजस्थान लोक सेवा आयोग (RPSC) के आधिकारिक पाठ्यक्रम और परीक्षा प्रारूप के अनुरूप AI-संचालित प्रश्नों के साथ अभ्यास करें। स्पष्ट प्रश्न, सटीक उत्तर कुंजी तथा गुरु-मंत्र विश्लेषण।",
      button: "अभ्यास प्रणाली शुरू करें",
      footer: "राजस्थान लोक सेवा आयोग • AI MCQ पोर्टल अभ्यास सुइट"
    }
  };

  const curr = content[lang];

  return (
    <div className="min-h-screen bg-page flex flex-col items-center justify-center p-4 text-main relative overflow-hidden">
      <div className="w-full max-w-xl border border-border-theme bg-[var(--card-bg)] p-6 md:p-10 shadow-none text-center relative z-10 transition-colors duration-200">
        
        {/* Language Pill */}
        <div className="flex justify-end mb-6">
          <button 
            type="button"
            onClick={toggleLang}
            className="flex items-center gap-1.5 px-3 py-1.5 border border-border-theme hover:bg-slate-50 text-[10px] font-bold uppercase tracking-widest text-slate-500 hover:text-slate-800 transition-colors"
          >
            <Languages size={12} />
            {lang === 'EN' ? 'हिंदी' : 'ENGLISH'}
          </button>
        </div>

        {/* Emblems / Subtitle */}
        <div className="w-12 h-12 border border-border-theme text-primary mx-auto flex items-center justify-center mb-6">
          <BookOpen size={20} />
        </div>

        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight mb-2 text-main font-sans">
          {curr.heading}
        </h1>
        
        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-6 border-b border-border-theme pb-4">
          {curr.subheading}
        </p>
        
        <p className="text-sm text-slate-500 mb-8 leading-relaxed font-normal">
          {curr.body}
        </p>

        <button
          type="button"
          onClick={handleStart}
          className="w-full h-11 bg-slate-900 text-white font-bold text-xs uppercase tracking-[0.2em] hover:bg-slate-800 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
        >
          {curr.button} <ChevronRight size={14} />
        </button>
      </div>

      <footer className="mt-8 text-center text-slate-400 text-[10px] uppercase tracking-wider font-medium">
        {curr.footer}
      </footer>
    </div>
  );
}

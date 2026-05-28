import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Mail, Lock, User as UserIcon, Eye, EyeOff, Loader2, Languages, ArrowLeft } from 'lucide-react';
import { mockAuth } from '../services/authService';
import { User } from '../types';
import { useFeedback } from '../hooks/useFeedback';

interface AuthScreenProps {
  onSuccess: (user: User) => void;
  onBack: () => void;
}

export default function AuthScreen({ onSuccess, onBack }: AuthScreenProps) {
  const [mode, setMode] = useState<'LOGIN' | 'SIGNUP'>('LOGIN');
  const [lang, setLang] = useState<'EN' | 'HI'>('EN');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({ name: '', email: '', password: '' });
  const { feedback } = useFeedback();

  const content = {
    EN: {
      loginTitle: "Candidate Authentication",
      signupTitle: "New Registrations System",
      nameLabel: "Full Name (Candidate's Name)",
      emailLabel: "Registered Email Address",
      passLabel: "Access Pin/Password",
      loginBtn: "Authenticate & Enter",
      signupBtn: "Enroll & Register",
      switchSignup: "New Candidate? Register Here",
      switchLogin: "Registered Candidate? Sign-In Here",
      passHint: "Secure credentials with minimum 8 characters",
      back: "Return to Main"
    },
    HI: {
      loginTitle: "अभ्यर्थी प्रमाणीकरण",
      signupTitle: "नवीन पंजीकरण प्रणाली",
      nameLabel: "पूरा नाम (अभ्यर्थी का नाम)",
      emailLabel: "पंजीकृत ईमेल पता",
      passLabel: "एक्सेस पिन/पासवर्ड",
      loginBtn: "प्रत्यायन करें",
      signupBtn: "नामांकन एवं पंजीकरण",
      switchSignup: "नए अभ्यर्थी? यहाँ पंजीकरण करें",
      switchLogin: "पंजीकृत अभ्यर्थी? यहाँ लॉग-इन करें",
      passHint: "कम से कम 8 अक्षर का सुरक्षित पासवर्ड प्रविष्ट करें",
      back: "मुख्य पृष्ठ पर लौटें"
    }
  };

  const curr = content[lang];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    feedback('click');
    setLoading(true);
    try {
      let user;
      if (mode === 'SIGNUP') {
        user = await mockAuth.signup(formData.name, formData.email);
      } else {
        user = await mockAuth.login(formData.email);
      }
      feedback('success');
      onSuccess(user);
    } catch (err) {
      feedback('wrong');
      alert("Authentication failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-page flex flex-col p-4 items-center justify-center relative">
      
      {/* Top action bar */}
      <div className="w-full max-w-sm flex items-center justify-between mb-4">
        <button 
          type="button"
          onClick={onBack}
          className="flex items-center gap-1.5 text-slate-400 hover:text-slate-800 transition-colors font-bold uppercase text-[10px] tracking-widest"
        >
          <ArrowLeft size={12} /> {curr.back}
        </button>

        <button 
          type="button"
          onClick={() => setLang(lang === 'EN' ? 'HI' : 'EN')}
          className="flex items-center gap-1.5 px-2 py-1 border border-border-theme hover:bg-slate-50 text-[10px] font-bold text-slate-500 hover:text-slate-800 transition-all uppercase tracking-wider"
        >
          <Languages size={12} /> {lang === 'EN' ? 'HINDI' : 'ENGLISH'}
        </button>
      </div>

      <div className="w-full max-w-sm border border-border-theme bg-[var(--card-bg)] p-6 md:p-8 shadow-none transition-colors duration-200">
        
        <div className="text-center mb-8 border-b border-border-theme pb-4">
          <h2 className="text-lg font-bold uppercase tracking-wider text-main">
            {mode === 'LOGIN' ? curr.loginTitle : curr.signupTitle}
          </h2>
          <p className="text-[9px] text-slate-400 font-bold uppercase mt-1">RPSC AI Compliance Enforcer</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <AnimatePresence mode="wait">
            {mode === 'SIGNUP' && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden"
              >
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">{curr.nameLabel}</label>
                <div className="relative">
                  <UserIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                  <input 
                    required
                    type="text"
                    placeholder="Enter full name"
                    className="w-full bg-[var(--card-bg)] border border-border-theme p-3 pl-10 text-xs text-main outline-none focus:border-slate-800 transition-colors"
                    value={formData.name}
                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                  />
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">{curr.emailLabel}</label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
              <input 
                required
                type="email"
                placeholder="name@portal.com"
                className="w-full bg-[var(--card-bg)] border border-border-theme p-3 pl-10 text-xs text-main outline-none focus:border-slate-800 transition-colors"
                value={formData.email}
                onChange={e => setFormData({ ...formData, email: e.target.value })}
              />
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">{curr.passLabel}</label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
              <input 
                required
                type={showPassword ? "text" : "password"}
                placeholder="••••••••"
                className="w-full bg-[var(--card-bg)] border border-border-theme p-3 pl-10 pr-10 text-xs text-main outline-none focus:border-slate-800 transition-colors"
                value={formData.password}
                onChange={e => setFormData({ ...formData, password: e.target.value })}
              />
              <button 
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-800 transition-colors"
              >
                {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
              </button>
            </div>
            <p className="text-[9px] text-slate-400 mt-1.5 italic font-medium">{curr.passHint}</p>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full h-10 bg-slate-900 border border-slate-900 text-white font-bold tracking-[0.2em] uppercase text-xs hover:bg-slate-800 disabled:opacity-55 transition-all flex items-center justify-center gap-2"
          >
            {loading ? <Loader2 className="animate-spin" size={16} /> : (mode === 'LOGIN' ? curr.loginBtn : curr.signupBtn)}
          </button>
        </form>

        <button 
          type="button"
          onClick={() => setMode(mode === 'LOGIN' ? 'SIGNUP' : 'LOGIN')}
          className="w-full mt-6 text-center text-[9px] font-bold text-slate-400 hover:text-slate-800 transition-colors uppercase tracking-[0.15em] border-t border-border-theme pt-4"
        >
          {mode === 'LOGIN' ? curr.switchSignup : curr.switchLogin}
        </button>
      </div>
    </div>
  );
}

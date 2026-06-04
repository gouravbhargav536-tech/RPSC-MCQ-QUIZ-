import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, 
  Key, 
  Settings, 
  CheckCircle2, 
  AlertCircle, 
  Loader2, 
  Eye, 
  EyeOff, 
  Sparkles,
  RefreshCw,
  Cpu
} from 'lucide-react';
import axios from 'axios';

interface ApiSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  theme: 'geometric' | 'rajasthan';
  feedback: (type: 'click' | 'correct' | 'wrong' | 'royal' | 'success') => void;
}

export default function ApiSettingsModal({ isOpen, onClose, theme, feedback }: ApiSettingsModalProps) {
  const [useCustomKey, setUseCustomKey] = useState(false);
  const [apiKey, setApiKey] = useState('');
  const [showKey, setShowKey] = useState(false);
  const [isValidated, setIsValidated] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [isValidating, setIsValidating] = useState(false);

  // Initialize from LocalStorage
  useEffect(() => {
    if (isOpen) {
      const storedUseCustom = localStorage.getItem('rpsc_use_custom_key') === 'true';
      const storedKey = localStorage.getItem('rpsc_custom_api_key') || '';
      const storedValidated = localStorage.getItem('rpsc_custom_key_validated') === 'true';
      
      setUseCustomKey(storedUseCustom);
      setApiKey(storedKey);
      setIsValidated(storedValidated);
      setValidationError(null);
    }
  }, [isOpen]);

  const handleToggle = (checked: boolean) => {
    feedback('click');
    setUseCustomKey(checked);
    if (!checked) {
      // Clear validation state on disabling
      setValidationError(null);
    } else if (apiKey && !isValidated) {
      // Prompt validation if key exists but not validated
      setIsValidated(false);
    }
  };

  const handleValidateAndSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!apiKey.trim()) {
      feedback('wrong');
      setValidationError('Please enter an API key first.');
      return;
    }

    feedback('click');
    setIsValidating(true);
    setValidationError(null);
    setIsValidated(false);

    try {
      const response = await axios.post('/api/validate-key', { apiKey: apiKey.trim() });
      if (response.data.valid) {
        feedback('success');
        setIsValidated(true);
        // Save to LocalStorage
        localStorage.setItem('rpsc_use_custom_key', String(useCustomKey));
        localStorage.setItem('rpsc_custom_api_key', apiKey.trim());
        localStorage.setItem('rpsc_custom_key_validated', 'true');
      } else {
        throw new Error(response.data.error || 'The Gemini API key could not be verified.');
      }
    } catch (err: any) {
      feedback('wrong');
      const errMessage = err.response?.data?.error || err.message || 'Verification request failed. Please check network and copy-paste correctness.';
      setValidationError(errMessage);
      setIsValidated(false);
      localStorage.setItem('rpsc_custom_key_validated', 'false');
    } finally {
      setIsValidating(false);
    }
  };

  const handleSaveOnly = () => {
    feedback('click');
    localStorage.setItem('rpsc_use_custom_key', String(useCustomKey));
    localStorage.setItem('rpsc_custom_api_key', apiKey.trim());
    localStorage.setItem('rpsc_custom_key_validated', String(isValidated));
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-slate-900/40 backdrop-blur-md cursor-pointer"
          />

          {/* Modal Container */}
          <motion.div
            initial={{ scale: 0.95, opacity: 0, y: 15 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 15 }}
            transition={{ type: 'spring', duration: 0.4 }}
            className={`relative max-w-lg w-full rounded-3xl shadow-2xl p-6 md:p-8 flex flex-col gap-6 select-none overflow-hidden border ${
              theme === 'rajasthan'
                ? 'bg-gradient-to-b from-orange-50 via-white to-amber-50 border-amber-200 text-slate-800'
                : 'bg-white border-slate-200 text-slate-800'
            }`}
          >
            {/* Design Accents for Rajasthan Royal Mode */}
            {theme === 'rajasthan' && (
              <div className="absolute top-0 inset-x-0 h-2 bg-gradient-to-r from-rose-800 via-red-700 to-orange-600" />
            )}

            {/* Header */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`p-2.5 rounded-xl flex items-center justify-center ${
                  theme === 'rajasthan' ? 'bg-amber-100 text-rose-800' : 'bg-indigo-50 text-indigo-600'
                }`}>
                  <Settings size={20} className="animate-spin-slow" />
                </div>
                <div>
                  <h3 className={`text-lg md:text-xl font-bold font-display uppercase tracking-tight ${
                    theme === 'rajasthan' ? 'text-rose-900' : 'text-slate-900'
                  }`}>
                    API Engine Settings
                  </h3>
                  <p className="text-xs text-slate-500 font-sans tracking-wide">
                    Configure LLM Generation Keys
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-1.5 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-all cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* Config Form or Body */}
            <div className="flex flex-col gap-5 pt-2">
              <div className={`p-4 rounded-2xl flex items-start gap-3 border ${
                theme === 'rajasthan' 
                  ? 'bg-amber-500/5 border-amber-200/50 text-amber-900/80' 
                  : 'bg-indigo-500/5 border-indigo-100 text-indigo-900/80'
              }`}>
                <Cpu size={18} className={`shrink-0 mt-0.5 ${theme === 'rajasthan' ? 'text-amber-600' : 'text-indigo-600'}`} />
                <div className="text-xs leading-relaxed">
                  <p className="font-semibold mb-1 uppercase tracking-wider text-[10px]">How this works</p>
                  By default, AI-Quizzer generates premium standard RPSC MCQs using our built-in hosted model keys. 
                  If you prefer to bypass standard quotas or run unlimited expert sessions, enable custom integration below. Key data is saved encrypted directly in your local browser storage.
                </div>
              </div>

              {/* Toggle Custom Key option */}
              <label className="flex items-center justify-between cursor-pointer p-4 rounded-2xl border border-slate-100 bg-slate-50/50 hover:bg-slate-50 transition-all">
                <div className="flex flex-col gap-0.5">
                  <span className="text-sm font-bold text-slate-800">Use Custom Gemini API Key</span>
                  <span className="text-xs text-slate-400">Prioritize your own quota & usage statistics</span>
                </div>
                <div className="relative">
                  <input
                    type="checkbox"
                    checked={useCustomKey}
                    onChange={(e) => handleToggle(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500"></div>
                </div>
              </label>

              {/* Conditional input fields */}
              <AnimatePresence>
                {useCustomKey && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    className="overflow-hidden flex flex-col gap-3"
                  >
                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-bold text-slate-500 uppercase tracking-widest flex items-center gap-1.5 leading-none">
                        <Key size={12} />
                        Gemini API Key
                      </label>
                      <div className="relative flex items-center">
                        <input
                          type={showKey ? 'text' : 'password'}
                          value={apiKey}
                          onChange={(e) => {
                            setApiKey(e.target.value);
                            setIsValidated(false);
                            setValidationError(null);
                          }}
                          placeholder="AIzaSy..."
                          className={`w-full font-mono text-sm px-4 py-3 rounded-xl border transition-all bg-white text-slate-800 pr-12 focus:outline-none focus:ring-2 ${
                            theme === 'rajasthan'
                              ? 'border-amber-200 focus:border-amber-500 focus:ring-amber-200'
                              : 'border-slate-200 focus:border-indigo-500 focus:ring-indigo-200'
                          }`}
                        />
                        <button
                          type="button"
                          onClick={() => {
                            feedback('click');
                            setShowKey(!showKey);
                          }}
                          className="absolute right-3 p-1.5 rounded-lg text-slate-400 hover:text-slate-600 transition-colors"
                        >
                          {showKey ? <EyeOff size={16} /> : <Eye size={16} />}
                        </button>
                      </div>
                    </div>

                    {/* Check if key is validated or error occurs */}
                    {isValidating && (
                      <div className="flex items-center gap-2 text-xs text-indigo-600 font-medium bg-indigo-50 px-3.5 py-2.5 rounded-xl border border-indigo-100 animate-pulse">
                        <Loader2 size={14} className="animate-spin shrink-0" />
                        <span>Verifying key directly via a test call to Gemini API...</span>
                      </div>
                    )}

                    {isValidated && !isValidating && (
                      <div className="flex items-start gap-2 text-xs text-emerald-800 font-medium bg-emerald-50 px-3.5 py-2.5 rounded-xl border border-emerald-200">
                        <CheckCircle2 size={16} className="text-emerald-600 shrink-0 mt-0.5" />
                        <div>
                          <p className="font-bold">Key Verified Successfully!</p>
                          <p className="text-emerald-600/80">This key is functional and has been configured to prioritize generation of RPSC questions.</p>
                        </div>
                      </div>
                    )}

                    {validationError && !isValidating && (
                      <div className="flex items-start gap-2 text-xs text-rose-800 font-medium bg-rose-50 px-3.5 py-2.5 rounded-xl border border-rose-200">
                        <AlertCircle size={16} className="text-rose-600 shrink-0 mt-0.5" />
                        <div>
                          <p className="font-bold">Invalid / Prohibited Key:</p>
                          <p className="text-rose-600/80 leading-relaxed">{validationError}</p>
                        </div>
                      </div>
                    )}

                    {/* Validate and save action */}
                    <button
                      type="button"
                      onClick={handleValidateAndSave}
                      disabled={isValidating || !apiKey.trim()}
                      className={`w-full py-2.5 md:py-3 px-4 rounded-xl font-bold uppercase text-xs tracking-wider flex items-center justify-center gap-2 border transition-all cursor-pointer ${
                        isValidating || !apiKey.trim()
                          ? 'bg-slate-100 text-slate-400 border-slate-100 cursor-not-allowed'
                          : theme === 'rajasthan'
                            ? 'bg-amber-100 border-amber-300 text-amber-800 hover:bg-amber-200 hover:border-amber-400'
                            : 'bg-indigo-50 border-indigo-200 text-indigo-800 hover:bg-indigo-100 hover:border-indigo-300'
                      }`}
                    >
                      <RefreshCw size={12} className={isValidating ? 'animate-spin' : ''} />
                      Verify Custom Credentials
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Footer Buttons */}
            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 py-3 px-4 rounded-xl text-slate-500 hover:text-slate-800 text-xs font-bold uppercase tracking-widest transition-colors hover:bg-slate-50 border border-transparent cursor-pointer text-center"
              >
                Close
              </button>
              <button
                type="button"
                onClick={handleSaveOnly}
                className={`flex-1 py-3 px-4 rounded-xl font-bold uppercase text-xs tracking-widest text-white shadow-lg shadow-primary-500/10 active:scale-[0.98] transition-all cursor-pointer text-center ${
                  theme === 'rajasthan'
                    ? 'bg-gradient-to-r from-rose-800 to-orange-600 hover:brightness-110'
                    : 'bg-indigo-600 hover:bg-indigo-700'
                }`}
              >
                Apply Changes
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

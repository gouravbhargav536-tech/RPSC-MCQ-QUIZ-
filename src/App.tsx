/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  BookOpen, 
  ChevronRight, 
  Timer, 
  RotateCcw, 
  CheckCircle2, 
  XCircle, 
  Award, 
  BrainCircuit,
  ArrowLeft,
  Loader2,
  History,
  Calculator,
  FlaskConical,
  Languages,
  Zap,
  Activity,
  LayoutGrid,
  Info,
  ShieldCheck,
  ChevronLeft,
  LogOut,
  Palette,
  Castle,
  Sun,
  Trophy,
  Star,
  Map as MapIcon,
  Compass,
  User as UserIcon,
  Menu,
  X
} from 'lucide-react';
import { generateQuizQuestions } from './services/geminiService';
import { Question, QuizConfig, Subject, Difficulty, Language, ThemeType, User, ExamPattern } from './types';
import { mockAuth } from './services/authService';
import IntroScreen from './components/IntroScreen';
import AuthScreen from './components/AuthScreen';
import RiverMap from './components/RiverMap';
import { useFeedback } from './hooks/useFeedback';
import { testFirebaseConnection, hasFirebaseVars } from './services/firebase';
import { firebaseService } from './services/firebaseService';
import { Play, Pause, Bookmark, Terminal, AlertCircle, ShieldAlert } from 'lucide-react';

export default function App() {
  const [screen, setScreen] = useState<'LANDING' | 'INTRO' | 'AUTH' | 'HOME' | 'SETUP' | 'RULES' | 'QUIZ' | 'RESULTS'>('LANDING');
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [theme, setTheme] = useState<ThemeType>('geometric');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [rulesAccepted, setRulesAccepted] = useState(false);
  const [hasSavedQuiz, setHasSavedQuiz] = useState(false);
  
  // Selection state
  const [config, setConfig] = useState<QuizConfig>({
    subject: 'Rajasthan GK',
    difficulty: 'Medium',
    language: 'English',
    questionCount: 10,
    pattern: '2021-Present',
    topic: ''
  });

  // Quiz state
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [userAnswers, setUserAnswers] = useState<(string | null)[]>([]);
  const [mistakes, setMistakes] = useState<Question[]>([]);
  const [isReviewMode, setIsReviewMode] = useState(false);
  const [consecutiveCorrect, setConsecutiveCorrect] = useState(0);
  const [quizTimer, setQuizTimer] = useState(0);
  const [isAnswered, setIsAnswered] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Diagnostics and premium examination layout states
  const [diagnosticsOpen, setDiagnosticsOpen] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [markedForReview, setMarkedForReview] = useState<Record<number, boolean>>({});
  const [bookmarks, setBookmarks] = useState<Record<number, boolean>>({});
  const [firebaseStatus, setFirebaseStatus] = useState<'Checking' | 'Syncing' | 'Connected' | 'Not Configured' | 'Failed'>('Checking');
  const [firebaseError, setFirebaseError] = useState<string | null>(null);

  // Trigger Firestore ping check on boot
  useEffect(() => {
    const checkFirebase = async () => {
      setFirebaseStatus('Syncing');
      try {
        const res = await testFirebaseConnection();
        if (res.active) {
          setFirebaseStatus('Connected');
          setFirebaseError(null);
        } else {
          setFirebaseStatus(hasFirebaseVars ? 'Failed' : 'Not Configured');
          setFirebaseError(res.error || "Firebase Firestore database connection is unreachable.");
        }
      } catch (err: any) {
        setFirebaseStatus('Failed');
        setFirebaseError(err?.message || String(err));
      }
    };
    checkFirebase();
  }, []);

  // Gamification state
  const [streak, setStreak] = useState(0);
  const [badges, setBadges] = useState<string[]>([]);
  const [dailyDone, setDailyDone] = useState(false);
  const [isDailyChallenge, setIsDailyChallenge] = useState(false);
  const [isMapOpen, setIsMapOpen] = useState(false);

  const { feedback } = useFeedback();

  // Check for saved quiz on mount
  useEffect(() => {
    const saved = localStorage.getItem('rpsc_current_quiz');
    if (saved) setHasSavedQuiz(true);
  }, [screen]);

  // Persist user and progress
  useEffect(() => {
    const savedUser = localStorage.getItem('rpsc_user');
    if (savedUser) {
      try {
        setUser(JSON.parse(savedUser));
        setScreen('HOME');
      } catch (e) {
        console.error("Failed to parse saved user", e);
      }
    }
  }, []);

  useEffect(() => {
    if (user) {
      localStorage.setItem('rpsc_user', JSON.stringify(user));
      
      // Update local storage gamification stats if user profile fields are present
      const u = user as any;
      if (u.uid && u.uid !== 'local_temp_uid') {
        const stats = {
          streak: u.streak || 0,
          badges: u.badges || [],
          lastQuizDate: u.lastQuizDate || "",
          lastDailyDate: u.lastDailyDate || "",
          quizCount: u.quizCount || 0
        };
        localStorage.setItem('rpsc-gamification', JSON.stringify(stats));
        setStreak(stats.streak);
        setBadges(stats.badges);
        if (stats.lastDailyDate === new Date().toDateString()) {
          setDailyDone(true);
        }
      }
    } else {
      localStorage.removeItem('rpsc_user');
      localStorage.removeItem('rpsc_current_quiz');
    }
  }, [user]);

  // Synchronize Firestore bookmarks with active quiz question checklist
  useEffect(() => {
    const restoreBookmarks = async () => {
      if (user && (user as any).uid && questions.length > 0) {
        try {
          const dbBookmarks = await firebaseService.getBookmarks((user as any).uid);
          const activeBookmarks: Record<number, boolean> = {};
          questions.forEach((q, idx) => {
            const qId = q.id || `q-${idx}`;
            const sanitizedId = qId.replace(/[^a-zA-Z0-9_\-]/g, '_');
            if (dbBookmarks[sanitizedId] !== undefined) {
              activeBookmarks[idx] = true;
            } else {
              // fallback match on content
              const match = Object.values(dbBookmarks).some(b => b.question === q.question);
              if (match) activeBookmarks[idx] = true;
            }
          });
          setBookmarks(activeBookmarks);
        } catch (err) {
          console.error("Failed to restore bookmarks from Firestore:", err);
        }
      }
    };
    restoreBookmarks();
  }, [user, questions]);

  // Save quiz progress
  useEffect(() => {
    if (screen === 'QUIZ' && questions.length > 0) {
      const progress = {
        config,
        questions,
        userAnswers,
        currentIndex,
        quizTimer,
        isAnswered,
        isReviewMode,
        isDailyChallenge
      };
      localStorage.setItem('rpsc_current_quiz', JSON.stringify(progress));
    } else if (screen === 'RESULTS') {
      localStorage.removeItem('rpsc_current_quiz');
    }
  }, [screen, userAnswers, currentIndex, quizTimer, isAnswered]);

  // Restore progress
  const restoreQuiz = () => {
    const saved = localStorage.getItem('rpsc_current_quiz');
    if (saved) {
      const data = JSON.parse(saved);
      setConfig(data.config);
      setQuestions(data.questions);
      setUserAnswers(data.userAnswers);
      setCurrentIndex(data.currentIndex);
      setQuizTimer(data.quizTimer);
      setIsAnswered(data.isAnswered);
      setIsReviewMode(data.isReviewMode);
      setIsDailyChallenge(data.isDailyChallenge);
      setScreen('QUIZ');
      feedback('success');
    }
  };

  useEffect(() => {
    const savedUser = mockAuth.getCurrentUser();
    if (savedUser) setUser(savedUser);

    if (screen === 'LANDING') {
      const timer = setTimeout(() => {
        setScreen(savedUser ? 'HOME' : 'INTRO');
      }, 2500);
      return () => clearTimeout(timer);
    }
  }, [screen]);

  const handleLogout = () => {
    feedback('click');
    mockAuth.logout();
    setUser(null);
    setScreen('INTRO');
  };

  const toggleTheme = () => {
    feedback('royal');
    setTheme(prev => prev === 'geometric' ? 'rajasthan' : 'geometric');
  };

  useEffect(() => {
    if (screen === 'QUIZ' && !loading && !isPaused) {
      timerRef.current = setInterval(() => {
        setQuizTimer(prev => {
          if (prev >= 1199) {
            // Countdown ended. Auto-submit exam.
            setScreen('RESULTS');
            feedback('success');
            return 1200;
          }
          return prev + 1;
        });
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [screen, loading, isPaused]);

  const startSetup = (subject: Subject) => {
    feedback('click');
    setConfig(prev => ({
      ...prev,
      subject,
      selectedSubjects: subject === 'Balanced Mock Test' 
        ? [
            'Rajasthan Current Affairs',
            'National Current Affairs',
            'Rajasthan GK',
            'Indian GK',
            'Mathematics',
            'Science',
            'Reasoning',
            'Hindi',
            'English'
          ]
        : undefined
    }));
    setIsReviewMode(false);
    setIsDailyChallenge(false);
    setScreen('SETUP');
  };

  const startMistakeReview = () => {
    if (mistakes.length === 0) return;
    setQuestions(mistakes);
    setUserAnswers(new Array(mistakes.length).fill(null));
    setCurrentIndex(0);
    setIsReviewMode(true);
    setIsDailyChallenge(false);
    setScreen('QUIZ');
  };

  useEffect(() => {
    const savedStats = localStorage.getItem('rpsc-gamification');
    if (savedStats) {
      const stats = JSON.parse(savedStats);
      setStreak(stats.streak || 0);
      setBadges(stats.badges || []);
      
      const today = new Date().toDateString();
      if (stats.lastDailyDate === today) {
        setDailyDone(true);
      }
    }
  }, []);

  const updateGamification = async (newScore: number, total: number) => {
    const statsStr = localStorage.getItem('rpsc-gamification');
    let stats = statsStr ? JSON.parse(statsStr) : { streak: 0, badges: [], lastDailyDate: '', quizCount: 0 };
    
    // Update Streak
    const today = new Date().toDateString();
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    
    if (stats.lastQuizDate === yesterday.toDateString()) {
      stats.streak += 1;
    } else if (stats.lastQuizDate !== today) {
      stats.streak = 1;
    }
    stats.lastQuizDate = today;

    // Daily Challenge update
    if (isDailyChallenge && newScore >= 8) {
      stats.lastDailyDate = today;
      setDailyDone(true);
      if (!stats.badges.includes('Daily Warrior')) stats.badges.push('Daily Warrior');
    }

    // Badge logic
    stats.quizCount = (stats.quizCount || 0) + 1;
    if (stats.quizCount >= 10 && !stats.badges.includes('Exam Ninja')) stats.badges.push('Exam Ninja');
    if (newScore === total && total >= 10 && !stats.badges.includes('Perfectionist')) stats.badges.push('Perfectionist');
    if (newScore === total && !isDailyChallenge && !stats.badges.includes('Topic Master')) stats.badges.push('Topic Master');
    if (streak >= 7 && !stats.badges.includes('Consistency King')) stats.badges.push('Consistency King');

    localStorage.setItem('rpsc-gamification', JSON.stringify(stats));
    setStreak(stats.streak);
    setBadges(stats.badges);

    // Sync gamified profile details and quiz history directly to Firestore
    if (user && (user as any).uid) {
      try {
        await firebaseService.saveQuizAttempt((user as any).uid, config, newScore, quizTimer);
        
        await mockAuth.updateProfile((user as any).uid, {
          streak: stats.streak,
          badges: stats.badges,
          lastQuizDate: stats.lastQuizDate || "",
          lastDailyDate: stats.lastDailyDate || "",
          quizCount: stats.quizCount,
        });

        const updatedProfile = {
          ...user,
          streak: stats.streak,
          badges: stats.badges,
          lastQuizDate: stats.lastQuizDate || "",
          lastDailyDate: stats.lastDailyDate || "",
          quizCount: stats.quizCount,
        };
        setUser(updatedProfile);
        localStorage.setItem('rpsc_user', JSON.stringify(updatedProfile));
      } catch (err) {
        console.error("Failed to sync score progression to Firestore db:", err);
      }
    }
  };

  useEffect(() => {
    if (screen === 'RESULTS') {
      updateGamification(getScore(), questions.length);
    }
  }, [screen]);

  const startDailyChallenge = () => {
    if (dailyDone) return;
    setConfig({
      subject: 'Rajasthan GK',
      difficulty: 'Hard',
      language: 'English',
      questionCount: 10,
      topic: 'Mixed Syllabus Rapid Fire'
    });
    setIsDailyChallenge(true);
    handleStartQuiz();
  };

  const handleStartQuiz = () => {
    feedback('click');
    setScreen('RULES');
  };

  const confirmStartQuiz = async () => {
    feedback('click');
    setLoading(true);
    setScreen('QUIZ');
    try {
      const generatedQuestions = await generateQuizQuestions(config);
      setQuestions(generatedQuestions);
      setUserAnswers(new Array(generatedQuestions.length).fill(null));
      setCurrentIndex(0);
      setQuizTimer(0);
      setIsAnswered(false);
    } catch (error) {
      alert("Error generating quiz. Please try again.");
      setScreen('SETUP');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectAnswer = (answer: string) => {
    if (isAnswered) return;
    
    const newAnswers = [...userAnswers];
    newAnswers[currentIndex] = answer;
    setUserAnswers(newAnswers);
    setIsAnswered(true);

    if (answer === questions[currentIndex].correctAnswer) {
      feedback('correct');
      setConsecutiveCorrect(prev => prev + 1);
    } else {
      feedback('wrong');
      setConsecutiveCorrect(0);
      setMistakes(prev => {
        if (prev.find(m => m.id === questions[currentIndex].id)) return prev;
        return [...prev, questions[currentIndex]];
      });
    }
  };

  const nextQuestion = () => {
    feedback('click');
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(prev => prev + 1);
      setIsAnswered(false);
    } else {
      feedback('success');
      setScreen('RESULTS');
    }
  };

  const skipQuestion = () => {
    feedback('click');
    setUserAnswers(prev => {
      const next = [...prev];
      next[currentIndex] = 'SKIPPED';
      return next;
    });
    nextQuestion();
  };

  const prevQuestion = () => {
    feedback('click');
    if (currentIndex > 0) {
      setCurrentIndex(prev => prev - 1);
      setIsAnswered(true); // Assuming they already answered, if not it just shows question
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getScore = () => {
    return userAnswers.reduce((acc, ans, idx) => {
      return ans === questions[idx]?.correctAnswer ? acc + 1 : acc;
    }, 0);
  };

  const getSkippedCount = () => {
    return userAnswers.filter(ans => ans === 'SKIPPED').length;
  };

  const getIncorrectCount = () => {
    return userAnswers.filter((ans, idx) => ans !== 'SKIPPED' && ans !== null && ans !== questions[idx]?.correctAnswer).length;
  };

  const subjects: { name: Subject; icon: any; color: string; desc: string }[] = [
    { name: 'Balanced Mock Test', icon: Trophy, color: 'bg-indigo-700', desc: 'Mix of multiple RPSC subjects evenly' },
    { name: 'Rajasthan Current Affairs', icon: Zap, color: 'bg-amber-600', desc: 'Sports, Politics, Schemes 2026' },
    { name: 'National Current Affairs', icon: Sun, color: 'bg-rose-600', desc: 'National & Global Events' },
    { name: 'Rajasthan GK', icon: History, color: 'bg-blue-600', desc: 'Geography, History, Culture' },
    { name: 'Indian GK', icon: BookOpen, color: 'bg-indigo-600', desc: 'Constitution, Polity, Economy' },
    { name: 'Mathematics', icon: Calculator, color: 'bg-orange-600', desc: 'Algebra, Calculus, Probability' },
    { name: 'Science', icon: FlaskConical, color: 'bg-green-600', desc: 'Physics, Chemistry, Biology' },
    { name: 'Reasoning', icon: BrainCircuit, color: 'bg-teal-600', desc: 'Series, Analogy, Puzzles' },
    { name: 'Hindi', icon: Languages, color: 'bg-red-600', desc: 'Grammar, Vocab, Samas' },
    { name: 'English', icon: Zap, color: 'bg-purple-600', desc: 'Grammar, Tense, Voice' },
  ];

  return (
    <div className={`h-screen bg-page flex flex-col font-sans text-main overflow-hidden theme-${theme} relative`} data-theme={theme}>
      {/* 🛠️ COLLAPSIBLE SYSTEM DIAGNOSTIC PANEL */}
      <AnimatePresence>
        {diagnosticsOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="w-full bg-slate-900 text-slate-200 border-b border-slate-700 font-mono text-xs overflow-hidden relative z-50 shrink-0"
          >
            <div className="max-w-7xl mx-auto p-4 md:p-6 grid grid-cols-1 md:grid-cols-12 gap-6">
              {/* Variable Health Audit */}
              <div className="md:col-span-4 space-y-4 border-r border-slate-800 pr-0 md:pr-6">
                <div className="flex items-center gap-2 text-teal-400 font-bold border-b border-slate-800 pb-2">
                  <Terminal size={14} /> ENVIRONMENTAL AUDIT
                </div>
                
                <div className="space-y-3 font-semibold">
                  {/* Gemini API Key */}
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">VITE_GEMINI_API_KEY:</span>
                    {typeof (import.meta as any).env?.VITE_GEMINI_API_KEY === 'string' && (import.meta as any).env?.VITE_GEMINI_API_KEY.length > 0 ? (
                      <span className="px-2 py-0.5 bg-green-500/10 text-green-400 border border-green-500/30 rounded text-[10px] font-bold">
                        RESOLVED (Active)
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 bg-red-500/10 text-red-400 border border-red-500/30 rounded text-[10px] font-bold">
                        NOT CONFIGURED
                      </span>
                    )}
                  </div>

                  {/* OpenRouter API Key */}
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">VITE_OPENROUTER_API_KEY:</span>
                    {typeof (import.meta as any).env?.VITE_OPENROUTER_API_KEY === 'string' && (import.meta as any).env?.VITE_OPENROUTER_API_KEY.length > 0 ? (
                      <span className="px-2 py-0.5 bg-green-500/10 text-green-400 border border-green-500/30 rounded text-[10px] font-bold">
                        RESOLVED (Active)
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 bg-red-400/10 text-red-400 border border-red-400/30 rounded text-[10px] font-bold">
                        NOT CONFIGURED
                      </span>
                    )}
                  </div>

                  {/* Firebase Firestore Status */}
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Firestore Connection:</span>
                    <span className={`px-2 py-0.5 border rounded text-[10px] font-bold ${
                      firebaseStatus === 'Connected' 
                        ? 'bg-green-500/10 text-green-400 border-green-500/30'
                        : firebaseStatus === 'Syncing'
                          ? 'bg-amber-500/10 text-amber-400 border-amber-500/30 animate-pulse'
                          : firebaseStatus === 'Not Configured'
                            ? 'bg-slate-500/10 text-slate-400 border-slate-500/30'
                            : 'bg-red-500/10 text-red-400 border-red-500/30'
                    }`}>
                      {firebaseStatus === 'Connected' && 'CONNECTED (Auto-Polling)'}
                      {firebaseStatus === 'Syncing' && 'SYNCING PING...'}
                      {firebaseStatus === 'Not Configured' && 'LOCAL FALLBACK'}
                      {firebaseStatus === 'Failed' && 'STREAM DISCONNECTED / TIMEOUT'}
                      {firebaseStatus === 'Checking' && 'CHECKING...'}
                    </span>
                  </div>
                </div>

                <div className="text-[10px] text-slate-500 p-2.5 bg-slate-950/50 rounded border border-slate-800">
                  <span className="font-bold text-amber-500 block mb-1">💡 DEV TIP:</span>
                  To use real Firebase, declare <span className="text-slate-300">VITE_FIREBASE_API_KEY</span> and <span className="text-slate-300">VITE_FIREBASE_PROJECT_ID</span> in your secrets.
                </div>
              </div>

              {/* Netlify Variable Diagnostic Audit Details */}
              <div className="md:col-span-8 space-y-4">
                <div className="flex items-center gap-2 text-teal-400 font-bold border-b border-slate-800 pb-2">
                  <AlertCircle size={14} /> SYSTEM DIAGNOSTIC LOGS & REMEDIATION ARCHITECTURE
                </div>
                
                <div className="text-xs space-y-3 leading-relaxed text-slate-300">
                  <div>
                    <span className="text-amber-400 font-bold">1. Diagnosing Netlify Env 'NOT CONFIGURED' & 404s:</span>
                    <p className="text-[11px] text-slate-400 mt-1">
                      If variables exist in Netlify but show <span className="text-slate-200">NOT CONFIGURED</span> in the client, verify that <span className="text-amber-300 font-bold">"All scopes" (Builds and Runtime)</span> are checked on the Netlify Environment Dashboard. If only "Builds" is active, Vite's production bundler lacks access during runtime bundle execution, stripping keys from the app!
                    </p>
                  </div>

                  <div>
                    <span className="text-amber-400 font-bold">2. Restoring "@firebase/firestore" WebChannel RPC Stream Error:</span>
                    <p className="text-[11px] text-slate-400 mt-1">
                      On sandboxed networks, gRPC streams error on RPC transport. We have patched our client initialization inside <span className="text-slate-200">src/services/firebase.ts</span> using the strict constraint <span className="text-teal-400 font-semibold italic">experimentalAutoDetectLongPolling: true</span>, forcing fallback transmission to prevent stream dropouts and secure flawless quiz syncing.
                    </p>
                  </div>

                  {firebaseError && (
                    <div className="bg-red-900/10 border border-red-500/20 text-red-400 p-2.5 rounded text-[11px]">
                      <span className="font-bold">Active Connection Error Log:</span> {firebaseError}
                    </div>
                  )}
                </div>
              </div>
            </div>
            
            <div className="bg-slate-950/80 px-4 py-2 border-t border-slate-800 flex justify-between items-center text-[10px] text-slate-500">
              <span>ACTIVE SYSTEM AUDITOR • OFFLINE PORTAL MATCHED</span>
              <button 
                onClick={() => setDiagnosticsOpen(false)}
                className="text-teal-400 hover:text-teal-300 uppercase tracking-wider font-bold bg-transparent border-0 cursor-pointer"
              >
                [ Close Panel ]
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Background Accents (Geometric Balance Mode) */}
      {theme === 'geometric' && (
        <div className="fixed inset-0 pointer-events-none overflow-hidden">
          <div className="absolute top-[-100px] left-[-100px] w-[400px] h-[400px] bg-indigo-500/10 rounded-full blur-[100px]"></div>
          <div className="absolute bottom-[-150px] right-[-150px] w-[500px] h-[500px] bg-teal-500/10 rounded-full blur-[120px]"></div>
        </div>
      )}

      {/* Background Accents (Rajasthan Royal Mode) */}
      {theme === 'rajasthan' && (
        <div className="fixed inset-0 pointer-events-none overflow-hidden bg-gradient-to-br from-orange-50 via-amber-50 to-rose-50 opacity-100 -z-10">
          <div className="absolute inset-0 opacity-5 bg-[radial-gradient(circle_at_20%_20%,#9f1239_2px,transparent_2px)] bg-[length:32px_32px]" />
          <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-rose-500/5 rounded-full blur-[100px]"></div>
        </div>
      )}

      <AnimatePresence mode="wait">
        
        {/* LANDING SCREEN */}
        {screen === 'LANDING' && (
          <motion.div
            key="landing"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex flex-col items-center justify-center h-full bg-slate-900 text-white p-6"
          >
            <div className="flex items-center gap-4 mb-8">
              <div className="w-16 h-16 bg-primary rounded flex items-center justify-center text-white font-bold text-3xl shadow-lg font-display">A</div>
              <h1 className="text-4xl font-bold tracking-tight font-display">RPSC <span className="text-primary underline underline-offset-8 decoration-2 italic">AI-Quizzer</span></h1>
            </div>
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="text-center"
            >
              <p className="text-xl font-light tracking-wide text-slate-300">आपकी तैयारी का स्मार्ट साथी!</p>
              <p className="text-sm uppercase tracking-[0.3em] mt-4 text-primary font-bold">Initializing Engine</p>
            </motion.div>
          </motion.div>
        )}

        {/* INTRO SCREEN */}
        {screen === 'INTRO' && (
          <IntroScreen onStart={() => setScreen('AUTH')} />
        )}

        {/* AUTH SCREEN */}
        {screen === 'AUTH' && (
          <AuthScreen 
            onSuccess={(u) => {
              setUser(u);
              setScreen('HOME');
            }} 
            onBack={() => setScreen('INTRO')}
          />
        )}

        {/* QUIZ SHELL (Used for screens after intro/auth) */}
        {(screen !== 'LANDING' && screen !== 'INTRO' && screen !== 'AUTH') && (
          <motion.div
            key="app-shell"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col h-full overflow-hidden"
          >
            {/* Header Navigation */}
            <header className={`h-16 md:h-20 flex items-center justify-between px-4 md:px-8 shrink-0 relative z-20 transition-all duration-700 ${
              theme === 'rajasthan' 
                ? 'bg-gradient-to-r from-rose-800 via-red-700 to-orange-600 text-white border-b-4 border-amber-600 shadow-lg' 
                : 'bg-white/80 backdrop-blur-md border-b border-white/10'
            }`}>
                <div className="flex items-center gap-3 md:gap-4 cursor-pointer" onClick={() => setScreen('HOME')}>
                  <div className={`w-8 h-8 md:w-10 md:h-10 rounded-xl flex items-center justify-center font-bold text-lg md:text-xl font-display shadow-lg transition-transform active:scale-95 ${
                    theme === 'rajasthan' ? 'bg-white text-rose-800' : 'bg-primary text-white'
                  }`}>
                    {theme === 'rajasthan' ? <Castle size={18} /> : 'A'}
                  </div>
                  <div>
                    <h1 className={`text-base md:text-xl font-bold tracking-tight font-display ${theme === 'rajasthan' ? 'text-white' : ''}`}>
                      RPSC <span className={`${theme === 'rajasthan' ? 'text-amber-200' : 'text-primary'} underline decoration-2 underline-offset-4`}>AI-Quizzer</span>
                    </h1>
                    {theme === 'rajasthan' && <p className="hidden md:block text-[8px] text-orange-100 uppercase tracking-widest font-bold">Royal Examination Portal</p>}
                  </div>
                </div>
                
                <div className="flex items-center gap-2 md:gap-4">
                  {(screen === 'QUIZ' || screen === 'RESULTS') && (
                    <div className="flex flex-col items-end mr-1 md:mr-4">
                      <span className="hidden lg:block text-[9px] uppercase font-bold text-slate-400 tracking-widest whitespace-nowrap">Session Timer</span>
                      <span className="text-xs md:text-xl font-mono font-bold text-primary italic leading-none">{formatTime(quizTimer)}</span>
                    </div>
                  )}
                  
                  <div className="flex items-center gap-1 md:gap-2">
                    {/* diagnostics toggle */}
                    <button
                      onClick={() => setDiagnosticsOpen(!diagnosticsOpen)}
                      className={`px-3 py-1.5 md:px-4 md:py-2 rounded-full border text-[10px] font-bold uppercase transition-all tracking-wider flex items-center gap-1.5 cursor-pointer shadow-sm ${
                        diagnosticsOpen 
                          ? 'bg-amber-600 border-amber-500 text-white' 
                          : 'bg-slate-900 border-slate-700 text-slate-300 hover:bg-slate-800'
                      }`}
                    >
                      <Terminal size={12} />
                      <span className="hidden xs:inline">System Audit</span>
                    </button>

                    <div className="hidden sm:flex items-center gap-1 px-2 md:px-3 py-1 bg-orange-500/10 border border-orange-500/10 rounded-full">
                      <span className="text-orange-500 animate-pulse text-[10px]">🔥</span>
                      <span className="text-[10px] md:text-xs font-bold text-orange-500">{streak}</span>
                    </div>

                    <button 
                      onClick={toggleTheme}
                      title="Switch Theme"
                      className={`flex items-center gap-2 px-3 py-2 md:px-5 md:py-2.5 rounded-full transition-all duration-700 shadow-lg border group relative overflow-hidden active:scale-95 ${
                        theme === 'rajasthan' 
                          ? 'bg-rose-900/40 border-amber-500/50 text-amber-100 hover:bg-rose-900/60' 
                          : 'bg-white border-indigo-100 text-indigo-600 hover:border-indigo-300 hover:bg-indigo-50'
                      }`}
                    >
                      <Palette size={18} className={`transition-all duration-500 group-hover:rotate-[30deg] ${theme === 'rajasthan' ? 'text-amber-400' : 'text-indigo-500'}`} />
                      <span className={`text-[10px] md:text-sm font-bold transition-all duration-700 whitespace-nowrap ${
                        theme === 'rajasthan' 
                          ? 'font-serif italic text-amber-200 tracking-[0.15em] drop-shadow-sm' 
                          : 'font-display uppercase tracking-widest text-indigo-700'
                      }`}>
                        {theme === 'rajasthan' ? 'Royal Mode' : 'Switch Theme'}
                      </span>
                      
                      {theme === 'rajasthan' && (
                        <motion.div 
                          initial={{ scale: 0, opacity: 0 }}
                          animate={{ scale: [0, 1.2, 1], opacity: [0, 1, 0.8] }}
                          transition={{ repeat: Infinity, duration: 3 }}
                          className="absolute top-1 right-2 text-amber-300 pointer-events-none"
                        >
                          <Star size={8} fill="currentColor" />
                        </motion.div>
                      )}
                      
                      <div className={`absolute inset-0 opacity-0 group-hover:opacity-10 transition-opacity bg-white`}></div>
                    </button>

                  <div className="hidden xs:block h-6 md:h-8 w-px bg-slate-200 mx-1 md:mx-2"></div>

                  {user && (
                    <div className="flex items-center gap-2 md:gap-4">
                      <div className="flex flex-col items-end hidden lg:flex">
                        <span className={`text-[10px] font-bold uppercase tracking-widest leading-none mb-1 ${theme === 'rajasthan' ? 'text-orange-200 opacity-80' : 'text-slate-400'}`}>Authenticated</span>
                        <span className={`text-xs font-bold ${theme === 'rajasthan' ? 'text-white' : 'text-main'}`}>{user.name}</span>
                      </div>
                      <button 
                        onClick={handleLogout}
                        title="Logout"
                        className={`p-1.5 md:p-2 transition-colors ${theme === 'rajasthan' ? 'text-white/70 hover:text-white' : 'text-slate-400 hover:text-red-500'}`}
                      >
                        <LogOut size={16} />
                      </button>
                    </div>
                  )}

                  {screen === 'QUIZ' && (
                    <button 
                      onClick={() => setScreen('RESULTS')}
                      className="px-3 md:px-6 py-1.5 md:py-2 bg-slate-900 text-white text-xs md:text-sm font-semibold rounded hover:bg-slate-800 transition-colors shadow-sm ml-1 md:ml-4"
                    >
                      Submit
                    </button>
                  )}
                  {screen === 'RESULTS' && (
                    <button 
                      onClick={() => setScreen('HOME')}
                      className="px-3 md:px-6 py-1.5 md:py-2 bg-primary text-white text-xs md:text-sm font-semibold rounded hover:brightness-110 transition-all shadow-sm ml-1 md:ml-4"
                    >
                      Exit
                    </button>
                  )}
                </div>
              </div>
            </header>

            {/* Main Content Area */}
            <main className="flex-1 flex overflow-hidden relative">
              
              {/* Sidebar Left: Progress & Stats (Quiz) - Desktop and Tablet */}
              {screen === 'QUIZ' && !loading && (
                <aside className="hidden lg:flex w-72 border-r border-white/10 bg-white/5 backdrop-blur-sm p-6 flex-col gap-8 shrink-0 relative z-10 transition-all">
                  <div>
                    <h3 className="text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-4 flex items-center gap-2 font-display">
                       <Activity size={12} /> Adaptive Progress
                    </h3>
                    <div className="flex items-end gap-1.5 h-12">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <div 
                          key={i} 
                          className={`flex-1 rounded-sm transition-all duration-500 ${
                            i <= (currentIndex / questions.length) * 5 ? 'bg-primary' : 'bg-slate-100'
                          }`} 
                          style={{ height: `${(5 - i) * 20}%` }} 
                        />
                      ))}
                    </div>
                    <p className="mt-4 text-sm text-slate-600 italic">
                      Difficulty: <span className="font-bold text-accent">{config.difficulty}</span>
                    </p>
                  </div>

                  <div>
                    <h3 className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                      <LayoutGrid size={12} /> Question Map
                    </h3>
                    <div className="grid grid-cols-5 gap-2">
                      {questions.map((_, i) => {
                        const isCurrent = i === currentIndex;
                        const isAnswered = userAnswers[i] !== null;
                        return (
                          <div 
                            key={i}
                            onClick={() => setCurrentIndex(i)}
                            className={`aspect-square border flex items-center justify-center text-[10px] font-bold cursor-pointer transition-all ${
                              isCurrent 
                                ? 'border-primary bg-primary text-white shadow-md' 
                                : isAnswered 
                                  ? 'border-primary bg-primary/10 text-primary'
                                  : 'border-slate-200 bg-white text-slate-400 hover:border-slate-300'
                            }`}
                          >
                            {(i + 1).toString().padStart(2, '0')}
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  <div className="mt-auto p-4 bg-slate-50 border border-slate-200 rounded">
                    <p className="text-[10px] text-slate-500 leading-relaxed">
                      <span className="font-bold block mb-1 uppercase tracking-tighter text-slate-400 flex items-center gap-1"><Info size={10} /> RPSC Context</span>
                      AI-curated patterns based on previous years' exams.
                    </p>
                  </div>
                </aside>
              )}

              {/* Central Section */}
              <section className="flex-1 bg-slate-50 overflow-y-auto px-4 md:px-12 py-8 md:py-12 flex flex-col pb-32 md:pb-12">
                <AnimatePresence mode="wait">
                  {screen === 'HOME' && (
                    <motion.div
                      key="home-grid"
                      initial={{ opacity: 0, scale: 0.98 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="max-w-4xl mx-auto w-full"
                    >
                      <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 md:mb-10 gap-4 md:gap-6">
                        <div>
                          <span className="text-[10px] md:text-[11px] font-bold text-slate-500 uppercase tracking-[0.2em]">Select Examination Subject</span>
                          <h2 className="text-2xl md:text-4xl font-display mt-1 md:mt-2 text-main italic">RPSC <span className="text-primary">Practice Portal</span></h2>
                        </div>
                        
                        <div className="flex flex-wrap gap-3 md:gap-4 items-center">
                          {streak > 0 && (
                            <div className="flex items-center gap-2 px-4 py-2 bg-orange-50 border border-orange-200 rounded-2xl shadow-sm">
                              <span className="text-xl">🔥</span>
                              <div className="flex flex-col">
                                <span className="text-[10px] font-bold text-orange-400 uppercase tracking-tighter">Current Streak</span>
                                <span className="text-sm font-bold text-orange-700 leading-none">{streak} Days</span>
                              </div>
                            </div>
                          )}

                          {mistakes.length > 0 && (
                            <button 
                              onClick={startMistakeReview}
                              className={`flex items-center gap-2 px-6 py-3 font-bold border-b-2 transition-all uppercase text-xs tracking-widest ${
                                theme === 'rajasthan' 
                                  ? 'bg-rose-800 text-white rounded-2xl border-rose-900 shadow-rose-900/20 shadow-lg' 
                                  : 'bg-accent text-white rounded-sm border-accent/40 shadow-accent/20 shadow-lg'
                              } hover:brightness-110`}
                            >
                              <BrainCircuit size={16} /> Review Mistakes ({mistakes.length})
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Gamification Row */}
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
                        {/* Daily Challenge Card */}
                        <div className={`col-span-1 md:col-span-2 p-5 md:p-8 rounded-3xl border-2 flex flex-col sm:flex-row items-center sm:items-stretch gap-6 relative overflow-hidden group ${
                          dailyDone 
                            ? 'bg-slate-50 border-slate-200 opacity-80' 
                            : 'bg-gradient-to-br from-amber-500 to-orange-500 border-amber-600 text-white'
                        }`}>
                          <div className="flex-1 relative z-10 text-center sm:text-left">
                            <div className="flex items-center justify-center sm:justify-start gap-2 mb-2">
                              <Sun size={20} className={dailyDone ? 'text-slate-400' : 'text-white animate-spin-slow'} />
                              <span className="text-[10px] font-bold uppercase tracking-widest opacity-80">Daily Challenge</span>
                            </div>
                            <h3 className="text-xl md:text-2xl font-display font-bold mb-2">10 MCQs Rapid Fire</h3>
                            <p className={`text-xs md:text-sm mb-6 ${dailyDone ? 'text-slate-500' : 'text-white/80'}`}>
                              {dailyDone ? 'You completed today\'s challenge! Return tomorrow.' : 'Finish in 5 minutes to earn the "Daily Warrior" badge.'}
                            </p>
                            
                            {!dailyDone && (
                              <button 
                                onClick={startDailyChallenge}
                                className="px-6 py-2.5 bg-white text-orange-600 font-bold text-xs uppercase tracking-widest rounded-xl hover:scale-105 active:scale-95 transition-all shadow-lg"
                              >
                                Start Challenge
                              </button>
                            )}
                            {dailyDone && (
                              <div className="flex items-center justify-center sm:justify-start gap-2 text-green-600 font-bold text-sm">
                                <CheckCircle2 size={18} /> Completed 
                              </div>
                            )}
                          </div>
                          <div className={`w-24 h-24 md:w-32 md:h-32 flex items-center justify-center shrink-0 relative z-10 ${dailyDone ? 'grayscale opacity-20' : ''}`}>
                             <div className="absolute inset-0 bg-white/20 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-1000"></div>
                             <Star size={48} className="text-white drop-shadow-lg md:hidden" />
                             <Star size={64} className="text-white drop-shadow-lg hidden md:block" />
                          </div>
                        </div>

                        {/* Resume / Badges Panel */}
                        <div className="flex flex-col gap-6">
                           {hasSavedQuiz && (
                             <motion.button
                               initial={{ x: 20, opacity: 0 }}
                               animate={{ x: 0, opacity: 1 }}
                               onClick={restoreQuiz}
                               className="p-6 bg-slate-900 rounded-3xl text-white border border-slate-700 shadow-xl group relative overflow-hidden"
                             >
                                <div className="relative z-10">
                                   <div className="flex items-center gap-2 mb-2">
                                      <div className="w-2 h-2 rounded-full bg-primary animate-pulse"></div>
                                      <span className="text-[10px] font-bold uppercase tracking-widest opacity-60">Active Session</span>
                                   </div>
                                   <h3 className="text-xl font-display font-bold mb-1">Resume Test</h3>
                                   <p className="text-[10px] text-slate-400 italic">Curated: {config.subject}</p>
                                </div>
                                <Activity className="absolute -right-4 -bottom-4 text-white/5 group-hover:scale-110 transition-transform" size={100} />
                             </motion.button>
                           )}

                           <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm flex-1">
                           <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                             <Award size={14} /> Unlocked Badges
                           </h3>
                           <div className="flex flex-wrap gap-3">
                             {badges.length === 0 ? (
                               <p className="text-xs text-slate-400 italic">Complete quizzes to unlock achievement badges.</p>
                             ) : (
                               badges.map(b => (
                                 <div key={b} className="group relative">
                                   <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center text-primary border border-primary/20 hover:bg-primary hover:text-white transition-all cursor-help shadow-sm">
                                     <Award size={18} />
                                   </div>
                                   <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-slate-900 text-white text-[9px] rounded font-bold whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity">
                                     {b}
                                   </div>
                                 </div>
                               ))
                             )}
                           </div>
                        </div>
                      </div>

                    </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {subjects.map((sub, idx) => (
                          <motion.button
                            key={sub.name}
                            whileHover={{ y: -4, shadow: '0 10px 25px -5px rgba(0,0,0,0.1)' }}
                            onClick={() => startSetup(sub.name)}
                            className={`p-6 border text-left transition-all group ${
                              theme === 'rajasthan' 
                                ? 'bg-white rounded-3xl border-orange-200 shadow-md shadow-orange-100 hover:shadow-xl' 
                                : 'bg-white border-slate-200'
                            }`}
                          >
                            <div className={`w-10 h-10 ${
                              theme === 'rajasthan' ? 'bg-rose-800' : (sub.color.includes('blue') ? 'bg-primary' : sub.color)
                            } text-white flex items-center justify-center rounded-sm mb-4 group-hover:scale-110 transition-transform shadow-sm`}>
                              <sub.icon size={20} />
                            </div>
                            <h3 className={`text-lg font-bold underline underline-offset-4 pointer-events-none ${
                                theme === 'rajasthan' ? 'text-rose-900 decoration-orange-100 group-hover:decoration-rose-500' : 'text-slate-800 decoration-slate-200 group-hover:decoration-primary'
                              }`}>{sub.name}</h3>
                            <p className="text-sm text-slate-500 mt-2 italic pointer-events-none">{sub.desc}</p>
                          </motion.button>
                        ))}
                      </div>
                    </motion.div>
                  )}

                  {screen === 'SETUP' && (
                    <motion.div
                      key="setup-form"
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="max-w-2xl mx-auto w-full"
                    >
                      <button 
                        onClick={() => setScreen('HOME')}
                        className="flex items-center text-[11px] font-bold text-slate-400 uppercase tracking-widest hover:text-primary transition-colors mb-8"
                      >
                        <ChevronLeft size={16} /> Back to Library
                      </button>
                      
                      <div className={`p-6 md:p-10 ${
                        theme === 'rajasthan' ? 'bg-white rounded-[2rem] border-2 border-amber-500 shadow-2xl' : 'bg-white border border-slate-200'
                      }`}>
                        <div className="mb-8 md:mb-10 flex flex-col md:flex-row border-b border-slate-100 pb-8">
                           <div className={`w-12 h-12 md:w-14 md:h-14 ${
                             theme === 'rajasthan' ? 'bg-rose-800' : (subjects.find(s => s.name === config.subject)?.color.includes('blue') ? 'bg-primary' : subjects.find(s => s.name === config.subject)?.color)
                           } text-white flex items-center justify-center rounded-sm mx-auto md:ml-0 md:mr-6 mb-4 md:mb-0`}>
                             {(() => {
                               const SIcon = subjects.find(s => s.name === config.subject)?.icon || History;
                               return <SIcon size={28} />;
                             })()}
                           </div>
                           <div className="text-center md:text-left">
                             <h2 className="text-2xl md:text-3xl font-display text-main">{config.subject}</h2>
                             <p className="text-xs md:text-sm text-slate-500 italic">Configuration & AI Tuning</p>
                           </div>
                        </div>

                        {config.subject === 'Balanced Mock Test' && (
                          <div className="p-4 md:p-6 bg-slate-50 border border-slate-100 rounded-2xl mb-8">
                            <label className="block text-[10px] md:text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-3">
                              Subjects to Include in Mock Quiz (Mixed Evenly)
                            </label>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-2">
                              {[
                                'Rajasthan Current Affairs',
                                'National Current Affairs',
                                'Rajasthan GK',
                                'Indian GK',
                                'Mathematics',
                                'Science',
                                'Reasoning',
                                'Hindi',
                                'English'
                              ].map((sub) => {
                                const isSelected = config.selectedSubjects?.includes(sub as Subject);
                                return (
                                  <button
                                    key={sub}
                                    onClick={() => {
                                      feedback('click');
                                      const current = config.selectedSubjects || [];
                                      const next = current.includes(sub as Subject)
                                        ? current.filter(s => s !== sub)
                                         : [...current, sub as Subject];
                                      setConfig({ ...config, selectedSubjects: next });
                                    }}
                                    className={`flex items-center gap-3 p-3 border rounded-xl text-left transition-all ${
                                      isSelected
                                        ? 'bg-indigo-50 border-indigo-200 text-indigo-950 font-semibold'
                                        : 'bg-white border-slate-200 text-slate-500 hover:border-slate-300'
                                    }`}
                                  >
                                    <div className={`w-4 h-4 rounded border flex items-center justify-center transition-all ${
                                      isSelected ? 'bg-indigo-600 border-indigo-600 text-white' : 'border-slate-300 text-transparent'
                                     }`}>
                                       <CheckCircle2 size={10} className="stroke-[3]" />
                                    </div>
                                    <span className="text-xs">{sub}</span>
                                  </button>
                                );
                              })}
                            </div>
                            {(!config.selectedSubjects || config.selectedSubjects.length === 0) && (
                              <p className="text-[10px] text-red-500 font-bold mt-2 uppercase">⚠️ Please select at least one subject!</p>
                            )}
                          </div>
                        )}

                    <div className="grid gap-6 md:gap-8">
                          <div className="group">
                             <label className="block text-[10px] md:text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-3">Exam Pattern Style</label>
                             <div className="grid grid-cols-2 gap-2">
                               {(['2012-2020', '2021-Present'] as ExamPattern[]).map(p => (
                                 <button
                                   key={p}
                                   onClick={() => setConfig({ ...config, pattern: p })}
                                   className={`py-2.5 md:py-3 border text-[10px] md:text-xs font-bold transition-all ${
                                     config.pattern === p 
                                       ? 'border-primary bg-primary text-white shadow-md' 
                                       : 'border-slate-200 text-slate-500 hover:border-primary/20'
                                   }`}
                                 >
                                   {p}
                                 </button>
                               ))}
                             </div>
                          </div>

                          <div className="group">
                             <label className="block text-[10px] md:text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-3">Quiz Language</label>
                             <div className="grid grid-cols-3 gap-2">
                               {(['English', 'Hindi', 'Hinglish'] as Language[]).map(lang => (
                                 <button
                                   key={lang}
                                   onClick={() => setConfig({ ...config, language: lang })}
                                   className={`py-2.5 md:py-3 border text-[10px] md:text-xs font-bold transition-all ${
                                     config.language === lang 
                                       ? 'border-primary bg-primary text-white shadow-md' 
                                       : 'border-slate-200 text-slate-500 hover:border-primary/20'
                                   }`}
                                 >
                                   {lang.toUpperCase()}
                                 </button>
                               ))}
                             </div>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-8">
                            <div>
                               <label className="block text-[10px] md:text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-3">Difficulty Level</label>
                               <select 
                                 value={config.difficulty}
                                 onChange={(e) => setConfig({ ...config, difficulty: e.target.value as Difficulty })}
                                 className="w-full bg-slate-50 border border-slate-200 p-3 md:p-4 text-xs md:text-sm font-medium focus:border-primary outline-none appearance-none"
                               >
                                 <option value="Easy">EASY</option>
                                 <option value="Medium">MEDIUM</option>
                                 <option value="Hard">HARD</option>
                               </select>
                            </div>
                            <div>
                               <label className="block text-[10px] md:text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-3">Question Count</label>
                               <select 
                                 value={config.questionCount}
                                 onChange={(e) => setConfig({ ...config, questionCount: parseInt(e.target.value) })}
                                 className="w-full bg-slate-50 border border-slate-200 p-3 md:p-4 text-xs md:text-sm font-medium focus:border-primary outline-none appearance-none"
                               >
                                 <option value={5}>05 QUESTIONS</option>
                                 <option value={10}>10 QUESTIONS</option>
                                 <option value={15}>15 QUESTIONS</option>
                               </select>
                            </div>
                          </div>

                          <div>
                             <label className="block text-[10px] md:text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-3">Syllabus Focus (Optional)</label>
                             <input 
                               type="text"
                               placeholder="e.g. Geography of Aravalli..."
                               value={config.topic}
                               onChange={(e) => setConfig({ ...config, topic: e.target.value })}
                               className="w-full bg-slate-800/5 border border-slate-200 p-3 md:p-4 text-xs md:text-sm font-medium focus:border-primary outline-none text-main"
                             />
                          </div>

                          <button
                            disabled={config.subject === 'Balanced Mock Test' && (!config.selectedSubjects || config.selectedSubjects.length === 0)}
                            onClick={handleStartQuiz}
                            className="w-full bg-slate-900 text-white font-bold tracking-widest uppercase py-4 md:py-5 mt-4 hover:bg-primary disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-slate-900 transition-all shadow-xl shadow-slate-200 flex items-center justify-center gap-2 text-xs md:text-sm"
                          >
                            Generate Quiz <ChevronRight size={18} />
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  )}

                  {screen === 'RULES' && (
                    <motion.div
                      key="rules"
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="max-w-xl mx-auto w-full"
                    >
                      <div className={`p-8 md:p-12 ${
                        theme === 'rajasthan' ? 'bg-white rounded-[2rem] border-2 border-amber-500 shadow-2xl shadow-amber-900/10' : 'bg-white border border-slate-200'
                      }`}>
                        <div className="flex items-center gap-4 mb-8">
                           <div className="w-12 h-12 bg-primary/10 text-primary rounded-full flex items-center justify-center">
                              <Info size={24} />
                           </div>
                           <div>
                              <h2 className="text-2xl font-display font-bold text-main italic">Pre-Exam <span className="text-primary">Protocols</span></h2>
                              <p className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">RPSC AI Compliance v2.4</p>
                           </div>
                        </div>

                        <div className="space-y-6 mb-10">
                           {[
                             { icon: Timer, text: "The session is strictly timed. Auto-submit on expiry." },
                             { icon: Star, text: "Focus entirely on the screen. Do not switch tabs." },
                             { icon: BookOpen, text: "Instant AI feedback is available after selecting answers." },
                             { icon: ShieldCheck, text: "Questions are generated based on RPSC official syllabus." }
                           ].map((rule, i) => (
                             <div key={i} className="flex gap-4 p-4 bg-slate-50 border border-slate-100 rounded-2xl group hover:bg-white hover:shadow-md transition-all">
                                <rule.icon size={20} className="text-slate-400 shrink-0 group-hover:text-primary transition-colors" />
                                <p className="text-sm text-slate-600 font-medium leading-relaxed">{rule.text}</p>
                             </div>
                           ))}
                        </div>

                        <label className="flex items-center gap-3 p-4 bg-primary/5 border border-primary/20 rounded-2xl cursor-pointer hover:bg-primary/10 transition-colors mb-8">
                           <input 
                             type="checkbox" 
                             className="w-5 h-5 rounded border-primary text-primary focus:ring-primary shadow-sm"
                             onChange={(e) => setRulesAccepted(e.target.checked)}
                           />
                           <span className="text-xs font-bold text-slate-700">I have read and understood the examination protocols.</span>
                        </label>

                        <div className="grid grid-cols-2 gap-4">
                           <button 
                             onClick={() => setScreen('SETUP')}
                             className="py-4 border border-slate-200 rounded-xl font-bold uppercase text-[10px] tracking-widest text-slate-500 hover:bg-slate-50 transition-all active:scale-95"
                           >
                              Back
                           </button>
                           <button 
                             disabled={!rulesAccepted}
                             onClick={confirmStartQuiz}
                             className="py-4 bg-primary text-white rounded-xl font-bold uppercase text-[10px] tracking-widest disabled:opacity-50 disabled:grayscale transition-all shadow-lg shadow-primary/20 hover:brightness-110 flex items-center justify-center gap-2 active:scale-95"
                           >
                              Proceed to Exam <ChevronRight size={14} />
                           </button>
                        </div>
                      </div>
                    </motion.div>
                  )}

                  {screen === 'QUIZ' && (
                    <motion.div
                      key="quiz-center"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="max-w-3xl mx-auto w-full flex flex-col justify-between min-h-full pb-24"
                    >
                      {loading ? (
                        <div className="flex flex-col items-center py-20 text-center">
                          <Loader2 size={48} className="text-primary animate-spin mb-6" />
                          <h3 className="text-2xl font-display text-main italic">Assembling MCQs...</h3>
                          <p className="text-slate-500 text-sm mt-2 uppercase tracking-widest font-bold">Matching Exam Patterns</p>
                        </div>
                      ) : isPaused ? (
                        /* SECURE MODE PAUSED OVERLAY */
                        <motion.div 
                          initial={{ opacity: 0, scale: 0.98 }}
                          animate={{ opacity: 1, scale: 1 }}
                          className="flex flex-col items-center justify-center text-center py-24 px-6 bg-slate-900/10 backdrop-blur-md rounded-3xl border border-slate-200 shadow-2xl my-auto"
                        >
                          <ShieldAlert size={64} className="text-amber-500 mb-6 animate-bounce" />
                          <h3 className="text-2xl font-bold text-slate-800 uppercase tracking-tight font-display">EXAMINATION PAUSED</h3>
                          <p className="text-slate-500 text-sm mt-3 max-w-md leading-relaxed">
                            Secure Mode Active: All question data and core option coordinates are locked and concealed to prevent clock tampering.
                          </p>
                          <button
                            onClick={() => {
                              feedback('success');
                              setIsPaused(false);
                            }}
                            className="mt-8 px-8 py-3.5 bg-primary text-white font-bold rounded-xl uppercase text-xs tracking-widest hover:brightness-110 active:scale-95 transition-all shadow-lg"
                          >
                            Resume Examination
                          </button>
                        </motion.div>
                      ) : (
                        <>
                          {/* ⏱️ TIMED EXAMINATION HEADER */}
                          <div className={`p-4 md:p-5 mb-6 border ${
                            theme === 'rajasthan' 
                              ? 'bg-amber-50/50 border-amber-300/40 rounded-3xl shadow-sm' 
                              : 'bg-white/80 backdrop-blur-md border-slate-200/60 rounded-2xl shadow-sm'
                          }`}>
                            <div className="flex items-center justify-between">
                              {/* Left: Set detail and countdown timer */}
                              <div className="flex items-center gap-3">
                                <span className={`px-3 py-1 font-mono text-[11px] font-extrabold tracking-widest ${
                                  theme === 'rajasthan' ? 'bg-amber-600 text-white' : 'bg-slate-900 text-teal-400'
                                } rounded`}>
                                  SET - 01
                                </span>
                                <div className="h-4 w-px bg-slate-300"></div>
                                <div className="flex items-center gap-1.5">
                                  <span className="text-sm md:text-base font-mono font-bold text-slate-700 animate-pulse tracking-wide whitespace-nowrap">
                                    Time Left: {Math.floor(Math.max(0, 1200 - quizTimer) / 60)}:{(Math.max(0, 1200 - quizTimer) % 60).toString().padStart(2, '0')}
                                  </span>
                                </div>
                              </div>
                              
                              {/* Right: Functional Pause button */}
                              <button
                                onClick={() => {
                                  feedback('click');
                                  setIsPaused(true);
                                }}
                                title="Pause Exam"
                                className="w-10 h-10 rounded-full flex items-center justify-center bg-slate-100 hover:bg-slate-200 text-slate-700 transition-all cursor-pointer active:scale-90 shadow-sm border border-slate-200/50"
                              >
                                <Pause size={16} />
                              </button>
                            </div>

                            {/* Question Type and Marking Scheme Sub-header */}
                            <div className="flex flex-wrap items-center justify-between border-t border-slate-200/50 mt-4 pt-3 text-xs text-slate-500 font-semibold md:flex">
                              <span className="uppercase tracking-widest text-[9px] text-slate-400">
                                Question Type: Single Choice Mcq
                              </span>
                              
                              <div className="flex items-center gap-2">
                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-green-50 text-green-600 border border-green-200/30 rounded font-bold text-[10px]">
                                  Correct: +1.00
                                </span>
                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-red-50 text-red-600 border border-red-200/30 rounded font-bold text-[10px]">
                                  Incorrect: -0.25
                                </span>
                              </div>
                            </div>
                          </div>
                          {/* 📖 QUESTION CONTAINER LAYOUT */}
                          <div className={`p-6 md:p-8 border mb-6 ${
                            theme === 'rajasthan' 
                              ? 'bg-white rounded-3xl border-amber-500/40 shadow-sm' 
                              : 'bg-white border-slate-200/60 rounded-2xl shadow-sm'
                          }`}>
                            <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-6">
                              {/* Left index */}
                              <span className="text-[11px] font-bold uppercase tracking-widest text-slate-400">
                                Question No.: <span className="text-slate-800 font-mono text-xs font-semibold">{currentIndex + 1}</span> of {questions.length}
                              </span>

                              {/* Right: SAVE bookmark button */}
                              <button
                                onClick={async () => {
                                  feedback('royal');
                                  const isCurrentlyBookmarked = bookmarks[currentIndex];
                                  setBookmarks(prev => ({ ...prev, [currentIndex]: !isCurrentlyBookmarked }));
                                  
                                  if (user && (user as any).uid) {
                                    const q = questions[currentIndex];
                                    const qId = q.id || `q-${currentIndex}`;
                                    try {
                                      if (!isCurrentlyBookmarked) {
                                        await firebaseService.addBookmark((user as any).uid, qId, q);
                                      } else {
                                        await firebaseService.removeBookmark((user as any).uid, qId);
                                      }
                                    } catch (err) {
                                      console.error("Failed to update bookmark in Firestore", err);
                                    }
                                  }
                                }}
                                className={`flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest rounded-lg border transition-all ${
                                  bookmarks[currentIndex]
                                    ? 'bg-amber-50 border-amber-400 text-amber-700 shadow-sm'
                                    : 'bg-slate-50 border-slate-200 text-slate-500 hover:bg-slate-100'
                                }`}
                              >
                                <Bookmark size={12} className={bookmarks[currentIndex] ? 'fill-amber-500 text-amber-500' : ''} />
                                <span>{bookmarks[currentIndex] ? 'Saved' : 'Save'}</span>
                              </button>
                            </div>

                            {/* Question Title & Rendering details */}
                            <div className="relative">
                              <span className="absolute left-0 top-0.5 px-2 py-0.5 bg-primary/10 text-primary text-[9px] font-extrabold rounded-sm uppercase tracking-widest">
                                {isReviewMode ? 'Notebook Review' : `${config.subject}`}
                              </span>
                              
                              <AnimatePresence>
                                {consecutiveCorrect >= 3 && (
                                  <motion.span 
                                    initial={{ opacity: 0, x: -10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0 }}
                                    className="absolute right-0 top-0.5 text-[9px] font-extrabold text-accent uppercase tracking-widest flex items-center gap-1 inline-flex"
                                  >
                                    <Zap size={9} /> Leveling Up
                                  </motion.span>
                                )}
                              </AnimatePresence>
                              
                              {/* Question display */}
                              <h2 className="text-xl md:text-2xl font-medium mt-8 md:mt-10 leading-relaxed text-slate-800 tracking-normal border-l-4 border-slate-205 pl-4">
                                {questions[currentIndex]?.question}
                              </h2>
                            </div>

                            {/* 📐 SPARTAN SPACIOUS LAYOUT SEPARATOR MARGIN */}
                            {/* Insert significant padding (32px to 48px) between question text and first option */}
                            <div className="h-10 md:h-12"></div>

                            {/* 🪟 DISTINCT VERTICAL OPTIONS GRID */}
                            <div className="space-y-4">
                  {questions[currentIndex] && Object.entries(questions[currentIndex].options).map(([key, value]) => {
                    const isCorrect = key === questions[currentIndex].correctAnswer;
                    const isSelected = key === userAnswers[currentIndex];
                    
                    let btnClass = "border-slate-200/85 bg-white hover:border-primary shadow-sm hover:bg-slate-50/45";
                    let keyBadgeClass = "bg-slate-100 text-slate-700 border-slate-200 group-hover:bg-primary group-hover:text-white group-hover:border-primary";

                    if (isAnswered) {
                      if (isCorrect) {
                        btnClass = "border-primary bg-primary/5 shadow-lg pointer-events-none ring-2 ring-primary/20";
                        keyBadgeClass = "bg-primary text-white border-primary scale-105";
                      } else if (isSelected) {
                        btnClass = "border-red-400 bg-red-100/30 pointer-events-none";
                        keyBadgeClass = "bg-red-500 text-white border-red-500";
                      } else {
                        btnClass = "opacity-40 grayscale pointer-events-none border-slate-105 bg-white shadow-none";
                        keyBadgeClass = "bg-slate-100 text-slate-400 border-slate-200";
                      }
                    }

                    return (
                      <motion.button
                        key={key}
                        whileHover={!isAnswered ? { x: 4 } : {}}
                        whileTap={!isAnswered ? { scale: 0.99 } : {}}
                        onClick={() => handleSelectAnswer(key)}
                        className={`w-full flex items-center gap-4 p-4 md:p-5 border transition-all text-left group relative min-h-[64px] ${
                          theme === 'rajasthan' ? 'rounded-2xl' : 'rounded-xl'
                        } ${btnClass}`}
                      >
                        <span className={`w-8 h-8 shrink-0 rounded-lg border flex items-center justify-center font-mono font-extrabold text-sm tracking-widest transition-all ${keyBadgeClass}`}>
                          {key}
                        </span>
                        <span className={`text-base flex-1 leading-relaxed text-slate-700 ${isSelected && !isAnswered ? 'font-semibold text-slate-800' : 'font-medium'}`}>
                          {value}
                        </span>
                        
                        {isAnswered && isCorrect && (
                          <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="absolute right-4 shrink-0">
                            <CheckCircle2 className="text-primary" size={20} />
                          </motion.div>
                        )}
                        {isAnswered && isSelected && !isCorrect && (
                          <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="absolute right-4 shrink-0">
                            <XCircle className="text-red-500" size={20} />
                          </motion.div>
                        )}
                      </motion.button>
                    );
                  })}
                </div>
              </div>

                {/* ⚙️ DESKTOP PREVIEW INFORMATION ROW */}
                <div className="hidden md:flex items-center justify-between text-[11px] text-slate-400 uppercase font-semibold px-2 mb-6">
                  <span>Diagnostic Engine Matches RPSC Standards</span>
                  <span>Secure Cloud Logging Enabled</span>
                </div>

                {/* 📲 RESPONSIVE BOTTOM STICKY NAVIGATION BAR */}
                {/* Persistent bottom touchscreen safe sticky element bar, fully accessible with >48px targets */}
                <div className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200/80 shadow-[0_-12px_40px_rgba(0,0,0,0.06)] py-4 px-4 md:px-8">
                  <div className="max-w-3xl mx-auto flex items-center justify-between gap-4">
                    
                    {/* Left Action Button: Mark for Review & Next */}
                    <button 
                      onClick={() => {
                        feedback('click');
                        setMarkedForReview(prev => ({ ...prev, [currentIndex]: !prev[currentIndex] }));
                        nextQuestion();
                      }}
                      className={`flex-1 h-[48px] px-4 rounded-xl font-bold uppercase text-[11px] tracking-wider border transition-all active:scale-95 text-center flex items-center justify-center ${
                        markedForReview[currentIndex]
                          ? 'bg-amber-100/60 border-amber-300 text-amber-800'
                          : 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-600'
                      }`}
                    >
                      {markedForReview[currentIndex] ? '★ Marked for Review' : 'Mark for Review & Next'}
                    </button>

                    {/* Right Action Button: Save & Next (Cyan Accent) */}
                    <button 
                      onClick={() => {
                        feedback('click');
                        nextQuestion();
                      }}
                      className="flex-1 h-[48px] px-6 text-white font-extrabold rounded-xl shadow-md uppercase text-[11px] tracking-wider flex items-center justify-center gap-1.5 transition-all active:scale-95"
                      style={{ backgroundColor: '#00c5bc' }}
                    >
                      <span>{currentIndex === questions.length - 1 ? 'Finish Exam' : 'Save & Next'}</span>
                      <ChevronRight size={16} />
                    </button>
                  </div>
                </div>

                          {isAnswered && questions[currentIndex] && (
                            <motion.div
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              className="mt-8 space-y-4"
                            >
                              {/* Guruji's Insight Section */}
                              <div className="bg-amber-50 border-l-4 border-amber-500 p-6 shadow-sm rounded-r-2xl">
                                <div className="text-[10px] text-amber-600 font-bold uppercase tracking-widest mb-2 flex items-center gap-2">
                                  <BrainCircuit size={14} /> Guruji's Smart Tip (Guru-Mantra)
                                </div>
                                <p className="text-sm md:text-base text-slate-800 leading-relaxed font-bold italic mb-3">
                                  {questions[currentIndex].teacherInsight}
                                </p>
                                {questions[currentIndex].patternYear && (
                                  <span className="inline-block px-2 py-1 bg-amber-200/50 text-amber-800 text-[9px] font-bold rounded uppercase tracking-tighter">
                                    Pattern Context: {questions[currentIndex].patternYear} RPSC Style
                                  </span>
                                )}
                              </div>

                              {/* Why Other Options are Wrong */}
                              {questions[currentIndex].wrongOptionsAnalysis && (
                                <div className="bg-white border border-slate-200 p-6 rounded-2xl shadow-sm">
                                  <div className="text-[10px] text-red-600 font-bold uppercase tracking-widest mb-4 flex items-center gap-2">
                                    <RotateCcw size={14} /> विकल्प विश्लेषण (Option Analysis)
                                  </div>
                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {(['A', 'B', 'C', 'D'] as const).map(key => (
                                      <div key={key} className={`p-3 rounded-xl border flex items-start gap-3 ${key === questions[currentIndex].correctAnswer ? 'bg-green-50 border-green-100' : 'bg-slate-50 border-slate-100'}`}>
                                        <span className={`shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold ${key === questions[currentIndex].correctAnswer ? 'bg-green-500 text-white' : 'bg-slate-200 text-slate-500'}`}>
                                          {key}
                                        </span>
                                        <span className="text-xs text-slate-600 italic">
                                          {(questions[currentIndex].wrongOptionsAnalysis as any)[key]}
                                        </span>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}

                              {/* Standard Tech Explanation */}
                              <div className="bg-white border border-slate-200 p-6 rounded-2xl shadow-sm">
                                <div className="text-[10px] text-primary font-bold uppercase tracking-widest mb-2 flex items-center gap-1">
                                  <Info size={12} /> Standard Facts
                                </div>
                                <p className="text-sm text-slate-600 leading-relaxed">
                                  {questions[currentIndex].explanation}
                                </p>
                              </div>

                              {/* Extra Facts */}
                              {questions[currentIndex].extraFacts && (questions[currentIndex].extraFacts || []).length > 0 && (
                                <div className="bg-indigo-50 border border-indigo-100 p-6 rounded-2xl shadow-sm">
                                  <div className="text-[10px] text-indigo-600 font-bold uppercase tracking-widest mb-3 flex items-center gap-2">
                                    <BookOpen size={14} /> अतिरिक्त परीक्षा तथ्य (Extra Facts)
                                  </div>
                                  <ul className="space-y-2">
                                    {(questions[currentIndex].extraFacts || []).map((fact, i) => (
                                      <li key={i} className="text-xs md:text-sm text-slate-700 flex items-start gap-3">
                                        <CheckCircle2 size={12} className="text-indigo-400 mt-1 shrink-0" />
                                        <span>{fact}</span>
                                      </li>
                                    ))}
                                  </ul>
                                </div>
                              )}

                              {/* Youtube Video Player */}
                              {questions[currentIndex].videoUrl && (
                                <div className="space-y-4">
                                  <div className="text-[10px] text-red-600 font-bold uppercase tracking-widest flex items-center gap-2">
                                    <Zap size={14} className="fill-red-500 animate-pulse" /> Concept Deep-Dive (Hindi)
                                  </div>
                                  <div className="relative aspect-video w-full overflow-hidden rounded-3xl shadow-xl bg-slate-900 border-4 border-white">
                                    <iframe 
                                      className="absolute inset-0 w-full h-full"
                                      src={`https://www.youtube.com/embed/${
                                        questions[currentIndex].videoUrl.includes('v=') 
                                          ? questions[currentIndex].videoUrl.split('v=')[1]?.split('&')[0] 
                                          : questions[currentIndex].videoUrl.includes('youtu.be/')
                                            ? questions[currentIndex].videoUrl.split('youtu.be/')[1]?.split('?')[0]
                                            : questions[currentIndex].videoUrl
                                      }?hl=hi&cc_lang_pref=hi&cc_load_policy=1&modestbranding=1&rel=0`}
                                      title="YouTube video player"
                                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                                      allowFullScreen
                                    ></iframe>
                                  </div>
                                  <div className="flex items-center justify-between px-2">
                                    <p className="text-[10px] text-slate-400 font-medium italic">
                                      * Video content curated for RPSC/Current Affairs preparation.
                                    </p>
                                    <a 
                                      href={`https://www.youtube.com/watch?v=${
                                        questions[currentIndex].videoUrl.includes('v=') 
                                          ? questions[currentIndex].videoUrl.split('v=')[1]?.split('&')[0] 
                                          : questions[currentIndex].videoUrl
                                      }`}
                                      target="_blank"
                                      rel="noreferrer"
                                      className="text-[10px] font-bold text-primary hover:underline uppercase tracking-tighter"
                                    >
                                      Open in App
                                    </a>
                                  </div>
                                </div>
                              )}
                            </motion.div>
                          )}
                        </>
                      )}
                    </motion.div>
                  )}

                  {screen === 'RESULTS' && (
                    <motion.div
                      key="results"
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="max-w-4xl mx-auto w-full"
                    >
                      <div className="text-center mb-10">
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          className="w-24 h-24 bg-primary text-white rounded-full flex items-center justify-center mx-auto mb-6 shadow-2xl shadow-primary/30"
                        >
                          <Trophy size={48} />
                        </motion.div>
                        <h2 className="text-4xl font-display font-bold italic text-main tracking-tight">Session <span className="text-primary">Completed!</span></h2>
                        <p className="text-slate-500 mt-2 uppercase tracking-[0.3em] text-[10px] font-bold">Deep Performance Analysis Ready</p>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-10">
                        <div className={`p-6 shadow-sm border ${
                          theme === 'rajasthan' ? 'bg-white rounded-3xl border-amber-500' : 'bg-white border-slate-200'
                        }`}>
                          <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-4">Accuracy dashboard</h4>
                          <div className="flex items-center gap-4">
                            <div className="text-3xl font-bold font-mono text-slate-900">{getScore()}/{questions.length}</div>
                            <div className="h-10 w-px bg-slate-100 mx-2"></div>
                            <div className="flex-1">
                               <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                                 <motion.div 
                                   initial={{ width: 0 }}
                                   animate={{ width: `${(getScore() / questions.length) * 100}%` }}
                                   className="h-full bg-primary"
                                 />
                               </div>
                               <p className="text-[10px] text-slate-400 mt-2 font-bold uppercase">{Math.round((getScore() / questions.length) * 100)}% Match rate</p>
                            </div>
                          </div>
                        </div>

                        <div className={`p-6 shadow-sm border ${
                          theme === 'rajasthan' ? 'bg-white rounded-3xl border-teal-600' : 'bg-white border-slate-200'
                        }`}>
                          <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-4">Detailed Performance</h4>
                          <div className="grid grid-cols-3 gap-2">
                             <div className="text-center">
                                <p className="text-lg font-bold text-green-600">{getScore()}</p>
                                <p className="text-[8px] uppercase font-bold text-slate-400">Correct</p>
                             </div>
                             <div className="text-center">
                                <p className="text-lg font-bold text-red-500">{getIncorrectCount()}</p>
                                <p className="text-[8px] uppercase font-bold text-slate-400">Wrong</p>
                             </div>
                             <div className="text-center">
                                <p className="text-lg font-bold text-slate-400">{getSkippedCount()}</p>
                                <p className="text-[8px] uppercase font-bold text-slate-400">Skipped</p>
                             </div>
                          </div>
                        </div>

                        <div className={`p-6 shadow-sm border ${
                          theme === 'rajasthan' ? 'bg-white rounded-3xl border-teal-600' : 'bg-white border-slate-200'
                        }`}>
                          <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-4">Vitals & Pace</h4>
                          <div className="flex items-center gap-4">
                             <Timer className="text-slate-300" size={24} />
                             <div>
                                <span className="text-2xl font-mono font-bold text-main">{formatTime(quizTimer)}</span>
                                <p className="text-[9px] text-slate-400 uppercase font-bold tracking-tighter">Total Duration</p>
                             </div>
                          </div>
                        </div>

                        <div className={`p-6 shadow-sm border md:col-span-2 lg:col-span-1 ${
                          theme === 'rajasthan' ? 'bg-white rounded-3xl border-orange-500' : 'bg-white border-slate-200'
                        }`}>
                          <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-4">Study Insight</h4>
                          <div className="flex items-start gap-3">
                            <Zap size={16} className="text-accent shrink-0" />
                            <p className="text-xs text-slate-500 italic leading-relaxed">
                              Focus on <span className="text-main font-bold">"{config.subject}"</span>. Your response time was optimal, but consistency peaked in the first half.
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        {/* Summary Card */}
                        <div className={`p-6 md:p-10 text-white relative overflow-hidden flex flex-col justify-between min-h-[280px] md:h-80 shadow-2xl ${
                          theme === 'rajasthan' ? 'bg-gradient-to-br from-rose-800 to-rose-950 rounded-[2rem]' : 'bg-brand-bg rounded-2xl'
                        }`}>
                           <div className="relative z-10">
                             <h4 className="text-[10px] font-bold opacity-60 uppercase tracking-[0.3em] mb-2">Examination Score</h4>
                             <p className="text-5xl md:text-7xl font-mono font-bold italic tracking-tighter">{getScore()} <span className="text-xl md:text-2xl opacity-40 font-serif not-italic">/ {questions.length}</span></p>
                           </div>
                           
                           <div className="relative z-10">
                              <div className="flex -space-x-2 mb-4">
                                {[1, 2, 3, 4].map(i => (
                                  <div key={i} className="w-8 h-8 rounded-full border-2 border-brand-bg bg-primary flex items-center justify-center text-[10px] font-bold">#{i}</div>
                                ))}
                                <div className="w-8 h-8 rounded-full border-2 border-brand-bg bg-slate-800 flex items-center justify-center text-[10px] font-bold hidden xs:flex">+RPSC</div>
                              </div>
                              <p className="text-xs md:text-sm font-light leading-relaxed text-slate-300 italic">You outperformed <span className="text-white font-bold">82% of peers</span> in the {config.difficulty} module.</p>
                           </div>

                           <div className="absolute -bottom-20 -right-20 w-64 h-64 bg-primary/20 rounded-full blur-[80px]"></div>
                        </div>

                        {/* Analysis Card */}
                        <div className={`p-8 flex flex-col shadow-sm border ${
                          theme === 'rajasthan' ? 'bg-white rounded-[2rem] border-amber-500' : 'bg-white border-slate-200 rounded-2xl'
                        }`}>
                           <h3 className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-6 border-b border-slate-50 pb-2 flex items-center gap-2">
                             <Activity size={14} /> Subject Vitals
                           </h3>
                           <div className="space-y-6 flex-1">
                             <div className="flex items-center justify-between group">
                                <div className="flex items-center gap-3">
                                   <div className="w-1.5 h-1.5 rounded-full bg-accent group-hover:scale-150 transition-transform"></div>
                                   <span className="text-sm font-bold text-slate-700">MCQ Accuracy</span>
                                </div>
                                <span className="text-sm font-mono font-bold text-main">{Math.round((getScore() / questions.length) * 100)}%</span>
                             </div>
                             <div className="flex items-center justify-between group">
                                <div className="flex items-center gap-3">
                                   <div className="w-1.5 h-1.5 rounded-full bg-primary group-hover:scale-150 transition-transform"></div>
                                   <span className="text-sm font-bold text-slate-700">Processing Pace</span>
                                </div>
                                <span className="text-sm font-mono font-bold text-main">{Math.round(quizTimer / questions.length)}s per item</span>
                             </div>
                             <div className="flex items-center justify-between group">
                                <div className="flex items-center gap-3">
                                   <div className="w-1.5 h-1.5 rounded-full bg-slate-300 group-hover:scale-150 transition-transform"></div>
                                   <span className="text-sm font-bold text-slate-700">System Difficulty</span>
                                </div>
                                <span className="text-sm font-mono font-bold text-main italic px-2 bg-slate-100 rounded text-[10px] uppercase tracking-tighter">{config.difficulty}</span>
                             </div>
                           </div>

                           <div className="mt-8 grid grid-cols-2 gap-4">
                              <button 
                                onClick={handleStartQuiz}
                                className="touch-target bg-primary text-white font-bold text-[10px] uppercase tracking-widest py-4 rounded-xl hover:brightness-110 transition-all flex items-center justify-center gap-2 shadow-lg shadow-primary/20"
                              >
                                <RotateCcw size={14} /> Re-Generate
                              </button>
                              <button 
                                onClick={() => setScreen('HOME')}
                                className="touch-target bg-slate-900 text-white font-bold text-[10px] uppercase tracking-widest py-4 rounded-xl hover:bg-slate-800 transition-all flex items-center justify-center gap-2 shadow-lg"
                              >
                                Exit Session <ChevronRight size={14} />
                              </button>
                           </div>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </section>

              {/* Sidebar Right: Info Panel (Only in Quiz) */}
              {screen === 'QUIZ' && !loading && (
                <aside className="hidden xl:flex w-80 bg-white border-l border-slate-200 p-8 flex flex-col gap-8 shrink-0">
                  <div className="p-6 bg-brand-bg text-white rounded overflow-hidden relative group">
                     <div className="relative z-10">
                       <h4 className="text-[10px] font-bold opacity-60 uppercase tracking-widest mb-1">Session Score</h4>
                       <p className="text-4xl font-mono font-bold italic">{getScore()} <span className="text-lg opacity-40 font-serif not-italic">pts</span></p>
                       <div className="mt-4 h-1.5 w-full bg-white/10 rounded-full overflow-hidden">
                         <div className="h-full bg-primary transition-all duration-700" style={{ width: `${(getScore() / questions.length) * 100}%` }}></div>
                       </div>
                     </div>
                     <div className="absolute -right-4 -bottom-4 w-20 h-20 bg-primary rounded-full opacity-30 group-hover:scale-125 transition-transform duration-700"></div>
                   </div>

                   <div>
                     <h3 className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-4">Topic Metrics</h3>
                     <div className="space-y-4">
                        <div className="space-y-1.5">
                           <div className="flex items-center justify-between text-xs">
                             <span className="text-slate-500 font-medium">{config.subject} Concepts</span>
                             <span className="font-bold text-slate-900">{Math.round((currentIndex / questions.length) * 100)}% Coverage</span>
                           </div>
                           <div className="h-1 w-full bg-slate-100 rounded-full overflow-hidden">
                              <div className="h-full bg-primary" style={{ width: `${(currentIndex / questions.length) * 100}%` }}></div>
                           </div>
                        </div>
                     </div>
                   </div>

                   <div className="mt-auto">
                     <div className="p-5 border border-primary/10 bg-primary/5 rounded italic relative overflow-hidden">
                        <div className="w-1 h-full bg-primary absolute left-0 top-0"></div>
                        <p className="text-[9px] text-primary font-bold uppercase mb-2 flex items-center gap-1"><Zap size={10} /> AI Recommendation</p>
                        <p className="text-xs text-primary/80 leading-snug font-medium">
                          "Maintain your pace. High accuracy in early questions suggests you can transition to more complex topics."
                        </p>
                     </div>
                   </div>
                </aside>
              )}
            </main>

            {/* Footer Bar */}
            <footer className="h-10 bg-brand-bg text-slate-500 text-[10px] uppercase tracking-[0.2em] flex items-center justify-between px-4 md:px-8 shrink-0">
              <span className="flex items-center gap-2">AI Engine <span className="hidden xs:inline">v2.4</span> <span className="opacity-30">|</span> <span className="text-primary italic font-bold">RPSC Optimized</span></span>
              <div className="flex gap-6 items-center">
                <span className="hidden md:inline">ClickCraft v1.0 <span className="opacity-30">|</span> Session ID: AIQ-2024-{quizTimer}</span>
                <span className="flex items-center gap-1.5 text-primary"><div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse"></div> <ShieldCheck size={12} /> <span className="hidden xs:inline">Secure Portal</span></span>
              </div>
            </footer>

            <AnimatePresence>
              {isMapOpen && (
                <RiverMap onClose={() => setIsMapOpen(false)} feedback={feedback} />
              )}
            </AnimatePresence>
          </motion.div>
        )}

      </AnimatePresence>
    </div>
  );
}

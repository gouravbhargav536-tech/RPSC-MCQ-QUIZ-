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
import HomeDashboard from './components/HomeDashboard';
import SetupPanel from './components/SetupPanel';
import RulesPanel from './components/RulesPanel';
import ResultsPanel from './components/ResultsPanel';
import { useFeedback } from './hooks/useFeedback';

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

  // Gamification state
  const [streak, setStreak] = useState(0);
  const [badges, setBadges] = useState<string[]>([]);
  const [dailyDone, setDailyDone] = useState(false);
  const [isDailyChallenge, setIsDailyChallenge] = useState(false);
  const [isMapOpen, setIsMapOpen] = useState(false);
  const [bookmarks, setBookmarks] = useState<Question[]>([]);
  const [isBookmarksReview, setIsBookmarksReview] = useState(false);

  const { feedback } = useFeedback();

  // Check for saved quiz on mount
  useEffect(() => {
    const saved = localStorage.getItem('rpsc_current_quiz');
    if (saved) setHasSavedQuiz(true);
  }, [screen]);

  // Load bookmarks on mount
  useEffect(() => {
    const savedBookmarks = localStorage.getItem('rpsc_bookmarks');
    if (savedBookmarks) {
      try {
        setBookmarks(JSON.parse(savedBookmarks));
      } catch (e) {
        console.error("Failed to parse saved bookmarks", e);
      }
    }
  }, []);

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
    } else {
      localStorage.removeItem('rpsc_user');
      localStorage.removeItem('rpsc_current_quiz');
    }
  }, [user]);

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
        isDailyChallenge,
        isBookmarksReview
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
      setIsBookmarksReview(data.isBookmarksReview || false);
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
    if (screen === 'QUIZ' && !loading) {
      timerRef.current = setInterval(() => {
        setQuizTimer(prev => prev + 1);
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [screen, loading]);

  const startSetup = (subject: Subject) => {
    feedback('click');
    setConfig(prev => ({ ...prev, subject }));
    setIsReviewMode(false);
    setIsDailyChallenge(false);
    setIsBookmarksReview(false);
    setScreen('SETUP');
  };

  const startMistakeReview = () => {
    if (mistakes.length === 0) return;
    setQuestions(mistakes);
    setUserAnswers(new Array(mistakes.length).fill(null));
    setCurrentIndex(0);
    setIsReviewMode(true);
    setIsDailyChallenge(false);
    setIsBookmarksReview(false);
    setScreen('QUIZ');
  };

  const startBookmarksReview = () => {
    if (bookmarks.length === 0) return;
    feedback('click');
    setQuestions(bookmarks);
    setUserAnswers(new Array(bookmarks.length).fill(null));
    setCurrentIndex(0);
    setIsReviewMode(true);
    setIsDailyChallenge(false);
    setIsBookmarksReview(true);
    setScreen('QUIZ');
  };

  const toggleBookmark = (q: Question) => {
    setBookmarks(prev => {
      const exists = prev.some(b => b.id === q.id);
      let updated;
      if (exists) {
        updated = prev.filter(b => b.id !== q.id);
        feedback('click');
      } else {
        updated = [...prev, q];
        feedback('success');
      }
      localStorage.setItem('rpsc_bookmarks', JSON.stringify(updated));
      return updated;
    });
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

  const updateGamification = (newScore: number, total: number) => {
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
            <header className={`min-h-[3.5rem] md:h-20 py-2 md:py-0 flex flex-wrap gap-2 justify-between items-center px-2 md:px-8 shrink-0 relative z-20 transition-all duration-700 ${
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
                
                <div className="flex flex-wrap items-center gap-1.5 md:gap-4">
                  {(screen === 'QUIZ' || screen === 'RESULTS') && (
                    <div className="flex flex-col items-end mr-1 md:mr-4">
                      <span className="hidden lg:block text-[9px] uppercase font-bold text-slate-400 tracking-widest whitespace-nowrap">Session Timer</span>
                      <span className="text-xs md:text-xl font-mono font-bold text-primary italic leading-none">{formatTime(quizTimer)}</span>
                    </div>
                  )}
                  
                  <div className="flex flex-wrap items-center gap-1 md:gap-2">
                    <div className="hidden sm:flex items-center gap-1 px-2 md:px-3 py-1 bg-orange-500/10 border border-orange-500/10 rounded-full">
                      <span className="text-orange-500 animate-pulse text-[10px]">🔥</span>
                      <span className="text-[10px] md:text-xs font-bold text-orange-500">{streak}</span>
                    </div>

                    <button 
                      onClick={toggleTheme}
                      title="Switch Theme"
                      className={`flex items-center gap-1.5 px-2 md:px-5 py-1.5 md:py-2.5 rounded-full transition-all duration-700 shadow-lg border group relative overflow-hidden active:scale-95 ${
                        theme === 'rajasthan' 
                          ? 'bg-rose-900/40 border-amber-500/50 text-amber-100 hover:bg-rose-900/60' 
                          : 'bg-white border-indigo-100 text-indigo-600 hover:border-indigo-300 hover:bg-indigo-50'
                      }`}
                    >
                      <Palette size={14} className={`transition-all duration-500 group-hover:rotate-[30deg] ${theme === 'rajasthan' ? 'text-amber-400' : 'text-indigo-500'}`} />
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
                    <div className="flex items-center gap-1.5 md:gap-4">
                      <div className="flex flex-col items-end hidden lg:flex">
                        <span className={`text-[10px] font-bold uppercase tracking-widest leading-none mb-1 ${theme === 'rajasthan' ? 'text-orange-200 opacity-80' : 'text-slate-400'}`}>Authenticated</span>
                        <span className={`text-xs font-bold ${theme === 'rajasthan' ? 'text-white' : 'text-main'}`}>{user.name}</span>
                      </div>
                      <button 
                        onClick={handleLogout}
                        title="Logout"
                        className={`p-1 md:p-2 transition-colors ${theme === 'rajasthan' ? 'text-white/70 hover:text-white' : 'text-slate-400 hover:text-red-500'}`}
                      >
                        <LogOut size={16} />
                      </button>
                    </div>
                  )}

                  {screen === 'QUIZ' && (
                    <button 
                      onClick={() => setScreen('RESULTS')}
                      className="px-2 md:px-6 py-1 md:py-2 bg-slate-900 text-white text-[10px] md:text-sm font-semibold rounded hover:bg-slate-800 transition-colors shadow-sm ml-1 md:ml-4"
                    >
                      Submit
                    </button>
                  )}
                  {screen === 'RESULTS' && (
                    <button 
                      onClick={() => setScreen('HOME')}
                      className="px-2 md:px-6 py-1 md:py-2 bg-primary text-white text-[10px] md:text-sm font-semibold rounded hover:brightness-110 transition-all shadow-sm ml-1 md:ml-4"
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
              <section className="flex-1 bg-slate-50 overflow-y-auto px-4 md:px-12 py-8 md:py-12 flex flex-col pb-32 md:pb-12 border-l border-border-theme">
                <AnimatePresence mode="wait">
                  {screen === 'HOME' && (
                    <HomeDashboard 
                      user={user}
                      streak={streak}
                      badges={badges}
                      dailyDone={dailyDone}
                      hasSavedQuiz={hasSavedQuiz}
                      mistakes={mistakes}
                      bookmarks={bookmarks}
                      subjects={subjects}
                      startSetup={startSetup}
                      startDailyChallenge={startDailyChallenge}
                      startMistakeReview={startMistakeReview}
                      startBookmarksReview={startBookmarksReview}
                      toggleBookmark={toggleBookmark}
                      restoreQuiz={restoreQuiz}
                      theme={theme}
                    />
                  )}

                  {screen === 'SETUP' && (
                    <SetupPanel 
                      config={config}
                      setConfig={setConfig}
                      onBack={() => setScreen('HOME')}
                      onStartQuiz={handleStartQuiz}
                      subjects={subjects}
                    />
                  )}

                  {screen === 'RULES' && (
                    <RulesPanel 
                      rulesAccepted={rulesAccepted}
                      setRulesAccepted={setRulesAccepted}
                      onBack={() => setScreen('SETUP')}
                      onConfirm={confirmStartQuiz}
                    />
                  )}

                  {screen === 'QUIZ' && (
                    <motion.div
                      key="quiz-center"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="max-w-2xl mx-auto w-full flex flex-col justify-center min-h-full"
                    >
                      {loading ? (
                        <div className="flex flex-col items-center py-20 text-center">
                          <Loader2 size={48} className="text-primary animate-spin mb-6" />
                          <h3 className="text-2xl font-display text-main italic">Assembling MCQs...</h3>
                          <p className="text-slate-500 text-sm mt-2 uppercase tracking-widest font-bold">Matching Exam Patterns</p>
                        </div>
                      ) : (
                        <>
                          <div className="mb-8 relative pr-1">
                            <div className="flex justify-between items-center gap-2 mb-4 px-4 md:px-0">
                              <div className="flex items-center flex-wrap gap-2">
                                <span className="px-3 py-1 bg-primary/10 text-primary text-[10px] font-bold rounded-sm uppercase tracking-widest">
                                   {isReviewMode ? (isBookmarksReview ? 'Saved Bookmarks' : 'Mistake Notebook') : `${config.subject} • ${config.difficulty}`}
                                </span>
                                
                                <AnimatePresence>
                                  {consecutiveCorrect >= 3 && (
                                    <motion.span 
                                      initial={{ opacity: 0, x: -10 }}
                                      animate={{ opacity: 1, x: 0 }}
                                      exit={{ opacity: 0 }}
                                      className="text-[10px] font-bold text-accent uppercase tracking-widest flex items-center gap-1 inline-flex"
                                    >
                                      <Zap size={10} /> AI: Leveling Up Challenge
                                    </motion.span>
                                  )}
                                </AnimatePresence>
                              </div>

                              {questions[currentIndex] && (
                                <button
                                  type="button"
                                  onClick={() => toggleBookmark(questions[currentIndex])}
                                  className="text-slate-400 hover:text-amber-500 transition-colors p-1.5 bg-white border border-slate-200 rounded-full cursor-pointer flex items-center justify-center shadow-sm shrink-0"
                                  title={bookmarks.some(b => b.id === questions[currentIndex].id) ? "Remove Bookmark" : "Bookmark Question"}
                                >
                                  <Star 
                                    size={15} 
                                    className={`${
                                      bookmarks.some(b => b.id === questions[currentIndex].id) 
                                        ? "fill-amber-500 text-amber-500" 
                                        : "text-slate-400"
                                    } transition-all`}
                                  />
                                </button>
                              )}
                            </div>
                            <h2 className="text-lg md:text-xl font-semibold px-4 font-display mt-2 leading-snug md:leading-tight text-main italic">
                               {questions[currentIndex]?.question}
                            </h2>
                          </div>

                {/* Options Grid */}
                <div className="grid grid-cols-1 gap-3 md:gap-4">
                  {questions[currentIndex] && Object.entries(questions[currentIndex].options).map(([key, value]) => {
                    const isCorrect = key === questions[currentIndex].correctAnswer;
                    const isSelected = key === userAnswers[currentIndex];
                    
                    let btnClass = "border-slate-200 bg-white hover:border-primary shadow-sm hover:shadow-md";
                    let circleClass = "border-slate-200 text-slate-400 group-hover:bg-primary group-hover:text-white group-hover:border-primary";

                    if (isAnswered) {
                      if (isCorrect) {
                        btnClass = "border-primary bg-primary/5 shadow-lg pointer-events-none ring-2 ring-primary/20";
                        circleClass = "bg-primary text-white border-primary scale-110";
                      } else if (isSelected) {
                        btnClass = "border-red-400 bg-red-50/50 pointer-events-none";
                        circleClass = "bg-red-500 text-white border-red-500";
                      } else {
                        btnClass = "opacity-40 grayscale pointer-events-none border-slate-100 bg-white shadow-none";
                      }
                    }

                    return (
                      <motion.button
                        key={key}
                        whileHover={!isAnswered ? { y: -4, scale: 1.01 } : {}}
                        whileTap={!isAnswered ? { scale: 0.98 } : {}}
                        onClick={() => handleSelectAnswer(key)}
                        className={`flex items-center gap-3 md:gap-4 p-3 md:p-4 border transition-all text-left group relative min-h-[60px] ${
                          theme === 'rajasthan' ? 'rounded-2xl' : 'rounded-xl'
                        } ${btnClass}`}
                      >
                        <span className={`w-8 h-8 md:w-10 md:h-10 shrink-0 rounded-xl border-2 flex items-center justify-center font-bold text-sm md:text-base transition-all ${circleClass}`}>
                          {key}
                        </span>
                        <span className={`text-sm md:text-base flex-1 leading-tight ${isSelected && !isAnswered ? 'font-bold' : 'font-medium'}`}>{value}</span>
                        {isAnswered && isCorrect && (
                          <motion.div 
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            className="absolute right-3"
                          >
                            <CheckCircle2 className="text-primary" size={20} />
                          </motion.div>
                        )}
                        {isAnswered && isSelected && !isCorrect && (
                          <motion.div 
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            className="absolute right-3"
                          >
                            <XCircle className="text-red-500" size={20} />
                          </motion.div>
                        )}
                      </motion.button>
                    );
                  })}
                </div>

                <div className="flex items-center justify-between mt-12 border-t border-slate-200 pt-8 pb-4 md:pb-0 hidden md:flex">
                  <div className="flex gap-4">
                    <button 
                      onClick={prevQuestion}
                      disabled={currentIndex === 0}
                      className="touch-target text-slate-400 font-bold uppercase text-[10px] tracking-widest hover:text-slate-600 flex items-center gap-1 disabled:opacity-20 transition-all"
                    >
                      <ChevronLeft size={14} /> Previous
                    </button>
                    {!isAnswered && (
                      <button 
                        onClick={skipQuestion}
                        className="touch-target text-slate-400 font-bold uppercase text-[10px] tracking-widest hover:text-slate-600 transition-all"
                      >
                        Skip Question
                      </button>
                    )}
                  </div>
                  <div className="flex gap-4">
                     {isAnswered && questions[currentIndex]?.question.toLowerCase().includes('ganga') && (
                        <button 
                          onClick={() => {
                            feedback('click');
                            setIsMapOpen(true);
                          }}
                          className="px-6 bg-white border border-primary/30 text-primary font-bold rounded shadow-sm transition-all uppercase text-[10px] tracking-widest flex items-center gap-2 hover:bg-primary/5 h-[44px]"
                        >
                          <MapIcon size={14} /> Explore Map
                        </button>
                      )}
                     <button 
                       onClick={nextQuestion}
                       className={`touch-target px-8 text-white font-bold rounded shadow-lg transition-all uppercase text-[11px] tracking-widest flex items-center gap-2 ${
                         isAnswered ? 'bg-primary shadow-primary/20 brightness-110' : 'bg-slate-400 opacity-60'
                       }`}
                     >
                       {currentIndex === questions.length - 1 ? 'Finish Exam' : (isAnswered ? 'Save & Next' : 'Select Answer')} <ChevronRight size={18} />
                     </button>
                  </div>
                </div>

                {/* Mobile Sticky Bottom Nav for Quiz */}
                <div className="md:hidden fixed bottom-6 left-4 right-4 z-50 glass rounded-3xl p-4 flex items-center justify-between shadow-[0_20px_50px_rgba(0,0,0,0.3)]">
                   <div className="flex flex-col pl-2">
                      <span className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter">Question</span>
                      <span className="text-sm font-bold text-main italic">Q{currentIndex + 1}/{questions.length}</span>
                   </div>
                   
                    <div className="flex gap-3">
                      <button 
                        onClick={prevQuestion}
                        disabled={currentIndex === 0}
                        className="w-10 h-10 flex items-center justify-center bg-white border border-slate-200 rounded-2xl text-slate-400 disabled:opacity-20 active:scale-95 transition-all shadow-sm"
                      >
                        <ChevronLeft size={20} />
                      </button>
                      {isAnswered && questions[currentIndex]?.question.toLowerCase().includes('ganga') && (
                         <button 
                           onClick={() => {
                             feedback('click');
                             setIsMapOpen(true);
                           }}
                           className="w-10 h-10 flex items-center justify-center bg-white border border-primary/30 rounded-2xl text-primary active:scale-95 transition-all shadow-sm"
                         >
                           <Compass size={20} />
                         </button>
                       )}
                      {!isAnswered && (
                        <button 
                          onClick={skipQuestion}
                          className="px-4 h-10 bg-white border border-slate-200 text-slate-400 font-bold rounded-2xl active:scale-95 transition-all text-[10px] uppercase tracking-widest"
                        >
                          Skip
                        </button>
                      )}
                      <button 
                        onClick={nextQuestion}
                        className={`px-6 h-10 text-white font-bold rounded-2xl shadow-lg flex items-center gap-2 active:scale-95 transition-all text-[10px] uppercase tracking-widest ${
                          isAnswered ? 'bg-primary' : 'bg-slate-400 opacity-60'
                        }`}
                      >
                        {currentIndex === questions.length - 1 ? 'Finish' : (isAnswered ? 'Save' : 'Next')}
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
                    <ResultsPanel 
                      questions={questions}
                      config={config}
                      getScore={getScore}
                      getIncorrectCount={getIncorrectCount}
                      getSkippedCount={getSkippedCount}
                      quizTimer={quizTimer}
                      formatTime={formatTime}
                      theme={theme}
                      handleStartQuiz={handleStartQuiz}
                      setScreen={setScreen}
                    />
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

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Settings, MathProblem, Difficulty, GameMode } from '../types';
import { sounds } from '../utils/soundEngine';
import { generateProblem, getOperationSymbol } from '../utils/mathGenerator';
import { Timer, Trophy, CheckCircle, XCircle, Delete, Home, Award, Zap, Crown, Flame, Rocket, PlusCircle, ShieldAlert } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { evaluateAchievements, Badge } from '../utils/streakAndAchievements';
import pibotMascot from '../assets/images/pibot-mascot.jpg';

interface ToastSlot {
  id: string;
  title: string;
  description: string;
  type: 'badge' | 'streak' | 'score' | 'speed';
  iconName?: string;
  colorGrade?: 'bronze' | 'silver' | 'gold' | 'cosmic' | 'normal';
}

const ToastIcon = ({ name, className }: { name?: string; className?: string }) => {
  switch (name) {
    case 'Award': return <Award className={className} />;
    case 'Zap': return <Zap className={className} />;
    case 'Crown': return <Crown className={className} />;
    case 'Flame': return <Flame className={className} />;
    case 'Rocket': return <Rocket className={className} />;
    case 'PlusCircle': return <PlusCircle className={className} />;
    case 'XCircle': return <XCircle className={className} />;
    case 'ShieldAlert': return <ShieldAlert className={className} />;
    default: return <Award className={className} />;
  }
};

const getToastColorStyles = (type: string, colorGrade?: string) => {
  if (type === 'badge') {
    switch (colorGrade) {
      case 'bronze': return { bg: 'bg-amber-100 text-amber-700 border-amber-400', label: '🥉 BRONZE BADGE' };
      case 'silver': return { bg: 'bg-slate-100 text-slate-600 border-slate-400', label: '🥈 SILVER BADGE' };
      case 'gold': return { bg: 'bg-yellow-50 text-yellow-600 border-yellow-400', label: '🥇 GOLD BADGE' };
      case 'cosmic': return { bg: 'bg-indigo-950 text-purple-400 border-purple-500', label: '✨ COSMIC BADGE' };
      default: return { bg: 'bg-indigo-50 text-indigo-700 border-indigo-400', label: '🎖️ BADGE UNLOCKED' };
    }
  }
  switch (type) {
    case 'streak': return { bg: 'bg-orange-100 text-orange-600 border-orange-400', label: '🔥 STREAK MILESTONE' };
    case 'score': return { bg: 'bg-emerald-100 text-emerald-600 border-emerald-400', label: '🏆 SCORE MILESTONE' };
    case 'speed': return { bg: 'bg-cyan-100 text-cyan-600 border-cyan-400', label: '⚡ SPEED MILESTONE' };
    default: return { bg: 'bg-indigo-50 text-indigo-700 border-indigo-400', label: '🎉 MILESTONE ACHIEVED' };
  }
};

interface GameProps {
  settings: Settings;
  onEndGame: (score: number, totalSubmissions: number, history: any[]) => void;
  onHome: () => void;
}

export const Game: React.FC<GameProps> = ({ settings, onEndGame, onHome }) => {
  const [timeLeft, setTimeLeft] = useState(settings.gameDurationSeconds);
  const [score, setScore] = useState(0);
  const [totalSubmissions, setTotalSubmissions] = useState(0);
  const [history, setHistory] = useState<any[]>([]);
  
  const [currentDifficulty, setCurrentDifficulty] = useState<Difficulty>(settings.difficulty);
  const [currentProblem, setCurrentProblem] = useState<MathProblem | null>(null);
  const [streak, setStreak] = useState(0);
  const [problemIndex, setProblemIndex] = useState(0);

  const [inputValue, setInputValue] = useState('');
  const [feedback, setFeedback] = useState<'correct' | 'incorrect' | null>(null);
  
  // Power-up states
  const [freezesLeft, setFreezesLeft] = useState(1);
  const [hintsLeft, setHintsLeft] = useState(1);
  const [freezeTimeRemaining, setFreezeTimeRemaining] = useState(0);
  const [powerupEarnedNotification, setPowerupEarnedNotification] = useState<string | null>(null);
  
  const questionStartTimeRef = useRef(Date.now());

  // Toasts state and systems
  const [toasts, setToasts] = useState<ToastSlot[]>([]);
  const savedProgressRef = useRef<any[]>([]);
  const previouslyUnlockedBadgeIdsRef = useRef<Set<string>>(new Set());
  const hasTriggeredSpeedSub1Ref = useRef(false);
  const hasTriggeredSpeedSub2Ref = useRef(false);

  // Sync state values to refs on change to prevent React dependency closing variables bugs
  const scoreRef = useRef(0);
  const totalSubmissionsRef = useRef(0);
  const historyRef = useRef<any[]>([]);
  const streakRef = useRef(0);

  useEffect(() => { scoreRef.current = score; }, [score]);
  useEffect(() => { totalSubmissionsRef.current = totalSubmissions; }, [totalSubmissions]);
  useEffect(() => { historyRef.current = history; }, [history]);
  useEffect(() => { streakRef.current = streak; }, [streak]);

  // Load initial progress and find previously unlocked badges
  useEffect(() => {
    const raw = localStorage.getItem('speedMathProgress');
    let parsed: any[] = [];
    if (raw) {
      try {
        parsed = JSON.parse(raw);
      } catch (e) {}
    }
    savedProgressRef.current = parsed;
    
    try {
      const initialBadges = evaluateAchievements(parsed);
      const initialUnlocked = new Set<string>();
      initialBadges.forEach(b => {
        if (b.unlocked) {
          initialUnlocked.add(b.id);
        }
      });
      previouslyUnlockedBadgeIdsRef.current = initialUnlocked;
    } catch (e) {
      console.error(e);
    }
  }, []);

  const triggerToast = useCallback((
    id: string,
    title: string,
    description: string,
    type: 'badge' | 'streak' | 'score' | 'speed',
    iconName?: string,
    colorGrade?: 'bronze' | 'silver' | 'gold' | 'cosmic' | 'normal'
  ) => {
    // Play achievement chime
    sounds.playAchievement();
    
    setToasts(prev => {
      if (prev.some(t => t.id === id)) return prev;
      return [...prev, { id, title, description, type, iconName, colorGrade }];
    });

    // Auto-dismiss in 4000ms
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 4000);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  // Initialize first problem
  useEffect(() => {
    setCurrentProblem(generateProblem(currentDifficulty, settings.operations));
    questionStartTimeRef.current = Date.now();
  }, [currentDifficulty, settings.operations]);

  // Timer countdown
  useEffect(() => {
    if (settings.gameMode === GameMode.UNTIMED) return;
    if (timeLeft <= 0) {
      onEndGame(score, totalSubmissions, history);
      return;
    }
    const timer = setInterval(() => {
      setFreezeTimeRemaining(freeze => {
        if (freeze > 0) {
          // Compensate question start ref by 1s (1000ms) for each frozen second of gameplay
          questionStartTimeRef.current += 1000;
          return freeze - 1;
        } else {
          setTimeLeft(prev => {
             const nextVal = prev - 1;
             if (nextVal > 0 && nextVal <= 10) {
                sounds.playCountdownTick(nextVal);
             }
             return nextVal;
          });
          return 0;
        }
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [timeLeft, onEndGame, score, totalSubmissions, history, settings.gameMode]);

  const handleCorrectAnswer = useCallback((timeSpentParam?: number) => {
    setFeedback('correct');
    sounds.playCorrect();
    
    // timeSpentParam can be passed if we call this from event handler to ensure exact timing
    const timeSpent = timeSpentParam ?? ((Date.now() - questionStartTimeRef.current) / 1000);
    
    const nextScore = scoreRef.current + 1;
    const nextTotalSub = totalSubmissionsRef.current + 1;
    const nextStreak = streakRef.current + 1;

    setScore(nextScore);
    setTotalSubmissions(nextTotalSub);
    setStreak(nextStreak);

    // Reward power-ups on streak increments of 5
    if (nextStreak > 0 && nextStreak % 5 === 0) {
      const isFreezeReward = Math.random() > 0.5;
      if (isFreezeReward) {
        setFreezesLeft(f => f + 1);
        setPowerupEarnedNotification(`+1 Freeze (Streak ${nextStreak} Reward!)`);
      } else {
        setHintsLeft(h => h + 1);
        setPowerupEarnedNotification(`+1 Hint (Streak ${nextStreak} Reward!)`);
      }
      sounds.playAchievement();
      setTimeout(() => {
        setPowerupEarnedNotification(null);
      }, 2200);
    }

    // Save to history (only correct answers are logged in history for time metrics)
    const problemToSave = currentProblem;
    const diffToSave = currentDifficulty;
    const nextHistoryItem = {
        problem: problemToSave,
        timeSpent,
        difficulty: diffToSave
    };

    setHistory(prev => {
       const newHist = [...prev, nextHistoryItem];

       // Real-time badge & milestone updates
       try {
          const currentActiveSession = {
             date: new Date().toISOString(),
             score: nextScore,
             totalSubmissions: nextTotalSub,
             settings,
             history: newHist,
          };
          
          const simulatedProgress = [...savedProgressRef.current, currentActiveSession];
          const currentBadges = evaluateAchievements(simulatedProgress);
          
          // Compare simulated current badges with previously unlocked set
          currentBadges.forEach(badge => {
             if (badge.unlocked && !previouslyUnlockedBadgeIdsRef.current.has(badge.id)) {
                previouslyUnlockedBadgeIdsRef.current.add(badge.id);
                // Trigger beautiful badge toast on screen
                triggerToast(
                   `badge_${badge.id}`,
                   `Badge Unlocked: ${badge.title}! 🎖️`,
                   badge.description,
                   'badge',
                   badge.icon,
                   badge.colorGrade
                );
             }
          });
       } catch (err) {
          console.error("Error evaluating real-time achievements:", err);
       }

       return newHist;
    });

    // Handle in-game milestones
    // 1. Streak Milestones
    if (nextStreak === 5) {
      triggerToast('streak_5', 'Streak Spark! 🔥', 'Reached 5 consecutive correct answers.', 'streak');
    } else if (nextStreak === 10) {
      triggerToast('streak_10', 'On Fire! 🔥', 'Reached 10 consecutive correct answers!', 'streak');
    } else if (nextStreak === 15) {
      triggerToast('streak_15', 'Inferno! 💥', 'Reached 15 consecutive correct answers!', 'streak');
    } else if (nextStreak === 20) {
      triggerToast('streak_20', 'Math Legend! 🌟', 'Reached 20 consecutive correct answers!', 'streak');
    } else if (nextStreak > 20 && nextStreak % 10 === 0) {
      triggerToast(`streak_${nextStreak}`, `${nextStreak} Streak! 👑`, 'Unstoppable mathematical precision!', 'streak');
    }

    // 2. Score Milestones
    if (nextScore === 10) {
      triggerToast('score_10', 'Double Digits! 🏆', 'Scored 10 points in this session.', 'score');
    } else if (nextScore === 20) {
      triggerToast('score_20', 'Elite Solver! 💎', 'Scored 20 points in this session!', 'score');
    } else if (nextScore === 30) {
      triggerToast('score_30', 'Grandmaster Speed! 🚀', 'Scored 30 points in a single session!', 'score');
    } else if (nextScore > 30 && nextScore % 10 === 0) {
      triggerToast(`score_${nextScore}`, `${nextScore} Points! 👑`, 'Pristine speedmath drill performance!', 'score');
    }

    // 3. Speed Milestones (first sub-1.8s and first sub-1.0s)
    if (timeSpent < 1.0 && !hasTriggeredSpeedSub1Ref.current) {
      triggerToast('speed_sub_1', 'Sub-Second Answer! ⚡', `Solved a problem in just ${timeSpent.toFixed(2)}s!`, 'speed');
      hasTriggeredSpeedSub1Ref.current = true;
    } else if (timeSpent < 1.8 && !hasTriggeredSpeedSub2Ref.current) {
      triggerToast('speed_sub_2', 'Instinctive Reflex! ⚡', `Solved a problem in ${timeSpent.toFixed(2)}s!`, 'speed');
      hasTriggeredSpeedSub2Ref.current = true;
    }

    // Progressive logic if enabled
    let nextDifficulty = currentDifficulty;
    if (settings.adaptiveDifficulty) {
       if (nextStreak >= 3 && timeSpent < 5) {
          // Increase difficulty
          const diffs = Object.values(Difficulty);
          const i = diffs.indexOf(currentDifficulty);
          if (i !== -1 && i < diffs.length - 1) {
              nextDifficulty = diffs[i + 1] as Difficulty;
          }
          setStreak(0); // reset streak after difficulty bump
       }
    }

    // Almost immediate next question
    setTimeout(() => {
       setCurrentDifficulty(nextDifficulty);
       setCurrentProblem(generateProblem(nextDifficulty, settings.operations));
       setProblemIndex(i => i + 1);
       setInputValue('');
       setFeedback(null);
       questionStartTimeRef.current = Date.now();
    }, 50); // extremely fast swipe delay
  }, [currentDifficulty, currentProblem, settings, triggerToast]);

  const handleDigit = useCallback((digit: string) => {
     if (!currentProblem || feedback === 'correct') return; // ignore if transitioning

     let baseStr = inputValue;
     if (feedback === 'incorrect') {
         baseStr = ''; // start fresh on new digit if they were wrong
         setFeedback(null);
     }
     
     const newValue = baseStr + digit;
     setInputValue(newValue);

     const correctAnswerStr = currentProblem.correctAnswer.toString();

     if (newValue === correctAnswerStr) {
         setInputValue(newValue); // show the correct answer just for the 50ms transition
         const ts = (Date.now() - questionStartTimeRef.current) / 1000;
         handleCorrectAnswer(ts);
     } else if (!correctAnswerStr.startsWith(newValue)) {
         setFeedback('incorrect');
         sounds.playIncorrect();
         setTotalSubmissions(t => t + 1);
         setStreak(0);
     } else {
         sounds.playClick();
     }
  }, [currentProblem, inputValue, feedback, handleCorrectAnswer]);

  const handleBackspace = useCallback(() => {
      if (feedback === 'correct') return;
      sounds.playClick();
      if (feedback === 'incorrect') {
          setInputValue('');
          setFeedback(null);
      } else {
          setInputValue(prev => prev.slice(0, -1));
      }
  }, [feedback]);

  const onSkip = useCallback(() => {
      sounds.playClick();
      setStreak(0);
      setInputValue('');
      setFeedback(null);
      setCurrentProblem(generateProblem(currentDifficulty, settings.operations));
      setProblemIndex(i => i + 1);
      questionStartTimeRef.current = Date.now();
  }, [currentDifficulty, settings.operations]);

  const activateFreezeTime = useCallback(() => {
     if (settings.gameMode === GameMode.UNTIMED) return;
     if (freezesLeft <= 0 || freezeTimeRemaining > 0) return;
     
     sounds.playFreeze();
     setFreezesLeft(f => f - 1);
     setFreezeTimeRemaining(5);
  }, [freezesLeft, freezeTimeRemaining, settings.gameMode]);

  const activateHint = useCallback(() => {
     if (!currentProblem || hintsLeft <= 0) return;
     
     sounds.playHint();
     const correctAnswerStr = currentProblem.correctAnswer.toString();
     
     // Find the common prefix of current inputValue and the correctAnswerStr
     let commonPrefix = '';
     for (let i = 0; i < inputValue.length; i++) {
        if (inputValue[i] === correctAnswerStr[i]) {
           commonPrefix += inputValue[i];
        } else {
           break;
        }
     }
     
     if (commonPrefix === correctAnswerStr) return; // already correct
     
     const nextDigit = correctAnswerStr[commonPrefix.length];
     const newValue = commonPrefix + nextDigit;
     
     setInputValue(newValue);
     setHintsLeft(h => h - 1);
     
     // Check if this completes the problem!
     if (newValue === correctAnswerStr) {
        setInputValue(newValue);
        const ts = (Date.now() - questionStartTimeRef.current) / 1000;
        handleCorrectAnswer(ts);
     } else {
        setFeedback(null);
     }
  }, [currentProblem, inputValue, hintsLeft, handleCorrectAnswer]);

  // Keyboard support
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const keyUpper = e.key.toUpperCase();
      if (e.key >= '0' && e.key <= '9') {
        handleDigit(e.key);
      } else if (e.key === 'Backspace') {
        handleBackspace();
      } else if (e.key === ' ' || e.key === 'Enter') {
         if (feedback === 'incorrect') {
             e.preventDefault();
             onSkip();
         }
      } else if (keyUpper === 'F') {
         activateFreezeTime();
      } else if (keyUpper === 'H') {
         activateHint();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleDigit, handleBackspace, onSkip, feedback, activateFreezeTime, activateHint]);

  if (!currentProblem) return null;

  return (
    <div className="w-full max-w-4xl mx-auto flex flex-col items-center justify-center min-h-[100dvh] relative px-4 select-none">
       
       {/* Highly Visually Prominent Top Dashboard Layout */}
       <div className="absolute top-4 left-[2%] right-[2%] md:left-[5%] md:right-[5%] max-w-3xl mx-auto flex items-center justify-between gap-3 bg-[#FAF7EC] border-4 border-slate-900 rounded-[2rem] px-4 py-2.5 md:py-3.5 shadow-[5px_5px_0_0_#0f172a] z-20">
          
          {/* Left Block: Score and Streak Badge */}
          <div className="flex items-center gap-2">
             <div className="flex flex-col">
                <span className="text-[9px] uppercase tracking-widest text-slate-400 font-extrabold leading-none mb-1">SCORE</span>
                <span className="text-xl md:text-2xl font-mono font-black text-slate-800 leading-none">{score}</span>
             </div>
             {streak > 0 && (
                <div className="flex items-center gap-0.5 bg-orange-50 border border-orange-100 text-orange-600 px-1.5 py-1 rounded-lg text-xs font-black animate-bounce shrink-0" title={`${streak} consecutive correct answers`}>
                   <span>🔥</span>
                   <span className="font-mono">{streak}</span>
                </div>
              )}
          </div>

          {/* Center Block: VERY noticeable Bigger & More Noticeable Clock */}
          {settings.gameMode === GameMode.TIMED && (
             <div className="flex items-center justify-center shrink-0">
                {freezeTimeRemaining > 0 ? (
                   <div className="animate-pulse flex items-center gap-1.5 bg-cyan-100 border-2 border-cyan-400 px-3 py-1 md:px-4 md:py-1.5 rounded-2xl shadow-[0_0_15px_rgba(6,182,212,0.4)] text-cyan-700 transform scale-105">
                      <span className="animate-spin text-md md:text-lg">❄️</span>
                      <span className="font-mono text-sm md:text-base font-black tracking-widest uppercase">FROZEN {freezeTimeRemaining}s</span>
                   </div>
                ) : (
                   <div className={`transition-all duration-300 flex items-center gap-2 md:gap-3 px-4 py-1.5 md:px-6 md:py-2.5 rounded-2xl border ${
                      timeLeft <= 10 
                        ? 'bg-rose-50 border-rose-500 shadow-[0_0_25px_rgba(244,63,94,0.5)] scale-110 md:scale-125 text-rose-600 animate-pulse' 
                        : 'bg-slate-900 border-slate-950 text-amber-400 shadow-md'
                   }`}>
                      <Timer className={`w-4 h-4 md:w-6 md:h-6 ${timeLeft <= 10 ? 'animate-bounce text-rose-500' : 'text-amber-400'}`} />
                      <span className={`font-mono text-xl md:text-4xl font-black tracking-widest ${timeLeft <= 10 ? 'text-rose-600' : 'text-slate-100'}`}>
                         {Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')}
                      </span>
                   </div>
                )}
             </div>
          )}

          {/* Right Block: Home Button */}
          <button 
             onClick={() => { sounds.playClick(); onHome(); }}
             className="flex items-center gap-1.5 px-3 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-[10px] font-black uppercase tracking-widest rounded-xl transition-all active:scale-95 border-2 border-slate-900 shadow-[2px_2px_0_0_#0f172a] shrink-0 cursor-pointer"
          >
             <Home className="w-3.5 h-3.5" />
             <span className="hidden sm:inline font-bold">Home</span>
          </button>
       </div>

       {/* Main Page Layout */}
       <div className="w-full flex-1 flex flex-col items-center justify-center mt-24 md:mt-24">
           <div className="text-[10px] font-bold text-slate-300 uppercase tracking-widest mb-4">Level {currentDifficulty}</div>
           
           {/* Equation with fast swipe animation */}
           <AnimatePresence mode="popLayout">
             <motion.div 
               key={problemIndex} // update exactly on next problem
               initial={{ opacity: 0, scale: 0.9, y: 20 }}
               animate={{ opacity: 1, scale: 1, y: 0 }}
               exit={{ opacity: 0, scale: 1.1, y: -20 }}
               transition={{ duration: 0.15 }}
               className="flex flex-col items-center justify-center mb-8 relative w-full"
             >
                <div className="text-7xl md:text-[140px] font-black text-slate-800 tracking-tighter flex items-center gap-4 md:gap-8 z-10 my-4 leading-none font-sans">
                   <span>{currentProblem.num1}</span>
                   <span className="text-slate-300 font-light">{getOperationSymbol(currentProblem.operation)}</span>
                   <span>{currentProblem.num2}</span>
                   <span className="text-slate-200 font-thin italic">=</span>
                   
                   {/* Typed Answer Field */}
                   <span className={`w-32 md:w-56 h-24 md:h-40 border-b-4 ml-2 flex items-center justify-center transition-colors duration-100 ${
                       feedback === 'correct' ? 'border-emerald-500 text-emerald-500' : 
                       feedback === 'incorrect' ? 'border-rose-500 text-rose-500' : 
                       inputValue ? 'border-slate-800 text-slate-800' : 'border-slate-300 text-slate-300'
                   }`}>
                      {inputValue ? (
                          <span className="text-7xl md:text-[140px] font-black">{inputValue}</span>
                      ) : (
                          <span className="opacity-0">?</span> 
                      )}
                   </span>
                </div>
             </motion.div>
           </AnimatePresence>

           {/* Streak Reward & Power-up HUD */}
           <div className="w-full max-w-sm flex flex-col items-center">
              <AnimatePresence>
                 {powerupEarnedNotification && (
                    <motion.div 
                       initial={{ opacity: 0, y: 12, scale: 0.9 }} 
                       animate={{ opacity: 1, y: 0, scale: 1 }} 
                       exit={{ opacity: 0, y: -12, scale: 0.9 }}
                       className="w-full mb-3 flex justify-center"
                    >
                       <div className="bg-gradient-to-r from-amber-500 to-amber-600 text-amber-50 text-[10px] font-black tracking-widest uppercase py-1.5 px-4 rounded-full shadow-lg flex items-center gap-1.5 border border-amber-400/30 animate-pulse">
                          <span>✨</span>
                          <span>{powerupEarnedNotification}</span>
                       </div>
                    </motion.div>
                 )}
              </AnimatePresence>

              {/* Power-up Actions Panel */}
              <div className="w-full bg-[#FAF7EC] border-4 border-slate-900 p-2.5 rounded-2xl flex gap-2.5 shadow-[3px_3px_0_0_#0f172a] mb-4">
                 <button
                    onClick={activateFreezeTime}
                    disabled={settings.gameMode === GameMode.UNTIMED || freezesLeft <= 0 || freezeTimeRemaining > 0}
                    className={`flex-1 py-3 px-3 rounded-xl flex items-center justify-center gap-1.5 transition-all text-[11px] font-extrabold tracking-wider uppercase cursor-pointer select-none active:scale-95 ${
                       settings.gameMode === GameMode.UNTIMED ? 'opacity-30 cursor-not-allowed' :
                       freezeTimeRemaining > 0 ? 'bg-cyan-500 text-white border-2 border-slate-900 animate-pulse shadow-md shadow-cyan-100' :
                       freezesLeft > 0 ? 'bg-cyan-100 border-2 border-slate-900 text-cyan-800 hover:bg-cyan-200 shadow-[2px_2px_0_0_#0f172a]' :
                       'bg-slate-100 border border-slate-200 text-slate-300'
                    }`}
                    title="Freeze timer for 5 seconds (Hotkeys: F)"
                 >
                    <span className="text-xs">❄️</span>
                    <span>Freeze ({freezesLeft})</span>
                 </button>

                 <button
                    onClick={activateHint}
                    disabled={hintsLeft <= 0}
                    className={`flex-1 py-3 px-3 rounded-xl flex items-center justify-center gap-1.5 transition-all text-[11px] font-extrabold tracking-wider uppercase cursor-pointer select-none active:scale-95 ${
                       hintsLeft > 0 ? 'bg-amber-100 border-2 border-slate-900 text-amber-900 hover:bg-amber-200 shadow-[2px_2px_0_0_#0f172a]' :
                       'bg-slate-100 border border-slate-200 text-slate-300'
                    }`}
                    title="Fills first/next correct digit of the answer (Hotkeys: H)"
                  >
                    <span className="text-xs">💡</span>
                    <span>Hint ({hintsLeft})</span>
                 </button>
              </div>
           </div>

           {/* Number Pad Container */}
           <div className="w-full max-w-sm mt-2">
               <AnimatePresence>
                  {feedback === 'incorrect' && (
                     <motion.div 
                        initial={{ opacity: 0, height: 0 }} 
                        animate={{ opacity: 1, height: 'auto' }} 
                        exit={{ opacity: 0, height: 0 }}
                        className="w-full mb-4 flex justify-center"
                     >
                        <button 
                           onClick={onSkip}
                           className="flex items-center gap-2 bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-600 px-6 py-3 rounded-xl font-bold tracking-widest uppercase text-xs transition-colors w-full justify-center"
                        >
                           <XCircle className="w-4 h-4" /> Skip Question
                        </button>
                     </motion.div>
                  )}
               </AnimatePresence>

               <div className="grid grid-cols-3 gap-2 md:gap-4">
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(num => (
                     <button
                        key={num}
                        onClick={() => handleDigit(num.toString())}
                        className="bg-[#FAF7EC] hover:bg-amber-100/80 hover:scale-[1.02] active:scale-95 text-slate-900 border-4 border-slate-900 text-2xl md:text-4xl font-black aspect-square rounded-2xl md:rounded-[32px] flex items-center justify-center shadow-[3px_3px_0_0_#0f172a] cursor-pointer transition-all"
                     >
                        {num}
                     </button>
                  ))}
                  
                  {/* Empty cell or dot ? We don't have decimals. */}
                  <div className="bg-amber-50 rounded-2xl md:rounded-[32px] border-4 border-slate-900 flex items-center justify-center overflow-hidden p-1 shadow-[3px_3px_0_0_#0f172a] relative"><img src={pibotMascot} alt="Pi" className={`w-full h-full object-cover rounded-xl transition-all duration-150 animate-float-pibot ${feedback === 'correct' ? 'scale-[1.15] rotate-6 animate-none' : feedback === 'incorrect' ? 'scale-90 saturate-50 opacity-55 animate-none' : 'scale-100 hover:scale-105'}`} referrerPolicy="no-referrer" /></div>
                  
                  <button
                     onClick={() => handleDigit('0')}
                     className="bg-slate-100 hover:bg-slate-200 active:bg-slate-300 text-slate-800 md:text-3xl font-black aspect-square rounded-2xl md:rounded-[32px] flex items-center justify-center transition-colors"
                  >
                     0
                  </button>

                  <button
                     onClick={handleBackspace}
                     className="keypad-delete-btn text-white aspect-square rounded-2xl md:rounded-[32px] flex items-center justify-center transform active:translate-y-0.5 cursor-pointer shadow-red-200 shadow-sm"
                  >
                     <Delete className="w-6 h-6 md:w-8 md:h-8" />
                  </button>
               </div>
               
               <p className="text-center text-[10px] uppercase font-bold tracking-widest text-slate-300 mt-6 md:mt-8 hidden md:block">
                  Keyboard input supported
               </p>
           </div>
       </div>

        {/* Non-intrusive Toast Notifications Container */}
        <div className="fixed top-24 right-4 md:right-8 z-50 pointer-events-none flex flex-col gap-3 max-w-sm w-[calc(100%-2rem)] items-end">
           <AnimatePresence>
              {toasts.map((toast) => {
                 const colors = getToastColorStyles(toast.type, toast.colorGrade);
                 return (
                    <motion.div
                       layout
                       key={toast.id}
                       initial={{ opacity: 0, x: 50, scale: 0.9 }}
                       animate={{ opacity: 1, x: 0, scale: 1 }}
                       exit={{ opacity: 0, x: 100, scale: 0.9, transition: { duration: 0.2 } }}
                       className="w-full bg-[#FAF7EC] border-4 border-slate-900 rounded-[1.5rem] shadow-[4px_4px_0_0_#0f172a] p-4 flex items-start gap-3 pointer-events-auto select-none overflow-hidden relative"
                    >
                       {/* Animated Badge Icon Background */}
                       <div className={`p-2 px-2.5 rounded-xl border-2 border-slate-900 ${colors.bg} flex-shrink-0 flex items-center justify-center`}>
                          {toast.type === 'badge' ? (
                             <ToastIcon name={toast.iconName} className="w-5 h-5 md:w-6 md:h-6 stroke-[2.5]" />
                          ) : toast.type === 'streak' ? (
                             <Flame className="w-5 h-5 md:w-6 md:h-6 stroke-[2.5]" />
                          ) : toast.type === 'score' ? (
                             <Trophy className="w-5 h-5 md:w-6 md:h-6 stroke-[2.5]" />
                          ) : (
                             <Zap className="w-5 h-5 md:w-6 md:h-6 stroke-[2.5]" />
                          )}
                       </div>
                       
                       {/* Notification text details */}
                       <div className="flex-1 min-w-0 pr-2">
                          <div className="text-[9px] font-black tracking-widest text-indigo-700 uppercase mb-1">
                             {colors.label}
                          </div>
                          <h4 className="text-xs md:text-sm font-black text-slate-800 leading-tight">
                             {toast.title}
                          </h4>
                          <p className="text-[10px] md:text-[11px] text-slate-500 font-bold leading-snug mt-0.5">
                             {toast.description}
                          </p>
                       </div>
                       
                       {/* Manual Dismiss Button */}
                       <button 
                          onClick={() => removeToast(toast.id)}
                          className="text-slate-400 hover:text-slate-900 p-0.5 -mt-1 -mr-1 transition-colors cursor-pointer shrink-0"
                          title="Dismiss"
                       >
                          <XCircle className="w-4 h-4 shrink-0" />
                       </button>
                       
                       {/* Sliding Auto-Dismiss Progress Indicator bar */}
                       <motion.div 
                          initial={{ width: '100%' }}
                          animate={{ width: 0 }}
                          transition={{ duration: 4.0, ease: 'linear' }}
                          className="absolute bottom-0 left-0 h-1 bg-indigo-600"
                       />
                    </motion.div>
                 );
              })}
           </AnimatePresence>
        </div>

    </div>
  );
};

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Settings, MathProblem, Difficulty, GameMode } from '../types';
import { sounds } from '../utils/soundEngine';
import { generateProblem, getOperationSymbol } from '../utils/mathGenerator';
import { XCircle, Delete, Home } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { evaluateAchievements, Badge } from '../utils/streakAndAchievements';
import { brandMarks, challengeIcons, fx, mascots, operationIcons, panels } from '../assets/uiAssetRegistry';

interface GameProps {
  settings: Settings;
  onEndGame: (score: number, totalSubmissions: number, history: any[], unlockedBadges: Badge[]) => void;
  onHome: () => void;
}

const assetPanelStyle = (asset: string, overlay = 'rgba(8, 13, 32, 0.78)'): React.CSSProperties => ({
  backgroundImage: `linear-gradient(135deg, ${overlay}, rgba(2, 6, 23, 0.9)), url(${asset})`,
  backgroundPosition: 'center',
  backgroundSize: 'cover',
});

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
  
  const questionStartTimeRef = useRef(Date.now());

  // Achievement unlocks are tracked live but displayed only after active gameplay ends.
  const savedProgressRef = useRef<any[]>([]);
  const previouslyUnlockedBadgeIdsRef = useRef<Set<string>>(new Set());
  const roundUnlockedBadgesRef = useRef<Badge[]>([]);

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

  // Initialize first problem
  useEffect(() => {
    setCurrentProblem(generateProblem(currentDifficulty, settings.operations));
    questionStartTimeRef.current = Date.now();
  }, [currentDifficulty, settings.operations]);

  // Timer countdown
  useEffect(() => {
    if (settings.gameMode === GameMode.UNTIMED) return;
    if (timeLeft <= 0) {
      onEndGame(score, totalSubmissions, history, roundUnlockedBadgesRef.current);
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
      } else {
        setHintsLeft(h => h + 1);
      }
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
                if (!roundUnlockedBadgesRef.current.some(queuedBadge => queuedBadge.id === badge.id)) {
                   roundUnlockedBadgesRef.current = [...roundUnlockedBadgesRef.current, badge];
                }
             }
          });
       } catch (err) {
          console.error("Error evaluating real-time achievements:", err);
       }

       return newHist;
    });

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
  }, [currentDifficulty, currentProblem, settings]);

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

  const currentOperationIcon = operationIcons[currentProblem.operation];
  const currentModeIcon =
    settings.gameMode === GameMode.TIMED
      ? challengeIcons.timed
      : challengeIcons.untimed;

  return (
    <div className="w-full max-w-4xl mx-auto flex flex-col items-center justify-center min-h-[100dvh] max-h-[100dvh] relative px-4 select-none overflow-hidden">
       
       {/* Highly Visually Prominent Top Dashboard Layout */}
       <div
         className="absolute top-3 left-3 right-3 md:left-[5%] md:right-[5%] max-w-3xl mx-auto flex items-center justify-between gap-2.5 bg-slate-950/88 border border-cyan-200/40 rounded-[1.65rem] px-3 py-2 md:px-4 md:py-2.5 shadow-[0_14px_34px_rgba(8,47,73,0.36)] z-20 text-white backdrop-blur"
         style={assetPanelStyle(panels.navbarGlow, 'rgba(10, 17, 38, 0.82)')}
       >
          
          {/* Left Block: Brand Mark, Score and Streak Badge */}
          <div className="flex items-center gap-2 min-w-0">
             <img
               src={brandMarks.primaryLogo}
               alt="SpeedMath Coach logo"
               className="h-10 w-10 md:h-12 md:w-12 rounded-xl object-contain shadow-[0_0_18px_rgba(251,191,36,0.24)] ring-1 ring-amber-100/35 shrink-0"
             />
             <div className="flex flex-col rounded-2xl border border-cyan-100/15 bg-cyan-300/8 px-3 py-2">
                <span className="text-[8px] uppercase tracking-widest text-cyan-100/52 font-extrabold leading-none mb-1">Score</span>
                <span className="text-xl md:text-2xl font-mono font-black text-cyan-50 leading-none">{score}</span>
             </div>
             {streak > 0 && (
                <div className="flex items-center gap-1 bg-amber-300/14 border border-amber-200/35 text-amber-100 px-2 py-1.5 rounded-xl text-xs font-black shrink-0" title={`${streak} consecutive correct answers`}>
                   <span className="h-1.5 w-1.5 rounded-full bg-amber-300 shadow-[0_0_10px_rgba(251,191,36,0.8)]"></span>
                   <span className="font-mono">{streak}</span>
                </div>
              )}
          </div>

          {/* Center Block: VERY noticeable Bigger & More Noticeable Clock */}
          {settings.gameMode === GameMode.TIMED && (
             <div className="flex items-center justify-center shrink-0">
                {freezeTimeRemaining > 0 ? (
                   <div className="animate-pulse flex items-center gap-1.5 bg-cyan-300/18 border border-cyan-300/60 px-3 py-1.5 md:px-4 md:py-2 rounded-2xl shadow-[0_0_18px_rgba(6,182,212,0.32)] text-cyan-50">
                      <img src={fx.cyanOrbGlow} alt="" aria-hidden="true" className="w-5 h-5 object-contain animate-spin" />
                      <span className="font-mono text-sm md:text-base font-black tracking-widest uppercase">FROZEN {freezeTimeRemaining}s</span>
                   </div>
                ) : (
                   <div className={`transition-all duration-300 flex items-center gap-2 md:gap-3 px-3 py-1.5 md:px-5 md:py-2 rounded-2xl border ${
                      timeLeft <= 10 
                        ? 'bg-rose-500/18 border-rose-300 shadow-[0_0_25px_rgba(244,63,94,0.42)] text-rose-100 animate-pulse'
                        : 'bg-slate-950/82 border-amber-200/24 text-amber-200 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]'
                   }`}>
                      <img src={currentModeIcon} alt="" aria-hidden="true" className={`w-5 h-5 md:w-7 md:h-7 object-contain ${timeLeft <= 10 ? 'animate-bounce' : ''}`} />
                      <span className={`font-mono text-xl md:text-3xl font-black tracking-widest ${timeLeft <= 10 ? 'text-rose-100' : 'text-slate-100'}`}>
                         {Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')}
                      </span>
                   </div>
                )}
             </div>
          )}

          {/* Right Block: Home Button */}
          <button 
             onClick={() => { sounds.playClick(); onHome(); }}
             className="flex items-center gap-1.5 px-3 py-2 bg-cyan-300 hover:bg-cyan-200 text-slate-950 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all active:scale-95 border border-cyan-100 shadow-[0_0_16px_rgba(34,211,238,0.28)] shrink-0 cursor-pointer"
          >
             <Home className="w-3.5 h-3.5" />
             <span className="hidden sm:inline font-bold">Home</span>
          </button>
       </div>

       {/* Main Page Layout */}
       <div className="w-full flex-1 flex flex-col items-center justify-center mt-[4.5rem] md:mt-[5.5rem] pb-2">
           <div className="flex items-center gap-2 rounded-full border border-cyan-100/18 bg-slate-950/55 px-3 py-1.5 text-[10px] font-black text-cyan-100/74 uppercase tracking-widest mb-2 md:mb-3">
              <img src={currentOperationIcon} alt="" aria-hidden="true" className="w-7 h-7 object-contain drop-shadow-[0_0_10px_rgba(34,211,238,0.3)]" />
              <span>Level {currentDifficulty}</span>
           </div>
           
           {/* Equation with fast swipe animation */}
           <AnimatePresence mode="popLayout">
             <motion.div 
               key={problemIndex} // update exactly on next problem
               initial={{ opacity: 0, scale: 0.9, y: 20 }}
               animate={{ opacity: 1, scale: 1, y: 0 }}
               exit={{ opacity: 0, scale: 1.1, y: -20 }}
               transition={{ duration: 0.15 }}
               className="flex flex-col items-center justify-center mb-3 md:mb-5 relative w-full max-w-3xl rounded-[1.75rem] border border-cyan-200/40 shadow-[0_18px_50px_rgba(8,47,73,0.38)] px-3 py-3 md:px-8 md:py-6 overflow-hidden backdrop-blur"
               style={assetPanelStyle(panels.exerciseCard, 'rgba(6, 12, 32, 0.86)')}
             >
                <img src={fx.mathParticles} alt="" aria-hidden="true" className="absolute inset-0 h-full w-full object-cover opacity-15 mix-blend-screen pointer-events-none" />
                <div className="text-5xl sm:text-7xl md:text-[116px] font-black text-white tracking-tight flex items-center gap-2 sm:gap-4 md:gap-7 z-10 my-1 md:my-3 leading-none font-sans drop-shadow-[0_8px_24px_rgba(0,0,0,0.45)]">
                   <span>{currentProblem.num1}</span>
                   <span className="text-cyan-300 font-light">{getOperationSymbol(currentProblem.operation)}</span>
                   <span>{currentProblem.num2}</span>
                   <span className="text-amber-300 font-thin italic">=</span>
                   
                   {/* Typed Answer Field */}
                   <span className={`w-24 sm:w-32 md:w-52 h-16 sm:h-24 md:h-36 border-b-4 ml-2 flex items-center justify-center transition-colors duration-100 ${
                       feedback === 'correct' ? 'border-emerald-500 text-emerald-500' : 
                       feedback === 'incorrect' ? 'border-rose-500 text-rose-500' : 
                       inputValue ? 'border-cyan-200 text-cyan-50' : 'border-cyan-100/35 text-cyan-100/35'
                   }`}>
                      {inputValue ? (
                          <span className="text-5xl sm:text-7xl md:text-[128px] font-black">{inputValue}</span>
                      ) : (
                          <span className="opacity-0">?</span> 
                      )}
                   </span>
                </div>
             </motion.div>
           </AnimatePresence>

           {/* Power-up HUD */}
           <div className="w-full max-w-[320px] sm:max-w-sm flex flex-col items-center">
              {/* Power-up Actions Panel */}
              <div className="w-full bg-slate-950/88 border border-cyan-200/35 p-2 rounded-2xl flex gap-2 shadow-[0_12px_30px_rgba(8,47,73,0.32)] mb-3 md:p-2.5 md:gap-2.5 md:mb-3" style={assetPanelStyle(panels.cosmicCard, 'rgba(10, 17, 38, 0.84)')}>
                 <button
                    onClick={activateFreezeTime}
                    disabled={settings.gameMode === GameMode.UNTIMED || freezesLeft <= 0 || freezeTimeRemaining > 0}
                    className={`flex-1 py-2.5 px-2 rounded-xl flex items-center justify-center gap-1.5 transition-all text-[11px] font-extrabold tracking-wider uppercase cursor-pointer select-none active:scale-95 md:py-3 md:px-3 ${
                       settings.gameMode === GameMode.UNTIMED ? 'opacity-30 cursor-not-allowed' :
                       freezeTimeRemaining > 0 ? 'bg-cyan-300/22 text-cyan-50 border border-cyan-200/70 animate-pulse shadow-[0_0_18px_rgba(34,211,238,0.22)]' :
                       freezesLeft > 0 ? 'bg-cyan-300/12 border border-cyan-200/40 text-cyan-50 hover:bg-cyan-300/18' :
                       'bg-slate-900/70 border border-slate-700 text-slate-500'
                    }`}
                    title="Freeze timer for 5 seconds (Hotkeys: F)"
                 >
                    <img src={fx.cyanOrbGlow} alt="" aria-hidden="true" className="w-4 h-4 object-contain" />
                    <span>Freeze ({freezesLeft})</span>
                 </button>

                 <button
                    onClick={activateHint}
                    disabled={hintsLeft <= 0}
                    className={`flex-1 py-2.5 px-2 rounded-xl flex items-center justify-center gap-1.5 transition-all text-[11px] font-extrabold tracking-wider uppercase cursor-pointer select-none active:scale-95 md:py-3 md:px-3 ${
                       hintsLeft > 0 ? 'bg-amber-300/14 border border-amber-200/45 text-amber-100 hover:bg-amber-300/20' :
                       'bg-slate-900/70 border border-slate-700 text-slate-500'
                    }`}
                    title="Fills first/next correct digit of the answer (Hotkeys: H)"
                  >
                    <img src={fx.goldSparkBurst} alt="" aria-hidden="true" className="w-4 h-4 object-contain" />
                    <span>Hint ({hintsLeft})</span>
                 </button>
              </div>
           </div>

           {/* Number Pad Container */}
           <div className="w-full max-w-[320px] sm:max-w-sm mt-1 md:mt-2">
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
                           className="flex items-center gap-2 bg-rose-500/16 hover:bg-rose-500/22 border border-rose-300/50 text-rose-100 px-6 py-3 rounded-xl font-bold tracking-widest uppercase text-xs transition-colors w-full justify-center"
                        >
                           <XCircle className="w-4 h-4" /> Skip Question
                        </button>
                     </motion.div>
                  )}
               </AnimatePresence>

               <div className="grid grid-cols-3 gap-2.5 md:gap-3">
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(num => (
                     <button
                        key={num}
                        onClick={() => handleDigit(num.toString())}
                        className="bg-slate-950/90 hover:bg-cyan-950/95 hover:scale-[1.02] active:scale-95 text-cyan-50 border border-cyan-200/45 text-2xl md:text-4xl font-black aspect-square rounded-2xl md:rounded-[1.6rem] flex items-center justify-center shadow-[0_10px_24px_rgba(8,47,73,0.32)] cursor-pointer transition-all backdrop-blur"
                     >
                        {num}
                     </button>
                  ))}
                  
                  {/* Empty cell or dot ? We don't have decimals. */}
                  <div className="bg-slate-950/90 rounded-2xl md:rounded-[1.6rem] border border-amber-300/45 flex items-center justify-center overflow-hidden p-1 shadow-[0_10px_24px_rgba(251,191,36,0.13)] relative backdrop-blur">
                    <img src={mascots.headAvatar} alt="Pi-bot" className={`w-full h-full object-contain rounded-xl transition-all duration-150 animate-float-pibot ${feedback === 'correct' ? 'scale-[1.15] rotate-6 animate-none' : feedback === 'incorrect' ? 'scale-90 saturate-50 opacity-55 animate-none' : 'scale-100 hover:scale-105'}`} />
                  </div>
                  
                  <button
                     onClick={() => handleDigit('0')}
                     className="bg-slate-950/90 hover:bg-cyan-950 active:bg-cyan-900 text-cyan-50 border border-cyan-200/45 text-2xl md:text-3xl font-black aspect-square rounded-2xl md:rounded-[1.6rem] flex items-center justify-center transition-colors shadow-[0_10px_24px_rgba(8,47,73,0.32)]"
                  >
                     0
                  </button>

                  <button
                     onClick={handleBackspace}
                     className="keypad-delete-btn text-white aspect-square rounded-2xl md:rounded-[1.6rem] flex items-center justify-center transform active:translate-y-0.5 cursor-pointer shadow-red-200 shadow-sm"
                  >
                     <Delete className="w-6 h-6 md:w-8 md:h-8" />
                  </button>
               </div>
               
               <p className="text-center text-[10px] uppercase font-bold tracking-widest text-cyan-100/45 mt-4 md:mt-5 hidden md:block">
                  Keyboard input supported
               </p>
           </div>
       </div>

    </div>
  );
};

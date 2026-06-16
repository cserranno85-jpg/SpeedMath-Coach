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
  backgroundImage: `linear-gradient(135deg, ${overlay}, rgba(2, 8, 31, 0.96)), url(${asset})`,
  backgroundPosition: 'center',
  backgroundSize: 'cover',
});

const numberKeys = [1, 2, 3, 4, 5, 6, 7, 8, 9];

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
  const isEndingRef = useRef(false);
  const isAdvancingRef = useRef(false);
  const wrongLockedRef = useRef(false);
  const nextProblemTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

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

  useEffect(() => {
    isEndingRef.current = false;
    isAdvancingRef.current = false;
    wrongLockedRef.current = false;

    return () => {
      isEndingRef.current = true;
      if (nextProblemTimeoutRef.current) {
        clearTimeout(nextProblemTimeoutRef.current);
      }
    };
  }, []);

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
    isAdvancingRef.current = false;
    wrongLockedRef.current = false;
  }, [currentDifficulty, settings.operations]);

  const completeRound = useCallback(() => {
    if (isEndingRef.current) return;
    isEndingRef.current = true;
    if (nextProblemTimeoutRef.current) {
      clearTimeout(nextProblemTimeoutRef.current);
    }
    onEndGame(scoreRef.current, totalSubmissionsRef.current, historyRef.current, roundUnlockedBadgesRef.current);
  }, [onEndGame]);

  // Timer countdown
  useEffect(() => {
    if (settings.gameMode === GameMode.UNTIMED) return;
    if (timeLeft <= 0) {
      completeRound();
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
             const nextVal = Math.max(0, prev - 1);
             if (nextVal > 0 && nextVal <= 10) {
                sounds.playCountdownTick(nextVal);
             }
             if (nextVal === 0) {
                completeRound();
             }
             return nextVal;
          });
          return 0;
        }
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [completeRound, settings.gameMode, timeLeft]);

  const handleCorrectAnswer = useCallback((timeSpentParam?: number) => {
    if (!currentProblem || isAdvancingRef.current || isEndingRef.current) return;
    isAdvancingRef.current = true;
    wrongLockedRef.current = false;
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
    if (nextProblemTimeoutRef.current) {
       clearTimeout(nextProblemTimeoutRef.current);
    }
    nextProblemTimeoutRef.current = setTimeout(() => {
       if (isEndingRef.current) return;
       setCurrentDifficulty(nextDifficulty);
       setCurrentProblem(generateProblem(nextDifficulty, settings.operations));
       setProblemIndex(i => i + 1);
       setInputValue('');
       setFeedback(null);
       questionStartTimeRef.current = Date.now();
       isAdvancingRef.current = false;
    }, 50); // extremely fast swipe delay
  }, [currentDifficulty, currentProblem, settings]);

  const handleDigit = useCallback((digit: string) => {
     if (!currentProblem || feedback === 'correct' || isAdvancingRef.current || isEndingRef.current) return;
     if (wrongLockedRef.current && feedback !== 'incorrect') return;

     let baseStr = inputValue;
     if (feedback === 'incorrect') {
         baseStr = ''; // start fresh on new digit if they were wrong
         setFeedback(null);
         wrongLockedRef.current = false;
     }
     
     const newValue = baseStr + digit;
     setInputValue(newValue);

     const correctAnswerStr = currentProblem.correctAnswer.toString();

     if (newValue === correctAnswerStr) {
         setInputValue(newValue); // show the correct answer just for the 50ms transition
         const ts = (Date.now() - questionStartTimeRef.current) / 1000;
         handleCorrectAnswer(ts);
     } else if (!correctAnswerStr.startsWith(newValue)) {
         wrongLockedRef.current = true;
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
          wrongLockedRef.current = false;
      } else {
          setInputValue(prev => prev.slice(0, -1));
      }
  }, [feedback]);

  const onSkip = useCallback(() => {
      sounds.playClick();
      setStreak(0);
      setInputValue('');
      setFeedback(null);
      isAdvancingRef.current = false;
      wrongLockedRef.current = false;
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
     if (isAdvancingRef.current || isEndingRef.current) return;
     
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
    <div className="gameplay-safe-root w-full max-w-4xl mx-auto flex flex-col items-center justify-center min-h-[100dvh] max-h-[100dvh] relative px-4 select-none overflow-hidden">
       
       {/* Highly Visually Prominent Top Dashboard Layout */}
       <div
         className="gameplay-hud-safe premium-card-depth absolute left-3 right-3 z-20 mx-auto flex max-w-[430px] items-center justify-between gap-2 rounded-[1.45rem] border border-cyan-200/38 bg-[#02081f]/92 px-2.5 py-2 text-white shadow-[0_10px_26px_rgba(8,47,73,0.3),inset_0_1px_0_rgba(255,255,255,0.08)] backdrop-blur-sm md:left-[5%] md:right-[5%] md:max-w-3xl md:px-4 md:py-2.5"
         style={assetPanelStyle(panels.navbarGlow, 'rgba(3, 12, 38, 0.88)')}
       >
          
          {/* Left Block: Brand Mark, Score and Streak Badge */}
          <div className="flex items-center gap-2 min-w-0">
             <img
               src={brandMarks.primaryLogo}
               alt="SpeedMath Coach logo"
               className="h-9 w-9 shrink-0 rounded-xl object-contain shadow-[0_0_18px_rgba(251,191,36,0.24)] ring-1 ring-amber-100/35 md:h-12 md:w-12"
             />
             <div className="flex flex-col rounded-2xl border border-cyan-100/15 bg-cyan-300/8 px-2.5 py-1.5 md:px-3 md:py-2">
                <span className="text-[8px] uppercase tracking-widest text-cyan-100/52 font-extrabold leading-none mb-1">Score</span>
                <span className="font-mono text-lg font-black leading-none text-cyan-50 md:text-2xl">{score}</span>
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
                   <div className="flex animate-pulse items-center gap-1.5 rounded-2xl border border-cyan-300/60 bg-cyan-300/18 px-2.5 py-1.5 text-cyan-50 shadow-[0_0_18px_rgba(6,182,212,0.32)] md:px-4 md:py-2">
                      <img src={fx.cyanOrbGlow} alt="" aria-hidden="true" className="w-5 h-5 object-contain animate-spin" />
                      <span className="font-mono text-xs font-black uppercase tracking-widest md:text-base">FROZEN {freezeTimeRemaining}s</span>
                   </div>
                ) : (
                   <div className={`flex items-center gap-1.5 rounded-2xl border px-2.5 py-1.5 transition-all duration-300 md:gap-3 md:px-5 md:py-2 ${
                      timeLeft <= 10 
                        ? 'bg-rose-500/18 border-rose-300 shadow-[0_0_25px_rgba(244,63,94,0.42)] text-rose-100 animate-pulse'
                        : 'bg-slate-950/82 border-amber-200/24 text-amber-200 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]'
                   }`}>
                      <img src={currentModeIcon} alt="" aria-hidden="true" className={`h-5 w-5 object-contain md:h-7 md:w-7 ${timeLeft <= 10 ? 'animate-bounce' : ''}`} />
                      <span className={`font-mono text-lg font-black tracking-widest md:text-3xl ${timeLeft <= 10 ? 'text-rose-100' : 'text-slate-100'}`}>
                         {Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')}
                      </span>
                   </div>
                )}
             </div>
          )}

          {/* Right Block: Home Button */}
          <div className="hidden items-center gap-1 rounded-xl border border-amber-200/25 bg-amber-300/10 px-2 py-1.5 text-[10px] font-black uppercase tracking-widest text-amber-100 min-[390px]:flex">
             L1
          </div>
          <button 
             onClick={() => { sounds.playClick(); onHome(); }}
             className="premium-action-pill flex shrink-0 cursor-pointer items-center gap-1.5 rounded-xl border border-cyan-100 bg-cyan-300 px-2.5 py-2 text-[10px] font-black uppercase tracking-widest text-slate-950 shadow-[0_0_16px_rgba(34,211,238,0.28)] hover:bg-cyan-200 md:px-3"
          >
             <Home className="w-3.5 h-3.5" />
             <span className="hidden sm:inline font-bold">Home</span>
          </button>
       </div>

       {/* Main Page Layout */}
       <div className="gameplay-main-stack w-full flex-1 flex flex-col items-center justify-center pb-1">
           <div className="flex items-center gap-2 rounded-full border border-cyan-100/18 bg-[#02081f]/68 px-3 py-1.5 text-[10px] font-black text-cyan-100/74 uppercase tracking-widest shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]">
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
               className="gameplay-equation-card premium-card-depth flex flex-col items-center justify-center relative w-full max-w-3xl rounded-[1.75rem] border border-cyan-200/42 shadow-[0_12px_34px_rgba(8,47,73,0.32)] px-3 md:px-8 overflow-hidden"
               style={assetPanelStyle(panels.exerciseCard, 'rgba(3, 12, 38, 0.88)')}
             >
                <img src={fx.mathParticles} alt="" aria-hidden="true" className="absolute inset-0 h-full w-full object-cover opacity-15 mix-blend-screen pointer-events-none" />
                <div className="text-5xl sm:text-7xl md:text-[116px] font-black text-white tracking-tight flex items-center gap-2 sm:gap-4 md:gap-7 z-10 my-1 leading-none font-sans drop-shadow-[0_8px_24px_rgba(0,0,0,0.45)]">
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
              <div className="premium-card-depth w-full bg-[#02081f]/92 border border-cyan-200/35 p-2 rounded-2xl flex gap-2 shadow-[0_8px_22px_rgba(8,47,73,0.26)] md:p-2.5 md:gap-2.5" style={assetPanelStyle(panels.cosmicCard, 'rgba(3, 12, 38, 0.88)')}>
                 <button
                    onClick={activateFreezeTime}
                    disabled={settings.gameMode === GameMode.UNTIMED || freezesLeft <= 0 || freezeTimeRemaining > 0}
                    className={`premium-toggle-3d flex-1 py-2.5 px-2 rounded-xl flex items-center justify-center gap-1.5 text-[11px] font-extrabold tracking-wider uppercase cursor-pointer select-none md:py-3 md:px-3 ${
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
                    className={`premium-toggle-3d flex-1 py-2.5 px-2 rounded-xl flex items-center justify-center gap-1.5 text-[11px] font-extrabold tracking-wider uppercase cursor-pointer select-none md:py-3 md:px-3 ${
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
           <div className="w-full max-w-[320px] sm:max-w-sm">
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
                           className="premium-toggle-3d flex items-center gap-2 bg-rose-500/16 hover:bg-rose-500/22 border border-rose-300/50 text-rose-100 px-6 py-3 rounded-xl font-bold tracking-widest uppercase text-xs w-full justify-center"
                        >
                           <XCircle className="w-4 h-4" /> Skip Question
                        </button>
                     </motion.div>
                  )}
               </AnimatePresence>

               <div className="gameplay-keypad-grid grid grid-cols-3">
                  {numberKeys.map(num => (
                     <button
                        key={num}
                        onClick={() => handleDigit(num.toString())}
                        className="premium-key-3d hover:bg-cyan-950/95 text-cyan-50 border border-cyan-200/48 text-2xl md:text-4xl font-black aspect-square rounded-2xl md:rounded-[1.6rem] flex items-center justify-center cursor-pointer"
                     >
                        {num}
                     </button>
                  ))}
                  
                  {/* Empty cell or dot ? We don't have decimals. */}
                  <div className="premium-key-3d rounded-2xl md:rounded-[1.6rem] border border-amber-300/45 flex items-center justify-center overflow-hidden p-1 relative">
                    <img src={mascots.headAvatar} alt="Pi-bot" className={`w-full h-full object-contain rounded-xl transition-all duration-150 animate-float-pibot ${feedback === 'correct' ? 'scale-[1.15] rotate-6 animate-none' : feedback === 'incorrect' ? 'scale-90 saturate-50 opacity-55 animate-none' : 'scale-100 hover:scale-105'}`} />
                  </div>
                  
                  <button
                     onClick={() => handleDigit('0')}
                     className="premium-key-3d hover:bg-cyan-950 active:bg-cyan-900 text-cyan-50 border border-cyan-200/48 text-2xl md:text-3xl font-black aspect-square rounded-2xl md:rounded-[1.6rem] flex items-center justify-center"
                  >
                     0
                  </button>

                  <button
                     onClick={handleBackspace}
                     className="keypad-delete-btn premium-key-3d text-white aspect-square rounded-2xl md:rounded-[1.6rem] flex items-center justify-center cursor-pointer"
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

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Settings, MathProblem, Difficulty, GameMode } from '../types';
import { sounds } from '../utils/soundEngine';
import { generateProblem, getOperationSymbol } from '../utils/mathGenerator';
import { Timer, XCircle, Delete, Home, Check, Lightbulb, Snowflake } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { evaluateAchievements, Badge } from '../utils/streakAndAchievements';
import { formatDuration, normalizeDurationSeconds } from '../utils/durationPresets';
import { loadProgress } from '../utils/progressStorage';
import pibotMascot from '../assets/images/pibot-mascot.jpg';

interface GameProps {
  settings: Settings;
  onEndGame: (score: number, totalSubmissions: number, history: any[], unlockedBadges: Badge[]) => void;
  onHome: () => void;
}

export const Game: React.FC<GameProps> = ({ settings, onEndGame, onHome }) => {
  const gameDurationSeconds = normalizeDurationSeconds(settings.gameDurationSeconds);
  const [timeLeft, setTimeLeft] = useState(() => gameDurationSeconds);
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
  const gameEndedRef = useRef(false);
  const transitionTimeoutRef = useRef<number | null>(null);

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
    return () => {
      gameEndedRef.current = true;
      if (transitionTimeoutRef.current !== null) {
        window.clearTimeout(transitionTimeoutRef.current);
      }
    };
  }, []);

  const resetBadgeBaseline = useCallback(() => {
    const parsed = loadProgress();
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
      previouslyUnlockedBadgeIdsRef.current = new Set();
    }
  }, []);

  // Reset all round-owned state whenever a new keyed game starts.
  useEffect(() => {
    const nextProblem = generateProblem(settings.difficulty, settings.operations);
    if (transitionTimeoutRef.current !== null) {
      window.clearTimeout(transitionTimeoutRef.current);
      transitionTimeoutRef.current = null;
    }
    gameEndedRef.current = false;
    roundUnlockedBadgesRef.current = [];
    scoreRef.current = 0;
    totalSubmissionsRef.current = 0;
    historyRef.current = [];
    streakRef.current = 0;

    setTimeLeft(gameDurationSeconds);
    setScore(0);
    setTotalSubmissions(0);
    setHistory([]);
    setCurrentDifficulty(settings.difficulty);
    setCurrentProblem(nextProblem);
    setStreak(0);
    setProblemIndex(0);
    setInputValue('');
    setFeedback(null);
    setFreezesLeft(1);
    setHintsLeft(1);
    setFreezeTimeRemaining(0);
    questionStartTimeRef.current = Date.now();
    resetBadgeBaseline();
  }, [gameDurationSeconds, resetBadgeBaseline, settings.difficulty, settings.operations]);

  // Timer countdown
  useEffect(() => {
    if (settings.gameMode === GameMode.UNTIMED) return;
    if (timeLeft <= 0) {
      if (!gameEndedRef.current) {
        gameEndedRef.current = true;
        onEndGame(score, totalSubmissions, history, roundUnlockedBadgesRef.current);
      }
      return;
    }
    const timer = setInterval(() => {
      if (gameEndedRef.current) return;
      setFreezeTimeRemaining(freeze => {
        if (freeze > 0) {
          // Compensate question start ref by 1s (1000ms) for each frozen second of gameplay
          questionStartTimeRef.current += 1000;
          return freeze - 1;
        } else {
          setTimeLeft(prev => {
             const nextVal = prev - 1;
             if (!gameEndedRef.current && nextVal > 0 && nextVal <= 5) {
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
    if (gameEndedRef.current) return;
    setFeedback('correct');
    sounds.play('correct');
    
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
    transitionTimeoutRef.current = window.setTimeout(() => {
       if (gameEndedRef.current) return;
       setCurrentDifficulty(nextDifficulty);
       setCurrentProblem(generateProblem(nextDifficulty, settings.operations));
       setProblemIndex(i => i + 1);
       setInputValue('');
       setFeedback(null);
       questionStartTimeRef.current = Date.now();
       transitionTimeoutRef.current = null;
    }, 50); // extremely fast swipe delay
  }, [currentDifficulty, currentProblem, settings]);

  const handleDigit = useCallback((digit: string) => {
     if (gameEndedRef.current || !currentProblem || feedback === 'correct') return; // ignore if transitioning

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
         sounds.play('incorrect');
         setTotalSubmissions(t => t + 1);
         setStreak(0);
     } else {
         sounds.play('keypadTap');
     }
  }, [currentProblem, inputValue, feedback, handleCorrectAnswer]);

  const handleBackspace = useCallback(() => {
      if (gameEndedRef.current || feedback === 'correct') return;
      sounds.play('uiTap');
      if (feedback === 'incorrect') {
          setInputValue('');
          setFeedback(null);
      } else {
          setInputValue(prev => prev.slice(0, -1));
      }
  }, [feedback]);

  const handleEnter = useCallback(() => {
    if (gameEndedRef.current || !currentProblem || feedback === 'correct') return;

    if (inputValue === currentProblem.correctAnswer.toString()) {
      const ts = (Date.now() - questionStartTimeRef.current) / 1000;
      handleCorrectAnswer(ts);
      return;
    }

    sounds.play('incorrect');
    setFeedback('incorrect');
    setTotalSubmissions(t => t + 1);
    setStreak(0);
  }, [currentProblem, feedback, handleCorrectAnswer, inputValue]);

  const onSkip = useCallback(() => {
      if (gameEndedRef.current) return;
      sounds.play('uiTap');
      setStreak(0);
      setInputValue('');
      setFeedback(null);
      setCurrentProblem(generateProblem(currentDifficulty, settings.operations));
      setProblemIndex(i => i + 1);
      questionStartTimeRef.current = Date.now();
  }, [currentDifficulty, settings.operations]);

  const activateFreezeTime = useCallback(() => {
     if (gameEndedRef.current) return;
     if (settings.gameMode === GameMode.UNTIMED) return;
     if (freezesLeft <= 0 || freezeTimeRemaining > 0) return;
     
     sounds.play('primaryTap');
     setFreezesLeft(f => f - 1);
     setFreezeTimeRemaining(5);
  }, [freezesLeft, freezeTimeRemaining, settings.gameMode]);

  const activateHint = useCallback(() => {
     if (gameEndedRef.current) return;
     if (!currentProblem || hintsLeft <= 0) return;
     
     sounds.play('primaryTap');
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
         e.preventDefault();
         if (feedback === 'incorrect') {
             onSkip();
         } else {
             handleEnter();
         }
      } else if (keyUpper === 'F') {
         activateFreezeTime();
      } else if (keyUpper === 'H') {
         activateHint();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleDigit, handleBackspace, onSkip, feedback, activateFreezeTime, activateHint, handleEnter]);

  if (!currentProblem) return null;

  const accuracy = totalSubmissions > 0 ? Math.round((score / totalSubmissions) * 100) : 0;
  const statCards = [
    { label: 'Score', value: score, tone: 'from-yellow-300 to-orange-400 text-slate-950' },
    { label: 'Accuracy', value: `${accuracy}%`, tone: 'from-emerald-300 to-teal-400 text-slate-950' },
    { label: 'Question', value: problemIndex + 1, tone: 'from-cyan-300 to-blue-400 text-slate-950' },
  ];

  return (
    <div className="w-full max-w-6xl mx-auto min-h-[calc(100dvh-1.5rem)] flex flex-col gap-3 select-none">
       <div className="rounded-3xl border border-white/15 bg-slate-950/78 shadow-[0_18px_55px_rgba(0,0,0,0.35)] px-3 py-3 sm:px-4 flex items-center justify-between gap-2">
          <div className="min-w-0">
             <div className="text-[10px] uppercase font-black text-cyan-200">Level {currentDifficulty}</div>
             <div className="flex items-center gap-2 mt-1">
                <span className="text-xl sm:text-2xl font-mono font-black text-white">{score}</span>
                {streak > 0 && (
                  <span className="rounded-full bg-orange-400 px-2 py-0.5 text-[11px] font-black text-slate-950" title={`${streak} consecutive correct answers`}>
                    Streak {streak}
                  </span>
                )}
             </div>
          </div>

          {settings.gameMode === GameMode.TIMED ? (
             <div className={`shrink-0 flex items-center gap-2 rounded-2xl border px-3 py-2 ${
                freezeTimeRemaining > 0
                  ? 'border-cyan-300 bg-cyan-300 text-slate-950 animate-pulse'
                  : timeLeft <= 10
                    ? 'border-rose-300 bg-rose-500 text-white animate-pulse shadow-[0_0_24px_rgba(244,63,94,0.55)]'
                    : 'border-yellow-300/70 bg-blue-950 text-yellow-300'
             }`}>
                {freezeTimeRemaining > 0 ? <Snowflake className="w-4 h-4" /> : <Timer className="w-4 h-4" />}
                <span className="font-mono text-2xl sm:text-3xl font-black leading-none">
                  {freezeTimeRemaining > 0 ? `${freezeTimeRemaining}s` : formatDuration(timeLeft)}
                </span>
             </div>
          ) : (
             <div className="shrink-0 rounded-2xl border border-emerald-300/60 bg-emerald-400 px-3 py-2 text-sm font-black text-slate-950">
                Practice
             </div>
          )}

          <button
             onClick={() => { sounds.play('uiTap'); onHome(); }}
             className="premium-btn premium-btn-neutral shrink-0 !min-h-0 !rounded-2xl !p-3 text-white"
             title="Home"
          >
             <Home className="w-4 h-4" />
          </button>
       </div>

       <div className="flex-1 grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_360px] gap-3 lg:gap-5 items-stretch min-h-0">
          <div className="rounded-3xl border border-white/15 bg-blue-950/72 shadow-[0_18px_55px_rgba(0,0,0,0.32)] p-4 sm:p-5 flex flex-col justify-between gap-3 min-h-0 overflow-hidden">
             <div className="grid grid-cols-3 gap-2">
                {statCards.map((card) => (
                  <div key={card.label} className={`rounded-2xl bg-gradient-to-br ${card.tone} p-3 shadow-[0_12px_24px_rgba(0,0,0,0.2)]`}>
                    <div className="text-[10px] uppercase font-black opacity-80">{card.label}</div>
                    <div className="text-xl sm:text-2xl font-mono font-black">{card.value}</div>
                  </div>
                ))}
             </div>

             <div className="flex-1 flex flex-col items-center justify-center gap-4 min-h-[190px]">
                <AnimatePresence mode="popLayout">
                  <motion.div
                    key={problemIndex}
                    initial={{ opacity: 0, scale: 0.96, y: 14 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 1.04, y: -14 }}
                    transition={{ duration: 0.15 }}
                    className="w-full"
                  >
                    <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-4 text-5xl sm:text-6xl md:text-7xl font-black leading-none text-white">
                       <span>{currentProblem.num1}</span>
                       <span className="text-cyan-300">{getOperationSymbol(currentProblem.operation)}</span>
                       <span>{currentProblem.num2}</span>
                       <span className="text-blue-200">=</span>
                       <span className={`min-w-24 sm:min-w-32 h-16 sm:h-20 border-b-4 flex items-center justify-center ${
                          feedback === 'correct' ? 'border-emerald-300 text-emerald-300' :
                          feedback === 'incorrect' ? 'border-rose-300 text-rose-300' :
                          inputValue ? 'border-yellow-300 text-yellow-300' : 'border-white/30 text-white/30'
                       }`}>
                          {inputValue || '?'}
                       </span>
                    </div>
                  </motion.div>
                </AnimatePresence>

                <div className="w-full max-w-xl rounded-2xl border border-cyan-300/20 bg-slate-950/45 p-3 flex items-center gap-3">
                  <img src={pibotMascot} alt="Pi-bot Coach" className={`w-14 h-14 rounded-2xl object-cover shrink-0 transition ${feedback === 'correct' ? 'scale-105' : feedback === 'incorrect' ? 'grayscale opacity-70' : ''}`} referrerPolicy="no-referrer" />
                  <div className="min-w-0">
                    <div className="text-[10px] uppercase font-black text-cyan-200">Pi-bot Coach</div>
                    <div className="text-xs sm:text-sm text-blue-50 leading-snug">
                      {feedback === 'incorrect' ? 'Adjust the answer or skip to keep your rhythm.' : 'Stay quick, accurate, and keep the timer in view.'}
                    </div>
                  </div>
                </div>
             </div>

             <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={activateFreezeTime}
                  disabled={settings.gameMode === GameMode.UNTIMED || freezesLeft <= 0 || freezeTimeRemaining > 0}
                  className={`premium-btn premium-btn-small text-xs ${
                    settings.gameMode === GameMode.UNTIMED || freezesLeft <= 0
                      ? 'is-disabled'
                      : freezeTimeRemaining > 0
                        ? 'premium-chip is-active animate-pulse'
                        : 'premium-btn-secondary'
                  }`}
                >
                  <Snowflake className="w-4 h-4" /> Freeze ({freezesLeft})
                </button>
                <button
                  onClick={activateHint}
                  disabled={hintsLeft <= 0}
                  className={`premium-btn premium-btn-small text-xs ${
                    hintsLeft > 0 ? 'premium-btn-primary' : 'is-disabled'
                  }`}
                >
                  <Lightbulb className="w-4 h-4" /> Hint ({hintsLeft})
                </button>
             </div>
          </div>

          <div className="rounded-3xl border border-white/15 bg-slate-950/78 shadow-[0_18px_55px_rgba(0,0,0,0.32)] p-3 sm:p-4 flex flex-col justify-end gap-2">
             <AnimatePresence>
                {feedback === 'incorrect' && (
                   <motion.button
                      initial={{ opacity: 0, y: -8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -8 }}
                      onClick={onSkip}
                      className="premium-btn premium-btn-danger w-full text-xs"
                   >
                      <XCircle className="w-4 h-4" /> Skip Question
                   </motion.button>
                )}
             </AnimatePresence>

             <div className="grid grid-cols-3 gap-2">
                {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(num => (
                   <button
                      key={num}
                      onClick={() => handleDigit(num.toString())}
                      className="premium-btn premium-keypad h-14 min-[390px]:h-16 md:h-20 text-2xl md:text-3xl"
                   >
                      {num}
                   </button>
                ))}
                <button
                   onClick={handleBackspace}
                   className="premium-btn premium-btn-danger h-14 min-[390px]:h-16 md:h-20"
                   title="Delete"
                >
                   <Delete className="w-6 h-6" />
                </button>
                <button
                   onClick={() => handleDigit('0')}
                   className="premium-btn premium-keypad h-14 min-[390px]:h-16 md:h-20 text-2xl md:text-3xl"
                >
                   0
                </button>
                <button
                   onClick={handleEnter}
                   className="premium-btn premium-btn-success h-14 min-[390px]:h-16 md:h-20"
                   title="Enter"
                >
                   <Check className="w-7 h-7 stroke-[3]" />
                </button>
             </div>
          </div>
       </div>
    </div>
  );
};

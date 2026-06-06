import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Settings, MathProblem, Difficulty, GameMode } from '../types';
import { generateProblem, getOperationSymbol } from '../utils/mathGenerator';
import { Timer, Trophy, CheckCircle, XCircle, Delete, Home } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

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
  
  const questionStartTimeRef = useRef(Date.now());

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
      setTimeLeft(prev => prev - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [timeLeft, onEndGame, score, totalSubmissions, history, settings.gameMode]);

  const handleCorrectAnswer = useCallback((timeSpentParam?: number) => {
    setFeedback('correct');
    
    // timeSpentParam can be passed if we call this from event handler to ensure exact timing
    const timeSpent = timeSpentParam ?? ((Date.now() - questionStartTimeRef.current) / 1000);
    
    setScore(s => s + 1);
    setTotalSubmissions(t => t + 1);
    const newStreak = streak + 1;
    setStreak(newStreak);

    // Save to history (only correct answers are logged in history for time metrics)
    const problemToSave = currentProblem;
    const diffToSave = currentDifficulty;
    setHistory(prev => [...prev, {
        problem: problemToSave,
        timeSpent,
        difficulty: diffToSave
    }]);

    // Progressive logic if enabled
    let nextDifficulty = currentDifficulty;
    if (settings.adaptiveDifficulty) {
       if (newStreak >= 3 && timeSpent < 5) {
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
  }, [currentDifficulty, currentProblem, streak, settings]);

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
         setTotalSubmissions(t => t + 1);
         setStreak(0);
     }
  }, [currentProblem, inputValue, feedback, handleCorrectAnswer]);

  const handleBackspace = useCallback(() => {
      if (feedback === 'correct') return;
      if (feedback === 'incorrect') {
          setInputValue('');
          setFeedback(null);
      } else {
          setInputValue(prev => prev.slice(0, -1));
      }
  }, [feedback]);

  const onSkip = useCallback(() => {
      setStreak(0);
      setInputValue('');
      setFeedback(null);
      setCurrentProblem(generateProblem(currentDifficulty, settings.operations));
      setProblemIndex(i => i + 1);
      questionStartTimeRef.current = Date.now();
  }, [currentDifficulty, settings.operations]);

  // Keyboard support
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key >= '0' && e.key <= '9') {
        handleDigit(e.key);
      } else if (e.key === 'Backspace') {
        handleBackspace();
      } else if (e.key === ' ' || e.key === 'Enter') {
         if (feedback === 'incorrect') {
             e.preventDefault();
             onSkip();
         }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleDigit, handleBackspace, onSkip, feedback]);

  if (!currentProblem) return null;

  return (
    <div className="w-full max-w-4xl mx-auto flex flex-col items-center justify-between min-h-[100dvh] relative px-4 pb-8 pt-16 sm:py-8 select-none overflow-x-hidden">
       
       {/* Small floating info panel in the top corners */}
       <div className="absolute top-4 right-4 flex flex-col items-end gap-2 z-20">
          {settings.gameMode === GameMode.TIMED && (
              <div className="flex flex-col items-end">
                 <span className="text-[10px] uppercase tracking-widest text-slate-400 font-bold mb-0.5 font-mono">Time</span>
                 <span className={`text-2xl font-mono font-bold tracking-tighter leading-none ${timeLeft <= 10 ? 'text-rose-500 animate-pulse' : 'text-slate-400'}`}>
                     {Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')}
                 </span>
              </div>
          )}
          <button 
             onClick={onHome}
             className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-700 text-[10px] font-bold uppercase tracking-widest rounded-lg transition-colors shadow-sm cursor-pointer"
          >
             <Home className="w-3 h-3" />
             Home
          </button>
       </div>

       <div className="absolute top-4 left-4 flex flex-col items-start gap-2 z-20">
          <div className="flex flex-col items-start">
             <span className="text-[10px] uppercase tracking-widest text-slate-400 font-bold mb-0.5 font-mono">Score</span>
             <div className="flex items-center gap-1 text-slate-800 font-bold text-2xl font-mono tracking-tighter leading-none">
                 {score}
             </div>
          </div>
       </div>

       {/* Main Page Layout */}
       <div className="w-full flex-1 flex flex-col items-center justify-center my-auto py-4">
            <div className="text-[11px] font-black text-indigo-950/40 uppercase tracking-widest mb-2 font-mono">Difficulty: {currentDifficulty}</div>
            
            {/* Equation with fast swipe animation */}
            <AnimatePresence mode="popLayout">
              <motion.div 
                key={problemIndex} // update exactly on next problem
                initial={{ opacity: 0, scale: 0.95, y: 15 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 1.05, y: -15 }}
                transition={{ duration: 0.1 }}
                className="flex flex-col items-center justify-center relative w-full max-w-full px-2"
              >
                 <div className="text-[clamp(42px,12vw,92px)] sm:text-[96px] md:text-[128px] lg:text-[150px] font-black text-slate-800 tracking-tighter flex flex-wrap items-center justify-center gap-x-3 sm:gap-x-6 gap-y-1 z-10 my-2 leading-none font-sans w-full max-w-full text-center">
                    <span>{currentProblem.num1}</span>
                    <span className="text-slate-300 font-light select-none">{getOperationSymbol(currentProblem.operation)}</span>
                    <span>{currentProblem.num2}</span>
                    <span className="text-slate-200 font-thin italic select-none">=</span>
                    
                    {/* Typed Answer Field */}
                    <span className={`min-w-[80px] sm:min-w-[130px] px-2 h-[1.1em] border-b-4 flex items-center justify-center transition-colors duration-100 ${
                        feedback === 'correct' ? 'border-emerald-500 text-emerald-500' : 
                        feedback === 'incorrect' ? 'border-rose-500 text-rose-500' : 
                        inputValue ? 'border-slate-800 text-slate-800' : 'border-slate-300 text-slate-300'
                    }`}>
                       {inputValue ? (
                           <span className="font-mono text-[clamp(42px,12vw,92px)] sm:text-[96px] md:text-[128px] lg:text-[150px] font-black">{inputValue}</span>
                       ) : (
                           <span className="opacity-40 text-slate-300 font-mono text-[clamp(36px,10vw,80px)] sm:text-[80px] font-normal">?</span> 
                       )}
                    </span>
                 </div>
              </motion.div>
            </AnimatePresence>

            {/* Number Pad Container */}
            <div className="w-full max-w-sm mt-4 sm:mt-6 px-1.5 pb-safe">
                <AnimatePresence>
                   {feedback === 'incorrect' && (
                      <motion.div 
                         initial={{ opacity: 0, height: 0 }} 
                         animate={{ opacity: 1, height: 'auto' }} 
                         exit={{ opacity: 0, height: 0 }}
                         className="w-full mb-3 flex justify-center"
                      >
                         <button 
                            onClick={onSkip}
                            className="flex items-center gap-2 bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-600 px-4 py-2.5 rounded-xl font-bold tracking-widest uppercase text-[10px] transition-colors w-full justify-center cursor-pointer shadow-sm active:scale-98"
                         >
                            <XCircle className="w-3.5 h-3.5" /> Skip Question
                         </button>
                      </motion.div>
                   )}
                </AnimatePresence>

                <div className="grid grid-cols-3 gap-2 md:gap-3">
                   {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(num => (
                      <button
                         key={num}
                         onClick={() => handleDigit(num.toString())}
                         className="bg-slate-100/95 hover:bg-slate-200/90 active:bg-slate-300 text-slate-800 font-black rounded-2xl flex items-center justify-center transition-all cursor-pointer shadow-sm text-2xl sm:text-3xl hover:scale-101 active:scale-95"
                         style={{ height: 'clamp(70px, 15vw, 102px)' }}
                      >
                         {num}
                      </button>
                   ))}
                   
                   {/* Empty cell or dot ? We don't have decimals. */}
                   <div className="bg-transparent border-2 border-dashed border-slate-100/80 rounded-2xl"></div>
                   
                   <button
                      onClick={() => handleDigit('0')}
                      className="bg-slate-100/95 hover:bg-slate-200/90 active:bg-slate-300 text-slate-800 font-black rounded-2xl flex items-center justify-center transition-all cursor-pointer shadow-sm text-2xl sm:text-3xl hover:scale-101 active:scale-95"
                      style={{ height: 'clamp(70px, 15vw, 102px)' }}
                   >
                      0
                   </button>

                   <button
                      onClick={handleBackspace}
                      className="bg-slate-200 hover:bg-slate-350 active:bg-slate-400 text-slate-600 rounded-2xl flex items-center justify-center transition-all cursor-pointer shadow-sm hover:scale-101 active:scale-95"
                      style={{ height: 'clamp(70px, 15vw, 102px)' }}
                   >
                      <Delete className="w-6 h-6 sm:w-7 sm:h-7" />
                   </button>
                </div>
                
                <p className="text-center text-[10px] uppercase font-bold tracking-widest text-slate-300 mt-4 hidden sm:block font-mono">
                   Keyboard input supported
                </p>
            </div>
       </div>

    </div>
  );
};


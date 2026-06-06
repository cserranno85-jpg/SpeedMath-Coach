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
    if (settings.aiProgressiveHardening) {
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
    <div className="w-full max-w-4xl mx-auto flex flex-col items-center justify-center min-h-[100dvh] relative px-4 select-none">
       
       {/* Small floating info panel in the top corners */}
       <div className="absolute top-4 right-4 flex flex-col items-end gap-2 z-20">
          {settings.gameMode === GameMode.TIMED && (
              <div className="flex flex-col items-end">
                 <span className="text-[10px] uppercase tracking-widest text-slate-400 font-bold mb-0.5">Time</span>
                 <span className={`text-2xl font-mono font-bold tracking-tighter ${timeLeft <= 10 ? 'text-rose-500 animate-pulse' : 'text-slate-400'}`}>
                     {Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')}
                 </span>
              </div>
          )}
          <button 
             onClick={onHome}
             className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-700 text-[10px] font-bold uppercase tracking-widest rounded-md transition-colors shadow-sm"
          >
             <Home className="w-3 h-3" />
             Home
          </button>
       </div>

       <div className="absolute top-4 left-4 flex flex-col items-start gap-2 z-20">
          <div className="flex flex-col items-start">
             <span className="text-[10px] uppercase tracking-widest text-slate-400 font-bold mb-0.5">Score</span>
             <div className="flex items-center gap-1 text-slate-800 font-bold text-2xl font-mono tracking-tighter">
                 {score}
             </div>
          </div>
       </div>

       {/* Main Page Layout */}
       <div className="w-full flex-1 flex flex-col items-center justify-center mt-12 md:mt-0">
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

           {/* Number Pad Container */}
           <div className="w-full max-w-sm mt-8">
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
                        className="bg-slate-100 hover:bg-slate-200 active:bg-slate-300 text-slate-800 md:text-3xl font-black aspect-square rounded-2xl md:rounded-[32px] flex items-center justify-center transition-colors"
                     >
                        {num}
                     </button>
                  ))}
                  
                  {/* Empty cell or dot ? We don't have decimals. */}
                  <div className="bg-transparent border-2 border-dashed border-slate-100 rounded-2xl md:rounded-[32px]"></div>
                  
                  <button
                     onClick={() => handleDigit('0')}
                     className="bg-slate-100 hover:bg-slate-200 active:bg-slate-300 text-slate-800 md:text-3xl font-black aspect-square rounded-2xl md:rounded-[32px] flex items-center justify-center transition-colors"
                  >
                     0
                  </button>

                  <button
                     onClick={handleBackspace}
                     className="bg-slate-200 hover:bg-slate-300 active:bg-slate-400 text-slate-600 aspect-square rounded-2xl md:rounded-[32px] flex items-center justify-center transition-colors"
                  >
                     <Delete className="w-6 h-6 md:w-8 md:h-8" />
                  </button>
               </div>
               
               <p className="text-center text-[10px] uppercase font-bold tracking-widest text-slate-300 mt-6 md:mt-8 hidden md:block">
                  Keyboard input supported
               </p>
           </div>
       </div>

    </div>
  );
};


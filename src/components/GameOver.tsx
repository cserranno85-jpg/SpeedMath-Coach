import React from 'react';
import { GameSession, Difficulty } from '../types';
import { RotateCw, Trophy, BarChart, TrendingUp, Clock } from 'lucide-react';
import { motion } from 'motion/react';

interface GameOverProps {
  score: number;
  totalQuestions: number;
  history: any[];
  onPlayAgain: () => void;
  onMenu: () => void;
}

export const GameOver: React.FC<GameOverProps> = ({ score, totalQuestions, history, onPlayAgain, onMenu }) => {
  const accuracy = totalQuestions > 0 ? Math.round((score / totalQuestions) * 100) : 0;
  
  // Group history by time interval
  const under3s = history.filter(h => h.timeSpent <= 3).length;
  const under5s = history.filter(h => h.timeSpent > 3 && h.timeSpent <= 5).length;
  const over5s = history.filter(h => h.timeSpent > 5).length;

  return (
    <motion.div 
       initial={{ opacity: 0, y: 20 }}
       animate={{ opacity: 1, y: 0 }}
       className="w-full max-w-xl mx-auto bg-white rounded-2xl border border-slate-200 shadow-sm p-8"
    >
       <div className="text-center mb-8">
            <div className="w-16 h-16 bg-slate-50 border border-slate-200 text-slate-400 rounded-2xl flex items-center justify-center mx-auto mb-6 transform -rotate-6">
                <Trophy className="w-8 h-8" />
            </div>
            <h2 className="text-3xl font-bold text-slate-800 tracking-tighter">Session Complete</h2>
            <p className="text-xs text-slate-500 font-medium tracking-tight mt-2">Here is your speed math performance.</p>
       </div>

       <div className="grid grid-cols-2 gap-4 mb-8">
          <div className="bg-slate-50 p-6 rounded-xl border border-slate-200 flex flex-col items-center justify-center">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Score</span>
              <span className="text-4xl font-mono font-bold text-indigo-600 tracking-tighter">{score}</span>
          </div>
          <div className="bg-slate-50 p-6 rounded-xl border border-slate-200 flex flex-col items-center justify-center">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Accuracy</span>
              <span className="text-4xl font-mono font-bold text-emerald-600 tracking-tighter">{accuracy}%</span>
          </div>
       </div>

       <div className="mb-8">
           <h3 className="text-[10px] font-bold text-slate-800 uppercase tracking-widest mb-4 flex items-center gap-2 border-b border-slate-100 pb-2">
               <Clock className="w-4 h-4" /> Speed Intervals
           </h3>
           <div className="space-y-3">
               <div className="flex items-center justify-between p-3 bg-slate-50 border border-slate-100 text-slate-700 rounded-lg">
                   <div className="flex items-center gap-2 text-xs font-bold">Under 3 seconds</div>
                   <div className="font-mono font-bold text-indigo-600 text-sm">{under3s} <span className="text-[10px] text-slate-400">ans</span></div>
               </div>
               <div className="flex items-center justify-between p-3 bg-slate-50 border border-slate-100 text-slate-700 rounded-lg">
                   <div className="flex items-center gap-2 text-xs font-bold">3 - 5 seconds</div>
                   <div className="font-mono font-bold text-indigo-600 text-sm">{under5s} <span className="text-[10px] text-slate-400">ans</span></div>
               </div>
               <div className="flex items-center justify-between p-3 bg-slate-50 border border-slate-100 text-slate-700 rounded-lg">
                   <div className="flex items-center gap-2 text-xs font-bold">Over 5 seconds</div>
                   <div className="font-mono font-bold text-indigo-600 text-sm">{over5s} <span className="text-[10px] text-slate-400">ans</span></div>
               </div>
           </div>
       </div>

       <div className="flex gap-4">
           <button 
             onClick={onMenu}
             className="flex-1 py-4 bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-500 rounded-xl font-bold text-sm tracking-widest uppercase flex items-center justify-center transition-colors"
           >
              Settings
           </button>
           <button 
             onClick={onPlayAgain}
             className="flex-1 py-4 bg-indigo-900 border border-indigo-900 hover:bg-indigo-800 text-white rounded-xl font-bold text-sm tracking-widest uppercase flex items-center justify-center gap-2 transition-transform active:scale-95 shadow-lg"
           >
             <RotateCw className="w-4 h-4" /> Play Again
           </button>
       </div>
    </motion.div>
  );
};

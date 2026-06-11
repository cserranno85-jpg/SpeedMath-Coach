import React, { useEffect, useState } from 'react';
import { GameSession, Difficulty } from '../types';
import { RotateCw, Trophy, Clock, Award, Star } from 'lucide-react';
import { motion } from 'motion/react';
import { evaluateAchievements, Badge } from '../utils/streakAndAchievements';
import { sounds } from '../utils/soundEngine';
import pibotMascot from '../assets/images/pibot-mascot.jpg';

interface GameOverProps {
  score: number;
  totalQuestions: number;
  history: any[];
  onPlayAgain: () => void;
  onMenu: () => void;
}

export const GameOver: React.FC<GameOverProps> = ({ score, totalQuestions, history, onPlayAgain, onMenu }) => {
  const accuracy = totalQuestions > 0 ? Math.round((score / totalQuestions) * 100) : 0;
  const [unlockedNow, setUnlockedNow] = useState<Badge[]>([]);
  
  // Group history by time interval
  const under3s = history.filter(h => h.timeSpent <= 3).length;
  const under5s = history.filter(h => h.timeSpent > 3 && h.timeSpent <= 5).length;
  const over5s = history.filter(h => h.timeSpent > 5).length;

  useEffect(() => {
    // Play descriptive sound cue depending on calibration score results
    if (accuracy >= 80 && score > 0) {
      sounds.playAchievement();
    } else if (score > 0) {
      sounds.playCorrect();
    } else {
      sounds.playIncorrect();
    }

    const raw = localStorage.getItem('speedMathProgress');
    if (raw) {
      try {
        const parsed = JSON.parse(raw);
        const badgesList = evaluateAchievements(parsed);
        // Filter badges that are actually unlocked
        setUnlockedNow(badgesList.filter(b => b.unlocked));
      } catch (e) {}
    }
  }, []);

  const getReactiveMascotMessage = () => {
    if (accuracy === 100 && score > 0) {
      return `Masterful calculation skill! Absolute complete accuracy (100%) across all ${score} solutions! Truly a legend.`;
    }
    if (accuracy >= 80) {
      return `Outstanding execution! Highly refined calculation metrics verified. You calibrated at a remarkable ${accuracy}% precision level!`;
    }
    if (accuracy >= 50) {
      return `Decent runtime stats! Logic patterns are warm and functioning correctly. Let's do another run to break above 80%!`;
    }
    return `Session indexed. Practice drives neuroplasticity! Try adjusting difficulty to build a confidence run.`;
  };

  return (
    <motion.div 
       id="gameover_screen_root"
       initial={{ opacity: 0, y: 20 }}
       animate={{ opacity: 1, y: 0 }}
       className="w-full max-w-xl mx-auto bg-white rounded-2xl border-2 border-slate-200 shadow-xl p-6 md:p-8"
    >
       {/* High Polish Mascot Presenter Header */}
       <div className="flex flex-col sm:flex-row items-center gap-5 p-5 bg-gradient-to-br from-indigo-900 to-indigo-950 rounded-2xl border border-indigo-800 text-white mb-6 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 rounded-full filter blur-2xl pointer-events-none"></div>
          
          {/* Animated 3D Mascot Avatar Frame */}
          <div className="relative shrink-0 select-none">
             <div className="w-20 h-20 transform -rotate-3 hover:rotate-0 transition-transform duration-300 animate-float-pibot">
                <img 
                   src={pibotMascot}
                   alt="Pi-bot 3D Mascot"
                   className="w-full h-full object-cover rounded-full filter drop-shadow-md"
                   referrerPolicy="no-referrer"
                />
             </div>
          </div>

          <div className="flex-1 text-center sm:text-left">
             <h3 className="text-xs uppercase font-extrabold tracking-widest text-amber-400 flex items-center justify-center sm:justify-start gap-1">
                <Trophy className="w-3.5 h-3.5 text-yellow-400" /> Pi-bot Advisor Report
             </h3>
             <p className="text-xs font-semibold text-indigo-100 mt-1.5 italic leading-relaxed">
                "{getReactiveMascotMessage()}"
             </p>
          </div>
       </div>

       <div className="text-center mb-6">
            <h2 className="text-2xl font-black text-slate-800 tracking-tight">Practice Complete</h2>
            <p className="text-xs text-slate-400 font-medium tracking-tight mt-1">Here is your speed math performance.</p>
       </div>

       <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="bg-slate-50 p-6 rounded-xl border border-slate-200 flex flex-col items-center justify-center">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Score</span>
              <span className="text-4xl font-mono font-bold text-indigo-600 tracking-tighter">{score}</span>
          </div>
          <div className="bg-slate-50 p-6 rounded-xl border border-slate-200 flex flex-col items-center justify-center">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Accuracy</span>
              <span className="text-4xl font-mono font-bold text-emerald-600 tracking-tighter">{accuracy}%</span>
          </div>
       </div>

       {/* Unlocked Badges Tray on gameover */}
       {unlockedNow.length > 0 && (
         <div id="unlocked_badges_toast_tray" className="mb-6 bg-amber-50/50 p-4 rounded-xl border border-amber-200/60 shadow-sm shadow-amber-50 animate-pulse">
            <h4 className="text-[10px] font-bold text-amber-800 uppercase tracking-widest mb-3 flex items-center gap-1.5">
               <Star className="w-4 h-4 text-amber-500 fill-amber-500" /> Achievements Unlocked ({unlockedNow.length})
            </h4>
            <div className="flex flex-wrap gap-2">
               {unlockedNow.map(badge => (
                  <span 
                    key={badge.id}
                    title={badge.description}
                    className="flex items-center gap-1.5 bg-white border border-amber-300 text-amber-800 px-3 py-1.5 rounded-full text-[10px] lg:text-xs font-bold shadow-sm"
                  >
                     <Award className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                     {badge.title}
                  </span>
               ))}
            </div>
         </div>
       )}

       <div className="mb-8">
            <h3 className="text-[10px] font-bold text-slate-800 uppercase tracking-widest mb-4 flex items-center gap-2 border-b border-slate-100 pb-2">
                <Clock className="w-4 h-4 text-slate-500" /> Speed Intervals
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
              id="btn_gameover_settings"
              onClick={() => { sounds.playClick(); onMenu(); }}
              className="flex-1 py-4 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-500 hover:text-slate-700 rounded-2xl font-bold text-xs tracking-widest uppercase flex items-center justify-center transition-all duration-150 transform active:scale-95 cursor-pointer shadow-sm"
            >
               Settings
            </button>
            <button 
              id="btn_gameover_playagain"
              onClick={() => { sounds.playClick(); onPlayAgain(); }}
              className="flex-1 py-4 gold-button text-amber-950 rounded-2xl font-black text-xs tracking-widest uppercase flex items-center justify-center gap-2 transition-all duration-150 transform active:scale-95 cursor-pointer shadow-[0_4px_15px_rgba(217,119,6,0.25)]"
            >
              <RotateCw className="w-4 h-4" /> Play Again
            </button>
       </div>
    </motion.div>
  );
};

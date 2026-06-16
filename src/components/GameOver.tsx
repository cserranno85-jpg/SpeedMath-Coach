import React, { useEffect } from 'react';
import { RotateCw, Trophy, Clock, Star } from 'lucide-react';
import { motion } from 'motion/react';
import { Badge } from '../utils/streakAndAchievements';
import { sounds } from '../utils/soundEngine';
import {
  badgeArtByAchievementId,
  badges as badgeAssets,
  brandMarks,
  buttonGlows,
  fx,
  mascots,
  panels,
} from '../assets/uiAssetRegistry';

interface GameOverProps {
  score: number;
  totalQuestions: number;
  history: any[];
  unlockedBadges: Badge[];
  onPlayAgain: () => void;
  onMenu: () => void;
}

const modalPanelStyle = (asset: string, overlay = 'rgba(8, 13, 32, 0.84)'): React.CSSProperties => ({
  backgroundImage: `linear-gradient(135deg, ${overlay}, rgba(2, 6, 23, 0.92)), url(${asset})`,
  backgroundPosition: 'center',
  backgroundSize: 'cover',
});

export const GameOver: React.FC<GameOverProps> = ({ score, totalQuestions, history, unlockedBadges, onPlayAgain, onMenu }) => {
  const accuracy = totalQuestions > 0 ? Math.round((score / totalQuestions) * 100) : 0;
  
  // Group history by time interval
  const under3s = history.filter(h => h.timeSpent <= 3).length;
  const under5s = history.filter(h => h.timeSpent > 3 && h.timeSpent <= 5).length;
  const over5s = history.filter(h => h.timeSpent > 5).length;

  useEffect(() => {
    // Play descriptive sound cue depending on calibration score results
    if (accuracy >= 80 && score > 0) {
      sounds.playAchievement();
    } else if (score > 0) {
      sounds.playGameOver();
    } else {
      sounds.playIncorrect();
    }

  }, [accuracy, score]);

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
       className="relative mx-auto w-full max-w-xl overflow-hidden rounded-[1.85rem] border border-cyan-300/45 bg-slate-950/88 p-5 text-white shadow-[0_20px_60px_rgba(8,47,73,0.42),inset_0_1px_0_rgba(255,255,255,0.08)] backdrop-blur-xl md:p-8"
       style={modalPanelStyle(panels.modalGlow)}
    >
       <img src={fx.mathParticles} alt="" aria-hidden="true" className="absolute inset-0 h-full w-full object-cover opacity-10 mix-blend-screen pointer-events-none" />
       <div className="relative z-10">
       <div className="mb-4 flex items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3">
             <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl border border-cyan-200/35 bg-cyan-300/10 shadow-[0_0_22px_rgba(34,211,238,0.2)]">
                <img src={brandMarks.primaryLogo} alt="SpeedMath Coach logo" className="h-10 w-10 object-contain drop-shadow-[0_0_12px_rgba(251,191,36,0.3)]" />
             </div>
             <div className="min-w-0">
                <p className="text-[10px] font-black uppercase tracking-[0.22em] text-cyan-300">SpeedMath</p>
                <p className="text-lg font-black leading-tight text-white">Session Report</p>
             </div>
          </div>
       </div>
       {/* High Polish Mascot Presenter Header */}
       <div className="relative mb-6 flex flex-col items-center gap-5 overflow-hidden rounded-[1.5rem] border border-cyan-300/28 bg-slate-950/62 p-5 text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.06)] sm:flex-row">
          <img src={fx.goldSparkBurst} alt="" aria-hidden="true" className="absolute -top-12 -right-12 w-36 h-36 opacity-25 mix-blend-screen pointer-events-none" />
          
          {/* Animated 3D Mascot Avatar Frame */}
          <div className="relative shrink-0 select-none">
             <div className="w-20 h-20 transform -rotate-3 hover:rotate-0 transition-transform duration-300 animate-float-pibot">
                <img 
                   src={mascots.pointing}
                   alt="Pi-bot coach"
                   className="w-full h-full object-contain filter drop-shadow-[0_10px_18px_rgba(34,211,238,0.28)]"
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
            <h2 className="text-2xl font-black text-cyan-50 tracking-tight">Practice Complete</h2>
            <p className="text-xs text-cyan-100/55 font-medium tracking-tight mt-1">Here is your speed math performance.</p>
       </div>

       <div className="grid grid-cols-2 gap-3 mb-6">
          <div className="bg-slate-950/70 p-5 rounded-[1.35rem] border border-cyan-300/35 flex flex-col items-center justify-center shadow-[0_0_22px_rgba(34,211,238,0.12)]" style={modalPanelStyle(panels.statsCard, 'rgba(10, 28, 52, 0.74)')}>
              <span className="text-[10px] font-bold text-cyan-100/55 uppercase tracking-widest mb-1">Score</span>
              <span className="text-4xl font-mono font-bold text-cyan-200 tracking-tighter">{score}</span>
          </div>
          <div className="bg-slate-950/70 p-5 rounded-[1.35rem] border border-amber-300/35 flex flex-col items-center justify-center shadow-[0_0_22px_rgba(251,191,36,0.12)]" style={modalPanelStyle(panels.statsCard, 'rgba(34, 28, 39, 0.74)')}>
              <span className="text-[10px] font-bold text-amber-100/60 uppercase tracking-widest mb-1">Accuracy</span>
              <span className="text-4xl font-mono font-bold text-amber-200 tracking-tighter">{accuracy}%</span>
          </div>
       </div>

       {/* Unlocked Badges Tray on gameover */}
       {unlockedBadges.length > 0 && (
         <div id="unlocked_badges_toast_tray" className="mb-6 bg-amber-200/10 p-4 rounded-xl border border-amber-300/45 shadow-[0_0_22px_rgba(251,191,36,0.12)] relative overflow-hidden">
            <img src={badgeAssets.unlockBurst} alt="" aria-hidden="true" className="absolute -right-14 -top-14 h-36 w-36 opacity-25 mix-blend-screen pointer-events-none" />
            <h4 className="relative text-[10px] font-bold text-amber-200 uppercase tracking-widest mb-3 flex items-center gap-1.5">
               <Star className="w-4 h-4 text-amber-500 fill-amber-500" /> New Achievements ({unlockedBadges.length})
            </h4>
            <div className="relative flex flex-wrap gap-2">
               {unlockedBadges.map(badge => (
                  <span 
                    key={badge.id}
                    title={badge.description}
                    className="flex items-center gap-1.5 bg-slate-950/75 border border-amber-300/45 text-amber-100 px-3 py-1.5 rounded-full text-[10px] lg:text-xs font-bold shadow-sm"
                  >
                     <img src={badgeArtByAchievementId[badge.id] ?? badgeAssets.firstSolve} alt="" aria-hidden="true" className="w-5 h-5 object-contain shrink-0" />
                     {badge.title}
                  </span>
               ))}
            </div>
         </div>
       )}

       <div className="mb-8">
            <h3 className="text-[10px] font-bold text-cyan-50 uppercase tracking-widest mb-4 flex items-center gap-2 border-b border-cyan-100/15 pb-2">
                <Clock className="w-4 h-4 text-cyan-300" /> Speed Intervals
            </h3>
            <div className="space-y-3">
                <div className="flex items-center justify-between rounded-2xl border border-cyan-100/15 bg-slate-950/65 p-3 text-cyan-50">
                    <div className="flex items-center gap-2 text-xs font-bold">Under 3 seconds</div>
                    <div className="font-mono font-bold text-cyan-300 text-sm">{under3s} <span className="text-[10px] text-cyan-100/45">ans</span></div>
                </div>
                <div className="flex items-center justify-between rounded-2xl border border-cyan-100/15 bg-slate-950/65 p-3 text-cyan-50">
                    <div className="flex items-center gap-2 text-xs font-bold">3 - 5 seconds</div>
                    <div className="font-mono font-bold text-cyan-300 text-sm">{under5s} <span className="text-[10px] text-cyan-100/45">ans</span></div>
                </div>
                <div className="flex items-center justify-between rounded-2xl border border-cyan-100/15 bg-slate-950/65 p-3 text-cyan-50">
                    <div className="flex items-center gap-2 text-xs font-bold">Over 5 seconds</div>
                    <div className="font-mono font-bold text-cyan-300 text-sm">{over5s} <span className="text-[10px] text-cyan-100/45">ans</span></div>
                </div>
            </div>
       </div>

       <div className="flex gap-4">
            <button 
              id="btn_gameover_settings"
              onClick={() => { sounds.playClick(); onMenu(); }}
              className="flex-1 py-4 bg-slate-950/75 hover:bg-slate-900 border border-cyan-100/20 text-cyan-100/70 hover:text-cyan-100 rounded-2xl font-bold text-xs tracking-widest uppercase flex items-center justify-center transition-all duration-150 transform active:scale-95 cursor-pointer shadow-sm"
            >
               Settings
            </button>
            <button 
              id="btn_gameover_playagain"
              onClick={() => { sounds.playClick(); onPlayAgain(); }}
              className="flex-1 py-4 text-amber-950 rounded-2xl font-black text-xs tracking-widest uppercase flex items-center justify-center gap-2 transition-all duration-150 transform active:scale-95 cursor-pointer shadow-[0_0_22px_rgba(251,191,36,0.25)] border border-amber-100"
              style={{
                backgroundImage: `linear-gradient(180deg, rgba(251, 191, 36, 0.9), rgba(245, 158, 11, 0.95)), url(${buttonGlows.primary})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
              }}
            >
              <RotateCw className="w-4 h-4" /> Play Again
            </button>
       </div>
       </div>
    </motion.div>
  );
};

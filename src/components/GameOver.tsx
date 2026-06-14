import React, { useEffect } from 'react';
import { RotateCw, Trophy, Clock, Award, Star, Home, Target } from 'lucide-react';
import { motion } from 'motion/react';
import { Badge } from '../utils/streakAndAchievements';
import { sounds } from '../utils/soundEngine';
import pibotMascot from '../assets/images/pibot-mascot.jpg';

interface GameOverProps {
  score: number;
  totalQuestions: number;
  history: any[];
  unlockedBadges: Badge[];
  onPlayAgain: () => void;
  onMenu: () => void;
}

export const GameOver: React.FC<GameOverProps> = ({ score, totalQuestions, history, unlockedBadges, onPlayAgain, onMenu }) => {
  const accuracy = totalQuestions > 0 ? Math.round((score / totalQuestions) * 100) : 0;
  const under3s = history.filter(h => h.timeSpent <= 3).length;
  const under5s = history.filter(h => h.timeSpent > 3 && h.timeSpent <= 5).length;
  const over5s = history.filter(h => h.timeSpent > 5).length;

  useEffect(() => {
    if (unlockedBadges.length > 0) {
      sounds.play('achievement');
      return;
    }

    sounds.play('endRound');
  }, [unlockedBadges.length]);

  const getReactiveMascotMessage = () => {
    if (accuracy === 100 && score > 0) return `Perfect round: ${score} clean solves with no misses. That is elite focus.`;
    if (accuracy >= 80) return `Strong session. ${accuracy}% accuracy is ready for a faster restart or a harder setup.`;
    if (accuracy >= 50) return `Useful reps logged. Tighten the inputs and aim for 80% next round.`;
    return 'Session saved. Lower the difficulty or isolate one operation to rebuild rhythm.';
  };

  return (
    <motion.div
      id="gameover_screen_root"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full max-w-3xl mx-auto rounded-[2rem] border border-white/15 bg-slate-950/78 p-5 sm:p-7 text-white shadow-[0_24px_70px_rgba(0,0,0,0.42)]"
    >
      <div className="rounded-3xl bg-gradient-to-br from-blue-700 via-indigo-700 to-purple-700 p-5 relative overflow-hidden">
        <div className="absolute right-4 top-4 text-yellow-300/25">
          <Trophy className="w-24 h-24" />
        </div>
        <div className="relative flex flex-col sm:flex-row items-center gap-5">
          <div className="w-24 h-24 rounded-[2rem] bg-yellow-300 p-1 shadow-[0_0_36px_rgba(250,204,21,0.34)]">
            <img src={pibotMascot} alt="Pi-bot 3D Mascot" className="w-full h-full rounded-[1.6rem] object-cover animate-float-pibot" referrerPolicy="no-referrer" />
          </div>
          <div className="text-center sm:text-left">
            <div className="text-xs font-black uppercase text-yellow-300 flex items-center justify-center sm:justify-start gap-2">
              <Trophy className="w-4 h-4" /> Pi-bot Reward Report
            </div>
            <h1 className="mt-1 text-3xl sm:text-4xl font-black">Practice Complete</h1>
            <p className="mt-2 text-sm sm:text-base text-blue-50 leading-relaxed">{getReactiveMascotMessage()}</p>
          </div>
        </div>
      </div>

      <div className="mt-5 grid grid-cols-2 gap-3">
        <div className="rounded-3xl bg-gradient-to-br from-yellow-300 to-orange-400 p-5 text-slate-950">
          <div className="text-xs font-black uppercase opacity-75">Score</div>
          <div className="mt-1 text-5xl font-mono font-black">{score}</div>
        </div>
        <div className="rounded-3xl bg-gradient-to-br from-emerald-300 to-teal-400 p-5 text-slate-950">
          <div className="text-xs font-black uppercase opacity-75 flex items-center gap-2"><Target className="w-4 h-4" /> Accuracy</div>
          <div className="mt-1 text-5xl font-mono font-black">{accuracy}%</div>
        </div>
      </div>

      {unlockedBadges.length > 0 && (
        <div id="unlocked_badges_toast_tray" className="mt-5 rounded-3xl border border-yellow-300/40 bg-yellow-300/12 p-4">
          <h2 className="text-xs font-black uppercase text-yellow-300 flex items-center gap-2">
            <Star className="w-4 h-4 fill-yellow-300" /> New Achievements ({unlockedBadges.length})
          </h2>
          <div className="mt-3 flex flex-wrap gap-2">
            {unlockedBadges.map(badge => (
              <span key={badge.id} title={badge.description} className="rounded-full bg-yellow-300 px-3 py-2 text-xs font-black text-slate-950 flex items-center gap-2">
                <Award className="w-4 h-4" /> {badge.title}
              </span>
            ))}
          </div>
        </div>
      )}

      <div className="mt-5">
        <h2 className="mb-3 text-xs font-black uppercase text-cyan-200 flex items-center gap-2">
          <Clock className="w-4 h-4" /> Speed Intervals
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          {[
            { label: 'Under 3 seconds', value: under3s, tone: 'bg-emerald-400 text-slate-950' },
            { label: '3 - 5 seconds', value: under5s, tone: 'bg-cyan-400 text-slate-950' },
            { label: 'Over 5 seconds', value: over5s, tone: 'bg-orange-400 text-slate-950' },
          ].map(item => (
            <div key={item.label} className={`rounded-2xl ${item.tone} p-4`}>
              <div className="text-[11px] font-black uppercase opacity-75">{item.label}</div>
              <div className="mt-1 text-3xl font-mono font-black">{item.value}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-3">
        <button
          id="btn_gameover_playagain"
          onClick={() => { sounds.play('startRound'); onPlayAgain(); }}
          className="premium-btn premium-btn-primary sm:col-span-2 rounded-3xl px-5 py-4 text-sm"
        >
          <RotateCw className="w-5 h-5" /> Play Again
        </button>
        <button
          id="btn_gameover_settings"
          onClick={() => { sounds.play('uiTap'); onMenu(); }}
          className="premium-btn premium-btn-neutral rounded-3xl px-5 py-4 text-sm"
        >
          <Home className="w-5 h-5" /> Menu
        </button>
      </div>
    </motion.div>
  );
};

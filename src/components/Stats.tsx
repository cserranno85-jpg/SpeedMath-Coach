import React, { useEffect, useState } from 'react';
import { 
  Trophy, ArrowLeft, Target, Clock, Zap, BarChart3, AlertCircle, Activity, Check, Lock
} from 'lucide-react';
import { 
  ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend 
} from 'recharts';
import { evaluateAchievements, Badge } from '../utils/streakAndAchievements';
import { sounds } from '../utils/soundEngine';
import {
  badgeArtByAchievementId,
  badges as badgeAssets,
  fx,
  mascots,
  panels,
} from '../assets/uiAssetRegistry';

interface StatsProps {
  onBack: () => void;
}

const profilePanelStyle = (asset: string, overlay = 'rgba(8, 13, 32, 0.82)'): React.CSSProperties => ({
  backgroundImage: `linear-gradient(135deg, ${overlay}, rgba(2, 6, 23, 0.92)), url(${asset})`,
  backgroundPosition: 'center',
  backgroundSize: 'cover',
});

export const Stats: React.FC<StatsProps> = ({ onBack }) => {
  const [progress, setProgress] = useState<any[]>([]);
  const [badges, setBadges] = useState<Badge[]>([]);

  useEffect(() => {
    const raw = localStorage.getItem('speedMathProgress');
    if (raw) {
      try {
        const parsed = JSON.parse(raw);
        setProgress(parsed);
        setBadges(evaluateAchievements(parsed));
      } catch (e) {}
    } else {
      setBadges(evaluateAchievements([]));
    }
  }, []);

  const totalGames = progress.length;
  const highestScore = progress.reduce((max, s) => Math.max(max, s.score), 0);
  const totalSubmissions = progress.reduce((sum, s) => sum + (s.totalSubmissions || s.totalQuestions || 0), 0);
  const totalCorrect = progress.reduce((sum, s) => sum + s.score, 0);
  const overallAccuracy = totalSubmissions > 0 ? Math.round((totalCorrect / totalSubmissions) * 100) : 0;

  const allHistory = progress.flatMap(s => s.history || []);

  let avgTimeCorrect = 0;
  let under5 = 0;
  let between5and10 = 0;
  let over10 = 0;

  const operationStats: Record<string, { count: number; totalTime: number }> = {};

  allHistory.forEach(h => {
     if (typeof h.timeSpent === 'number') {
        avgTimeCorrect += h.timeSpent;
        if (h.timeSpent < 5) under5++;
        else if (h.timeSpent <= 10) between5and10++;
        else over10++;

        const op = h.problem?.operation;
        if (op) {
            if (!operationStats[op]) operationStats[op] = { count: 0, totalTime: 0 };
            operationStats[op].count++;
            operationStats[op].totalTime += h.timeSpent;
        }
     }
  });

  const historyCount = allHistory.length;
  if (historyCount > 0) avgTimeCorrect = avgTimeCorrect / historyCount;

  let bestOp = 'N/A';
  let worstOp = 'N/A';
  if (Object.keys(operationStats).length > 0) {
      const ops = Object.keys(operationStats).map(op => ({
         op,
         avgTime: operationStats[op].totalTime / operationStats[op].count
      })).sort((a, b) => a.avgTime - b.avgTime);
      
      bestOp = ops[0].op;
      worstOp = ops[ops.length - 1].op;
  }

  // Trend data (last 10 sessions)
  const recentSessions = progress.slice(-10);

  const chartData = recentSessions.map((session, index) => {
    const sDate = session.date ? new Date(session.date) : new Date();
    const formattedDate = `${sDate.getMonth() + 1}/${sDate.getDate()}`;
    const acc = session.totalSubmissions ? Math.round((session.score / session.totalSubmissions) * 100) : 0;
    return {
      name: `Drill #${index + 1}`,
      date: formattedDate,
      score: session.score,
      accuracy: acc,
    };
  });

  // Badge Color Grades configuration styling
  const getColorGradeStyles = (grade: string, unlocked: boolean) => {
    if (!unlocked) return 'border-slate-100 bg-slate-50 text-slate-300';
    switch (grade) {
      case 'bronze': return 'border-amber-300 bg-amber-50 text-amber-700 shadow-sm shadow-amber-100';
      case 'silver': return 'border-slate-300 bg-slate-50 text-slate-600 shadow-sm';
      case 'gold': return 'border-yellow-300 bg-amber-50/50 text-yellow-600 shadow-sm shadow-yellow-100';
      case 'cosmic': return 'border-purple-300 bg-purple-50 text-purple-700 shadow-sm shadow-purple-100';
      default: return 'border-indigo-300 bg-indigo-50 text-indigo-700';
    }
  };

  return (
    <div
      id="stats_page_layout"
      className="w-full max-w-4xl mx-auto bg-slate-950/92 rounded-[2.5rem] border border-cyan-300/60 shadow-[0_20px_60px_rgba(8,47,73,0.42)] p-6 md:p-8 my-8 text-white overflow-hidden relative"
      style={profilePanelStyle(panels.cosmicCard)}
    >
      <img src={fx.mathParticles} alt="" aria-hidden="true" className="absolute inset-0 h-full w-full object-cover opacity-10 mix-blend-screen pointer-events-none" />
      <div className="relative z-10">
      <button 
        id="btn_back_menu"
        onClick={() => { sounds.playClick(); onBack(); }}
        className="flex items-center gap-2 text-cyan-100/60 hover:text-cyan-100 font-bold text-[10px] tracking-widest uppercase mb-8 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" /> Back to Menu
      </button>

      <div className="mb-8 border-b border-cyan-100/15 pb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
         <div>
            <h2 className="text-3xl font-black text-cyan-50 tracking-tight">Performance Analytics</h2>
            <p className="text-xs text-cyan-100/55 font-bold uppercase tracking-widest mt-1.5">Holistic statistical calibration generated by Pi-bot</p>
         </div>

         {/* Mini Pi-Bot comment bubble inside stats sheet */}
         <div className="bg-slate-950/75 text-cyan-50 border border-cyan-300/35 p-4 rounded-2xl flex items-center gap-3.5 max-w-sm sm:max-w-md shadow-md shrink-0">
            <div className="w-11 h-11 shrink-0 select-none animate-float-pibot">
               <img 
                  src={mascots.headAvatar}
                  alt="Pi-bot avatar"
                  className="w-full h-full object-contain rounded-full"
               />
            </div>
            <div className="text-[11px] leading-snug">
               <span className="font-extrabold text-amber-400 block mb-0.5">Pi-bot Calibration Analysis</span>
               {totalGames > 0 ? (
                 `Neural scans verify peak performance at ${highestScore} points. Your overall calculation accuracy remains calibrated at ${overallAccuracy}% capacity.`
               ) : (
                 "Log at least one performance drill to initiate logic-matrix analytics, apprentice!"
               )}
            </div>
         </div>
      </div>

      {/* Top KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
         <div id="card_accuracy" className="bg-slate-950/75 p-5 rounded-2xl border border-cyan-300/45 shadow-[0_10px_26px_rgba(8,47,73,0.3)] flex flex-col transition-transform hover:-translate-y-0.5" style={profilePanelStyle(panels.statsCard, 'rgba(10, 28, 52, 0.74)')}>
             <Target className="w-5 h-5 text-cyan-300 mb-2.5 stroke-[2.5]" />
             <span className="text-cyan-100/55 text-[10px] font-black uppercase tracking-widest mb-0.5">Accuracy</span>
             <span className="text-3xl font-mono font-black text-cyan-50 tracking-tight">{overallAccuracy}%</span>
         </div>
         <div id="card_avg_speed" className="bg-slate-950/75 p-5 rounded-2xl border border-cyan-300/45 shadow-[0_10px_26px_rgba(8,47,73,0.3)] flex flex-col transition-transform hover:-translate-y-0.5" style={profilePanelStyle(panels.statsCard, 'rgba(10, 28, 52, 0.74)')}>
             <Clock className="w-5 h-5 text-cyan-300 mb-2.5 stroke-[2.5]" />
             <span className="text-cyan-100/55 text-[10px] font-black uppercase tracking-widest mb-0.5">Avg Speed</span>
             <span className="text-3xl font-mono font-black text-cyan-50 tracking-tight">{avgTimeCorrect.toFixed(1)}s</span>
         </div>
         <div id="card_high_score" className="bg-slate-950/75 p-5 rounded-2xl border border-amber-300/55 shadow-[0_10px_26px_rgba(251,191,36,0.14)] flex flex-col transition-transform hover:-translate-y-0.5" style={profilePanelStyle(panels.statsCard, 'rgba(34, 28, 39, 0.74)')}>
             <Trophy className="w-5 h-5 text-amber-500 mb-2.5 stroke-[2.5]" />
             <span className="text-amber-100/65 text-[10px] font-black uppercase tracking-widest mb-0.5">High Score</span>
             <span className="text-3xl font-mono font-black text-amber-100 tracking-tight">{highestScore}</span>
         </div>
         <div id="card_total_solved" className="bg-slate-950/75 p-5 rounded-2xl border border-purple-300/45 shadow-[0_10px_26px_rgba(168,85,247,0.14)] flex flex-col transition-transform hover:-translate-y-0.5" style={profilePanelStyle(panels.statsCard, 'rgba(28, 22, 55, 0.74)')}>
             <Activity className="w-5 h-5 text-purple-300 mb-2.5 stroke-[2.5]" />
             <span className="text-purple-100/65 text-[10px] font-black uppercase tracking-widest mb-0.5">Total Solved</span>
             <span className="text-3xl font-mono font-black text-purple-100 tracking-tight">{totalCorrect}</span>
         </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
         {/* Time Intervals */}
         <div>
            <h3 className="text-[10px] font-bold text-cyan-50 uppercase tracking-widest mb-4 flex items-center gap-2">
              <Zap className="w-4 h-4 text-emerald-500" /> Response Intervals
            </h3>
            <div className="space-y-3">
               <div className="flex items-center justify-between px-4 py-3 bg-amber-50/60 rounded-xl border-2 border-slate-900 shadow-[2px_2px_0_0_#0f172a]">
                  <span className="text-xs font-black text-slate-800">Under 5s <span className="text-[9px] text-slate-400 ml-1 uppercase">(Fast)</span></span>
                  <span className="font-mono font-black text-base text-emerald-600">{under5}</span>
               </div>
               <div className="flex items-center justify-between px-4 py-3 bg-amber-50/60 rounded-xl border-2 border-slate-900 shadow-[2px_2px_0_0_#0f172a]">
                  <span className="text-xs font-black text-slate-800">5s - 10s <span className="text-[9px] text-slate-400 ml-1 uppercase">(Average)</span></span>
                  <span className="font-mono font-black text-base text-amber-500">{between5and10}</span>
               </div>
               <div className="flex items-center justify-between px-4 py-3 bg-amber-50/60 rounded-xl border-2 border-slate-900 shadow-[2px_2px_0_0_#0f172a]">
                  <span className="text-xs font-black text-slate-800">Over 10s <span className="text-[9px] text-slate-400 ml-1 uppercase">(Slow)</span></span>
                  <span className="font-mono font-black text-base text-rose-500">{over10}</span>
               </div>
            </div>
         </div>

         {/* Strengths & Weaknesses */}
         <div>
            <h3 className="text-[10px] font-bold text-cyan-50 uppercase tracking-widest mb-4 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-indigo-500" /> Operation Mastery
            </h3>
            <div className="grid grid-cols-2 gap-3 h-[calc(100%-2rem)]">
               <div className="flex flex-col justify-center p-4 bg-emerald-50 rounded-2xl border-2 border-slate-900 shadow-[2px_2px_0_0_#0f172a] text-center">
                  <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest mb-2">Fastest Operation</span>
                  <span className="text-xl font-bold text-slate-800 capitalize tracking-tight">{bestOp.toLowerCase()}</span>
                  {bestOp !== 'N/A' && <span className="text-xs text-emerald-700 font-mono mt-1">{(operationStats[bestOp].totalTime / operationStats[bestOp].count).toFixed(1)}s avg</span>}
               </div>
               <div className="flex flex-col justify-center p-4 bg-rose-50 rounded-2xl border-2 border-slate-900 shadow-[2px_2px_0_0_#0f172a] text-center">
                  <span className="text-[10px] font-bold text-rose-600 uppercase tracking-widest mb-2">Needs Practice</span>
                  <span className="text-xl font-bold text-slate-800 capitalize tracking-tight">{worstOp.toLowerCase()}</span>
                  {worstOp !== 'N/A' && <span className="text-xs text-rose-700 font-mono mt-1">{(operationStats[worstOp].totalTime / operationStats[worstOp].count).toFixed(1)}s avg</span>}
               </div>
            </div>
         </div>
      </div>

      {/* Trend Graph with recharts */}
      <div className="mb-8">
         <h3 className="text-[10px] font-bold text-cyan-50 uppercase tracking-widest mb-4 flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-indigo-600" /> Recent Drills Progression
         </h3>
         
         <div id="recharts_trend_container" className="p-4 bg-amber-50/60 rounded-2xl border-4 border-slate-900 shadow-[3px_3px_0_0_#0f172a]" >
            {chartData.length === 0 ? (
               <div className="h-64 flex items-center justify-center">
                  <span className="text-xs text-slate-400 font-bold uppercase tracking-widest">No session data logged yet</span>
               </div>
            ) : (
               <div className="w-full h-64 text-xs font-mono">
                  <ResponsiveContainer width="100%" height="100%">
                     <LineChart data={chartData} margin={{ top: 10, right: 20, left: -20, bottom: 5 }}>
                        <CartesianGrid stroke="#f1f5f9" strokeDasharray="3 3" />
                        <XAxis dataKey="name" tick={{ fill: '#94a3b8', fontSize: 10 }} />
                        <YAxis yAxisId="left" tick={{ fill: '#4f46e5', fontSize: 10 }} name="Score" />
                        <YAxis yAxisId="right" orientation="right" tick={{ fill: '#10b981', fontSize: 10 }} name="Accuracy" unit="%" />
                        <Tooltip contentStyle={{ background: '#ffffff', borderRadius: '12px', border: '1px solid #e2e8f0', fontFamily: 'monospace' }} />
                        <Legend wrapperStyle={{ paddingTop: 10, fontSize: 11 }} />
                        <Line 
                          yAxisId="left" 
                          type="monotone" 
                          dataKey="score" 
                          name="Score (correct solves)" 
                          stroke="#4f46e5" 
                          strokeWidth={3} 
                          activeDot={{ r: 8 }} 
                        />
                        <Line 
                          yAxisId="right" 
                          type="monotone" 
                          dataKey="accuracy" 
                          name="Accuracy (%)" 
                          stroke="#10b981" 
                          strokeWidth={2} 
                          strokeDasharray="5 5"
                        />
                     </LineChart>
                  </ResponsiveContainer>
               </div>
            )}
         </div>
         <p className="text-[10px] text-center text-cyan-100/55 uppercase tracking-widest mt-2 font-bold">Accuracy & Score Trend (Last 10 Practice Drills)</p>
      </div>

      {/* Badges Achievements System */}
      <div id="achievements_section" className="border-t border-cyan-100/15 pt-8">
         <div className="flex items-center gap-2 mb-6">
            <Trophy className="w-5 h-5 text-yellow-500" />
            <h3 className="text-[10px] font-bold text-cyan-50 uppercase tracking-widest">
               Achievements & Milestones
            </h3>
            <span className="ml-auto text-[10px] font-mono font-bold bg-cyan-300/15 px-2.5 py-1 text-cyan-100 rounded-full border border-cyan-100/15">
               Unlocks: {badges.filter(b => b.unlocked).length} / {badges.length}
            </span>
         </div>

         <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {badges.map((badge) => (
               <div 
                 key={badge.id}
                 id={`badge_card_${badge.id}`}
                 className={`flex items-start gap-4 p-4 rounded-[1.5rem] border-4 border-slate-900 transition-all duration-200 ${
                   badge.unlocked 
                     ? 'bg-amber-200/10 border-amber-300/60 shadow-[0_0_20px_rgba(251,191,36,0.12)]' 
                     : 'bg-slate-950/55 opacity-70 border-slate-600/60'
                 }`}
               >
                  <div className="relative w-16 h-16 shrink-0">
                     <img
                       src={badge.unlocked ? (badgeArtByAchievementId[badge.id] ?? badgeAssets.firstSolve) : badgeAssets.locked}
                       alt=""
                       aria-hidden="true"
                       className={`w-full h-full object-contain drop-shadow-[0_8px_16px_rgba(0,0,0,0.35)] ${badge.unlocked ? '' : 'grayscale opacity-80'}`}
                     />
                     {badge.unlocked && (
                       <img src={badgeAssets.unlockBurst} alt="" aria-hidden="true" className="absolute inset-[-12px] h-[calc(100%+24px)] w-[calc(100%+24px)] object-contain opacity-35 mix-blend-screen pointer-events-none" />
                     )}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                     <div className="flex items-center gap-2">
                        <span className={`text-sm font-bold tracking-tight ${badge.unlocked ? 'text-cyan-50' : 'text-cyan-100/45'}`}>
                           {badge.title}
                        </span>
                        {badge.unlocked ? (
                           <span className="flex items-center justify-center w-4 h-4 bg-cyan-300 text-slate-950 rounded-full">
                              <Check className="w-2.5 h-2.5 stroke-[3]" />
                           </span>
                        ) : (
                           <span className="flex items-center justify-center w-4 h-4 text-cyan-100/35">
                              <Lock className="w-3 h-3 stroke-[2.5]" />
                           </span>
                        )}
                     </div>
                     <p className="text-xs text-cyan-100/60 leading-tight mt-1">
                        {badge.description}
                     </p>
                     
                     <div className="mt-3 flex items-center justify-between gap-2">
                        {/* Progress Bar */}
                        <div className="flex-1 bg-slate-800 rounded-full h-1.5 overflow-hidden">
                           <div 
                             className={`h-full rounded-full transition-all duration-300 ${badge.unlocked ? 'bg-cyan-400' : 'bg-slate-600'}`}
                             style={{ 
                               width: `${Math.min(100, (badge.id === 'speed_demon' 
                                 ? (badge.progressValue !== 0 && badge.progressValue < 1.5 ? 100 : Math.max(0, (3 - badge.progressValue) / 1.5 * 100))
                                 : (badge.progressValue / badge.progressTarget) * 100))}%` 
                             }}
                           ></div>
                        </div>
                        <span className="text-[9px] font-mono font-bold text-cyan-100/50 uppercase shrink-0">
                           {badge.progressText}
                        </span>
                     </div>
                  </div>
               </div>
            ))}
         </div>
      </div>

      </div>
   </div>
  );
};

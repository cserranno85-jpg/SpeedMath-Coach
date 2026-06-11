import React, { useEffect, useState } from 'react';
import { 
  Trophy, TrendingUp, Calendar, ArrowLeft, Target, Clock, Zap, BarChart3, AlertCircle, Activity,
  Award, Crown, Flame, Rocket, PlusCircle, XCircle, ShieldAlert, Check, Lock 
} from 'lucide-react';
import { 
  ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend 
} from 'recharts';
import { evaluateAchievements, Badge } from '../utils/streakAndAchievements';
import { sounds } from '../utils/soundEngine';
import pibotMascot from '../assets/images/pibot-mascot.jpg';

interface StatsProps {
  onBack: () => void;
}

const BadgeIcon = ({ name, className }: { name: string; className?: string }) => {
  switch (name) {
    case 'Award': return <Award className={className} />;
    case 'Zap': return <Zap className={className} />;
    case 'Crown': return <Crown className={className} />;
    case 'Flame': return <Flame className={className} />;
    case 'Rocket': return <Rocket className={className} />;
    case 'PlusCircle': return <PlusCircle className={className} />;
    case 'XCircle': return <XCircle className={className} />;
    case 'ShieldAlert': return <ShieldAlert className={className} />;
    default: return <Award className={className} />;
  }
};

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
    <div id="stats_page_layout" className="w-full max-w-4xl mx-auto bg-[#FAF7EC] rounded-[2.5rem] border-4 border-slate-900 shadow-[8px_8px_0_0_#0f172a] p-6 md:p-8 my-8">
      <button 
        id="btn_back_menu"
        onClick={() => { sounds.playClick(); onBack(); }}
        className="flex items-center gap-2 text-slate-400 hover:text-slate-700 font-bold text-[10px] tracking-widest uppercase mb-8 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" /> Back to Menu
      </button>

      <div className="mb-8 border-b border-slate-100 pb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
         <div>
            <h2 className="text-3xl font-black text-slate-800 tracking-tight">Performance Analytics</h2>
            <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-1.5">Holistic statistical calibration generated by Pi-bot</p>
         </div>

         {/* Mini Pi-Bot comment bubble inside stats sheet */}
         <div className="bg-indigo-950 text-indigo-100 border border-indigo-800 p-4 rounded-2xl flex items-center gap-3.5 max-w-sm sm:max-w-md shadow-md shrink-0">
            <div className="w-11 h-11 shrink-0 select-none animate-float-pibot">
               <img 
                  src={pibotMascot}
                  alt="Pi-bot Mascot"
                  className="w-full h-full object-cover rounded-full"
                  referrerPolicy="no-referrer"
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
         <div id="card_accuracy" className="bg-amber-50/70 p-5 rounded-2xl border-4 border-slate-900 shadow-[3px_3px_0_0_#0f172a] flex flex-col transition-transform hover:-translate-y-0.5">
             <Target className="w-5 h-5 text-indigo-600 mb-2.5 stroke-[2.5]" />
             <span className="text-slate-500 text-[10px] font-black uppercase tracking-widest mb-0.5">Accuracy</span>
             <span className="text-3xl font-mono font-black text-slate-900 tracking-tight">{overallAccuracy}%</span>
         </div>
         <div id="card_avg_speed" className="bg-amber-50/70 p-5 rounded-2xl border-4 border-slate-900 shadow-[3px_3px_0_0_#0f172a] flex flex-col transition-transform hover:-translate-y-0.5">
             <Clock className="w-5 h-5 text-emerald-600 mb-2.5 stroke-[2.5]" />
             <span className="text-slate-500 text-[10px] font-black uppercase tracking-widest mb-0.5">Avg Speed</span>
             <span className="text-3xl font-mono font-black text-slate-900 tracking-tight">{avgTimeCorrect.toFixed(1)}s</span>
         </div>
         <div id="card_high_score" className="bg-amber-50/70 p-5 rounded-2xl border-4 border-slate-900 shadow-[3px_3px_0_0_#0f172a] flex flex-col transition-transform hover:-translate-y-0.5">
             <Trophy className="w-5 h-5 text-amber-500 mb-2.5 stroke-[2.5]" />
             <span className="text-slate-500 text-[10px] font-black uppercase tracking-widest mb-0.5">High Score</span>
             <span className="text-3xl font-mono font-black text-slate-900 tracking-tight">{highestScore}</span>
         </div>
         <div id="card_total_solved" className="bg-amber-50/70 p-5 rounded-2xl border-4 border-slate-900 shadow-[3px_3px_0_0_#0f172a] flex flex-col transition-transform hover:-translate-y-0.5">
             <Activity className="w-5 h-5 text-rose-500 mb-2.5 stroke-[2.5]" />
             <span className="text-slate-500 text-[10px] font-black uppercase tracking-widest mb-0.5">Total Solved</span>
             <span className="text-3xl font-mono font-black text-slate-900 tracking-tight">{totalCorrect}</span>
         </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
         {/* Time Intervals */}
         <div>
            <h3 className="text-[10px] font-bold text-slate-800 uppercase tracking-widest mb-4 flex items-center gap-2">
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
            <h3 className="text-[10px] font-bold text-slate-800 uppercase tracking-widest mb-4 flex items-center gap-2">
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
         <h3 className="text-[10px] font-bold text-slate-800 uppercase tracking-widest mb-4 flex items-center gap-2">
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
         <p className="text-[10px] text-center text-slate-400 uppercase tracking-widest mt-2 font-bold">Accuracy & Score Trend (Last 10 Practice Drills)</p>
      </div>

      {/* Badges Achievements System */}
      <div id="achievements_section" className="border-t border-slate-100 pt-8">
         <div className="flex items-center gap-2 mb-6">
            <Trophy className="w-5 h-5 text-yellow-500" />
            <h3 className="text-[10px] font-bold text-slate-800 uppercase tracking-widest">
               Achievements & Milestones
            </h3>
            <span className="ml-auto text-[10px] font-mono font-bold bg-slate-100 px-2.5 py-1 text-slate-500 rounded-full">
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
                     ? 'bg-amber-50/65 border-slate-900 shadow-[2px_2px_0_0_#0f172a]' 
                     : 'bg-[#FAF7EC] opacity-50 border-slate-200'
                 }`}
               >
                  <div className={`p-3 rounded-xl border ${getColorGradeStyles(badge.colorGrade, badge.unlocked)}`}>
                     <BadgeIcon name={badge.icon} className="w-6 h-6 stroke-[2]" />
                  </div>
                  
                  <div className="flex-1 min-w-0">
                     <div className="flex items-center gap-2">
                        <span className={`text-sm font-bold tracking-tight ${badge.unlocked ? 'text-slate-800' : 'text-slate-400'}`}>
                           {badge.title}
                        </span>
                        {badge.unlocked ? (
                           <span className="flex items-center justify-center w-4 h-4 bg-emerald-100 text-emerald-700 rounded-full">
                              <Check className="w-2.5 h-2.5 stroke-[3]" />
                           </span>
                        ) : (
                           <span className="flex items-center justify-center w-4 h-4 text-slate-300">
                              <Lock className="w-3 h-3 stroke-[2.5]" />
                           </span>
                        )}
                     </div>
                     <p className="text-xs text-slate-500 leading-tight mt-1">
                        {badge.description}
                     </p>
                     
                     <div className="mt-3 flex items-center justify-between gap-2">
                        {/* Progress Bar */}
                        <div className="flex-1 bg-slate-100 rounded-full h-1.5 overflow-hidden">
                           <div 
                             className={`h-full rounded-full transition-all duration-300 ${badge.unlocked ? 'bg-emerald-500' : 'bg-slate-300'}`}
                             style={{ 
                               width: `${Math.min(100, (badge.id === 'speed_demon' 
                                 ? (badge.progressValue !== 0 && badge.progressValue < 1.5 ? 100 : Math.max(0, (3 - badge.progressValue) / 1.5 * 100))
                                 : (badge.progressValue / badge.progressTarget) * 100))}%` 
                             }}
                           ></div>
                        </div>
                        <span className="text-[9px] font-mono font-bold text-slate-400 uppercase shrink-0">
                           {badge.progressText}
                        </span>
                     </div>
                  </div>
               </div>
            ))}
         </div>
      </div>

   </div>
  );
};

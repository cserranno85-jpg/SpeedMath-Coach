import React, { useEffect, useState } from 'react';
import { Trophy, TrendingUp, Calendar, ArrowLeft, Target, Clock, Zap, BarChart3, AlertCircle, Activity } from 'lucide-react';

interface StatsProps {
  onBack: () => void;
}

export const Stats: React.FC<StatsProps> = ({ onBack }) => {
  const [progress, setProgress] = useState<any[]>([]);

  useEffect(() => {
    const raw = localStorage.getItem('speedMathProgress');
    if (raw) {
      try {
        setProgress(JSON.parse(raw));
      } catch (e) {}
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

  return (
    <div className="w-full max-w-4xl mx-auto bg-white rounded-2xl border border-slate-200 shadow-sm p-4 md:p-8 my-8">
      <button 
        onClick={onBack}
        className="flex items-center gap-2 text-slate-400 hover:text-slate-700 font-bold text-[10px] tracking-widest uppercase mb-8 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" /> Back to Menu
      </button>

      <div className="mb-8 border-b border-slate-100 pb-6">
         <h2 className="text-3xl font-bold text-slate-800 tracking-tighter">Performance Analytics</h2>
         <p className="text-xs text-slate-500 font-medium tracking-tight mt-1">Holistic breakdown of your speed and accuracy.</p>
      </div>

      {/* Top KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
         <div className="bg-slate-50 p-5 rounded-xl border border-slate-200 flex flex-col">
             <Target className="w-5 h-5 text-indigo-500 mb-3 stroke-[2]" />
             <span className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mb-1">Accuracy</span>
             <span className="text-3xl font-mono font-bold text-slate-800 tracking-tighter">{overallAccuracy}%</span>
         </div>
         <div className="bg-slate-50 p-5 rounded-xl border border-slate-200 flex flex-col">
             <Clock className="w-5 h-5 text-emerald-500 mb-3 stroke-[2]" />
             <span className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mb-1">Avg Speed</span>
             <span className="text-3xl font-mono font-bold text-slate-800 tracking-tighter">{avgTimeCorrect.toFixed(1)}s</span>
         </div>
         <div className="bg-slate-50 p-5 rounded-xl border border-slate-200 flex flex-col">
             <Trophy className="w-5 h-5 text-amber-500 mb-3 stroke-[2]" />
             <span className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mb-1">High Score</span>
             <span className="text-3xl font-mono font-bold text-slate-800 tracking-tighter">{highestScore}</span>
         </div>
         <div className="bg-slate-50 p-5 rounded-xl border border-slate-200 flex flex-col">
             <Activity className="w-5 h-5 text-rose-400 mb-3 stroke-[2]" />
             <span className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mb-1">Total Solved</span>
             <span className="text-3xl font-mono font-bold text-slate-800 tracking-tighter">{totalCorrect}</span>
         </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
         {/* Time Intervals */}
         <div>
            <h3 className="text-[10px] font-bold text-slate-800 uppercase tracking-widest mb-4 flex items-center gap-2">
              <Zap className="w-4 h-4 text-emerald-500" /> Response Intervals
            </h3>
            <div className="space-y-3">
               <div className="flex items-center justify-between p-3 bg-white rounded-lg border border-slate-100 shadow-sm">
                  <span className="text-sm font-bold text-slate-700">Under 5s <span className="text-[10px] text-slate-400 ml-1 uppercase">(Fast)</span></span>
                  <span className="font-mono font-bold text-lg text-emerald-600">{under5}</span>
               </div>
               <div className="flex items-center justify-between p-3 bg-white rounded-lg border border-slate-100 shadow-sm">
                  <span className="text-sm font-bold text-slate-700">5s - 10s <span className="text-[10px] text-slate-400 ml-1 uppercase">(Average)</span></span>
                  <span className="font-mono font-bold text-lg text-amber-500">{between5and10}</span>
               </div>
               <div className="flex items-center justify-between p-3 bg-white rounded-lg border border-slate-100 shadow-sm">
                  <span className="text-sm font-bold text-slate-700">Over 10s <span className="text-[10px] text-slate-400 ml-1 uppercase">(Slow)</span></span>
                  <span className="font-mono font-bold text-lg text-rose-500">{over10}</span>
               </div>
            </div>
         </div>

         {/* Strengths & Weaknesses */}
         <div>
            <h3 className="text-[10px] font-bold text-slate-800 uppercase tracking-widest mb-4 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-indigo-500" /> Operation Mastery
            </h3>
            <div className="grid grid-cols-2 gap-3 h-[calc(100%-2rem)]">
               <div className="flex flex-col justify-center p-4 bg-emerald-50 rounded-xl border border-emerald-100 text-center">
                  <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest mb-2">Fastest Operation</span>
                  <span className="text-xl font-bold text-slate-800 capitalize tracking-tight">{bestOp.toLowerCase()}</span>
                  {bestOp !== 'N/A' && <span className="text-xs text-emerald-700 font-mono mt-1">{(operationStats[bestOp].totalTime / operationStats[bestOp].count).toFixed(1)}s avg</span>}
               </div>
               <div className="flex flex-col justify-center p-4 bg-rose-50 rounded-xl border border-rose-100 text-center">
                  <span className="text-[10px] font-bold text-rose-600 uppercase tracking-widest mb-2">Needs Practice</span>
                  <span className="text-xl font-bold text-slate-800 capitalize tracking-tight">{worstOp.toLowerCase()}</span>
                  {worstOp !== 'N/A' && <span className="text-xs text-rose-700 font-mono mt-1">{(operationStats[worstOp].totalTime / operationStats[worstOp].count).toFixed(1)}s avg</span>}
               </div>
            </div>
         </div>
      </div>

      {/* Trend Graph Placeholder */}
      <div className="mb-8">
         <h3 className="text-[10px] font-bold text-slate-800 uppercase tracking-widest mb-4 flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-slate-500" /> Recent Session Trends
         </h3>
         <div className="h-32 flex items-end gap-2 p-4 bg-slate-50 rounded-xl border border-slate-200">
            {recentSessions.length === 0 ? (
               <span className="text-xs text-slate-400 font-bold uppercase tracking-widest align-middle w-full text-center pb-8">No session data</span>
            ) : (
               recentSessions.map((session, i) => {
                  const acc = session.totalSubmissions ? session.score / session.totalSubmissions : 0;
                  const height = Math.max(10, acc * 100);
                  return (
                     <div key={i} className="flex-1 flex flex-col items-center gap-2">
                        <div className="w-full bg-slate-200 rounded-t-sm relative flex items-end justify-center" style={{ height: '100px' }}>
                           <div className="w-full bg-indigo-400 rounded-t-sm transition-all" style={{ height: `${height}%` }}></div>
                        </div>
                        <span className="text-[8px] font-bold text-slate-400 font-mono">{session.score}</span>
                     </div>
                  );
               })
            )}
         </div>
         <p className="text-[10px] text-center text-slate-400 uppercase tracking-widest mt-2 font-bold">Accuracy & Score Trend (Last 10)</p>
      </div>

    </div>
  );
};

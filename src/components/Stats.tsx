import React, { useEffect, useState } from 'react';
import {
  Trophy, Calendar, ArrowLeft, Target, Clock, Zap, BarChart3, AlertCircle, Activity,
  Award, Crown, Flame, Rocket, PlusCircle, XCircle, ShieldAlert, Check, Lock
} from 'lucide-react';
import {
  ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend
} from 'recharts';
import { calculateStreak, evaluateAchievements, Badge } from '../utils/streakAndAchievements';
import { loadProgress } from '../utils/progressStorage';
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
    const parsed = loadProgress();
    setProgress(parsed);
    setBadges(evaluateAchievements(parsed));
  }, []);

  const totalGames = progress.length;
  const highestScore = progress.reduce((max, s) => Math.max(max, s.score || 0), 0);
  const totalSubmissions = progress.reduce((sum, s) => sum + (s.totalSubmissions || s.totalQuestions || 0), 0);
  const totalCorrect = progress.reduce((sum, s) => sum + (s.score || 0), 0);
  const overallAccuracy = totalSubmissions > 0 ? Math.round((totalCorrect / totalSubmissions) * 100) : 0;
  const streak = calculateStreak(progress);
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

  if (allHistory.length > 0) avgTimeCorrect = avgTimeCorrect / allHistory.length;

  let bestOp = 'N/A';
  let worstOp = 'N/A';
  if (Object.keys(operationStats).length > 0) {
    const ops = Object.keys(operationStats).map(op => ({
      op,
      avgTime: operationStats[op].totalTime / operationStats[op].count,
    })).sort((a, b) => a.avgTime - b.avgTime);
    bestOp = ops[0].op;
    worstOp = ops[ops.length - 1].op;
  }

  const chartData = progress.slice(-10).map((session, index) => {
    const sDate = session.date ? new Date(session.date) : new Date();
    return {
      name: `Drill ${index + 1}`,
      date: `${sDate.getMonth() + 1}/${sDate.getDate()}`,
      score: session.score || 0,
      accuracy: session.totalSubmissions ? Math.round(((session.score || 0) / session.totalSubmissions) * 100) : 0,
    };
  });

  const badgeTone = (badge: Badge) => {
    if (!badge.unlocked) return 'border-white/10 bg-white/8 text-blue-100 opacity-70';
    switch (badge.colorGrade) {
      case 'bronze': return 'border-orange-300/60 bg-orange-400 text-slate-950';
      case 'silver': return 'border-slate-200/70 bg-slate-100 text-slate-950';
      case 'gold': return 'border-yellow-300/70 bg-yellow-300 text-slate-950';
      case 'cosmic': return 'border-purple-300/70 bg-purple-400 text-slate-950';
      default: return 'border-cyan-300/70 bg-cyan-300 text-slate-950';
    }
  };

  return (
    <div id="stats_page_layout" className="w-full max-w-6xl mx-auto rounded-[2rem] border border-white/15 bg-slate-950/78 p-5 sm:p-7 text-white shadow-[0_24px_70px_rgba(0,0,0,0.42)]">
      <button
        id="btn_back_menu"
        onClick={() => { sounds.play('uiTap'); onBack(); }}
        className="premium-btn premium-btn-neutral premium-btn-small mb-5 text-xs"
      >
        <ArrowLeft className="w-4 h-4" /> Back to Menu
      </button>

      <div className="rounded-3xl bg-gradient-to-br from-blue-700 via-indigo-700 to-purple-700 p-5 flex flex-col md:flex-row md:items-center justify-between gap-5">
        <div>
          <div className="text-xs font-black uppercase text-yellow-300 flex items-center gap-2">
            <BarChart3 className="w-4 h-4" /> Performance Analytics
          </div>
          <h1 className="mt-1 text-3xl sm:text-4xl font-black">SpeedMath Progress</h1>
          <p className="mt-2 max-w-2xl text-sm text-blue-50">Scores, accuracy, speed intervals, streaks, and achievement milestones from local training history.</p>
        </div>
        <div className="rounded-3xl border border-white/15 bg-slate-950/45 p-4 flex items-center gap-3 max-w-md">
          <img src={pibotMascot} alt="Pi-bot Mascot" className="w-14 h-14 rounded-2xl object-cover animate-float-pibot" referrerPolicy="no-referrer" />
          <p className="text-xs leading-relaxed text-blue-50">
            <span className="block font-black text-yellow-300">Pi-bot Analysis</span>
            {totalGames > 0 ? `Peak score ${highestScore}, ${overallAccuracy}% overall accuracy, ${streak}-day streak.` : 'No drills logged. Start a timed round to populate analytics.'}
          </p>
        </div>
      </div>

      <div className="mt-5 grid grid-cols-2 lg:grid-cols-5 gap-3">
        {[
          { id: 'card_accuracy', label: 'Accuracy', value: `${overallAccuracy}%`, icon: Target, tone: 'from-cyan-300 to-blue-400' },
          { id: 'card_avg_speed', label: 'Avg Speed', value: `${avgTimeCorrect.toFixed(1)}s`, icon: Clock, tone: 'from-emerald-300 to-teal-400' },
          { id: 'card_high_score', label: 'High Score', value: highestScore, icon: Trophy, tone: 'from-yellow-300 to-orange-400' },
          { id: 'card_total_solved', label: 'Solved', value: totalCorrect, icon: Activity, tone: 'from-purple-300 to-fuchsia-400' },
          { id: 'card_streak', label: 'Streak', value: streak, icon: Calendar, tone: 'from-orange-300 to-rose-400' },
        ].map(card => {
          const Icon = card.icon;
          return (
            <div key={card.id} id={card.id} className={`rounded-3xl bg-gradient-to-br ${card.tone} p-4 text-slate-950`}>
              <div className="flex items-center justify-between gap-2">
                <span className="text-[10px] font-black uppercase opacity-75">{card.label}</span>
                <Icon className="w-5 h-5" />
              </div>
              <div className="mt-2 text-3xl font-mono font-black">{card.value}</div>
            </div>
          );
        })}
      </div>

      {totalGames === 0 && (
        <div className="mt-5 rounded-3xl border border-cyan-300/25 bg-cyan-300/10 p-6 text-center">
          <Trophy className="mx-auto w-10 h-10 text-yellow-300" />
          <h2 className="mt-3 text-xl font-black">No progress yet</h2>
          <p className="mt-1 text-sm text-blue-100">Your reset is reflected here. Complete a round to rebuild stats, streaks, history, and achievements.</p>
        </div>
      )}

      <div className="mt-5 grid grid-cols-1 lg:grid-cols-2 gap-5">
        <div className="rounded-3xl border border-white/15 bg-blue-950/60 p-5">
          <h2 className="mb-4 text-xs font-black uppercase text-cyan-200 flex items-center gap-2"><Zap className="w-4 h-4" /> Response Intervals</h2>
          <div className="space-y-3">
            {[
              { label: 'Under 5s', sub: 'Fast', value: under5, tone: 'text-emerald-300' },
              { label: '5s - 10s', sub: 'Average', value: between5and10, tone: 'text-yellow-300' },
              { label: 'Over 10s', sub: 'Slow', value: over10, tone: 'text-rose-300' },
            ].map(item => (
              <div key={item.label} className="rounded-2xl border border-white/10 bg-white/8 px-4 py-3 flex items-center justify-between gap-3">
                <span className="text-sm font-black">{item.label} <span className="text-[10px] uppercase text-blue-200">({item.sub})</span></span>
                <span className={`font-mono text-xl font-black ${item.tone}`}>{item.value}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-3xl border border-white/15 bg-blue-950/60 p-5">
          <h2 className="mb-4 text-xs font-black uppercase text-cyan-200 flex items-center gap-2"><AlertCircle className="w-4 h-4" /> Operation Mastery</h2>
          <div className="grid grid-cols-2 gap-3 h-full">
            <div className="rounded-3xl bg-emerald-400 p-4 text-center text-slate-950 flex flex-col justify-center">
              <span className="text-[10px] font-black uppercase opacity-75">Fastest</span>
              <span className="mt-2 text-xl font-black capitalize">{bestOp.toLowerCase()}</span>
              {bestOp !== 'N/A' && <span className="text-xs font-mono font-black">{(operationStats[bestOp].totalTime / operationStats[bestOp].count).toFixed(1)}s avg</span>}
            </div>
            <div className="rounded-3xl bg-rose-400 p-4 text-center text-slate-950 flex flex-col justify-center">
              <span className="text-[10px] font-black uppercase opacity-75">Needs Practice</span>
              <span className="mt-2 text-xl font-black capitalize">{worstOp.toLowerCase()}</span>
              {worstOp !== 'N/A' && <span className="text-xs font-mono font-black">{(operationStats[worstOp].totalTime / operationStats[worstOp].count).toFixed(1)}s avg</span>}
            </div>
          </div>
        </div>
      </div>

      <div className="mt-5 rounded-3xl border border-white/15 bg-blue-950/60 p-5">
        <h2 className="mb-4 text-xs font-black uppercase text-cyan-200 flex items-center gap-2">
          <BarChart3 className="w-4 h-4" /> Recent Drills Progression
        </h2>
        <div id="recharts_trend_container" className="h-72">
          {chartData.length === 0 ? (
            <div className="h-full flex items-center justify-center rounded-2xl border border-white/10 bg-white/8 text-xs font-black uppercase text-blue-100">
              No session data logged yet
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 10, right: 20, left: -12, bottom: 5 }}>
                <CartesianGrid stroke="rgba(255,255,255,0.12)" strokeDasharray="3 3" />
                <XAxis dataKey="name" tick={{ fill: '#bfdbfe', fontSize: 10 }} />
                <YAxis yAxisId="left" tick={{ fill: '#fde047', fontSize: 10 }} name="Score" />
                <YAxis yAxisId="right" orientation="right" tick={{ fill: '#5eead4', fontSize: 10 }} name="Accuracy" unit="%" />
                <Tooltip contentStyle={{ background: '#020617', borderRadius: '14px', border: '1px solid rgba(255,255,255,0.18)', color: '#ffffff' }} />
                <Legend wrapperStyle={{ paddingTop: 10, fontSize: 11, color: '#dbeafe' }} />
                <Line yAxisId="left" type="monotone" dataKey="score" name="Score" stroke="#fde047" strokeWidth={3} activeDot={{ r: 7 }} />
                <Line yAxisId="right" type="monotone" dataKey="accuracy" name="Accuracy (%)" stroke="#5eead4" strokeWidth={2} strokeDasharray="5 5" />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      <div id="achievements_section" className="mt-5">
        <div className="mb-4 flex items-center gap-2">
          <Trophy className="w-5 h-5 text-yellow-300" />
          <h2 className="text-xs font-black uppercase text-cyan-200">Achievements & Milestones</h2>
          <span className="ml-auto rounded-full bg-white/10 px-3 py-1 text-[11px] font-black text-blue-100">
            {badges.filter(b => b.unlocked).length} / {badges.length}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
          {badges.map((badge) => (
            <div key={badge.id} id={`badge_card_${badge.id}`} className={`rounded-3xl border p-4 ${badgeTone(badge)}`}>
              <div className="flex items-start gap-3">
                <div className="rounded-2xl bg-white/20 p-3 shrink-0">
                  <BadgeIcon name={badge.icon} className="w-6 h-6" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-black">{badge.title}</span>
                    {badge.unlocked ? <Check className="w-4 h-4 shrink-0" /> : <Lock className="w-4 h-4 shrink-0" />}
                  </div>
                  <p className="mt-1 text-xs leading-snug opacity-80">{badge.description}</p>
                  <div className="mt-3 flex items-center gap-2">
                    <div className="h-2 flex-1 overflow-hidden rounded-full bg-black/15">
                      <div
                        className="h-full rounded-full bg-white"
                        style={{
                          width: `${Math.min(100, (badge.id === 'speed_demon'
                            ? (badge.progressValue !== 0 && badge.progressValue < 1.5 ? 100 : Math.max(0, (3 - badge.progressValue) / 1.5 * 100))
                            : (badge.progressValue / badge.progressTarget) * 100))}%`,
                        }}
                      />
                    </div>
                    <span className="text-[10px] font-mono font-black uppercase shrink-0">{badge.progressText}</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

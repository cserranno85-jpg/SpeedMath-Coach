import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Activity,
  ArrowLeft,
  BarChart3,
  Check,
  Clock,
  Gauge,
  Lock,
  Target,
  Trophy,
  Zap,
} from 'lucide-react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
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
import {
  CardEnergy,
  PremiumBottomNav,
  PremiumGlassClass,
  PremiumNavKey,
  PremiumScreen,
  PremiumTopBar,
  SparkleBadge,
  labelClass,
  premiumPanelStyle,
} from './PremiumShell';

interface StatsProps {
  onBack: () => void;
  onStartGame: () => void;
  onNavigate: (state: 'HOME' | 'PRACTICE' | 'PROGRESS' | 'CHALLENGES') => void;
}

export const Stats: React.FC<StatsProps> = ({ onBack, onStartGame, onNavigate }) => {
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

  const {
    totalGames,
    highestScore,
    totalCorrect,
    overallAccuracy,
    avgTimeCorrect,
    under5,
    between5and10,
    over10,
    operationStats,
    bestOp,
    worstOp,
    chartData,
    unlockedCount,
    levelProgress,
    kpis,
  } = useMemo(() => {
    const totalGamesValue = progress.length;
    const highestScoreValue = progress.reduce((max, s) => Math.max(max, s.score || 0), 0);
    const totalSubmissionsValue = progress.reduce((sum, s) => sum + (s.totalSubmissions || s.totalQuestions || 0), 0);
    const totalCorrectValue = progress.reduce((sum, s) => sum + (s.score || 0), 0);
    const overallAccuracyValue = totalSubmissionsValue > 0 ? Math.round((totalCorrectValue / totalSubmissionsValue) * 100) : 0;
    const allHistory = progress.flatMap((s) => s.history || []);

    let avgTimeCorrectValue = 0;
    let under5Value = 0;
    let between5and10Value = 0;
    let over10Value = 0;
    const operationStatsValue: Record<string, { count: number; totalTime: number }> = {};

    allHistory.forEach((h) => {
      if (typeof h.timeSpent === 'number') {
        avgTimeCorrectValue += h.timeSpent;
        if (h.timeSpent < 5) under5Value++;
        else if (h.timeSpent <= 10) between5and10Value++;
        else over10Value++;

        const op = h.problem?.operation;
        if (op) {
          if (!operationStatsValue[op]) operationStatsValue[op] = { count: 0, totalTime: 0 };
          operationStatsValue[op].count++;
          operationStatsValue[op].totalTime += h.timeSpent;
        }
      }
    });

    if (allHistory.length > 0) avgTimeCorrectValue /= allHistory.length;

    let bestOpValue = 'N/A';
    let worstOpValue = 'N/A';
    const ops = Object.keys(operationStatsValue)
      .map((op) => ({
        op,
        avgTime: operationStatsValue[op].totalTime / operationStatsValue[op].count,
      }))
      .sort((a, b) => a.avgTime - b.avgTime);

    if (ops.length > 0) {
      bestOpValue = ops[0].op;
      worstOpValue = ops[ops.length - 1].op;
    }

    const recentSessions = progress.slice(-10);
    const chartDataValue = recentSessions.map((session, index) => {
      const sDate = session.date ? new Date(session.date) : new Date();
      const formattedDate = `${sDate.getMonth() + 1}/${sDate.getDate()}`;
      const submissions = session.totalSubmissions || session.totalQuestions || session.history?.length || session.score || 0;
      const scoreValue = Math.max(0, session.score || 0);
      const acc = submissions > 0 ? Math.round(Math.min(100, (scoreValue / submissions) * 100)) : scoreValue > 0 ? 100 : 0;
      const sessionHistory = Array.isArray(session.history) ? session.history : [];
      const avgSpeed =
        sessionHistory.length > 0
          ? sessionHistory.reduce((sum: number, item: any) => sum + (typeof item.timeSpent === 'number' ? item.timeSpent : 0), 0) / sessionHistory.length
          : 0;
      return {
        name: `#${index + 1}`,
        date: formattedDate,
        score: scoreValue,
        accuracy: acc,
        speed: Number(avgSpeed.toFixed(1)),
      };
    });

    const unlockedCountValue = badges.filter((badge) => badge.unlocked).length;
    const levelProgressValue = Math.min(100, totalCorrectValue % 100 || (totalCorrectValue > 0 ? 100 : 0));
    const kpisValue = [
      {
        id: 'card_accuracy',
        label: 'Accuracy',
        value: `${overallAccuracyValue}%`,
        icon: Target,
        className: 'border-emerald-300/50 text-emerald-100 shadow-[0_0_24px_rgba(16,185,129,0.18)]',
      },
      {
        id: 'card_avg_speed',
        label: 'Avg speed',
        value: `${avgTimeCorrectValue.toFixed(1)}s`,
        icon: Clock,
        className: 'border-cyan-300/50 text-cyan-100 shadow-[0_0_24px_rgba(34,211,238,0.18)]',
      },
      {
        id: 'card_high_score',
        label: 'High score',
        value: `${highestScoreValue}`,
        icon: Trophy,
        className: 'border-fuchsia-300/55 text-fuchsia-100 shadow-[0_0_26px_rgba(217,70,239,0.2)]',
      },
      {
        id: 'card_total_solved',
        label: 'Solved',
        value: `${totalCorrectValue}`,
        icon: Activity,
        className: 'border-blue-300/55 text-blue-100 shadow-[0_0_26px_rgba(59,130,246,0.22)]',
      },
    ];

    return {
      totalGames: totalGamesValue,
      highestScore: highestScoreValue,
      totalCorrect: totalCorrectValue,
      overallAccuracy: overallAccuracyValue,
      avgTimeCorrect: avgTimeCorrectValue,
      under5: under5Value,
      between5and10: between5and10Value,
      over10: over10Value,
      operationStats: operationStatsValue,
      bestOp: bestOpValue,
      worstOp: worstOpValue,
      chartData: chartDataValue,
      unlockedCount: unlockedCountValue,
      levelProgress: levelProgressValue,
      kpis: kpisValue,
    };
  }, [badges, progress]);

  const handleNavSelect = useCallback((key: PremiumNavKey) => {
    sounds.playClick();
    if (key === 'home') {
      onBack();
    } else if (key === 'practice') {
      onNavigate('PRACTICE');
    } else if (key === 'challenges') {
      onNavigate('CHALLENGES');
    }
  }, [onBack, onNavigate]);

  return (
    <>
      <PremiumScreen wide>
        <PremiumTopBar
          markIcon={BarChart3}
          markAlt="Progress dashboard icon"
          markTone="stats"
          titleEyebrow="Progress"
          titleMain="Dashboard"
          onSecondaryAction={onStartGame}
          secondaryTitle="Start Level 1 drill"
        />

        <button
          id="btn_back_menu"
          type="button"
          onClick={() => {
            sounds.playClick();
            onBack();
          }}
          className="mt-4 flex w-fit items-center gap-2 rounded-full border border-cyan-100/16 bg-slate-950/50 px-3 py-2 text-[10px] font-black uppercase tracking-widest text-cyan-100/68"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Menu
        </button>

        <section
          className={`${PremiumGlassClass} mt-4 p-4`}
          style={premiumPanelStyle(panels.cosmicCard, 'rgba(7, 13, 34, 0.78)')}
        >
          <CardEnergy className="-left-24 bottom-[-70px]" />
          <img src={fx.goldSparkBurst} alt="" aria-hidden="true" className="pointer-events-none absolute -right-20 -top-16 h-56 w-56 opacity-24 mix-blend-screen" />
          <div className="relative z-10 grid grid-cols-[96px_1fr] items-center gap-4 sm:grid-cols-[128px_1fr]">
            <div className="relative grid h-32 place-items-center sm:h-40">
              <div className="absolute left-1/2 top-2 h-[108px] w-[108px] -translate-x-1/2 rounded-[2rem] border border-cyan-200/42 bg-cyan-300/10 shadow-[0_0_34px_rgba(34,211,238,0.26),inset_0_1px_0_rgba(255,255,255,0.12)] sm:top-3 sm:h-32 sm:w-32" />
              <img
                src={mascots.headAvatar}
                alt="Pi-bot avatar"
                className="relative z-10 h-[108px] w-[108px] -translate-y-2 object-contain drop-shadow-[0_18px_26px_rgba(34,211,238,0.3)] sm:h-32 sm:w-32 sm:-translate-y-2"
              />
            </div>
            <div className="min-w-0">
              <h2 className="text-[42px] font-black leading-none tracking-tight text-white sm:text-5xl">Level 1</h2>
              <div className="mt-4 flex items-center gap-3">
                <div className="h-3 flex-1 overflow-hidden rounded-full bg-slate-800/90">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-yellow-300 via-amber-400 to-orange-500 shadow-[0_0_18px_rgba(251,191,36,0.5)]"
                    style={{ width: `${levelProgress}%` }}
                  />
                </div>
                <span className="font-mono text-sm font-black text-cyan-50">{levelProgress}/100</span>
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                <SparkleBadge>{totalGames} drills</SparkleBadge>
                <SparkleBadge>{unlockedCount} badges</SparkleBadge>
              </div>
            </div>
          </div>
        </section>

        <section className="mt-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
          {kpis.map(({ id, label, value, icon: Icon, className }) => (
            <div
              id={id}
              key={label}
              className={`${PremiumGlassClass} min-h-[132px] p-4 ${className}`}
              style={premiumPanelStyle(panels.statsCard, 'rgba(8, 17, 41, 0.74)')}
            >
              <div className="relative z-10 flex h-full flex-col justify-between">
                <div className="grid h-12 w-12 place-items-center rounded-full border border-current/35 bg-current/10">
                  <Icon className="h-7 w-7" />
                </div>
                <div>
                  <span className={`${labelClass} text-current/70`}>{label}</span>
                  <div className="mt-1 font-mono text-3xl font-black leading-none text-white">{value}</div>
                </div>
              </div>
            </div>
          ))}
        </section>

        <section className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
          <div className={`${PremiumGlassClass} p-4`} style={premiumPanelStyle(panels.cosmicCard, 'rgba(7, 13, 34, 0.82)')}>
            <h3 className={`${labelClass} mb-4 flex items-center gap-2 text-cyan-300`}>
              <Zap className="h-4 w-4 text-emerald-300" />
              Response intervals
            </h3>
            {[
              ['Under 5s', under5, 'Fast', 'text-emerald-200'],
              ['5s - 10s', between5and10, 'Average', 'text-amber-200'],
              ['Over 10s', over10, 'Slow', 'text-rose-200'],
            ].map(([label, value, tone, color]) => (
              <div key={label} className="mb-2 flex items-center justify-between rounded-2xl border border-cyan-100/14 bg-slate-950/48 px-4 py-3">
                <span className="text-xs font-black text-cyan-50">
                  {label} <span className="ml-1 text-[9px] uppercase text-cyan-100/45">({tone})</span>
                </span>
                <span className={`font-mono text-base font-black ${color}`}>{value}</span>
              </div>
            ))}
          </div>

          <div className={`${PremiumGlassClass} p-4`} style={premiumPanelStyle(panels.cosmicCard, 'rgba(7, 13, 34, 0.82)')}>
            <h3 className={`${labelClass} mb-4 flex items-center gap-2 text-cyan-300`}>
              <Gauge className="h-4 w-4 text-violet-300" />
              Operation mastery
            </h3>
            <div className="grid h-[calc(100%-2rem)] grid-cols-2 gap-3">
              <div className="flex flex-col justify-center rounded-2xl border border-emerald-200/35 bg-emerald-300/10 p-4 text-center">
                <span className={`${labelClass} mb-2 text-emerald-200`}>Fastest</span>
                <span className="text-xl font-black capitalize text-cyan-50">{bestOp.toLowerCase()}</span>
                {bestOp !== 'N/A' && <span className="mt-1 font-mono text-xs text-emerald-200">{(operationStats[bestOp].totalTime / operationStats[bestOp].count).toFixed(1)}s avg</span>}
              </div>
              <div className="flex flex-col justify-center rounded-2xl border border-rose-200/35 bg-rose-300/10 p-4 text-center">
                <span className={`${labelClass} mb-2 text-rose-200`}>Needs practice</span>
                <span className="text-xl font-black capitalize text-cyan-50">{worstOp.toLowerCase()}</span>
                {worstOp !== 'N/A' && <span className="mt-1 font-mono text-xs text-rose-200">{(operationStats[worstOp].totalTime / operationStats[worstOp].count).toFixed(1)}s avg</span>}
              </div>
            </div>
          </div>
        </section>

        <section className={`${PremiumGlassClass} mt-4 p-4`} style={premiumPanelStyle(panels.cosmicCard, 'rgba(7, 13, 34, 0.82)')}>
          <div className="relative z-10 mb-4 flex flex-wrap items-center justify-between gap-3">
            <h3 className={`${labelClass} flex items-center gap-2 text-cyan-300`}>
              <BarChart3 className="h-4 w-4 text-blue-300" />
              Recent drills
            </h3>
            {chartData.length > 0 && (
              <div className="flex gap-2 text-[10px] font-black uppercase tracking-widest">
                <span className="rounded-full border border-sky-300/30 bg-sky-300/10 px-2.5 py-1 text-sky-100">Score</span>
                <span className="rounded-full border border-emerald-300/30 bg-emerald-300/10 px-2.5 py-1 text-emerald-100">Accuracy</span>
              </div>
            )}
          </div>
          {chartData.length === 0 ? (
            <div className="flex h-64 items-center justify-center rounded-2xl border border-cyan-100/12 bg-slate-950/40">
              <span className="text-xs font-black uppercase tracking-widest text-cyan-100/45">No session data logged yet</span>
            </div>
          ) : (
            <div className="progress-chart-shell h-72 w-full rounded-[1.35rem] border border-cyan-100/14 bg-slate-950/48 p-2 text-xs font-mono shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData} margin={{ top: 18, right: 16, left: -18, bottom: 8 }}>
                  <defs>
                    <linearGradient id="scoreLineGradient" x1="0" y1="0" x2="1" y2="0">
                      <stop offset="0%" stopColor="#67e8f9" />
                      <stop offset="100%" stopColor="#60a5fa" />
                    </linearGradient>
                    <linearGradient id="accuracyLineGradient" x1="0" y1="0" x2="1" y2="0">
                      <stop offset="0%" stopColor="#6ee7b7" />
                      <stop offset="100%" stopColor="#facc15" />
                    </linearGradient>
                    <filter id="chartGlow" x="-20%" y="-20%" width="140%" height="140%">
                      <feGaussianBlur stdDeviation="2" result="coloredBlur" />
                      <feMerge>
                        <feMergeNode in="coloredBlur" />
                        <feMergeNode in="SourceGraphic" />
                      </feMerge>
                    </filter>
                  </defs>
                  <CartesianGrid stroke="#155e75" strokeOpacity={0.22} strokeDasharray="4 8" vertical={false} />
                  <XAxis dataKey="name" tick={{ fill: '#a5f3fc', fontSize: 10, fontWeight: 700 }} axisLine={{ stroke: '#164e63', strokeOpacity: 0.45 }} tickLine={false} />
                  <YAxis yAxisId="left" tick={{ fill: '#93c5fd', fontSize: 10, fontWeight: 700 }} name="Score" axisLine={false} tickLine={false} allowDecimals={false} width={34} />
                  <YAxis yAxisId="right" orientation="right" tick={{ fill: '#6ee7b7', fontSize: 10, fontWeight: 700 }} name="Accuracy" unit="%" axisLine={false} tickLine={false} domain={[0, 100]} width={38} />
                  <Tooltip
                    contentStyle={{ background: '#020617', color: '#e0f2fe', borderRadius: '14px', border: '1px solid rgba(103,232,249,0.28)', fontFamily: 'monospace', boxShadow: '0 12px 28px rgba(0,0,0,0.28)' }}
                    labelStyle={{ color: '#67e8f9', fontWeight: 900 }}
                    formatter={(value, name) => [name === 'Accuracy (%)' ? `${value}%` : value, name]}
                    labelFormatter={(_, payload) => payload?.[0]?.payload?.date ?? 'Drill'}
                  />
                  <Legend wrapperStyle={{ paddingTop: 8, fontSize: 11, color: '#cffafe' }} />
                  <Line yAxisId="left" type="monotone" dataKey="score" name="Score" stroke="url(#scoreLineGradient)" strokeWidth={3.5} filter="url(#chartGlow)" dot={{ r: 3.5, strokeWidth: 2, fill: '#020617', stroke: '#67e8f9' }} activeDot={{ r: 6, strokeWidth: 2, fill: '#67e8f9', stroke: '#ecfeff' }} />
                  <Line yAxisId="right" type="monotone" dataKey="accuracy" name="Accuracy (%)" stroke="url(#accuracyLineGradient)" strokeWidth={2.5} strokeDasharray="7 6" dot={{ r: 3, strokeWidth: 2, fill: '#020617', stroke: '#6ee7b7' }} activeDot={{ r: 5, strokeWidth: 2, fill: '#6ee7b7', stroke: '#ecfeff' }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
        </section>

        <section id="achievements_section" className={`${PremiumGlassClass} mt-4 p-4`} style={premiumPanelStyle(panels.cosmicCard, 'rgba(7, 13, 34, 0.82)')}>
          <div className="mb-4 flex items-center gap-2">
            <Trophy className="h-5 w-5 text-yellow-300" />
            <h3 className={`${labelClass} text-cyan-300`}>Achievements</h3>
            <span className="ml-auto rounded-full border border-cyan-100/15 bg-cyan-300/12 px-2.5 py-1 font-mono text-[10px] font-bold text-cyan-100">
              {unlockedCount} / {badges.length}
            </span>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {badges.map((badge) => (
              <div
                key={badge.id}
                id={`badge_card_${badge.id}`}
                className={`flex items-start gap-4 rounded-[1.35rem] border p-4 transition-all ${
                  badge.unlocked
                    ? 'border-amber-300/58 bg-amber-200/10 shadow-[0_0_20px_rgba(251,191,36,0.12)]'
                    : 'border-slate-600/55 bg-slate-950/45'
                }`}
              >
                <div className="relative h-16 w-16 shrink-0">
                  <img
                    src={badge.unlocked ? (badgeArtByAchievementId[badge.id] ?? badgeAssets.firstSolve) : badgeAssets.locked}
                    alt=""
                    aria-hidden="true"
                    className={`h-full w-full object-contain drop-shadow-[0_8px_16px_rgba(0,0,0,0.35)] ${badge.unlocked ? '' : 'grayscale opacity-75'}`}
                  />
                  {badge.unlocked && (
                    <img src={badgeAssets.unlockBurst} alt="" aria-hidden="true" className="pointer-events-none absolute inset-[-12px] h-[calc(100%+24px)] w-[calc(100%+24px)] object-contain opacity-35 mix-blend-screen" />
                  )}
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className={`text-sm font-bold tracking-tight ${badge.unlocked ? 'text-cyan-50' : 'text-cyan-100/45'}`}>
                      {badge.title}
                    </span>
                    {badge.unlocked ? (
                      <span className="grid h-4 w-4 place-items-center rounded-full bg-cyan-300 text-slate-950">
                        <Check className="h-2.5 w-2.5 stroke-[3]" />
                      </span>
                    ) : (
                      <Lock className="h-3.5 w-3.5 text-cyan-100/35" />
                    )}
                  </div>
                  <p className="mt-1 text-xs leading-tight text-cyan-100/60">{badge.description}</p>

                  <div className="mt-3 flex items-center justify-between gap-2">
                    <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-slate-800">
                      <div
                        className={`h-full rounded-full transition-all duration-300 ${badge.unlocked ? 'bg-cyan-400' : 'bg-slate-600'}`}
                        style={{
                          width: `${Math.min(
                            100,
                            badge.id === 'speed_demon'
                              ? badge.progressValue !== 0 && badge.progressValue < 1.5
                                ? 100
                                : Math.max(0, ((3 - badge.progressValue) / 1.5) * 100)
                              : (badge.progressValue / badge.progressTarget) * 100,
                          )}%`,
                        }}
                      />
                    </div>
                    <span className="shrink-0 font-mono text-[9px] font-bold uppercase text-cyan-100/50">{badge.progressText}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      </PremiumScreen>
      <PremiumBottomNav active="progress" onSelect={handleNavSelect} />
    </>
  );
};

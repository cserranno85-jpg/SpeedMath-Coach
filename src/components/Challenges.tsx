import React, { useEffect, useMemo, useState } from 'react';
import { ArrowRight, CalendarDays, CheckCircle2, Flame, Play, Target, Trophy, Zap } from 'lucide-react';
import { sounds } from '../utils/soundEngine';
import { calculateStreak } from '../utils/streakAndAchievements';
import { challengeIcons, fx, panels } from '../assets/uiAssetRegistry';
import {
  CardEnergy,
  PremiumBottomNav,
  PremiumCTA,
  PremiumGlassClass,
  PremiumNavKey,
  PremiumScreen,
  PremiumTopBar,
  SparkleBadge,
  labelClass,
  premiumPanelStyle,
} from './PremiumShell';

interface ChallengesProps {
  onStartGame: () => void;
  onNavigate: (state: 'HOME' | 'PRACTICE' | 'PROGRESS' | 'CHALLENGES') => void;
}

export const Challenges: React.FC<ChallengesProps> = ({ onStartGame, onNavigate }) => {
  const [progress, setProgress] = useState<any[]>([]);

  useEffect(() => {
    const raw = localStorage.getItem('speedMathProgress');
    if (!raw) return;
    try {
      const parsed = JSON.parse(raw);
      setProgress(Array.isArray(parsed) ? parsed : []);
    } catch (e) {
      setProgress([]);
    }
  }, []);

  const handleNavSelect = (key: PremiumNavKey) => {
    sounds.playClick();
    if (key === 'home') onNavigate('HOME');
    if (key === 'practice') onNavigate('PRACTICE');
    if (key === 'progress') onNavigate('PROGRESS');
  };

  const challengeCards = useMemo(() => {
    const lastSession = progress[progress.length - 1];
    const bestAccuracy = progress.reduce((best, session) => {
      const submissions = session.totalSubmissions || session.totalQuestions || session.history?.length || session.score || 0;
      const accuracy = submissions > 0 ? Math.round(((session.score || 0) / submissions) * 100) : 0;
      return Math.max(best, Math.min(100, accuracy));
    }, 0);
    const streakDays = calculateStreak(progress);
    const sprintProgress = Math.min(10, lastSession?.score || 0);

    return [
      {
        title: 'Daily Speed Sprint',
        description: 'Solve 10 timed questions before the arena clock cools down.',
        reward: '+25 XP',
        tag: 'Timed',
        relevance: `${sprintProgress}/10 solved in latest drill`,
        status: sprintProgress >= 10 ? 'Ready to claim' : 'Start sprint',
        icon: Zap,
        art: challengeIcons.timed,
        tone: 'border-cyan-300/48 bg-cyan-300/10 text-cyan-100',
        complete: sprintProgress >= 10,
      },
      {
        title: 'Accuracy Master',
        description: 'Finish a drill with 90%+ accuracy and keep your answer chain clean.',
        reward: '+40 XP',
        tag: 'Precision',
        relevance: `Best accuracy ${bestAccuracy}% / 90%`,
        status: bestAccuracy >= 90 ? 'Mastered' : 'Train accuracy',
        icon: Target,
        art: challengeIcons.daily,
        tone: 'border-emerald-300/48 bg-emerald-300/10 text-emerald-100',
        complete: bestAccuracy >= 90,
      },
      {
        title: 'Streak Builder',
        description: 'Complete practice for 3 active days to build a durable routine.',
        reward: '+60 XP',
        tag: 'Habit',
        relevance: `${Math.min(3, streakDays)}/3 active days`,
        status: streakDays >= 3 ? 'Streak secured' : 'Keep streaking',
        icon: Flame,
        art: challengeIcons.untimed,
        tone: 'border-amber-300/52 bg-amber-300/10 text-amber-100',
        complete: streakDays >= 3,
      },
    ];
  }, [progress]);

  return (
    <>
      <PremiumScreen>
        <PremiumTopBar
          markIcon={Trophy}
          markAlt="Challenges arena icon"
          markTone="challenge"
          titleEyebrow="Game mode"
          titleMain="Challenges"
          onSecondaryAction={() => onNavigate('PRACTICE')}
          secondaryTitle="Open practice setup"
        />

        <section
          className={`${PremiumGlassClass} mt-4 p-5 shadow-[0_22px_58px_rgba(8,47,73,0.34),0_0_34px_rgba(251,191,36,0.12),inset_0_1px_0_rgba(255,255,255,0.1)]`}
          style={premiumPanelStyle(panels.cosmicCard, 'rgba(7, 13, 34, 0.82)')}
        >
          <CardEnergy className="-right-24 -top-24" />
          <img src={fx.goldSparkBurst} alt="" aria-hidden="true" className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 opacity-24 mix-blend-screen" />
          <div className="relative z-10 flex flex-col items-center text-center">
            <div className="grid h-28 w-28 place-items-center rounded-[2rem] border border-amber-200/50 bg-amber-300/12 shadow-[0_0_34px_rgba(251,191,36,0.28),inset_0_1px_0_rgba(255,255,255,0.12)]">
              <img src={challengeIcons.daily} alt="" aria-hidden="true" className="h-20 w-20 object-contain drop-shadow-[0_12px_22px_rgba(251,191,36,0.28)]" />
            </div>
            <p className={`${labelClass} mt-5 text-cyan-300`}>Challenges</p>
            <h2 className="mt-2 text-[38px] font-black leading-none tracking-tight text-white">Daily Arena</h2>
            <p className="mt-3 max-w-sm text-sm font-semibold leading-relaxed text-cyan-50/62">
              Clear focused objectives, earn XP, and turn practice sessions into game-mode progression.
            </p>
            <div className="mt-5 flex flex-wrap justify-center gap-2">
              <SparkleBadge>Timed</SparkleBadge>
              <SparkleBadge>Accuracy</SparkleBadge>
            </div>
          </div>
        </section>

        <section className="mt-4 grid grid-cols-2 gap-3">
          {[
            { label: 'Next run', value: 'Ready', icon: CalendarDays, tone: 'border-cyan-300/50 text-cyan-100 shadow-[0_0_24px_rgba(34,211,238,0.18)]' },
            { label: 'Focus', value: 'Speed', icon: Zap, tone: 'border-amber-300/55 text-amber-100 shadow-[0_0_24px_rgba(251,191,36,0.18)]' },
          ].map(({ label, value, icon: Icon, tone }) => (
            <div
              key={label}
              className={`${PremiumGlassClass} min-h-[126px] p-4 ${tone}`}
              style={premiumPanelStyle(panels.statsCard, 'rgba(8, 17, 41, 0.74)')}
            >
              <div className="relative z-10 flex h-full flex-col justify-between">
                <div className="grid h-12 w-12 place-items-center rounded-full border border-current/35 bg-current/10">
                  <Icon className="h-7 w-7" />
                </div>
                <div>
                  <span className={`${labelClass} text-current/70`}>{label}</span>
                  <div className="mt-1 text-2xl font-black leading-none text-white">{value}</div>
                </div>
              </div>
            </div>
          ))}
        </section>

        <section className="mt-4 flex flex-col gap-3">
          {challengeCards.map(({ title, description, reward, tag, relevance, status, icon: Icon, art, tone, complete }) => (
            <button
              key={title}
              type="button"
              onClick={() => {
                sounds.playClick();
                onStartGame();
              }}
              className={`${PremiumGlassClass} group min-h-[150px] p-4 text-left ${tone}`}
              style={premiumPanelStyle(panels.statsCard, 'rgba(7, 17, 42, 0.78)')}
            >
              <div className="relative z-10 flex h-full gap-3.5">
                <div className="grid h-16 w-16 shrink-0 place-items-center rounded-[1.25rem] border border-current/35 bg-current/10">
                  <img src={art} alt="" aria-hidden="true" className="h-11 w-11 object-contain" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <Icon className="h-4 w-4 shrink-0" />
                        <h3 className="truncate text-base font-black leading-tight text-white">{title}</h3>
                      </div>
                      <p className="mt-1.5 text-xs font-semibold leading-snug text-cyan-50/64">{description}</p>
                    </div>
                    <span className="shrink-0 rounded-full border border-current/28 bg-current/10 px-2.5 py-1 font-mono text-[10px] font-black text-current">
                      {reward}
                    </span>
                  </div>
                  <div className="mt-4 flex flex-wrap items-center gap-2">
                    <span className="rounded-full border border-current/24 bg-slate-950/36 px-2.5 py-1 text-[10px] font-black uppercase tracking-widest text-current">
                      {tag}
                    </span>
                    <span className="min-w-0 flex-1 truncate text-[10px] font-bold uppercase tracking-widest text-cyan-100/48">
                      {relevance}
                    </span>
                  </div>
                  <div className="mt-3 flex items-center justify-between gap-3">
                    <span className={`inline-flex items-center gap-1.5 text-[11px] font-black uppercase tracking-widest ${complete ? 'text-emerald-200' : 'text-cyan-100'}`}>
                      {complete ? <CheckCircle2 className="h-4 w-4" /> : <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />}
                      {status}
                    </span>
                  </div>
                </div>
              </div>
            </button>
          ))}
        </section>

        <PremiumCTA
          id="btn_challenges_start_drill"
          icon={Play}
          onClick={() => {
            sounds.playClick();
            onStartGame();
          }}
        >
          Start SpeedMath Drill
        </PremiumCTA>
      </PremiumScreen>
      <PremiumBottomNav active="challenges" onSelect={handleNavSelect} />
    </>
  );
};

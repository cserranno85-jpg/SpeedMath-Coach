import React, { useEffect, useState } from 'react';
import { Activity, Flame, Gem, Play, Target, Zap } from 'lucide-react';
import { calculateStreak, evaluateAchievements, Badge } from '../utils/streakAndAchievements';
import { sounds } from '../utils/soundEngine';
import { brandMarks, fx, mascots, panels } from '../assets/uiAssetRegistry';
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

interface ProfileProps {
  onStartGame: () => void;
  onNavigate: (state: 'HOME' | 'PRACTICE' | 'PROGRESS' | 'PROFILE' | 'CHALLENGES') => void;
}

export const Profile: React.FC<ProfileProps> = ({ onStartGame, onNavigate }) => {
  const [progress, setProgress] = useState<any[]>([]);
  const [badges, setBadges] = useState<Badge[]>([]);

  useEffect(() => {
    const raw = localStorage.getItem('speedMathProgress');
    if (raw) {
      try {
        const parsed = JSON.parse(raw);
        setProgress(Array.isArray(parsed) ? parsed : []);
        setBadges(evaluateAchievements(Array.isArray(parsed) ? parsed : []));
      } catch (e) {
        setBadges(evaluateAchievements([]));
      }
    } else {
      setBadges(evaluateAchievements([]));
    }
  }, []);

  const totalSessions = progress.length;
  const totalCorrect = progress.reduce((sum, session) => sum + (session.score || 0), 0);
  const totalSubmissions = progress.reduce((sum, session) => sum + (session.totalSubmissions || session.totalQuestions || 0), 0);
  const accuracy = totalSubmissions > 0 ? Math.round((totalCorrect / totalSubmissions) * 100) : 0;
  const highScore = progress.reduce((max, session) => Math.max(max, session.score || 0), 0);
  const streak = calculateStreak(progress);
  const unlockedBadges = badges.filter((badge) => badge.unlocked).length;
  const levelProgress = Math.min(100, totalCorrect % 100 || (totalCorrect > 0 ? 100 : 0));

  const handleNavSelect = (key: PremiumNavKey) => {
    sounds.playClick();
    if (key === 'home') onNavigate('HOME');
    if (key === 'practice') onNavigate('PRACTICE');
    if (key === 'progress') onNavigate('PROGRESS');
    if (key === 'challenges') onNavigate('CHALLENGES');
  };

  const profileStats = [
    { label: 'Solved', value: totalCorrect, icon: Zap, className: 'border-blue-300/55 text-blue-100 shadow-[0_0_26px_rgba(59,130,246,0.22)]' },
    { label: 'Accuracy', value: `${accuracy}%`, icon: Target, className: 'border-emerald-300/55 text-emerald-100 shadow-[0_0_26px_rgba(16,185,129,0.22)]' },
    { label: 'Streak', value: streak, icon: Flame, className: 'border-amber-300/60 text-amber-100 shadow-[0_0_26px_rgba(251,191,36,0.24)]' },
    { label: 'Best', value: highScore, icon: Gem, className: 'border-fuchsia-300/55 text-fuchsia-100 shadow-[0_0_26px_rgba(217,70,239,0.22)]' },
  ];

  return (
    <>
      <PremiumScreen>
        <PremiumTopBar
          logoSrc={brandMarks.primaryLogo}
          onPrimaryAction={() => onNavigate('HOME')}
          onSecondaryAction={() => onNavigate('PRACTICE')}
          primaryTitle="Back to dashboard"
          secondaryTitle="Open practice setup"
        />

        <section
          className={`${PremiumGlassClass} mt-4 p-5 text-center shadow-[0_22px_58px_rgba(8,47,73,0.34),0_0_34px_rgba(217,70,239,0.12),inset_0_1px_0_rgba(255,255,255,0.1)]`}
          style={premiumPanelStyle(panels.cosmicCard, 'rgba(7, 13, 34, 0.8)')}
        >
          <CardEnergy className="-left-24 bottom-[-70px]" />
          <img src={fx.purpleEnergyRing} alt="" aria-hidden="true" className="pointer-events-none absolute left-1/2 top-7 h-48 w-48 -translate-x-1/2 object-contain opacity-26 mix-blend-screen" />
          <div className="relative z-10 flex flex-col items-center">
            <p className={`${labelClass} text-cyan-300`}>Coach profile</p>
            <div className="relative mt-5 grid h-44 w-44 place-items-center rounded-[2.5rem] border border-cyan-100/55 bg-cyan-300/10 shadow-[0_0_42px_rgba(34,211,238,0.34),0_0_28px_rgba(251,191,36,0.18),inset_0_1px_0_rgba(255,255,255,0.18)]">
              <div className="absolute inset-3 rounded-[2rem] border border-amber-200/22 bg-slate-950/42" />
              <img
                src={mascots.headAvatar}
                alt="Pi-bot profile avatar"
                className="relative z-10 h-36 w-36 object-contain drop-shadow-[0_20px_30px_rgba(34,211,238,0.36)]"
              />
            </div>
            <h2 className="mt-5 text-[44px] font-black leading-none tracking-tight text-white">Level 1</h2>
            <div className="mt-4 flex w-full items-center gap-3">
              <div className="h-3 flex-1 overflow-hidden rounded-full bg-slate-800/90 shadow-[inset_0_1px_3px_rgba(0,0,0,0.8)]">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-yellow-300 via-amber-400 to-orange-500 shadow-[0_0_18px_rgba(251,191,36,0.52)]"
                  style={{ width: `${levelProgress}%` }}
                />
              </div>
              <span className="font-mono text-sm font-black text-cyan-50">{levelProgress}/100</span>
            </div>
            <div className="mt-4 flex flex-wrap justify-center gap-2">
              <SparkleBadge>{totalSessions} drills</SparkleBadge>
              <SparkleBadge>{unlockedBadges} badges</SparkleBadge>
            </div>
          </div>
        </section>

        <section className="mt-4 grid grid-cols-2 gap-3">
          {profileStats.map(({ label, value, icon: Icon, className }) => (
            <div
              key={label}
              className={`${PremiumGlassClass} min-h-[126px] p-4 ${className}`}
              style={premiumPanelStyle(panels.statsCard, 'rgba(8, 17, 41, 0.74)')}
            >
              <div className="absolute -right-8 -bottom-8 h-24 w-24 rounded-full bg-current opacity-[0.08] blur-xl" />
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

        <section
          className={`${PremiumGlassClass} mt-4 p-[18px] shadow-[0_18px_44px_rgba(8,47,73,0.3),0_0_24px_rgba(34,211,238,0.1),inset_0_1px_0_rgba(255,255,255,0.1)]`}
          style={premiumPanelStyle(panels.cosmicCard, 'rgba(7, 13, 34, 0.82)')}
        >
          <div className="absolute -right-10 -top-12 h-28 w-28 rounded-full bg-cyan-300/10 blur-2xl" />
          <div className="relative z-10 flex items-center gap-3.5">
            <div className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl border border-cyan-200/40 bg-cyan-300/12 text-cyan-100 shadow-[0_0_24px_rgba(34,211,238,0.24),inset_0_1px_0_rgba(255,255,255,0.12)]">
              <Activity className="h-7 w-7" />
            </div>
            <div className="min-w-0">
              <p className={`${labelClass} text-cyan-300`}>Training note</p>
              <p className="mt-1.5 text-sm font-semibold leading-snug text-cyan-50/70">
                Keep going - complete drills, build your streak, and unlock more achievements.
              </p>
            </div>
          </div>
        </section>

        <PremiumCTA
          id="btn_profile_start_drill"
          icon={Play}
          onClick={() => {
            sounds.playClick();
            onStartGame();
          }}
        >
          Start SpeedMath Drill
        </PremiumCTA>
      </PremiumScreen>
      <PremiumBottomNav active="profile" onSelect={handleNavSelect} />
    </>
  );
};

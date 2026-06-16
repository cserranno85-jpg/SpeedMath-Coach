import React from 'react';
import { CalendarDays, Play, Trophy, Zap } from 'lucide-react';
import { sounds } from '../utils/soundEngine';
import { brandMarks, challengeIcons, fx, panels } from '../assets/uiAssetRegistry';
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
  onNavigate: (state: 'HOME' | 'PRACTICE' | 'PROGRESS' | 'PROFILE' | 'CHALLENGES') => void;
}

export const Challenges: React.FC<ChallengesProps> = ({ onStartGame, onNavigate }) => {
  const handleNavSelect = (key: PremiumNavKey) => {
    sounds.playClick();
    if (key === 'home') onNavigate('HOME');
    if (key === 'practice') onNavigate('PRACTICE');
    if (key === 'progress') onNavigate('PROGRESS');
    if (key === 'profile') onNavigate('PROFILE');
  };

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
              Challenge ladders are staged here. Start a tuned practice drill while the next arena set is prepared.
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

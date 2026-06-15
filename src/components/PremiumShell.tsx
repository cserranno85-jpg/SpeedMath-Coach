import React from 'react';
import {
  BarChart3,
  Bolt,
  Home,
  LucideIcon,
  Settings,
  Sparkles,
  Trophy,
  UserRound,
  WandSparkles,
} from 'lucide-react';
import { buttonGlows, fx, panels } from '../assets/uiAssetRegistry';

export type PremiumNavKey = 'home' | 'practice' | 'progress' | 'challenges' | 'profile';

export const premiumPanelStyle = (
  asset: string,
  overlay = 'rgba(7, 13, 34, 0.82)',
): React.CSSProperties => ({
  backgroundImage: `linear-gradient(135deg, ${overlay}, rgba(2, 6, 23, 0.94)), url(${asset})`,
  backgroundPosition: 'center',
  backgroundSize: 'cover',
});

export const labelClass = 'text-[10px] font-black uppercase tracking-[0.22em]';

export const premiumGlassClass =
  'relative overflow-hidden rounded-[1.75rem] border border-cyan-200/30 bg-slate-950/78 text-white shadow-[0_18px_48px_rgba(8,47,73,0.32),inset_0_1px_0_rgba(255,255,255,0.08)] backdrop-blur-xl';

export const PremiumGlassClass = premiumGlassClass;

interface PremiumTopBarProps {
  logoSrc: string;
  onPrimaryAction?: () => void;
  onSecondaryAction?: () => void;
  primaryTitle?: string;
  secondaryTitle?: string;
  muted?: boolean;
}

export const PremiumTopBar: React.FC<PremiumTopBarProps> = ({
  logoSrc,
  onPrimaryAction,
  onSecondaryAction,
  primaryTitle = 'Open controls',
  secondaryTitle = 'Level 1',
  muted = false,
}) => (
  <header
    className="relative z-20 flex items-center gap-3 rounded-[1.7rem] border border-cyan-200/25 bg-slate-950/72 px-3.5 py-3 text-white shadow-[0_14px_40px_rgba(3,12,35,0.56),inset_0_1px_0_rgba(255,255,255,0.08)] backdrop-blur-xl"
    style={premiumPanelStyle(panels.navbarGlow, 'rgba(7, 13, 34, 0.8)')}
  >
    <div className="pointer-events-none absolute -left-10 -top-12 h-28 w-28 rounded-full bg-cyan-400/18 blur-2xl" />
    <div className="relative flex min-w-0 flex-1 items-center gap-3">
      <div className="grid h-[58px] w-[58px] shrink-0 place-items-center rounded-[1.35rem] border border-cyan-200/35 bg-cyan-300/10 shadow-[0_0_28px_rgba(34,211,238,0.24),inset_0_0_24px_rgba(59,130,246,0.12)]">
        <img
          src={logoSrc}
          alt="SpeedMath Coach logo"
          className="h-12 w-12 object-contain drop-shadow-[0_0_14px_rgba(251,191,36,0.38)]"
        />
      </div>
      <div className="min-w-0 leading-none">
        <div className="text-[12px] font-black uppercase tracking-[0.12em] text-cyan-300">SpeedMath</div>
        <div className="mt-1 text-[25px] font-black tracking-tight text-white">Coach</div>
      </div>
    </div>

    <div className="relative flex shrink-0 items-center gap-2">
      <button
        type="button"
        onClick={onPrimaryAction}
        title={primaryTitle}
        className="grid h-[54px] w-[54px] place-items-center rounded-[1.35rem] border border-indigo-200/35 bg-indigo-400/12 text-cyan-50 shadow-[0_0_22px_rgba(99,102,241,0.25),inset_0_1px_0_rgba(255,255,255,0.1)] transition active:scale-95"
      >
        <WandSparkles className={`h-6 w-6 ${muted ? 'text-rose-200' : 'text-cyan-50'}`} />
      </button>
      <button
        type="button"
        onClick={onSecondaryAction}
        title={secondaryTitle}
        className="flex h-[54px] items-center gap-2 rounded-[1.35rem] border border-amber-200/40 bg-amber-300/10 px-4 text-amber-100 shadow-[0_0_22px_rgba(251,191,36,0.18),inset_0_1px_0_rgba(255,255,255,0.1)] transition active:scale-95"
      >
        <Bolt className="h-5 w-5 fill-amber-300 text-amber-300" />
        <span className="text-xl font-black tracking-wide">L1</span>
      </button>
    </div>
  </header>
);

interface PremiumScreenProps {
  children: React.ReactNode;
  className?: string;
  wide?: boolean;
}

export const PremiumScreen: React.FC<PremiumScreenProps> = ({ children, className = '', wide = false }) => (
  <main
    className={`relative mx-auto flex min-h-[100dvh] w-full flex-col px-3.5 pt-3.5 text-white ${wide ? 'max-w-4xl' : 'max-w-[460px]'} ${className}`}
    style={{ paddingBottom: 'calc(108px + env(safe-area-inset-bottom, 0px))' }}
  >
    {children}
  </main>
);

interface PremiumCTAProps {
  children: React.ReactNode;
  onClick: () => void;
  icon?: LucideIcon;
  id?: string;
}

export const PremiumCTA: React.FC<PremiumCTAProps> = ({ children, onClick, icon: Icon = Settings, id }) => (
  <button
    id={id}
    type="button"
    onClick={onClick}
    className="relative flex min-h-[64px] w-full items-center justify-center gap-3 overflow-hidden rounded-full border border-cyan-100/70 bg-cyan-300 px-6 text-sm font-black uppercase tracking-[0.18em] text-slate-950 shadow-[0_0_34px_rgba(34,211,238,0.45),0_14px_36px_rgba(37,99,235,0.34),inset_0_1px_0_rgba(255,255,255,0.45)] transition hover:brightness-110 active:scale-[0.98]"
    style={{
      backgroundImage: `linear-gradient(90deg, rgba(103,232,249,0.98), rgba(14,165,233,0.98) 46%, rgba(37,99,235,0.98)), url(${buttonGlows.primary})`,
      backgroundSize: 'cover',
      backgroundPosition: 'center',
    }}
  >
    <span className="pointer-events-none absolute inset-x-8 top-0 h-px bg-white/80" />
    <Icon className="h-5 w-5 stroke-[2.7]" />
    <span>{children}</span>
    <span className="absolute right-5 text-2xl leading-none text-cyan-50/80">»</span>
  </button>
);

const navItems: Array<{ key: PremiumNavKey; label: string; icon: LucideIcon }> = [
  { key: 'home', label: 'Home', icon: Home },
  { key: 'practice', label: 'Practice', icon: Bolt },
  { key: 'progress', label: 'Progress', icon: BarChart3 },
  { key: 'challenges', label: 'Challenges', icon: Trophy },
  { key: 'profile', label: 'Profile', icon: UserRound },
];

interface PremiumBottomNavProps {
  active: PremiumNavKey;
  onSelect: (key: PremiumNavKey) => void;
}

export const PremiumBottomNav: React.FC<PremiumBottomNavProps> = ({ active, onSelect }) => (
  <nav
    className="fixed inset-x-0 bottom-0 z-40 mx-auto w-full max-w-[460px] px-3.5 pb-3"
    style={{ paddingBottom: 'calc(12px + env(safe-area-inset-bottom, 0px))' }}
    aria-label="Primary navigation"
  >
    <div
      className="relative grid grid-cols-5 gap-1 overflow-hidden rounded-[1.55rem] border border-cyan-200/22 bg-slate-950/86 p-1.5 text-white shadow-[0_-10px_34px_rgba(8,47,73,0.25),0_16px_44px_rgba(2,6,23,0.7),inset_0_1px_0_rgba(255,255,255,0.08)] backdrop-blur-xl"
      style={premiumPanelStyle(panels.navbarGlow, 'rgba(5, 10, 29, 0.84)')}
    >
      <img src={fx.mathParticles} alt="" aria-hidden="true" className="pointer-events-none absolute inset-0 h-full w-full object-cover opacity-[0.08] mix-blend-screen" />
      {navItems.map(({ key, label, icon: Icon }) => {
        const isActive = key === active;
        return (
          <button
            key={key}
            type="button"
            onClick={() => onSelect(key)}
            className={`relative z-10 flex h-[70px] min-w-0 flex-col items-center justify-center gap-1 rounded-[1.25rem] text-[10px] font-black transition active:scale-95 ${
              isActive
                ? 'border border-cyan-200/50 bg-cyan-400/18 text-cyan-50 shadow-[0_0_24px_rgba(34,211,238,0.42),inset_0_0_18px_rgba(14,165,233,0.18)]'
                : 'text-cyan-100/58 hover:text-cyan-50'
            }`}
          >
            <Icon className={`h-6 w-6 ${isActive ? 'drop-shadow-[0_0_10px_rgba(34,211,238,0.9)]' : ''}`} />
            <span className="max-w-full truncate leading-none">{label}</span>
          </button>
        );
      })}
    </div>
  </nav>
);

interface OrbProps {
  className?: string;
}

export const CardEnergy: React.FC<OrbProps> = ({ className = '' }) => (
  <>
    <img src={fx.mathParticles} alt="" aria-hidden="true" className="pointer-events-none absolute inset-0 h-full w-full object-cover opacity-[0.11] mix-blend-screen" />
    <img src={fx.cyanOrbGlow} alt="" aria-hidden="true" className={`pointer-events-none absolute h-52 w-52 object-contain opacity-24 mix-blend-screen ${className}`} />
  </>
);

export const SparkleBadge: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <span className="inline-flex items-center gap-1.5 rounded-full border border-cyan-100/18 bg-cyan-300/10 px-3 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-cyan-100/70">
    <Sparkles className="h-3.5 w-3.5 text-amber-300" />
    {children}
  </span>
);

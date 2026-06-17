import React from 'react';
import {
  BarChart3,
  Bolt,
  Home,
  LucideIcon,
  Music,
  Settings,
  Sparkles,
  Trophy,
  VolumeX,
} from 'lucide-react';
import { buttonGlows, fx, panels } from '../assets/uiAssetRegistry';
import { sounds } from '../utils/soundEngine';

export type PremiumNavKey = 'home' | 'practice' | 'progress' | 'challenges';

export const premiumPanelStyle = (
  asset: string,
  overlay = 'rgba(3, 11, 35, 0.86)',
): React.CSSProperties => ({
  backgroundImage: `linear-gradient(135deg, ${overlay}, rgba(2, 8, 31, 0.96)), url(${asset})`,
  backgroundPosition: 'center',
  backgroundSize: 'cover',
});

export const labelClass = 'text-[10px] font-black uppercase tracking-[0.22em]';

export const premiumGlassClass =
  'mobile-light-glass premium-card-depth premium-shimmer relative overflow-hidden rounded-[1.75rem] border border-cyan-200/32 bg-[#03102f]/86 text-white shadow-[0_14px_34px_rgba(8,47,73,0.22),0_0_18px_rgba(34,211,238,0.06),inset_0_1px_0_rgba(255,255,255,0.09)] backdrop-blur-md';

export const PremiumGlassClass = premiumGlassClass;

type TopBarMarkKind = 'brand' | 'mascot' | 'icon';

interface AppLogoBadgeProps {
  src: string;
  alt: string;
  size?: 'sm' | 'md' | 'lg';
  kind?: TopBarMarkKind;
  className?: string;
}

export const AppLogoBadge: React.FC<AppLogoBadgeProps> = ({
  src,
  alt,
  size = 'md',
  kind = 'brand',
  className = '',
}) => {
  const frameSize = size === 'lg' ? 'h-[68px] w-[68px] rounded-[1.55rem]' : size === 'sm' ? 'h-12 w-12 rounded-[1.05rem]' : 'h-[58px] w-[58px] rounded-[1.35rem]';
  const imageSize = size === 'lg' ? 'h-[58px] w-[58px] rounded-[1.2rem]' : size === 'sm' ? 'h-10 w-10 rounded-[0.85rem]' : 'h-12 w-12 rounded-[1.05rem]';
  const fit = kind === 'brand' ? 'object-cover' : 'object-contain';
  const frameTone =
    kind === 'brand'
      ? 'border-cyan-200/35 bg-cyan-300/10 shadow-[0_0_20px_rgba(34,211,238,0.18),inset_0_0_18px_rgba(59,130,246,0.1)]'
      : kind === 'mascot'
      ? 'border-cyan-200/34 bg-blue-400/10 shadow-[0_0_18px_rgba(34,211,238,0.18),inset_0_1px_0_rgba(255,255,255,0.1)]'
      : 'border-amber-200/40 bg-amber-300/12 text-amber-100 shadow-[0_0_18px_rgba(251,191,36,0.16),inset_0_1px_0_rgba(255,255,255,0.1)]';

  return (
    <div className={`app-icon-rounded grid shrink-0 place-items-center overflow-hidden border ${frameSize} ${frameTone} ${className}`}>
      <img
        src={src}
        alt={alt}
        className={`rounded-logo-frame ${imageSize} ${fit} ${kind === 'brand' ? 'app-logo-image' : 'screen-mark-image'}`}
      />
    </div>
  );
};

type IconBadgeTone = 'stats' | 'challenge' | 'neutral';

interface TopBarIconBadgeProps {
  Icon: LucideIcon;
  label: string;
  tone?: IconBadgeTone;
}

const topBarIconToneClass: Record<IconBadgeTone, string> = {
  stats: 'border-sky-200/44 bg-sky-300/13 text-sky-100 shadow-[0_0_20px_rgba(56,189,248,0.18),inset_0_1px_0_rgba(255,255,255,0.12)]',
  challenge: 'border-amber-200/46 bg-amber-300/13 text-amber-100 shadow-[0_0_20px_rgba(251,191,36,0.18),inset_0_1px_0_rgba(255,255,255,0.12)]',
  neutral: 'border-cyan-200/36 bg-cyan-300/11 text-cyan-100 shadow-[0_0_18px_rgba(34,211,238,0.16),inset_0_1px_0_rgba(255,255,255,0.1)]',
};

export const TopBarIconBadge: React.FC<TopBarIconBadgeProps> = ({ Icon, label, tone = 'neutral' }) => (
  <div
    aria-label={label}
    role="img"
    className={`app-icon-rounded grid h-[58px] w-[58px] shrink-0 place-items-center overflow-hidden rounded-[1.35rem] border ${topBarIconToneClass[tone]}`}
  >
    <div className="grid h-12 w-12 place-items-center rounded-[1.05rem] border border-white/12 bg-slate-950/34">
      <Icon className="h-7 w-7 stroke-[2.5] drop-shadow-[0_0_12px_rgba(125,211,252,0.35)]" />
    </div>
  </div>
);

interface PremiumTopBarProps {
  logoSrc?: string;
  markIcon?: LucideIcon;
  markTone?: IconBadgeTone;
  markAlt?: string;
  markKind?: TopBarMarkKind;
  titleEyebrow?: string;
  titleMain?: string;
  onPrimaryAction?: (muted: boolean) => void;
  onSecondaryAction?: () => void;
  primaryTitle?: string;
  secondaryTitle?: string;
  muted?: boolean;
}

export const PremiumTopBar: React.FC<PremiumTopBarProps> = ({
  logoSrc,
  markIcon: MarkIcon,
  markTone = 'neutral',
  markAlt,
  markKind = 'brand',
  titleEyebrow = 'SpeedMath',
  titleMain = 'Coach',
  onPrimaryAction,
  onSecondaryAction,
  primaryTitle,
  secondaryTitle = 'Level 1',
  muted,
}) => {
  const [localMuted, setLocalMuted] = React.useState(() => sounds.getMutedStatus());
  const isMuted = muted ?? localMuted;
  const audioTitle = primaryTitle ?? (isMuted ? 'Turn music on' : 'Turn music off');
  const AudioIcon = isMuted ? VolumeX : Music;

  const handleAudioToggle = () => {
    const nextMuted = !isMuted;
    if (onPrimaryAction) {
      onPrimaryAction(nextMuted);
    } else {
      sounds.setMute(nextMuted);
      setLocalMuted(nextMuted);
      if (!nextMuted) {
        sounds.playClick();
      }
    }
  };

  return (
    <header
      className="mobile-light-glass premium-card-depth relative z-20 flex items-center gap-3 rounded-[1.7rem] border border-cyan-200/32 bg-[#03102f]/82 px-3.5 py-3 text-white shadow-[0_12px_28px_rgba(3,12,35,0.42),0_0_16px_rgba(34,211,238,0.06),inset_0_1px_0_rgba(255,255,255,0.09)] backdrop-blur-md"
      style={premiumPanelStyle(panels.navbarGlow, 'rgba(3, 12, 38, 0.84)')}
    >
      <div className="pointer-events-none absolute -left-8 -top-10 h-24 w-24 rounded-full bg-cyan-400/10 opacity-70" />
      <div className="relative flex min-w-0 flex-1 items-center gap-3">
        {MarkIcon ? (
          <TopBarIconBadge Icon={MarkIcon} label={markAlt ?? `${titleMain} icon`} tone={markTone} />
        ) : (
          <AppLogoBadge src={logoSrc ?? ''} alt={markAlt ?? 'SpeedMath Coach logo'} kind={markKind} />
        )}
        <div className="min-w-0 leading-none">
          <div className="truncate text-[12px] font-black uppercase tracking-[0.12em] text-cyan-300">{titleEyebrow}</div>
          <div className="mt-1 truncate text-[25px] font-black tracking-tight text-white">{titleMain}</div>
        </div>
      </div>

      <div className="relative flex shrink-0 items-center gap-2">
        <button
          type="button"
          onClick={handleAudioToggle}
          title={audioTitle}
          aria-label={audioTitle}
          aria-pressed={!isMuted}
          className={`premium-action-pill grid h-[54px] w-[54px] place-items-center rounded-[1.35rem] border shadow-[0_0_18px_rgba(99,102,241,0.16),inset_0_1px_0_rgba(255,255,255,0.12)] ${
            isMuted
              ? 'border-rose-200/42 bg-rose-400/12 text-rose-100'
              : 'border-cyan-100/48 bg-cyan-300/14 text-cyan-50'
          }`}
        >
          <AudioIcon className="h-6 w-6" />
        </button>
        <button
          type="button"
          onClick={onSecondaryAction}
          title={secondaryTitle}
          className="premium-action-pill flex h-[54px] items-center gap-2 rounded-[1.35rem] border border-amber-200/44 bg-amber-300/12 px-4 text-amber-100 shadow-[0_0_18px_rgba(251,191,36,0.14),inset_0_1px_0_rgba(255,255,255,0.12)]"
        >
          <Bolt className="h-5 w-5 fill-amber-300 text-amber-300" />
          <span className="text-xl font-black tracking-wide">L1</span>
        </button>
      </div>
    </header>
  );
};

interface PremiumScreenProps {
  children: React.ReactNode;
  className?: string;
  wide?: boolean;
}

export const PremiumScreen: React.FC<PremiumScreenProps> = ({ children, className = '', wide = false }) => (
  <main
    className={`premium-screen-safe premium-bottom-safe relative mx-auto flex min-h-[100dvh] w-full flex-col text-white ${wide ? 'max-w-4xl' : 'max-w-[460px]'} ${className}`}
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
    className="premium-3d-button premium-cta-glow relative flex min-h-[64px] w-full items-center justify-center gap-3 overflow-hidden rounded-full border border-cyan-100/70 bg-cyan-300 px-6 text-sm font-black uppercase tracking-[0.18em] text-slate-950 hover:brightness-110"
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
];

interface PremiumBottomNavProps {
  active: PremiumNavKey;
  onSelect: (key: PremiumNavKey) => void;
}

export const PremiumBottomNav: React.FC<PremiumBottomNavProps> = ({ active, onSelect }) => (
  <nav
    className="fixed inset-x-0 bottom-0 z-40 mx-auto w-full max-w-[460px] px-3.5 pb-3"
    style={{ paddingBottom: 'calc(12px + var(--safe-bottom))' }}
    aria-label="Primary navigation"
  >
    <div
      className="mobile-light-glass premium-card-depth relative grid grid-cols-4 gap-1 overflow-hidden rounded-[1.55rem] border border-cyan-200/28 bg-[#02081f]/92 p-1.5 text-white shadow-[0_-8px_26px_rgba(8,47,73,0.22),0_14px_38px_rgba(2,6,23,0.68),inset_0_1px_0_rgba(255,255,255,0.09)] backdrop-blur-md"
      style={premiumPanelStyle(panels.navbarGlow, 'rgba(3, 12, 38, 0.88)')}
    >
      <img src={fx.mathParticles} alt="" aria-hidden="true" className="pointer-events-none absolute inset-0 h-full w-full object-cover opacity-[0.08] mix-blend-screen" />
      {navItems.map(({ key, label, icon: Icon }) => {
        const isActive = key === active;
        return (
          <button
            key={key}
            type="button"
            onClick={() => onSelect(key)}
            className={`premium-pressable relative z-10 flex h-[68px] min-w-0 flex-col items-center justify-center gap-1 rounded-[1.25rem] text-[10px] font-black ${
              isActive
                ? 'premium-selected-glow border border-cyan-100/58 bg-cyan-300/20 text-cyan-50 shadow-[0_0_24px_rgba(34,211,238,0.4),0_0_16px_rgba(167,139,250,0.14),inset_0_0_18px_rgba(14,165,233,0.18)]'
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

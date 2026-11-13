import React from 'react';
import {
  BarChart3, Bolt, Home, LucideIcon, Settings, Sparkles,
  Trophy, UserRound, Volume2, VolumeX, ArrowRight,
} from 'lucide-react';
import { fx } from '../assets/uiAssetRegistry';

export type PremiumNavKey = 'home' | 'practice' | 'progress' | 'challenges' | 'profile';

/** Keep the asset parameter for downstream callers; a quieter overlay avoids visual noise. */
export const premiumPanelStyle = (
  asset: string,
  overlay = 'rgba(8, 27, 60, 0.92)',
): React.CSSProperties => ({
  backgroundImage: `linear-gradient(155deg, %%{overlay}, rgba(4, 12, 36, 0.96)), url(%%{asset})`,
  backgroundPosition: 'center',
  backgroundSize: 'cover',
});

export const labelClass = 'text-[11px] font-bold uppercase tracking-[0.10em]';

export const premiumGlassClass =
  'relative overflow-hidden rounded-[22px] border border-[#2B5E87] bg-[#10254B] text-white shadow-[0_12px_30px_rgba(0,0,0,0.18)]';

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
  logoSrc, onPrimaryAction, onSecondaryAction, primaryTitle = 'Sound controls',
  secondaryTitle = 'Practice setup', muted = false,
}) => (
  <header className="relative z-20 flex min-h-[76px] items-center gap-3 rounded-[20px] border border-[#294C73] bg-[#0B1B3A] p-3 text-white">
    <div className="flex min-w-0 flex-1 items-center gap-3">
      <div className="grid h-12 w-12 shrink-0 place-items-center rounded-[14px] border border-[#3D719B] bg-[#122D55]">
        <img src={logoSrc} alt="SpeedMath Coach logo" className="h-11 w-11 object-contain" />
      </div>
      <div className="min-w-0">
        <p className="text-[11px] font-bold uppercase tracking-[0.13em] text-[#67E4FF]">SpeedMath</p>
        <p className="text-[22px] font-black leading-tight text-white">Coach</p>
      </div>
    </div>
    <div className="flex shrink-0 gap-2">
      <button type="button" onClick={onPrimaryAction} disabled={!onPrimaryAction}
        aria-label={primaryTitle} title={primaryTitle}
        className="sm-touch-target grid h-12 w-12 place-items-center rounded-[14px] border border-[#34597B] bg-[#142C50] text-[#D9EEFF] disabled:opacity-50">
        {muted ? <VolumeX aria-hidden="true" className="h-5 w-5" /> : <Volume2 aria-hidden="true" className="h-5 w-5" />}
      </button>
      <button type="button" onClick={onSecondaryAction} disabled={!onSecondaryAction}
        aria-label={secondaryTitle} title={secondaryTitle}
        className="sm-touch-target grid h-12 w-12 place-items-center rounded-[14px] border border-[#B78B48] bg-[#433519] text-[#FFD183] disabled:opacity-50">
        <Bolt aria-hidden="true" className="h-5 w-5" />
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
  <main className={`premium-screen-safe premium-bottom-safe relative mx-auto flex min-h-[100dvh] w-full flex-col gap-3 text-white %%{wide ? 'max-w-4xl' : 'max-w-[460px]'} %%{className}`}>{children}</main>
);

interface PremiumCTAProps {
  children: React.ReactNode;
  onClick: () => void;
  icon?: LucideIcon;
  id?: string;
}
export const PremiumCTA: React.FC<PremiumCTAProps> = ({ children, onClick, icon: Icon = Bolt, id }) => (
  <button id={id} type="button" onClick={onClick}
    className="sm-touch-target relative flex min-h-[60px] w-full items-center justify-center gap-3 rounded-[20px] border border-[#8DEBFF] bg-[#61E4FF] px-6 py-3 text-sm font-black tracking-wide text-[#04122C] transition-colors hover:bg-[#86EBFF] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#9AF0FF]">
    <Icon aria-hidden="true" className="h-5 w-5" />
    <span>{children}</span>
    <ArrowRight aria-hidden="true" className="h-5 w-5" />
  </button>
);

const navItems: Array<{ key: PremiumNavKey; label: string; icon: LucideIcon }> = [
  { key: 'home', label: 'Home', icon: Home },
  { key: 'practice', label: 'Practice', icon: Bolt },
  { key: 'progress', label: 'Progress', icon: BarChart3 },
  { key: 'challenges', label: 'Badges', icon: Trophy },
  { key: 'profile', label: 'Profile', icon: UserRound },
];
interface PremiumBottomNavProps {
  active: PremiumNavKey;
  onSelect: (key: PremiumNavKey) => void;
}
export const PremiumBottomNav: React.FC<PremiumBottomNavProps> = ({ active, onSelect }) => (
  <nav aria-label="Primary navigation" className="fixed inset-x-0 bottom-0 z-40 mx-auto w-full max-w-[460px] px-3.5"
    style={{ paddingBottom: 'calc(12px + var(--safe-bottom))' }}>
    <div className="grid grid-cols-5 gap-1 rounded-[22px] border border-[#2B5E87] bg-[#081B3C]/95 p-1.5 shadow-[0_6px_20px_rgba(0,0,0,0.28)] backdrop-blur-md">
      {navItems.map(({ key, label, icon: Icon }) => {
        const selected = active === key;
        return (
          <button key={key} type="button" onClick={() => onSelect(key)}
            aria-label={label} aria-current={selected ? 'page' : undefined}
            className={`sm-touch-target flex min-h-[58px] min-w-0 flex-col items-center justify-center gap-1 rounded-[15px] px-0.5 text-[10px] font-bold transition-colors %%{selected ? 'bg-[#153A60] text-[#69E5FF]' : 'text-[#AFC6E6] hover:bg-[#10274B]'}`}>
            <Icon aria-hidden="true" className="h-5 w-5" />
            <span className="max-w-full truncate">{label}</span>
          </button>
        );
      })}
    </div>
  </nav>
);

export const CardEnergy: React.FC<{ className?: string }> = ({ className = '' }) => (
  <img src={fx.cyanOrbGlow} alt="" aria-hidden="true"
    className={`pointer-events-none absolute h-44 w-44 object-contain opacity-[0.05] %%{className}`} />
);

export const SparkleBadge: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <span className="inline-flex items-center gap-1.5 rounded-full border border-[#315B80] bg-[#14365B] px-3 py-1.5 text-[11px] font-bold text-[#BFEAFF]">
    <Sparkles aria-hidden="true" className="h-3.5 w-3.5 text-[#FFCD75]" />
    {children}
  </span>
);

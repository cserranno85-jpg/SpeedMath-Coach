import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Check,
  Flame,
  Gauge,
  Gem,
  Play,
  SlidersHorizontal,
  Sparkles,
  Target,
  Zap,
} from 'lucide-react';
import { Settings as SettingsType, Difficulty, Operation, GameMode } from '../types';
import { calculateStreak, evaluateAchievements, Badge } from '../utils/streakAndAchievements';
import { sounds } from '../utils/soundEngine';
import {
  badgeArtByAchievementId,
  badges as badgeAssets,
  brandMarks,
  challengeIcons,
  fx,
  mascots,
  operationIcons,
  panels,
} from '../assets/uiAssetRegistry';
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

interface MenuProps {
  settings: SettingsType;
  onSettingsChange: (newSettings: SettingsType) => void;
  onStartGame: () => void;
  onNavigate?: (state: 'HOME' | 'PRACTICE' | 'PROGRESS' | 'CHALLENGES') => void;
  initialTab?: 'DASHBOARD' | 'SETTINGS';
  activeNav?: PremiumNavKey;
}

const modeIconByMode: Record<GameMode, string> = {
  [GameMode.TIMED]: challengeIcons.timed,
  [GameMode.UNTIMED]: challengeIcons.untimed,
};

const settingPanelClass =
  'premium-card-depth relative overflow-hidden rounded-[1.35rem] border border-cyan-100/18 bg-[#03102f]/62 p-3.5 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]';

export const Menu: React.FC<MenuProps> = ({
  settings,
  onSettingsChange,
  onStartGame,
  onNavigate,
  initialTab = 'DASHBOARD',
  activeNav,
}) => {
  const [streak, setStreak] = useState(0);
  const [badges, setBadges] = useState<Badge[]>([]);
  const [totalSolves, setTotalSolves] = useState(0);
  const [accuracy, setAccuracy] = useState(0);
  const [muted, setMuted] = useState(sounds.getMutedStatus());
  const [activeTab, setActiveTab] = useState<'DASHBOARD' | 'SETTINGS'>(initialTab);
  const [highScore, setHighScore] = useState(0);
  const [totalSessions, setTotalSessions] = useState(0);

  const handleToggleMute = useCallback((nextVal = !muted) => {
    sounds.setMute(nextVal);
    setMuted(nextVal);
    if (!nextVal) {
      sounds.playClick();
    }
  }, [muted]);

  useEffect(() => {
    setActiveTab(initialTab);
  }, [initialTab]);

  useEffect(() => {
    const raw = localStorage.getItem('speedMathProgress');
    if (raw) {
      try {
        const parsed = JSON.parse(raw);
        setStreak(calculateStreak(parsed));
        const evaluated = evaluateAchievements(parsed);
        setBadges(evaluated);

        setTotalSessions(parsed.length);
        const high = parsed.reduce((max: number, s: any) => Math.max(max, s.score || 0), 0);
        setHighScore(high);

        let totalC = 0;
        let totalS = 0;
        parsed.forEach((session: any) => {
          totalC += session.score || 0;
          totalS += session.totalSubmissions || session.totalQuestions || 0;
        });
        setTotalSolves(totalC);
        setAccuracy(totalS > 0 ? Math.round((totalC / totalS) * 100) : 0);
      } catch (e) {}
    } else {
      setBadges(evaluateAchievements([]));
    }
  }, []);

  const toggleOperation = useCallback((op: Operation) => {
    sounds.playClick();
    onSettingsChange({
      ...settings,
      operations: {
        ...settings.operations,
        [op]: !settings.operations[op],
      },
    });
  }, [onSettingsChange, settings]);

  const unlockedBadgesCount = useMemo(() => badges.filter((badge) => badge.unlocked).length, [badges]);
  const featuredBadge = useMemo(() => badges.find((badge) => badge.unlocked) ?? badges[0], [badges]);
  const levelProgress = Math.min(100, totalSolves % 100 || (totalSolves > 0 ? 100 : 0));
  const selectedOperations = useMemo(
    () => Object.values(Operation).filter((op) => settings.operations[op]),
    [settings.operations],
  );

  const navActive: PremiumNavKey = activeNav ?? (activeTab === 'SETTINGS' ? 'practice' : 'home');
  const handleNavSelect = useCallback((key: PremiumNavKey) => {
    sounds.playClick();
    if (key === 'home') {
      onNavigate?.('HOME');
      setActiveTab('DASHBOARD');
    } else if (key === 'practice') {
      onNavigate?.('PRACTICE');
      setActiveTab('SETTINGS');
    } else if (key === 'progress') {
      onNavigate?.('PROGRESS');
    } else if (key === 'challenges') {
      onNavigate?.('CHALLENGES');
    }
  }, [onNavigate]);

  const statCards = useMemo(() => [
    {
      label: 'Solved',
      value: `${totalSolves}`,
      detail: totalSessions > 0 ? `${totalSessions} drills` : 'First drill ready',
      icon: Zap,
      theme: 'border-blue-300/55 bg-blue-500/12 text-blue-100 shadow-[0_0_26px_rgba(59,130,246,0.22)]',
      bubble: 'border-blue-200/45 bg-blue-400/18 text-blue-100 shadow-[0_0_22px_rgba(59,130,246,0.36)]',
    },
    {
      label: 'Accuracy',
      value: `${accuracy}%`,
      detail: accuracy > 0 ? 'Overall precision' : 'No attempts yet',
      icon: Target,
      theme: 'border-emerald-300/55 bg-emerald-400/12 text-emerald-100 shadow-[0_0_26px_rgba(16,185,129,0.2)]',
      bubble: 'border-emerald-200/45 bg-emerald-400/18 text-emerald-100 shadow-[0_0_22px_rgba(16,185,129,0.34)]',
    },
    {
      label: 'Streak',
      value: `${streak}`,
      detail: streak === 1 ? 'day active' : 'days active',
      icon: Flame,
      theme: 'border-amber-300/60 bg-amber-400/12 text-amber-100 shadow-[0_0_26px_rgba(251,191,36,0.22)]',
      bubble: 'border-amber-200/50 bg-amber-400/18 text-amber-100 shadow-[0_0_22px_rgba(251,191,36,0.36)]',
    },
    {
      label: 'Best',
      value: `${highScore}`,
      detail: 'High score',
      icon: Gem,
      theme: 'border-fuchsia-300/55 bg-fuchsia-400/12 text-fuchsia-100 shadow-[0_0_26px_rgba(217,70,239,0.2)]',
      bubble: 'border-fuchsia-200/45 bg-fuchsia-400/18 text-fuchsia-100 shadow-[0_0_22px_rgba(217,70,239,0.34)]',
    },
  ], [accuracy, highScore, streak, totalSessions, totalSolves]);

  return (
    <>
      <PremiumScreen>
        <PremiumTopBar
          logoSrc={brandMarks.primaryLogo}
          muted={muted}
          onPrimaryAction={handleToggleMute}
          onSecondaryAction={() => {
            sounds.playClick();
            onNavigate?.('PRACTICE');
            setActiveTab('SETTINGS');
          }}
          primaryTitle={muted ? 'Unmute audio' : 'Mute audio'}
          secondaryTitle="Level 1 setup"
        />

        {activeTab === 'DASHBOARD' ? (
          <section id="dashboard_tab_content" className="mt-4 flex flex-col gap-4">
            <div
              id="home_level_card"
              className={`${PremiumGlassClass} min-h-[250px] border-blue-300/40 p-4 shadow-[0_18px_52px_rgba(29,78,216,0.24),0_0_34px_rgba(251,191,36,0.1),inset_0_1px_0_rgba(255,255,255,0.1)]`}
              style={premiumPanelStyle(panels.cosmicCard, 'rgba(7, 13, 34, 0.76)')}
            >
              <CardEnergy className="-left-24 bottom-[-70px]" />
              <img
                src={fx.goldSparkBurst}
                alt=""
                aria-hidden="true"
                className="pointer-events-none absolute -right-20 -top-16 h-56 w-56 opacity-28 mix-blend-screen"
              />
              <div className="relative z-10 grid min-h-[218px] grid-cols-[42%_1fr] items-center gap-3">
                <div className="relative flex h-full items-center justify-center pt-1">
                  <div className="relative grid h-[142px] w-[142px] place-items-center rounded-[2.15rem] border border-cyan-200/58 bg-cyan-300/11 shadow-[0_0_38px_rgba(34,211,238,0.34),0_0_24px_rgba(251,191,36,0.2),inset_0_1px_0_rgba(255,255,255,0.18),inset_0_-14px_26px_rgba(2,8,31,0.32)]">
                    <div className="absolute inset-3 rounded-[1.7rem] border border-amber-200/20 bg-[#02081f]/38" />
                    <div className="absolute -bottom-4 left-1/2 h-16 w-32 -translate-x-1/2 rounded-full border border-amber-300/24 bg-amber-300/10 shadow-[0_0_34px_rgba(251,191,36,0.28)]" />
                    <img
                      src={mascots.headAvatar}
                      alt="Pi-bot avatar"
                      className="relative z-10 h-[122px] w-[122px] -translate-y-1 object-contain drop-shadow-[0_20px_28px_rgba(34,211,238,0.34)]"
                    />
                  </div>
                </div>

                <div className="min-w-0 py-2">
                  <p className={`${labelClass} text-cyan-300`}>Training level</p>
                  <h2 className="mt-2 text-[46px] font-black leading-none tracking-tight text-white">Level 1</h2>
                  <div className="mt-5 flex items-center gap-3">
                    <div className="h-3 flex-1 overflow-hidden rounded-full bg-slate-800/90 shadow-[inset_0_1px_3px_rgba(0,0,0,0.8)]">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-yellow-300 via-amber-400 to-orange-500 shadow-[0_0_18px_rgba(251,191,36,0.5)]"
                        style={{ width: `${levelProgress}%` }}
                      />
                    </div>
                    <span className="font-mono text-sm font-black text-cyan-50">{levelProgress}/100</span>
                  </div>
                  <div className="mt-5 rounded-[1.15rem] border border-cyan-100/16 bg-slate-950/40 p-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]">
                    <p className={`${labelClass} text-cyan-100/50`}>Pi-bot synced</p>
                    <p className="mt-1 text-xs font-semibold leading-snug text-cyan-50/62">
                      Robot head avatar active for this training dashboard.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {statCards.map(({ label, value, detail, icon: Icon, theme, bubble }) => (
                <div
                  key={label}
                  className={`${PremiumGlassClass} min-h-[142px] p-4 ${theme}`}
                  style={premiumPanelStyle(panels.statsCard, 'rgba(8, 17, 41, 0.72)')}
                >
                  <div className="absolute -right-8 -bottom-8 h-24 w-24 rounded-full bg-current opacity-[0.06]" />
                  <div className="relative z-10 flex h-full flex-col justify-between">
                    <div className="flex items-center justify-between gap-2">
                      <div className={`grid h-14 w-14 place-items-center rounded-full border ${bubble}`}>
                        <Icon className="h-8 w-8 stroke-[2.2]" />
                      </div>
                      <p className={`${labelClass} text-current/80`}>{label}</p>
                    </div>
                    <div>
                      <div className="font-mono text-[42px] font-black leading-none text-white">{value}</div>
                      <p className="mt-2 text-[10px] font-bold uppercase tracking-widest text-cyan-50/48">{detail}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div
              className={`${PremiumGlassClass} p-4`}
              style={premiumPanelStyle(panels.cosmicCard, 'rgba(6, 13, 34, 0.8)')}
            >
              <CardEnergy className="-right-24 -top-24" />
              <div className="relative z-10 mb-4 flex items-center justify-between">
                <h3 className={`${labelClass} text-cyan-300`}>Top badges</h3>
                <button
                  type="button"
                  onClick={() => {
                    sounds.playClick();
                    onNavigate?.('PROGRESS');
                  }}
                  className="text-xs font-bold text-cyan-200"
                >
                  View all ›
                </button>
              </div>
              {featuredBadge && (
                <button
                  type="button"
                  onClick={() => {
                    sounds.playClick();
                    onNavigate?.('PROGRESS');
                  }}
                  className="relative z-10 flex w-full items-center gap-4 rounded-[1.35rem] border border-cyan-200/22 bg-blue-950/34 p-4 text-left shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]"
                >
                  <div className="relative grid h-20 w-20 shrink-0 place-items-center">
                    <img
                      src={featuredBadge.unlocked ? (badgeArtByAchievementId[featuredBadge.id] ?? badgeAssets.firstSolve) : badgeAssets.locked}
                      alt=""
                      aria-hidden="true"
                      className={`h-16 w-16 object-contain drop-shadow-[0_10px_18px_rgba(34,211,238,0.24)] ${featuredBadge.unlocked ? '' : 'grayscale opacity-70'}`}
                    />
                    {featuredBadge.unlocked && (
                      <img src={badgeAssets.unlockBurst} alt="" aria-hidden="true" className="absolute inset-0 h-full w-full object-contain opacity-35 mix-blend-screen" />
                    )}
                  </div>
                  <div className="min-w-0">
                    <div className="text-lg font-black leading-tight text-white">{featuredBadge.title}</div>
                    <p className="mt-1 line-clamp-2 text-sm font-semibold leading-snug text-cyan-100/62">
                      {featuredBadge.unlocked ? featuredBadge.description : `${unlockedBadgesCount} / ${badges.length} unlocked`}
                    </p>
                  </div>
                </button>
              )}
            </div>

            <PremiumCTA
              id="btn_start_session_dashboard"
              icon={Play}
              onClick={() => {
                sounds.playClick();
                onStartGame();
              }}
            >
              Start SpeedMath Drill
            </PremiumCTA>
          </section>
        ) : (
          <section
            id="session_setup_card"
            className={`${PremiumGlassClass} mt-4 space-y-4 p-4`}
            style={premiumPanelStyle(panels.cosmicCard, 'rgba(7, 13, 34, 0.84)')}
          >
            <CardEnergy className="-right-24 -top-24" />
            <div className="relative z-10 flex items-center justify-between gap-3 border-b border-cyan-100/12 pb-4">
              <div className="flex min-w-0 items-center gap-3">
                <div className="relative grid h-12 w-12 shrink-0 place-items-center overflow-hidden rounded-2xl border border-cyan-200/40 bg-cyan-300/12 text-cyan-100 shadow-[0_0_22px_rgba(34,211,238,0.24),0_0_18px_rgba(251,191,36,0.1),inset_0_1px_0_rgba(255,255,255,0.12)]">
                  <div className="absolute inset-1 rounded-[1rem] border border-cyan-100/12 bg-slate-950/44" />
                  <SlidersHorizontal className="relative z-10 h-6 w-6 stroke-[2.5] drop-shadow-[0_0_10px_rgba(34,211,238,0.55)]" />
                </div>
                <div className="min-w-0">
                  <p className={`${labelClass} text-cyan-300`}>Rules & setup</p>
                  <h3 className="truncate text-xl font-black tracking-tight text-white">Session Calibration</h3>
                </div>
              </div>
              <SparkleBadge>{settings.difficulty}</SparkleBadge>
            </div>

            <div className="relative z-10 space-y-4">
              <section className={settingPanelClass}>
                <h4 className={`${labelClass} mb-3 flex items-center gap-2 text-cyan-100/60`}>
                  <img src={modeIconByMode[settings.gameMode]} alt="" aria-hidden="true" className="h-5 w-5 object-contain" />
                  Training format
                </h4>
                <div className="grid grid-cols-2 gap-2.5">
                  {[
                    { mode: GameMode.TIMED, label: 'Timed', icon: challengeIcons.timed },
                    { mode: GameMode.UNTIMED, label: 'Practice', icon: challengeIcons.untimed },
                  ].map(({ mode, label, icon }) => (
                    <button
                      key={mode}
                      id={mode === GameMode.TIMED ? 'btn_mode_timed' : 'btn_mode_untimed'}
                      type="button"
                      onClick={() => {
                        sounds.playClick();
                        onSettingsChange({ ...settings, gameMode: mode });
                      }}
                      className={`premium-toggle-3d flex min-h-[58px] items-center justify-center gap-2 rounded-2xl border px-3 text-xs font-black ${
                        settings.gameMode === mode
                          ? 'premium-selected-glow border-cyan-100 bg-cyan-300 text-slate-950 shadow-[0_0_22px_rgba(34,211,238,0.34)]'
                          : 'border-cyan-100/15 bg-[#02081f]/68 text-cyan-100/62'
                      }`}
                    >
                      <img src={icon} alt="" aria-hidden="true" className="h-7 w-7 object-contain" />
                      {label}
                    </button>
                  ))}
                </div>
              </section>

              <section className={settingPanelClass}>
                <h4 className={`${labelClass} mb-3 flex items-center gap-2 text-cyan-100/60`}>
                  <Sparkles className="h-4 w-4 text-cyan-300" />
                  Active operations
                </h4>
                <div className="grid grid-cols-2 gap-2.5">
                  {Object.values(Operation).map((op) => (
                    <label
                      key={op}
                      className={`premium-toggle-3d flex min-h-[58px] cursor-pointer select-none items-center gap-2.5 rounded-2xl border px-3 text-xs font-black ${
                        settings.operations[op]
                          ? 'premium-selected-glow border-cyan-200/55 bg-cyan-300/14 text-cyan-50 shadow-[0_0_16px_rgba(34,211,238,0.12)]'
                          : 'border-cyan-100/15 bg-[#02081f]/68 text-cyan-100/55'
                      }`}
                    >
                      <input
                        type="checkbox"
                        className="h-[18px] w-[18px] cursor-pointer rounded border-slate-300 accent-cyan-300"
                        checked={settings.operations[op]}
                        onChange={() => toggleOperation(op)}
                      />
                      <img src={operationIcons[op]} alt="" aria-hidden="true" className="h-7 w-7 object-contain" />
                      <span className="truncate capitalize">{op.toLowerCase()}</span>
                    </label>
                  ))}
                </div>
              </section>

              <section className={settingPanelClass}>
                <h4 className={`${labelClass} mb-3 flex items-center gap-2 text-cyan-100/60`}>
                  <Gauge className="h-4 w-4 text-violet-300" />
                  Difficulty
                </h4>
                <div className="grid grid-cols-2 gap-2.5">
                  {Object.values(Difficulty).map((diff) => (
                    <button
                      key={diff}
                      id={`btn_diff_${diff.toLowerCase()}`}
                      type="button"
                      onClick={() => {
                        sounds.playClick();
                        onSettingsChange({ ...settings, difficulty: diff });
                      }}
                      className={`premium-toggle-3d rounded-xl border px-3 py-2.5 text-xs font-black ${
                        settings.difficulty === diff
                          ? 'premium-selected-glow border-violet-100 bg-violet-300 text-slate-950 shadow-[0_0_18px_rgba(167,139,250,0.28)]'
                          : 'border-cyan-100/15 bg-[#02081f]/68 text-cyan-100/60'
                      }`}
                    >
                      {diff}
                    </button>
                  ))}
                </div>
              </section>

              <label className="premium-toggle-3d flex cursor-pointer select-none items-start justify-between gap-4 rounded-[1.35rem] border border-cyan-100/15 bg-[#02081f]/62 p-4">
                <div>
                  <div className="flex items-center gap-2 text-xs font-black text-cyan-50">
                    <Sparkles className="h-3.5 w-3.5 text-cyan-300" />
                    Adaptive learning
                  </div>
                  <p className="mt-1 text-[10px] leading-normal text-cyan-100/55">Scale difficulty based on live drill accuracy.</p>
                </div>
                <input
                  type="checkbox"
                  className="mt-0.5 h-5 w-5 cursor-pointer rounded border-slate-300 accent-cyan-300"
                  checked={settings.adaptiveDifficulty}
                  onChange={(e) => {
                    sounds.playClick();
                    onSettingsChange({ ...settings, adaptiveDifficulty: e.target.checked });
                  }}
                />
              </label>

              {settings.gameMode === GameMode.TIMED && (
                <section className={settingPanelClass}>
                  <h4 className={`${labelClass} mb-3 flex items-center gap-2 text-cyan-100/60`}>
                    <img src={challengeIcons.timed} alt="" aria-hidden="true" className="h-5 w-5 object-contain" />
                    Duration
                  </h4>
                  <div className="grid grid-cols-4 gap-2">
                    {[30, 60, 120, 300].map((time) => (
                      <button
                        key={time}
                        id={`btn_duration_${time}`}
                        type="button"
                        onClick={() => {
                          sounds.playClick();
                          onSettingsChange({ ...settings, gameDurationSeconds: time });
                        }}
                        className={`premium-toggle-3d rounded-xl border px-2 py-2.5 text-xs font-black ${
                          settings.gameDurationSeconds === time
                            ? 'premium-selected-glow border-cyan-100 bg-cyan-300 text-slate-950 shadow-[0_0_16px_rgba(34,211,238,0.28)]'
                            : 'border-cyan-100/15 bg-[#02081f]/68 text-cyan-100/60'
                        }`}
                      >
                        {time < 60 ? `${time}s` : `${time / 60}m`}
                      </button>
                    ))}
                  </div>
                </section>
              )}

              <div className="rounded-[1.35rem] border border-cyan-100/15 bg-slate-950/42 p-3 text-[10px] font-black uppercase tracking-widest text-cyan-50/62">
                <div className="mb-2 flex items-center justify-between gap-2">
                  <span>Current setup</span>
                  <span>{settings.gameMode}</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {selectedOperations.map((op) => (
                    <span key={op} className="rounded-full border border-cyan-200/24 bg-cyan-300/10 px-2.5 py-1 text-cyan-100">
                      {op.toLowerCase()}
                    </span>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 gap-3 min-[390px]:grid-cols-2">
                <button
                  id="btn_save_back"
                  type="button"
                  onClick={() => {
                    sounds.playClick();
                    setActiveTab('DASHBOARD');
                  }}
                  className="premium-3d-button flex min-h-[58px] items-center justify-center gap-2 rounded-2xl border border-cyan-100 bg-cyan-300 px-4 text-xs font-black uppercase tracking-widest text-slate-950 shadow-[0_0_22px_rgba(34,211,238,0.24)]"
                >
                  <Check className="h-4 w-4 stroke-[2.5]" />
                  Apply
                </button>
                <button
                  id="btn_play_direct"
                  type="button"
                  onClick={() => {
                    sounds.playClick();
                    onStartGame();
                  }}
                  className="premium-3d-button flex min-h-[58px] items-center justify-center gap-2 rounded-2xl border border-amber-200 bg-amber-300 px-4 text-xs font-black uppercase tracking-widest text-slate-950 shadow-[0_0_22px_rgba(251,191,36,0.24)]"
                >
                  <Play className="h-[18px] w-[18px] fill-current" />
                  Play
                </button>
              </div>
            </div>
          </section>
        )}
      </PremiumScreen>
      <PremiumBottomNav active={navActive} onSelect={handleNavSelect} />
    </>
  );
};

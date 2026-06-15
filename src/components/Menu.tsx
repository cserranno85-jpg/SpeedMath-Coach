import React, { useEffect, useState } from 'react';
import { Settings as SettingsType, Difficulty, Operation, GameMode } from '../types';
import {
  Settings as SettingsIcon, Play, BarChart2, Flame, Trophy, Sparkles,
  Volume2, VolumeX, Crown, Target, Check, Award, Zap
} from 'lucide-react';
import { calculateStreak, evaluateAchievements, Badge } from '../utils/streakAndAchievements';
import { sounds } from '../utils/soundEngine';
import {
  badgeArtByAchievementId,
  badges as badgeAssets,
  brandMarks,
  buttonGlows,
  challengeIcons,
  fx,
  mascots,
  operationIcons,
  panels,
} from '../assets/uiAssetRegistry';

interface MenuProps {
  settings: SettingsType;
  onSettingsChange: (newSettings: SettingsType) => void;
  onStartGame: () => void;
  onViewStats: () => void;
}

const cardAssetStyle = (asset: string, overlay = 'rgba(10, 16, 42, 0.78)'): React.CSSProperties => ({
  backgroundImage: `linear-gradient(135deg, ${overlay}, rgba(3, 7, 22, 0.92)), url(${asset})`,
  backgroundPosition: 'center',
  backgroundSize: 'cover',
});

const modeIconByMode: Record<GameMode, string> = {
  [GameMode.TIMED]: challengeIcons.timed,
  [GameMode.UNTIMED]: challengeIcons.untimed,
};

const shellCard =
  'relative overflow-hidden rounded-[1.75rem] border border-cyan-200/35 bg-slate-950/86 text-white shadow-[0_18px_48px_rgba(8,47,73,0.34)] backdrop-blur';

const sectionLabel =
  'text-[10px] font-black uppercase tracking-widest text-cyan-100/58';

const brandIconClassName =
  'h-14 w-14 rounded-2xl object-contain shadow-[0_0_22px_rgba(251,191,36,0.28)] ring-1 ring-amber-100/45';

export const Menu: React.FC<MenuProps> = ({ settings, onSettingsChange, onStartGame, onViewStats }) => {
  const [streak, setStreak] = useState(0);
  const [badges, setBadges] = useState<Badge[]>([]);
  const [totalSolves, setTotalSolves] = useState(0);
  const [accuracy, setAccuracy] = useState(0);
  const [muted, setMuted] = useState(sounds.getMutedStatus());
  const [activeTab, setActiveTab] = useState<'DASHBOARD' | 'SETTINGS'>('DASHBOARD');
  const [highScore, setHighScore] = useState(0);
  const [totalSessions, setTotalSessions] = useState(0);

  const handleToggleMute = () => {
    const nextVal = !muted;
    sounds.setMute(nextVal);
    setMuted(nextVal);
    if (!nextVal) {
      sounds.playClick();
    }
  };

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
          totalS += (session.totalSubmissions || session.totalQuestions || 0);
        });
        setTotalSolves(totalC);
        setAccuracy(totalS > 0 ? Math.round((totalC / totalS) * 100) : 0);
      } catch (e) {}
    } else {
      setBadges(evaluateAchievements([]));
    }
  }, []);

  const toggleOperation = (op: Operation) => {
    sounds.playClick();
    onSettingsChange({
      ...settings,
      operations: {
        ...settings.operations,
        [op]: !settings.operations[op]
      }
    });
  };

  const getPibotMessage = () => {
    if (totalSolves === 0) {
      return "Welcome trainee. I am Pi-bot, your calculation assistant. Start with a clean beginner drill to prime your mental math engine.";
    }
    if (streak >= 3) {
      return `Strong momentum: ${streak} training days in a row. Your dashboard is ready for another record attempt.`;
    }
    if (streak > 0) {
      return `Training streak active at ${streak} days. Keep the cadence steady and push today's drill.`;
    }
    if (accuracy > 90 && totalSolves > 20) {
      return `Precision is calibrated at ${accuracy}%. Increase the challenge when you want a harder session.`;
    }
    return "Calibrate the rules or start a focused drill. The fastest path is a short timed session with one clean operation.";
  };

  const unlockedBadgesCount = badges.filter(b => b.unlocked).length;
  const featuredBadges = [
    ...badges.filter(badge => badge.unlocked),
    ...badges.filter(badge => !badge.unlocked),
  ].slice(0, 4);

  const statCards = [
    {
      label: 'Streak',
      value: `${streak}`,
      unit: streak === 1 ? 'day' : 'days',
      detail: totalSessions > 0 ? `${totalSessions} sessions logged` : 'Start a first drill',
      icon: Flame,
      iconClassName: 'border-amber-200/25 bg-amber-300/12 text-amber-200',
      className: 'border-amber-300/45 shadow-[0_12px_30px_rgba(251,191,36,0.13)]',
    },
    {
      label: 'Best',
      value: `${highScore}`,
      unit: 'pts',
      detail: 'Personal score record',
      icon: Crown,
      iconClassName: 'border-yellow-200/25 bg-yellow-300/12 text-yellow-200',
      className: 'border-yellow-300/45 shadow-[0_12px_30px_rgba(250,204,21,0.12)]',
    },
    {
      label: 'Solved',
      value: `${totalSolves}`,
      unit: 'total',
      detail: 'Correct answers banked',
      icon: Award,
      iconClassName: 'border-cyan-200/25 bg-cyan-300/12 text-cyan-200',
      className: 'border-cyan-300/45 shadow-[0_12px_30px_rgba(34,211,238,0.12)]',
    },
    {
      label: 'Precision',
      value: `${accuracy}`,
      unit: '%',
      detail: accuracy > 0 ? 'Overall accuracy' : 'No attempts yet',
      icon: Target,
      iconClassName: 'border-violet-200/25 bg-violet-300/12 text-violet-200',
      className: 'border-violet-300/45 shadow-[0_12px_30px_rgba(167,139,250,0.12)]',
    },
  ];

  return (
    <div id="menu_layout_root" className="w-full max-w-[460px] mx-auto flex flex-col gap-4 selection:bg-cyan-200 pb-2">
      <div
        className={`${shellCard} p-3.5`}
        style={cardAssetStyle(panels.navbarGlow, 'rgba(9, 16, 38, 0.82)')}
      >
        <img src={fx.mathParticles} alt="" aria-hidden="true" className="absolute inset-0 h-full w-full object-cover opacity-10 mix-blend-screen pointer-events-none" />
          <div className="relative z-10 flex items-center gap-3">
          <img
            src={brandMarks.primaryLogo}
            alt="SpeedMath Coach logo"
            className={brandIconClassName}
          />
          <div className="min-w-0 flex-1">
            <p className="text-[10px] font-black uppercase tracking-[0.22em] text-lime-300 leading-none">SpeedMath</p>
            <h1 className="text-lg font-black text-white leading-tight tracking-tight truncate">SpeedMath Coach</h1>
          </div>
          <div className="hidden min-[390px]:flex items-center rounded-full border border-cyan-100/20 bg-cyan-300/10 px-2.5 py-1 text-[9px] font-black uppercase tracking-widest text-cyan-50">
            {settings.difficulty}
          </div>
          <button
            onClick={() => { sounds.playClick(); onViewStats(); }}
            className="h-10 w-10 rounded-2xl border border-cyan-100/25 bg-slate-950/55 text-cyan-100 hover:text-white active:scale-95 transition flex items-center justify-center cursor-pointer"
            title="View performance stats"
          >
            <BarChart2 className="w-4 h-4" />
          </button>
          <button
            id="btn_toggle_mute"
            onClick={handleToggleMute}
            className={`h-10 w-10 rounded-2xl border transition-all duration-150 flex items-center justify-center active:scale-95 cursor-pointer shrink-0 ${
              muted
                ? 'border-rose-300/40 bg-rose-950/70 text-rose-200'
                : 'border-amber-200/70 bg-amber-300 text-amber-950 shadow-[0_0_18px_rgba(251,191,36,0.24)]'
            }`}
            title={muted ? 'Unmute Volume' : 'Mute Volume'}
          >
            {muted ? <VolumeX className="w-[18px] h-[18px] stroke-[2.5]" /> : <Volume2 className="w-[18px] h-[18px] stroke-[2.5]" />}
          </button>
        </div>
      </div>

      {activeTab === 'DASHBOARD' && (
        <div id="dashboard_tab_content" className="flex flex-col gap-4">
          <div
            id="pibot_mascot_header"
            className={`${shellCard} min-h-[216px] p-5`}
            style={cardAssetStyle(panels.cosmicCard, 'rgba(8, 16, 42, 0.78)')}
          >
            <img src={fx.cyanOrbGlow} alt="" aria-hidden="true" className="absolute -right-24 -top-24 h-64 w-64 opacity-28 mix-blend-screen pointer-events-none" />
            <img src={fx.goldSparkBurst} alt="" aria-hidden="true" className="absolute -left-14 bottom-[-72px] h-44 w-44 opacity-20 mix-blend-screen pointer-events-none" />
            <div className="relative z-10 max-w-[68%] pr-2">
              <div className="mb-3 inline-flex items-center gap-1.5 rounded-full border border-cyan-100/20 bg-cyan-300/10 px-3 py-1">
                <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                <span className={sectionLabel}>Pi-bot online</span>
              </div>
              <h2 className="text-2xl font-black leading-[1.04] tracking-tight text-white">Ready for a focused speed run?</h2>
              <p className="mt-3 text-xs font-semibold leading-relaxed text-cyan-50/76">
                {getPibotMessage()}
              </p>
              <button
                id="btn_start_session_dashboard"
                onClick={() => { sounds.playClick(); onStartGame(); }}
                className="mt-4 inline-flex items-center justify-center gap-2 rounded-2xl border border-amber-100/70 px-4 py-3 text-xs font-black uppercase tracking-widest text-amber-950 shadow-[0_0_28px_rgba(251,191,36,0.25)] transition hover:brightness-110 active:scale-95 cursor-pointer"
                style={{
                  backgroundImage: `linear-gradient(180deg, rgba(251, 191, 36, 0.9), rgba(245, 158, 11, 0.95)), url(${buttonGlows.primary})`,
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                }}
              >
                <Play className="w-4 h-4 fill-current" />
                Start Drill
              </button>
            </div>
            <div className="absolute bottom-[-8px] right-[-10px] h-48 w-40 min-[390px]:h-56 min-[390px]:w-48 flex items-end justify-center pointer-events-none select-none">
              <img
                src={mascots.waving}
                alt="Pi-bot coach"
                className="h-full w-auto object-contain animate-float-pibot drop-shadow-[0_22px_30px_rgba(34,211,238,0.34)]"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {statCards.map(({ label, value, unit, detail, icon: Icon, iconClassName, className }) => (
              <div
                key={label}
                className={`${shellCard} ${className} min-h-[116px] p-4`}
                style={cardAssetStyle(panels.statsCard, 'rgba(9, 17, 38, 0.82)')}
              >
                <div className="relative z-10 flex h-full flex-col justify-between">
                  <div className="flex items-center justify-between gap-2">
                    <span className={sectionLabel}>{label}</span>
                    <div className={`rounded-xl border p-2 ${iconClassName}`}>
                      <Icon className="w-4 h-4" />
                    </div>
                  </div>
                  <div>
                    <div className="flex items-end gap-1.5">
                      <span className="font-mono text-3xl font-black leading-none text-white">{value}</span>
                      <span className="pb-0.5 text-[10px] font-black uppercase tracking-widest text-cyan-100/52">{unit}</span>
                    </div>
                    <p className="mt-2 text-[10px] font-semibold leading-tight text-cyan-50/58">{detail}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div
            className={`${shellCard} p-4`}
            style={cardAssetStyle(panels.cosmicCard, 'rgba(8, 15, 36, 0.84)')}
          >
            <div className="relative z-10 mb-3 flex items-center justify-between gap-3">
              <div>
                <p className={sectionLabel}>Featured badges</p>
                <h3 className="text-base font-black text-white tracking-tight">Achievements</h3>
              </div>
              <button
                onClick={() => { sounds.playClick(); onViewStats(); }}
                className="rounded-full border border-cyan-100/20 bg-cyan-300/10 px-3 py-1.5 text-[10px] font-black uppercase tracking-widest text-cyan-100 hover:text-white cursor-pointer"
              >
                {unlockedBadgesCount} / {badges.length}
              </button>
            </div>
            <div className="relative z-10 grid grid-cols-4 gap-2.5">
              {featuredBadges.map((badge) => (
                <div
                  key={badge.id}
                  className={`rounded-2xl border p-2 text-center ${
                    badge.unlocked
                      ? 'border-amber-300/55 bg-amber-200/10 text-amber-100 shadow-[0_0_16px_rgba(251,191,36,0.12)]'
                      : 'border-slate-600/60 bg-slate-950/45 text-cyan-100/40'
                  }`}
                  title={badge.description}
                >
                  <img
                    src={badge.unlocked ? (badgeArtByAchievementId[badge.id] ?? badgeAssets.firstSolve) : badgeAssets.locked}
                    alt=""
                    aria-hidden="true"
                    className={`mx-auto h-10 w-10 object-contain drop-shadow-[0_6px_12px_rgba(0,0,0,0.35)] ${badge.unlocked ? '' : 'grayscale opacity-70'}`}
                  />
                  <span className="mt-1 block truncate text-[9px] font-black leading-tight">{badge.title}</span>
                </div>
              ))}
            </div>
          </div>

          <div className={`${shellCard} p-4`} style={cardAssetStyle(panels.cosmicCard, 'rgba(9, 16, 36, 0.84)')}>
            <div className="relative z-10 flex flex-wrap items-center gap-2 text-[10px] font-black uppercase tracking-widest text-cyan-50/70">
              <span className="mr-auto text-cyan-100/52">Current setup</span>
              <span className="rounded-full border border-amber-200/25 bg-amber-300/12 px-2.5 py-1 text-amber-100">{settings.gameMode}</span>
              <span className="rounded-full border border-violet-200/25 bg-violet-300/12 px-2.5 py-1 text-violet-100">{settings.difficulty}</span>
              <button
                onClick={() => { sounds.playClick(); setActiveTab('SETTINGS'); }}
                className="rounded-full border border-cyan-200/30 bg-cyan-300/12 px-2.5 py-1 text-cyan-100 hover:text-white cursor-pointer"
              >
                Edit
              </button>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'SETTINGS' && (
        <div
          id="session_setup_card"
          className={`${shellCard} p-5 space-y-5`}
          style={cardAssetStyle(panels.cosmicCard, 'rgba(8, 15, 36, 0.86)')}
        >
          <img src={fx.mathParticles} alt="" aria-hidden="true" className="absolute inset-0 h-full w-full object-cover opacity-10 mix-blend-screen pointer-events-none" />
          <div className="relative z-10 flex items-start justify-between gap-4 border-b border-cyan-100/12 pb-4">
            <div className="flex min-w-0 items-center gap-3">
              <img
                src={brandMarks.primaryLogo}
                alt="SpeedMath Coach logo"
                className="h-12 w-12 rounded-2xl object-contain shadow-[0_0_18px_rgba(251,191,36,0.22)] ring-1 ring-amber-100/35"
              />
              <div className="min-w-0">
                <p className={sectionLabel}>Rules & setup</p>
                <h3 className="text-xl font-black text-white tracking-tight truncate">Session Calibration</h3>
              </div>
            </div>
            <div className="rounded-2xl border border-cyan-100/20 bg-cyan-300/10 p-2.5 text-cyan-200">
              <SettingsIcon className="w-5 h-5" />
            </div>
          </div>

          <div className="relative z-10 space-y-5">
            <section className="rounded-[1.35rem] border border-cyan-100/15 bg-slate-950/45 p-3.5">
              <h4 className={`${sectionLabel} mb-3 flex items-center gap-2`}>
                <img src={modeIconByMode[settings.gameMode]} alt="" aria-hidden="true" className="w-5 h-5 object-contain" />
                Training format
              </h4>
              <div className="grid grid-cols-2 gap-2.5">
                <button
                  id="btn_mode_timed"
                  onClick={() => { sounds.playClick(); onSettingsChange({ ...settings, gameMode: GameMode.TIMED }); }}
                  className={`rounded-2xl border px-3 py-3 text-xs font-black transition flex items-center justify-center gap-2 ${
                    settings.gameMode === GameMode.TIMED
                      ? 'bg-cyan-300 text-slate-950 border-cyan-100 shadow-[0_0_18px_rgba(34,211,238,0.32)]'
                      : 'bg-slate-950/55 border-cyan-100/15 text-cyan-100/64 hover:border-cyan-200/40'
                  }`}
                >
                  <img src={challengeIcons.timed} alt="" aria-hidden="true" className="w-6 h-6 object-contain" />
                  Timed
                </button>
                <button
                  id="btn_mode_untimed"
                  onClick={() => { sounds.playClick(); onSettingsChange({ ...settings, gameMode: GameMode.UNTIMED }); }}
                  className={`rounded-2xl border px-3 py-3 text-xs font-black transition flex items-center justify-center gap-2 ${
                    settings.gameMode === GameMode.UNTIMED
                      ? 'bg-cyan-300 text-slate-950 border-cyan-100 shadow-[0_0_18px_rgba(34,211,238,0.32)]'
                      : 'bg-slate-950/55 border-cyan-100/15 text-cyan-100/64 hover:border-cyan-200/40'
                  }`}
                >
                  <img src={challengeIcons.untimed} alt="" aria-hidden="true" className="w-6 h-6 object-contain" />
                  Practice
                </button>
              </div>
            </section>

            <section className="rounded-[1.35rem] border border-cyan-100/15 bg-slate-950/45 p-3.5">
              <h4 className={`${sectionLabel} mb-3 flex items-center gap-2`}>
                <Sparkles className="w-4 h-4 text-cyan-300" />
                Active operations
              </h4>
              <div className="grid grid-cols-2 gap-2.5">
                {Object.values(Operation).map((op) => (
                  <label key={op} className={`flex items-center gap-2.5 rounded-2xl border px-3 py-3 text-xs font-black transition select-none cursor-pointer ${
                    settings.operations[op]
                      ? 'bg-cyan-300/14 border-cyan-200/55 text-cyan-50 shadow-[0_0_16px_rgba(34,211,238,0.12)]'
                      : 'bg-slate-950/55 border-cyan-100/15 text-cyan-100/55 hover:border-cyan-200/40'
                  }`}>
                    <input
                      type="checkbox"
                      className="h-[18px] w-[18px] rounded border-slate-300 accent-cyan-300 cursor-pointer"
                      checked={settings.operations[op]}
                      onChange={() => toggleOperation(op)}
                    />
                    <img src={operationIcons[op]} alt="" aria-hidden="true" className="w-7 h-7 object-contain" />
                    <span className="capitalize truncate">{op.toLowerCase()}</span>
                  </label>
                ))}
              </div>
            </section>

            <section className="rounded-[1.35rem] border border-cyan-100/15 bg-slate-950/45 p-3.5">
              <h4 className={`${sectionLabel} mb-3 flex items-center gap-2`}>
                <Zap className="w-4 h-4 text-violet-300" />
                Difficulty
              </h4>
              <div className="grid grid-cols-2 gap-2.5">
                {Object.values(Difficulty).map((diff) => (
                  <button
                    key={diff}
                    id={`btn_diff_${diff.toLowerCase()}`}
                    onClick={() => { sounds.playClick(); onSettingsChange({ ...settings, difficulty: diff }); }}
                    className={`rounded-xl border px-3 py-2.5 text-xs font-black transition ${
                      settings.difficulty === diff
                        ? 'bg-violet-300 border-violet-100 text-slate-950 shadow-[0_0_18px_rgba(167,139,250,0.28)]'
                        : 'bg-slate-950/55 border-cyan-100/15 text-cyan-100/60 hover:border-cyan-200/40'
                    }`}
                  >
                    {diff}
                  </button>
                ))}
              </div>
            </section>

            <label className="flex items-start justify-between gap-4 rounded-[1.35rem] border border-cyan-100/15 bg-slate-950/45 p-4 cursor-pointer select-none">
              <div>
                <div className="flex items-center gap-2 text-xs font-black text-cyan-50">
                  <Sparkles className="w-3.5 h-3.5 text-cyan-300" />
                  Adaptive learning
                </div>
                <p className="mt-1 text-[10px] leading-normal text-cyan-100/55">Scale difficulty based on your live drill accuracy.</p>
              </div>
              <input
                type="checkbox"
                className="mt-0.5 h-5 w-5 rounded border-slate-300 accent-cyan-300 cursor-pointer"
                checked={settings.adaptiveDifficulty}
                onChange={(e) => { sounds.playClick(); onSettingsChange({ ...settings, adaptiveDifficulty: e.target.checked }); }}
              />
            </label>

            {settings.gameMode === GameMode.TIMED && (
              <section className="rounded-[1.35rem] border border-cyan-100/15 bg-slate-950/45 p-3.5">
                <h4 className={`${sectionLabel} mb-3 flex items-center gap-2`}>
                  <img src={challengeIcons.timed} alt="" aria-hidden="true" className="w-5 h-5 object-contain" />
                  Duration
                </h4>
                <div className="grid grid-cols-4 gap-2">
                  {[30, 60, 120, 300].map((time) => (
                    <button
                      key={time}
                      id={`btn_duration_${time}`}
                      onClick={() => { sounds.playClick(); onSettingsChange({ ...settings, gameDurationSeconds: time }); }}
                      className={`rounded-xl border px-2 py-2.5 text-xs font-black transition ${
                        settings.gameDurationSeconds === time
                          ? 'bg-cyan-300 border-cyan-100 text-slate-950 shadow-[0_0_16px_rgba(34,211,238,0.28)]'
                          : 'bg-slate-950/55 border-cyan-100/15 text-cyan-100/60 hover:border-cyan-200/40'
                      }`}
                    >
                      {time < 60 ? `${time}s` : `${time / 60}m`}
                    </button>
                  ))}
                </div>
              </section>
            )}

            <div className="grid grid-cols-1 min-[390px]:grid-cols-2 gap-3 pt-1">
              <button
                id="btn_save_back"
                onClick={() => { sounds.playClick(); setActiveTab('DASHBOARD'); }}
                className="rounded-2xl border border-cyan-100 bg-cyan-300 px-4 py-4 text-xs font-black uppercase tracking-widest text-slate-950 shadow-[0_0_22px_rgba(34,211,238,0.24)] active:scale-95 cursor-pointer flex items-center justify-center gap-2"
              >
                <Check className="w-4 h-4 stroke-[2.5]" />
                Apply
              </button>
              <button
                id="btn_play_direct"
                onClick={() => { sounds.playClick(); onStartGame(); }}
                className="rounded-2xl border border-amber-100 px-4 py-4 text-xs font-black uppercase tracking-widest text-amber-950 shadow-[0_0_22px_rgba(251,191,36,0.24)] active:scale-95 cursor-pointer flex items-center justify-center gap-2"
                style={{
                  backgroundImage: `linear-gradient(180deg, rgba(251, 191, 36, 0.9), rgba(245, 158, 11, 0.95)), url(${buttonGlows.primary})`,
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                }}
              >
                <Play className="w-[18px] h-[18px] fill-current" />
                Play
              </button>
            </div>
          </div>
        </div>
      )}

      <div
        className="sticky bottom-3 z-20 mt-1 rounded-[1.65rem] border border-cyan-200/35 bg-slate-950/90 p-1.5 shadow-[0_16px_42px_rgba(2,6,23,0.5)] backdrop-blur"
        style={cardAssetStyle(panels.navbarGlow, 'rgba(10, 16, 36, 0.78)')}
      >
        <div className="relative z-10 grid grid-cols-2 gap-1.5">
          <button
            onClick={() => { sounds.playClick(); setActiveTab('DASHBOARD'); }}
            className={`rounded-2xl px-3 py-3 text-[11px] font-black uppercase tracking-widest transition flex items-center justify-center gap-2 cursor-pointer ${
              activeTab === 'DASHBOARD'
                ? 'bg-cyan-300 text-slate-950 shadow-[0_0_18px_rgba(34,211,238,0.34)]'
                : 'text-cyan-100/62 hover:text-white'
            }`}
          >
            <BarChart2 className="w-4 h-4" />
            Dashboard
          </button>
          <button
            onClick={() => { sounds.playClick(); setActiveTab('SETTINGS'); }}
            className={`rounded-2xl px-3 py-3 text-[11px] font-black uppercase tracking-widest transition flex items-center justify-center gap-2 cursor-pointer ${
              activeTab === 'SETTINGS'
                ? 'bg-cyan-300 text-slate-950 shadow-[0_0_18px_rgba(34,211,238,0.34)]'
                : 'text-cyan-100/62 hover:text-white'
            }`}
          >
            <SettingsIcon className="w-4 h-4" />
            Setup
          </button>
        </div>
      </div>
    </div>
  );
};

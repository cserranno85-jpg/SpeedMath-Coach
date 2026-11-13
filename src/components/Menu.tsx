import React, { useEffect, useState } from 'react';
import {
  Activity, Check, Clock3, Flame, Gauge, Play, ShieldCheck,
  Sparkles, Target, Trophy, Zap,
} from 'lucide-react';
import { Settings as SettingsType, Difficulty, Operation, GameMode } from '../types';
import { calculateStreak, evaluateAchievements, Badge } from '../utils/streakAndAchievements';
import { sounds } from '../utils/soundEngine';
import { brandMarks, mascots } from '../assets/uiAssetRegistry';
import {
  PremiumBottomNav, PremiumCTA, PremiumGlassClass, PremiumNavKey,
  PremiumScreen, PremiumTopBar, SparkleBadge, labelClass,
} from './PremiumShell';

interface MenuProps {
  settings: SettingsType;
  onSettingsChange: (newSettings: SettingsType) => void;
  onStartGame: () => void;
  onNavigate?: (state: 'HOME' | 'PRACTICE' | 'PROGRESS' | 'PROFILE' | 'CHALLENGES' | 'PRIVACY') => void;
  initialTab?: 'DASHBOARD' | 'SETTINGS';
  activeNav?: PremiumNavKey;
}

type ProgressEntry = { score?: number; totalSubmissions?: number; totalQuestions?: number };
const operationSymbols: Record<Operation, string> = {
  [Operation.ADDITION]: '+',
  [Operation.SUBTRACTION]: '−',
  [Operation.MULTIPLICATION]: '×',
  [Operation.DIVISION]: '÷',
};

const optionBase =
  'sm-touch-target flex min-h-[52px] items-center justify-center gap-2 rounded-[15px] border px-3 py-3 text-sm font-bold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#91EEFF]';
const optionSelected = 'border-[#65E4FF] bg-[#1C5877] text-[#F0FDFF]';
const optionIdle = 'border-[#365679] bg-[#10254B] text-[#C2D5F0] hover:bg-[#173254]';

export const Menu: React.FC<MenuProps> = ({
  settings, onSettingsChange, onStartGame, onNavigate,
  initialTab = 'DASHBOARD', activeNav,
}) => {
  const [activeTab, setActiveTab] = useState<'DASHBOARD' | 'SETTINGS'>(initialTab);
  const [muted, setMuted] = useState(sounds.getMutedStatus());
  const [stats, setStats] = useState({
    solved: 0, attempts: 0, sessions: 0, accuracy: 0, highScore: 0, streak: 0,
  });
  const [featuredBadge, setFeaturedBadge] = useState<Badge | null>(null);

  useEffect(() => { setActiveTab(initialTab); }, [initialTab]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem('speedMathProgress');
      const parsed: ProgressEntry[] = raw ? JSON.parse(raw) : [];
      if (!Array.isArray(parsed)) return;
      const solved = parsed.reduce((n, entry) => n + (entry.score || 0), 0);
      const attempts = parsed.reduce(
        (n, entry) => n + (entry.totalSubmissions || entry.totalQuestions || 0), 0,
      );
      setStats({
        solved, attempts, sessions: parsed.length,
        accuracy: attempts > 0 ? Math.round(100 * solved / attempts) : 0,
        highScore: parsed.reduce((n, entry) => Math.max(n, entry.score || 0), 0),
        streak: calculateStreak(parsed),
      });
      const evaluated = evaluateAchievements(parsed);
      setFeaturedBadge(evaluated.find(b => b.unlocked) ?? evaluated[0] ?? null);
    } catch {
      // Corrupt local history must not prevent a fresh practice session.
    }
  }, []);

  const toggleMute = () => {
    const next = !muted;
    sounds.setMute(next);
    setMuted(next);
    if (!next) sounds.playClick();
  };
  const updateSettings = (next: SettingsType) => {
    sounds.playClick();
    onSettingsChange(next);
  };
  const toggleOperation = (operation: Operation) => {
    updateSettings({
      ...settings,
      operations: { ...settings.operations, [operation]: !settings.operations[operation] },
    });
  };
  const go = (target: PremiumNavKey) => {
    sounds.playClick();
    if (target === 'home') {
      setActiveTab('DASHBOARD');
      onNavigate?.('HOME');
    } else if (target === 'practice') {
      setActiveTab('SETTINGS');
      onNavigate?.('PRACTICE');
    } else if (target === 'progress') onNavigate?.('PROGRESS');
    else if (target === 'profile') onNavigate?.('PROFILE');
    else if (target === 'challenges') onNavigate?.('CHALLENGES');
  };
  const selectedNav = activeNav ?? (activeTab === 'SETTINGS' ? 'practice' : 'home');
  const start = () => { sounds.playClick(); onStartGame(); };

  return (
    <>
      <PremiumScreen>
        <PremiumTopBar
          logoSrc={brandMarks.primaryLogo}
          muted={muted}
          onPrimaryAction={toggleMute}
          onSecondaryAction={() => go('practice')}
          primaryTitle={muted ? 'Unmute sound' : 'Mute sound'}
          secondaryTitle="Configure practice session"
        />

        <header className="px-1 pt-2 pb-1">
          <p className={labelClass + ' text-[#69E5FF]'}>SpeedMath / Coach</p>
          <h1 className="mt-3 text-[clamp(25px,7vw,31px)] font-black leading-[1.12] tracking-tight text-[#F7FBFF]">
            {activeTab === 'SETTINGS' ? 'Build your session.' : 'Sharpen your mind.'}
          </h1>
          <p className="mt-2 text-sm leading-relaxed text-[#BDCEE8]">
            {activeTab === 'SETTINGS'
              ? "Choose what you’ll train today."
              : 'A little practice builds a stronger streak.'}
          </p>
        </header>

        {activeTab === 'DASHBOARD' ? (
          <section id="dashboard_tab_content" aria-label="Training dashboard" className="mt-2 space-y-4">
            <section className={PremiumGlassClass + ' relative min-h-[184px] p-5'}>
              <div className="absolute right-2 top-4 h-[112px] w-[112px] opacity-25">
                <img src={mascots.headAvatar} alt="" aria-hidden="true" className="h-full w-full object-contain" />
              </div>
              <div className="relative z-10 max-w-[260px]">
                <p className={labelClass + ' text-[#61E4FF]'}>Today's mission</p>
                <h2 className="mt-3 text-[23px] font-black leading-[1.2] text-white">
                  Make every second count.
                </h2>
                <p className="mt-3 text-[13px] leading-relaxed text-[#C7D8F0]">
                  Quick mental-math drills for focus, speed and confidence.
                </p>
                <p className="mt-4 flex items-center gap-2 text-xs font-bold text-[#FFCD75]">
                  <Clock3 aria-hidden="true" className="h-4 w-4" />
                  60-second daily drill
                </p>
              </div>
            </section>

            <div className="grid grid-cols-2 gap-3" aria-label="Your practice statistics">
              <div className="sm-stat-card">
                <Zap aria-hidden="true" className="h-5 w-5 text-[#61E4FF]" />
                <p className="mt-2 text-[30px] font-black leading-none text-white">{stats.solved}</p>
                <p className="mt-2 text-[11px] font-bold uppercase tracking-wide text-[#B5CBE8]">Questions solved</p>
              </div>
              <div className="sm-stat-card">
                <Target aria-hidden="true" className="h-5 w-5 text-[#FFC768]" />
                <p className="mt-2 text-[30px] font-black leading-none text-white">{stats.accuracy}%</p>
                <p className="mt-2 text-[11px] font-bold uppercase tracking-wide text-[#B5CBE8]">Overall accuracy</p>
              </div>
            </div>

            <PremiumCTA id="btn_start_session_dashboard" onClick={start} icon={Play}>
              Start a new drill
            </PremiumCTA>

            <button type="button" onClick={() => go('challenges')}
              className={PremiumGlassClass + ' sm-touch-target flex w-full items-center gap-3 p-4 text-left hover:border-[#61E4FF]'}>
              <Trophy aria-hidden="true" className="h-7 w-7 shrink-0 text-[#FFCD75]" />
              <div className="min-w-0 flex-1">
                <p className={labelClass + ' text-[#FFCD75]'}>Daily challenge</p>
                <h2 className="mt-1 text-lg font-bold text-white">
                  {featuredBadge?.unlocked ? featuredBadge.title : 'Beat your personal best.'}
                </h2>
                <p className="mt-1 text-xs leading-relaxed text-[#B5CBE8]">
                  {stats.sessions > 0
                    ? stats.sessions + ' drills completed · best score ' + stats.highScore
                    : 'Complete your first session to start tracking progress.'}
                </p>
              </div>
            </button>
          </section>
        ) : (
          <section id="session_setup_card" aria-label="Practice setup" className="mt-2 space-y-4">
            <section className={PremiumGlassClass + ' p-4'}>
              <h2 className={labelClass + ' mb-3 flex items-center gap-2 text-[#6DE7FF]'}>
                <Clock3 aria-hidden="true" className="h-4 w-4" /> Training format
              </h2>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { value: GameMode.TIMED, label: 'Timed drill' },
                  { value: GameMode.UNTIMED, label: 'Practice' },
                ].map(({ value, label }) => (
                  <button key={value} id={value === GameMode.TIMED ? 'btn_mode_timed' : 'btn_mode_untimed'}
                    type="button" onClick={() => updateSettings({ ...settings, gameMode: value })}
                    aria-pressed={settings.gameMode === value}
                    className={[optionBase, settings.gameMode === value ? optionSelected : optionIdle].join(' ')}>
                    {label}
                  </button>
                ))}
              </div>
            </section>

            <section className={PremiumGlassClass + ' p-4'}>
              <h2 className={labelClass + ' mb-3 flex items-center gap-2 text-[#6DE7FF]'}>
                <Sparkles aria-hidden="true" className="h-4 w-4" /> Math operations
              </h2>
              <div className="grid grid-cols-2 gap-3">
                {Object.values(Operation).map(op => (
                  <label key={op} className={[optionBase, 'cursor-pointer justify-start',
                    settings.operations[op] ? optionSelected : optionIdle].join(' ')}>
                    <input type="checkbox" className="h-4 w-4 accent-[#61E4FF]"
                      checked={settings.operations[op]} onChange={() => toggleOperation(op)} />
                    <span aria-hidden="true" className="text-xl">{operationSymbols[op]}</span>
                    <span className="min-w-0 truncate text-xs">{op.toLowerCase()}</span>
                  </label>
                ))}
              </div>
            </section>

            <section className={PremiumGlassClass + ' p-4'}>
              <h2 className={labelClass + ' mb-3 flex items-center gap-2 text-[#6DE7FF]'}>
                <Gauge aria-hidden="true" className="h-4 w-4" /> Difficulty
              </h2>
              <div className="grid grid-cols-2 gap-2">
                {Object.values(Difficulty).map(diff => (
                  <button key={diff} id={'btn_diff_' + diff.toLowerCase()}
                    type="button" aria-pressed={settings.difficulty === diff}
                    onClick={() => updateSettings({ ...settings, difficulty: diff })}
                    className={[optionBase, 'min-h-[46px] py-2 text-xs',
                      settings.difficulty === diff ? optionSelected : optionIdle].join(' ')}>
                    {diff.charAt(0) + diff.slice(1).toLowerCase()}
                  </button>
                ))}
              </div>
            </section>

            {settings.gameMode === GameMode.TIMED && (
              <section className={PremiumGlassClass + ' p-4'}>
                <h2 className={labelClass + ' mb-3 text-[#6DE7FF]'}>Duration</h2>
                <div className="grid grid-cols-4 gap-2">
                  {[30, 60, 120, 300].map(seconds => (
                    <button key={seconds} id={'btn_duration_' + seconds} type="button"
                      aria-pressed={settings.gameDurationSeconds === seconds}
                      onClick={() => updateSettings({ ...settings, gameDurationSeconds: seconds })}
                      className={[optionBase, 'min-h-[48px] px-1 text-xs',
                        settings.gameDurationSeconds === seconds ? optionSelected : optionIdle].join(' ')}>
                      {seconds < 60 ? seconds + 's' : seconds / 60 + 'm'}
                    </button>
                  ))}
                </div>
              </section>
            )}

            <label className={PremiumGlassClass + ' sm-touch-target flex cursor-pointer items-center gap-3 p-4'}>
              <Activity aria-hidden="true" className="h-5 w-5 shrink-0 text-[#61E4FF]" />
              <div className="min-w-0 flex-1">
                <span className="block text-sm font-bold text-white">Adaptive difficulty</span>
                <span className="mt-1 block text-xs text-[#B5CBE8]">Adjust challenge based on results.</span>
              </div>
              <input type="checkbox" className="h-5 w-5 accent-[#61E4FF]"
                checked={settings.adaptiveDifficulty}
                onChange={e => updateSettings({ ...settings, adaptiveDifficulty: e.target.checked })} />
            </label>

            <PremiumCTA id="btn_play_direct" onClick={start} icon={Play}>Let's play</PremiumCTA>
            <button id="btn_privacy_policy" type="button"
              onClick={() => { sounds.playClick(); onNavigate?.('PRIVACY'); }}
              className="sm-touch-target flex min-h-[48px] w-full items-center justify-center gap-2 rounded-xl text-sm font-semibold text-[#B8DEF2] underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#91EEFF]">
              <ShieldCheck aria-hidden="true" className="h-4 w-4" />
              Privacy Policy
            </button>
          </section>
        )}
      </PremiumScreen>
      <PremiumBottomNav active={selectedNav} onSelect={go} />
    </>
  );
};

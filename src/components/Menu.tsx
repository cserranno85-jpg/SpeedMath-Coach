import React, { useEffect, useState } from 'react';
import { Settings as SettingsType, Difficulty, Operation, GameMode } from '../types';
import {
  Settings as SettingsIcon, Play, BarChart2, Flame, Trophy, Sparkles,
  Volume2, VolumeX, Crown, Target, Check, Award, Trash2, X, Timer, Sun, Moon
} from 'lucide-react';
import { calculateStreak, evaluateAchievements, Badge } from '../utils/streakAndAchievements';
import { sounds } from '../utils/soundEngine';
import { APPROVED_DURATION_PRESETS, formatDurationLabel } from '../utils/durationPresets';
import { clearProgress, loadProgress, PROGRESS_STORAGE_KEYS_TO_CLEAR } from '../utils/progressStorage';
import pibotMascot from '../assets/images/pibot-mascot.jpg';

interface MenuProps {
  settings: SettingsType;
  onSettingsChange: (newSettings: SettingsType) => void;
  onStartGame: () => void;
  onViewStats: () => void;
}

const StopwatchLogo: React.FC = () => (
  <div className="relative w-24 h-24 sm:w-28 sm:h-28 flex items-center justify-center select-none shrink-0">
    <svg viewBox="0 0 200 200" className="w-full h-full drop-shadow-[0_10px_22px_rgba(0,0,0,0.45)]">
      <defs>
        <linearGradient id="speedGrad" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#22c55e" stopOpacity="0" />
          <stop offset="45%" stopColor="#22c55e" stopOpacity="0.55" />
          <stop offset="100%" stopColor="#bef264" stopOpacity="1" />
        </linearGradient>
      </defs>
      <g stroke="url(#speedGrad)" strokeWidth="7" strokeLinecap="round">
        <line x1="10" y1="78" x2="72" y2="78" />
        <line x1="0" y1="100" x2="82" y2="100" />
        <line x1="14" y1="123" x2="70" y2="123" />
      </g>
      <rect x="91" y="10" width="18" height="15" rx="3" fill="#ffffff" />
      <path d="M 85 24 L 85 18 C 85 15, 115 15, 115 18 L 115 24" fill="none" stroke="#ffffff" strokeWidth="6" strokeLinecap="round" />
      <circle cx="100" cy="100" r="62" fill="none" stroke="#ffffff" strokeWidth="10" />
      <circle cx="100" cy="100" r="7" fill="#ffffff" />
      <line x1="100" y1="100" x2="140" y2="70" stroke="#facc15" strokeWidth="8" strokeLinecap="round" />
    </svg>
  </div>
);

const emptyDashboard = {
  streak: 0,
  badges: evaluateAchievements([]),
  totalSolves: 0,
  accuracy: 0,
  highScore: 0,
  totalSessions: 0,
};

export const Menu: React.FC<MenuProps> = ({ settings, onSettingsChange, onStartGame, onViewStats }) => {
  const [dashboard, setDashboard] = useState(emptyDashboard);
  const [muted, setMuted] = useState(sounds.getMutedStatus());
  const [activeTab, setActiveTab] = useState<'DASHBOARD' | 'SETTINGS'>('DASHBOARD');
  const [showResetModal, setShowResetModal] = useState(false);
  const [resetSuccess, setResetSuccess] = useState(false);

  const refreshDashboard = (progress = loadProgress()) => {
    const totalSubmissions = progress.reduce((sum: number, session: any) => sum + (session.totalSubmissions || session.totalQuestions || 0), 0);
    const totalSolves = progress.reduce((sum: number, session: any) => sum + (session.score || 0), 0);

    setDashboard({
      streak: calculateStreak(progress),
      badges: evaluateAchievements(progress),
      totalSolves,
      accuracy: totalSubmissions > 0 ? Math.round((totalSolves / totalSubmissions) * 100) : 0,
      highScore: progress.reduce((max: number, session: any) => Math.max(max, session.score || 0), 0),
      totalSessions: progress.length,
    });
  };

  useEffect(() => {
    refreshDashboard();
  }, []);

  const handleToggleMute = () => {
    const nextVal = !muted;
    sounds.setMute(nextVal);
    setMuted(nextVal);
    if (!nextVal) sounds.play('primaryTap');
  };

  const toggleOperation = (op: Operation) => {
    sounds.play('uiTap');
    onSettingsChange({
      ...settings,
      operations: {
        ...settings.operations,
        [op]: !settings.operations[op],
      },
    });
  };

  const handleResetProgress = () => {
    clearProgress();
    sounds.play('resetConfirm');
    refreshDashboard([]);
    setShowResetModal(false);
    setResetSuccess(true);
    window.setTimeout(() => setResetSuccess(false), 2200);
  };

  const getPibotMessage = () => {
    if (dashboard.totalSolves === 0) {
      return 'Welcome. I am Pi-bot, your speed coach. Start with a short timed drill and build clean accuracy.';
    }
    if (dashboard.streak >= 3) {
      return `Strong rhythm: ${dashboard.streak} training days in a row. Keep the streak alive with one focused round.`;
    }
    if (dashboard.accuracy > 90 && dashboard.totalSolves > 20) {
      return `Precision is high at ${dashboard.accuracy}%. Increase difficulty when the current setup feels automatic.`;
    }
    return 'Your next best score comes from fast starts, steady inputs, and one clean operation set.';
  };

  const unlockedBadgesCount = dashboard.badges.filter(b => b.unlocked).length;

  return (
    <div id="menu_layout_root" className="w-full max-w-5xl mx-auto flex flex-col gap-4 text-white">
      {resetSuccess && (
        <div className="fixed left-1/2 top-[calc(env(safe-area-inset-top,0px)+1rem)] z-50 -translate-x-1/2 rounded-2xl border border-emerald-300/50 bg-emerald-400 px-4 py-2 text-sm font-black text-slate-950 shadow-[0_14px_40px_rgba(0,0,0,0.35)]">
          Progress reset.
        </div>
      )}

      <div className="rounded-[2rem] border border-white/15 bg-blue-950/75 shadow-[0_24px_70px_rgba(0,0,0,0.36)] p-5 sm:p-6 overflow-hidden relative">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_85%_10%,rgba(250,204,21,0.22),transparent_28%),radial-gradient(circle_at_5%_80%,rgba(34,211,238,0.16),transparent_32%)] pointer-events-none" />
        <div className="relative flex flex-col sm:flex-row sm:items-center gap-5">
          <StopwatchLogo />
          <div className="flex-1">
            <div className="text-sm font-black uppercase text-lime-300">SpeedMath Coach</div>
            <h1 className="mt-1 text-4xl sm:text-5xl font-black leading-none text-white">Train faster math</h1>
            <p className="mt-3 max-w-2xl text-sm sm:text-base text-blue-100 leading-relaxed">
              Premium mental math drills with timed rounds, streaks, achievements, and Pi-bot guidance.
            </p>
          </div>
          <button
            id="btn_toggle_mute"
            onClick={handleToggleMute}
            className={`premium-btn ${muted ? 'premium-btn-danger' : 'premium-btn-neutral text-yellow-300'} self-start !min-h-0 !p-3`}
            title={muted ? 'Turn sound effects on' : 'Turn sound effects off'}
          >
            {muted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-[1fr_1fr_auto] gap-2">
        <button
          onClick={() => { sounds.play('uiTap'); setActiveTab('DASHBOARD'); }}
          className={`premium-btn premium-btn-small ${activeTab === 'DASHBOARD' ? 'premium-chip is-active' : 'premium-btn-neutral'}`}
        >
          <BarChart2 className="w-4 h-4" /> Dashboard
        </button>
        <button
          onClick={() => { sounds.play('uiTap'); setActiveTab('SETTINGS'); }}
          className={`premium-btn premium-btn-small ${activeTab === 'SETTINGS' ? 'premium-chip is-active' : 'premium-btn-neutral'}`}
        >
          <SettingsIcon className="w-4 h-4" /> Settings
        </button>
        <button
          onClick={() => { sounds.play('uiTap'); onViewStats(); }}
          className="premium-btn premium-btn-small premium-btn-neutral col-span-2 sm:col-span-1"
        >
          <Trophy className="w-4 h-4" /> Stats
        </button>
      </div>

      {activeTab === 'DASHBOARD' && (
        <div id="dashboard_tab_content" className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-4">
          <div className="flex flex-col gap-4">
            <div id="pibot_mascot_header" className="rounded-3xl border border-white/15 bg-slate-950/72 p-5 shadow-[0_18px_55px_rgba(0,0,0,0.32)]">
              <div className="flex flex-col sm:flex-row items-center gap-5">
                <img src={pibotMascot} alt="Pi-bot 3D Mascot" className="w-32 h-32 rounded-[2rem] object-cover shadow-[0_0_36px_rgba(34,211,238,0.28)] animate-float-pibot" referrerPolicy="no-referrer" />
                <div className="text-center sm:text-left">
                  <div className="flex items-center justify-center sm:justify-start gap-2 text-yellow-300 font-black uppercase text-xs">
                    <Sparkles className="w-4 h-4" /> Pi-bot Advisor
                  </div>
                  <p className="mt-2 text-base sm:text-lg font-bold leading-snug text-white">{getPibotMessage()}</p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {[
                { label: 'Daily Streak', value: `${dashboard.streak}`, sub: dashboard.streak === 1 ? 'day' : 'days', icon: Flame, tone: 'from-orange-400 to-rose-500' },
                { label: 'High Score', value: dashboard.highScore, sub: 'points', icon: Crown, tone: 'from-purple-400 to-fuchsia-500' },
                { label: 'Solved', value: dashboard.totalSolves, sub: 'correct', icon: Award, tone: 'from-emerald-300 to-teal-500' },
                { label: 'Accuracy', value: `${dashboard.accuracy}%`, sub: `${dashboard.totalSessions} rounds`, icon: Target, tone: 'from-cyan-300 to-blue-500' },
              ].map((card) => {
                const Icon = card.icon;
                return (
                  <div key={card.label} className={`rounded-3xl bg-gradient-to-br ${card.tone} p-4 text-slate-950 shadow-[0_14px_34px_rgba(0,0,0,0.24)]`}>
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[10px] font-black uppercase opacity-80">{card.label}</span>
                      <Icon className="w-5 h-5" />
                    </div>
                    <div className="mt-2 text-3xl font-mono font-black">{card.value}</div>
                    <div className="text-[11px] font-black uppercase opacity-75">{card.sub}</div>
                  </div>
                );
              })}
            </div>

            <div className="rounded-3xl border border-white/15 bg-blue-950/70 p-5 shadow-[0_18px_55px_rgba(0,0,0,0.28)]">
              <div className="flex items-center justify-between gap-3 mb-4">
                <h2 className="text-sm font-black uppercase text-white flex items-center gap-2">
                  <Trophy className="w-4 h-4 text-yellow-300" /> Achievements
                </h2>
                <span className="rounded-full bg-white/10 px-3 py-1 text-[11px] font-black text-blue-100">{unlockedBadgesCount} / {dashboard.badges.length}</span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {dashboard.badges.map((badge: Badge) => (
                  <div key={badge.id} className={`rounded-2xl border p-3 min-h-24 ${badge.unlocked ? 'border-yellow-300/60 bg-yellow-300 text-slate-950' : 'border-white/10 bg-white/8 text-blue-100 opacity-70'}`} title={badge.description}>
                    <div className="text-lg">{badge.unlocked ? '🏆' : '🔒'}</div>
                    <div className="mt-1 text-[11px] font-black leading-tight">{badge.title}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="rounded-3xl border border-white/15 bg-slate-950/76 p-5 shadow-[0_18px_55px_rgba(0,0,0,0.32)] flex flex-col gap-4 lg:sticky lg:top-4 lg:self-start">
            <div>
              <div className="text-xs font-black uppercase text-cyan-200">Current setup</div>
              <div className="mt-2 flex flex-wrap gap-2">
                <span className="rounded-full bg-blue-500 px-3 py-1 text-xs font-black">{settings.gameMode}</span>
                <span className="rounded-full bg-purple-500 px-3 py-1 text-xs font-black">{settings.difficulty}</span>
                <span className="rounded-full bg-teal-500 px-3 py-1 text-xs font-black">{formatDurationLabel(settings.gameDurationSeconds as any)}</span>
              </div>
            </div>
            <button
              id="btn_start_session_dashboard"
              onClick={() => { sounds.play('startRound'); onStartGame(); }}
              className="premium-btn premium-btn-primary rounded-3xl px-5 py-5 text-base flex items-center justify-center gap-3"
            >
              <Play className="w-6 h-6 fill-current" /> Start Training
            </button>
            <button
              onClick={() => { sounds.play('uiTap'); setActiveTab('SETTINGS'); }}
              className="premium-btn premium-btn-neutral text-xs"
            >
              Adjust Training Setup
            </button>
          </div>
        </div>
      )}

      {activeTab === 'SETTINGS' && (
        <div id="session_setup_card" className="rounded-3xl border border-white/15 bg-slate-950/76 p-5 sm:p-6 shadow-[0_18px_55px_rgba(0,0,0,0.32)] space-y-6">
          <div>
            <h2 className="text-2xl font-black text-white flex items-center gap-2"><SettingsIcon className="w-6 h-6 text-cyan-300" /> Training Setup</h2>
            <p className="mt-1 text-sm text-blue-100">Pick a mode, operation mix, difficulty, and exact timer preset.</p>
          </div>

          <section>
            <h3 className="mb-3 text-xs font-black uppercase text-cyan-200">Training Format</h3>
            <div className="grid grid-cols-2 gap-2">
              {[
                { mode: GameMode.TIMED, label: 'Timed Drill' },
                { mode: GameMode.UNTIMED, label: 'Untimed Practice' },
              ].map(option => (
                <button
                  key={option.mode}
                  id={option.mode === GameMode.TIMED ? 'btn_mode_timed' : 'btn_mode_untimed'}
                  onClick={() => { sounds.play('uiTap'); onSettingsChange({ ...settings, gameMode: option.mode }); }}
                  className={`premium-btn premium-btn-small ${settings.gameMode === option.mode ? 'premium-chip is-active' : 'premium-btn-neutral'}`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </section>

          <section>
            <h3 className="mb-3 text-xs font-black uppercase text-cyan-200">Active Operations</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              {Object.values(Operation).map((op) => (
                <label key={op} className={`premium-btn premium-btn-small justify-start ${settings.operations[op] ? 'premium-btn-success' : 'premium-btn-neutral'}`}>
                  <input
                    type="checkbox"
                    className="w-4 h-4 accent-blue-600 cursor-pointer"
                    checked={settings.operations[op]}
                    onChange={() => toggleOperation(op)}
                  />
                  {op.toLowerCase()}
                </label>
              ))}
            </div>
          </section>

          <section>
            <h3 className="mb-3 text-xs font-black uppercase text-cyan-200">Base Difficulty</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              {Object.values(Difficulty).map((diff) => (
                <button
                  key={diff}
                  id={`btn_diff_${diff.toLowerCase()}`}
                  onClick={() => { sounds.play('uiTap'); onSettingsChange({ ...settings, difficulty: diff }); }}
                  className={`premium-btn premium-btn-small ${settings.difficulty === diff ? 'premium-btn-secondary !text-slate-950 !bg-purple-300' : 'premium-btn-neutral'}`}
                >
                  {diff}
                </button>
              ))}
            </div>
          </section>

          <label className="rounded-2xl border border-white/10 bg-white/10 p-4 flex items-start justify-between gap-4 cursor-pointer">
            <span>
              <span className="text-sm font-black text-white flex items-center gap-2"><Sparkles className="w-4 h-4 text-yellow-300" /> Adaptive difficulty</span>
              <span className="mt-1 block text-xs text-blue-100">Scale difficulty upward when your speed and streak are strong.</span>
            </span>
            <input
              type="checkbox"
              className="mt-1 w-5 h-5 accent-cyan-400 cursor-pointer"
              checked={settings.adaptiveDifficulty}
              onChange={(e) => { sounds.play('uiTap'); onSettingsChange({ ...settings, adaptiveDifficulty: e.target.checked }); }}
            />
          </label>

          <section>
            <h3 className="mb-3 text-xs font-black uppercase text-cyan-200">Preferences</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <button
                id="btn_sound_effects"
                onClick={handleToggleMute}
                className={`premium-btn premium-btn-small ${muted ? 'premium-btn-danger' : 'premium-btn-success'}`}
              >
                {muted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                Sound Effects
              </button>
              <button
                id="btn_theme_dark"
                onClick={() => { sounds.play('uiTap'); onSettingsChange({ ...settings, theme: 'dark' }); }}
                className={`premium-btn premium-btn-small ${settings.theme === 'dark' ? 'premium-chip is-active' : 'premium-btn-neutral'}`}
              >
                <Moon className="w-4 h-4" /> Dark
              </button>
              <button
                id="btn_theme_light"
                onClick={() => { sounds.play('uiTap'); onSettingsChange({ ...settings, theme: 'light' }); }}
                className={`premium-btn premium-btn-small ${settings.theme === 'light' ? 'premium-chip is-active' : 'premium-btn-neutral'}`}
              >
                <Sun className="w-4 h-4" /> Light
              </button>
            </div>
          </section>

          {settings.gameMode === GameMode.TIMED && (
            <section>
              <h3 className="mb-3 text-xs font-black uppercase text-cyan-200 flex items-center gap-2"><Timer className="w-4 h-4" /> Session Duration</h3>
              <div className="grid grid-cols-4 gap-2">
                {APPROVED_DURATION_PRESETS.map((time) => (
                  <button
                    key={time}
                    id={`btn_duration_${time}`}
                    onClick={() => { sounds.play('primaryTap'); onSettingsChange({ ...settings, gameDurationSeconds: time }); }}
                    className={`premium-btn premium-chip text-sm ${settings.gameDurationSeconds === time ? 'is-active !bg-yellow-300 !text-slate-950' : ''}`}
                  >
                    {formatDurationLabel(time)}
                  </button>
                ))}
              </div>
            </section>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <button
              id="btn_save_back"
              onClick={() => { sounds.play('primaryTap'); setActiveTab('DASHBOARD'); }}
              className="premium-btn premium-btn-secondary text-xs"
            >
              <Check className="w-4 h-4" /> Apply
            </button>
            <button
              id="btn_play_direct"
              onClick={() => { sounds.play('startRound'); onStartGame(); }}
              className="premium-btn premium-btn-primary text-xs"
            >
              <Play className="w-4 h-4 fill-current" /> Start Training
            </button>
          </div>

          <section className="rounded-3xl border border-rose-300/25 bg-rose-950/45 p-4">
            <h3 className="text-sm font-black text-rose-100 flex items-center gap-2"><Trash2 className="w-4 h-4" /> Reset Progress & Stats</h3>
            <p className="mt-1 text-xs text-rose-100/80">
              Clears {PROGRESS_STORAGE_KEYS_TO_CLEAR.join(', ')} while preserving settings and mute preferences.
            </p>
            <button
              onClick={() => { sounds.play('uiTap'); setShowResetModal(true); }}
              className="premium-btn premium-btn-danger premium-btn-small mt-4"
            >
              Reset Progress & Stats
            </button>
          </section>
        </div>
      )}

      {showResetModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/72 p-4">
          <div role="dialog" aria-modal="true" aria-labelledby="reset_progress_title" className="w-full max-w-md rounded-3xl border border-rose-300/40 bg-slate-950 p-5 text-white shadow-[0_24px_70px_rgba(0,0,0,0.55)]">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 id="reset_progress_title" className="text-xl font-black">Reset all progress?</h2>
                <p className="mt-2 text-sm leading-relaxed text-blue-100">
                  This will permanently delete your progress, stats, achievements, streaks, and history. This action cannot be undone.
                </p>
              </div>
              <button onClick={() => { sounds.play('uiTap'); setShowResetModal(false); }} className="premium-btn premium-btn-neutral !min-h-0 !rounded-xl !p-2 text-blue-100" title="Cancel">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-2">
              <button
                onClick={handleResetProgress}
                className="premium-btn premium-btn-danger text-xs"
              >
                Yes, reset everything
              </button>
              <button
                onClick={() => { sounds.play('uiTap'); setShowResetModal(false); }}
                className="premium-btn premium-btn-neutral text-xs"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

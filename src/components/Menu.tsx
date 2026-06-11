import React, { useEffect, useState } from 'react';
import { Settings as SettingsType, Difficulty, Operation, GameMode } from '../types';
import { 
  Settings as SettingsIcon, Play, BarChart2, Flame, Trophy, Sparkles, 
  Volume2, VolumeX, Crown, Target, Check, Award 
} from 'lucide-react';
import { calculateStreak, evaluateAchievements, Badge } from '../utils/streakAndAchievements';
import { sounds } from '../utils/soundEngine';
import pibotMascot from '../assets/images/pibot-mascot.jpg';

interface MenuProps {
  settings: SettingsType;
  onSettingsChange: (newSettings: SettingsType) => void;
  onStartGame: () => void;
  onViewStats: () => void;
}

const StopwatchLogo: React.FC = () => {
  return (
    <div className="relative w-40 h-40 flex items-center justify-center select-none shrink-0">
      <svg viewBox="0 0 200 200" className="w-full h-full filter drop-shadow-[0_8px_16px_rgba(0,0,0,0.35)]">
        {/* Speed Trails on the Left */}
        <defs>
          <linearGradient id="speedGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#10B981" stopOpacity="0" />
            <stop offset="30%" stopColor="#10B981" stopOpacity="0.3" />
            <stop offset="70%" stopColor="#10B981" stopOpacity="0.75" />
            <stop offset="100%" stopColor="#8efe04" stopOpacity="1" />
          </linearGradient>
        </defs>

        {/* Speed Wind Lines */}
        <g stroke="url(#speedGrad)" strokeWidth="6" strokeLinecap="round">
          <line x1="15" y1="75" x2="70" y2="75" />
          <line x1="5" y1="95" x2="80" y2="95" strokeWidth="8" />
          <line x1="0" y1="115" x2="65" y2="115" strokeWidth="7" />
          <line x1="20" y1="135" x2="75" y2="135" strokeWidth="5" />
        </g>

        {/* Stopwatch Body */}
        {/* Top Pusher */}
        <rect x="91" y="10" width="18" height="15" rx="3" fill="#FFFFFF" />
        {/* Top Loop Crown Ring */}
        <path d="M 85 24 L 85 18 C 85 15, 115 15, 115 18 L 115 24" fill="none" stroke="#FFFFFF" strokeWidth="6" strokeLinecap="round" />
        {/* Right Pusher Angle */}
        <g transform="rotate(45, 100, 100)">
          <rect x="92" y="12" width="16" height="12" rx="2" fill="#FFFFFF" />
        </g>

        {/* Outer Circular Ring Dial */}
        <circle cx="100" cy="100" r="62" fill="none" stroke="#FFFFFF" strokeWidth="10" />

        {/* Ring ticks */}
        <g stroke="#FFFFFF" strokeWidth="3" strokeLinecap="round" opacity="0.60">
          <line x1="100" y1="50" x2="100" y2="56" />
          <line x1="100" y1="144" x2="100" y2="150" />
          <line x1="50" y1="100" x2="56" y2="100" />
          <line x1="144" y1="100" x2="150" y2="100" />
          
          <line x1="64" y1="64" x2="69" y2="69" />
          <line x1="136" y1="136" x2="141" y2="141" />
          <line x1="136" y1="64" x2="131" y2="69" />
          <line x1="64" y1="136" x2="69" y2="131" />
        </g>

        {/* Center Pin */}
        <circle cx="100" cy="100" r="7" fill="#FFFFFF" />

        {/* Hand/Needle pointing to 2 o'clock */}
        <line x1="100" y1="100" x2="140" y2="70" stroke="#FFFFFF" strokeWidth="7" strokeLinecap="round" />
      </svg>
    </div>
  );
};

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

        // Calc metrics for Pi-bot greetings
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

  // Pi-bot context-aware messages
  const getPibotMessage = () => {
    if (totalSolves === 0) {
      return "Welcome trainee! I am Pi-bot, your calculation assistant. Let's start with beginner drills to prime your mental processors!";
    }
    if (streak >= 3) {
      return `Phenomenal performance! You have kept a ${streak}-day training streak. Ready to crush your records today?`;
    }
    if (streak > 0) {
      return `Target acquired! Great training streak at ${streak} days running. Tap Start to accelerate your numeracy!`;
    }
    if (accuracy > 90 && totalSolves > 20) {
      return `Incredible accuracy! You're computing at ${accuracy}% surgical precision. Let's push for high difficulty!`;
    }
    return "Calculations keep our logical structures optimized! Calibrate your operations tab or begin performance training instantly.";
  };

  const unlockedBadgesCount = badges.filter(b => b.unlocked).length;

  return (
    <div id="menu_layout_root" className="w-full max-w-2xl mx-auto flex flex-col gap-6 selection:bg-indigo-200">
       
       {/* SpeedMath Coach Premium Logo Banner */}
       <div className="relative select-none text-white rounded-[2.5rem] bg-gradient-to-b from-[#0c41a2] to-[#002663] border-4 border-slate-900 shadow-[6px_6px_0_0_#0f172a] p-6 md:p-8 overflow-hidden flex flex-col items-center justify-center min-h-[250px] md:min-h-[280px]">
          {/* Subtle grid background overlay inside the banner */}
          <div className="absolute inset-0 bg-[radial-gradient(#ffffff_1px,transparent_1px)] [background-size:16px_16px] opacity-[0.05] pointer-events-none"></div>

          {/* Floating decorative math symbols */}
          <span className="absolute top-6 left-[12%] text-[#1E5AF3] font-black text-4xl opacity-80 pointer-events-none drop-shadow-[0_2px_4px_rgba(0,0,0,0.3)] select-none">
            +
          </span>
          <span className="absolute top-6 right-[12%] text-[#1E5AF3] font-black text-4xl opacity-80 pointer-events-none drop-shadow-[0_2px_4px_rgba(0,0,0,0.3)] select-none">
            ×
          </span>
          <span className="absolute top-[40%] right-[8%] text-[#1E5AF3] font-black text-4xl opacity-80 pointer-events-none drop-shadow-[0_2px_4px_rgba(0,0,0,0.3)] select-none">
            ÷
          </span>
          <span className="absolute bottom-10 left-[15%] text-[#1E5AF3] font-black text-4xl opacity-80 pointer-events-none drop-shadow-[0_2px_4px_rgba(0,0,0,0.3)] select-none">
            −
          </span>
          <span className="absolute bottom-4 left-[46%] text-[#1E5AF3] font-black text-4xl opacity-80 pointer-events-none drop-shadow-[0_2px_4px_rgba(0,0,0,0.3)] select-none">
            =
          </span>
          <span className="absolute top-[38%] left-[8%] text-[#1E5AF3] font-black text-5xl opacity-40 pointer-events-none drop-shadow-[0_2px_4px_rgba(0,0,0,0.3)] select-none">
            2
          </span>
          <span className="absolute bottom-8 right-[10%] text-[#1E5AF3] font-black text-5xl opacity-40 pointer-events-none drop-shadow-[0_2px_4px_rgba(0,0,0,0.3)] select-none">
            3
          </span>

          {/* Main Visual Group */}
          <div className="relative z-10 flex flex-col items-center justify-center">
             {/* Stopwatch SVG Icon */}
             <div className="transform scale-[0.82] sm:scale-[0.88] md:scale-[0.93] -mb-3 -mt-6">
                <StopwatchLogo />
             </div>

             {/* Text Graphics Stack */}
             <div className="flex flex-col items-center justify-center text-center select-none">
                {/* SPEED */}
                <h1 className="text-4xl sm:text-5xl md:text-6xl font-black italic tracking-wide text-white uppercase drop-shadow-[0_4px_5px_rgba(0,0,0,0.6)] leading-none">
                   SPEED
                </h1>
                {/* MATH */}
                <h2 className="text-5xl sm:text-6xl md:text-7xl font-black italic tracking-tight text-[#8efe04] uppercase drop-shadow-[0_5px_6px_rgba(0,0,0,0.6)] leading-none select-none mt-1">
                   MATH
                </h2>
                {/* COACH pill line - with horizontal bars */}
                <div className="flex items-center justify-center gap-3 mt-2">
                   <div className="w-10 sm:w-16 h-1 bg-[#8efe04] rounded-full opacity-80"></div>
                   <span className="text-xs sm:text-sm font-black uppercase tracking-[0.25em] text-white drop-shadow-[0_2px_3px_rgba(0,0,0,0.4)]">
                      COACH
                   </span>
                   <div className="w-10 sm:w-16 h-1 bg-[#8efe04] rounded-full opacity-80"></div>
                </div>
             </div>
          </div>
       </div>

       {/* Mode Navigation Tab Controls & Discreet Sound Mute Button */}
       <div className="flex items-center gap-3 w-full max-w-lg mx-auto">
          <div className="flex-1 flex justify-center gap-3 bg-[#FAF7EC]/80 border-4 border-slate-900 shadow-[4px_4px_0_0_#0f172a] p-1.5 rounded-3xl">
            <button
              onClick={() => { sounds.playClick(); setActiveTab('DASHBOARD'); }}
              className={`flex-1 py-2.5 px-3 rounded-2xl text-[11px] font-black tracking-wider uppercase transition-all flex items-center justify-center gap-1.5 select-none cursor-pointer ${activeTab === 'DASHBOARD' ? 'bg-indigo-600 text-white border-4 border-slate-900 shadow-[2px_2px_0_0_#0f172a]' : 'text-slate-500 hover:text-slate-800'}`}
            >
              <BarChart2 className="w-4 h-4" /> Dashboard
            </button>
            <button
              onClick={() => { sounds.playClick(); setActiveTab('SETTINGS'); }}
              className={`flex-1 py-2.5 px-3 rounded-2xl text-[11px] font-black tracking-wider uppercase transition-all flex items-center justify-center gap-1.5 select-none cursor-pointer ${activeTab === 'SETTINGS' ? 'bg-indigo-600 text-white border-4 border-slate-900 shadow-[2px_2px_0_0_#0f172a]' : 'text-slate-500 hover:text-slate-800'}`}
            >
              <SettingsIcon className="w-4 h-4" /> Rules & Setup
            </button>
          </div>

          <button
            id="btn_toggle_mute"
            onClick={handleToggleMute}
            className={`p-3 rounded-full border-4 border-slate-900 transition-all duration-150 flex items-center justify-center shadow-[3px_3px_0_0_#0f172a] active:translate-y-0.5 active:shadow-[1px_1px_0_0_#0f172a] cursor-pointer shrink-0 ${muted ? 'bg-rose-100/90 text-rose-600' : 'bg-amber-100/90 text-amber-700'}`}
            title={muted ? 'Unmute Volume' : 'Mute Volume'}
          >
            {muted ? <VolumeX className="w-[18px] h-[18px] stroke-[2.5]" /> : <Volume2 className="w-[18px] h-[18px] stroke-[2.5]" />}
          </button>
       </div>

       {/* TAB 1: DASHBOARD STREAMLINEED */}
       {activeTab === 'DASHBOARD' && (
         <div id="dashboard_tab_content" className="flex flex-col gap-6">
            
            {/* Pi-bot Interactive Mascot Header (Bigger, animated & Float-styled) */}
            <div id="pibot_mascot_header" className="bg-gradient-to-br from-indigo-900 to-indigo-950 rounded-3xl border-4 border-slate-900 shadow-[6px_6px_0_0_#0f172a] p-6 text-white overflow-hidden relative">
               <div className="absolute top-0 right-0 w-48 h-48 bg-indigo-500 rounded-full filter blur-3xl opacity-20 pointer-events-none"></div>
               <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-pink-500 rounded-full filter blur-3xl opacity-15 pointer-events-none"></div>

               <div className="flex flex-col md:flex-row items-center gap-6 relative z-10">
                  {/* Dynamic 3D Mascot Avatar with NO border, circular & drop-shadowed */}
                  <div className="relative shrink-0 select-none">
                     <div className="w-40 h-40 md:w-44 md:h-44 transform hover:scale-105 active:scale-95 transition-all duration-300 animate-float-pibot flex items-center justify-center">
                        <img 
                           src={pibotMascot}
                           alt="Pi-bot 3D Mascot"
                           className="w-full h-full object-cover rounded-full filter drop-shadow-[0_12px_15px_rgba(99,102,241,0.35)]"
                           referrerPolicy="no-referrer"
                        />
                     </div>
                  </div>

                  {/* Mascot dialog speech-bubble */}
                  <div className="flex-1 text-center md:text-left">
                     <div className="flex items-center justify-center md:justify-start gap-2 mb-2">
                        <h2 className="text-xl md:text-2xl font-black tracking-tight text-white flex items-center gap-1.5">
                           <Sparkles className="w-5 h-5 text-yellow-400 animate-spin" style={{ animationDuration: '6s' }} /> Pi-bot Advisor
                        </h2>
                     </div>
                     
                     <div className="relative bg-indigo-950/60 rounded-2xl p-4 border border-indigo-800 text-xs md:text-sm text-indigo-100 leading-relaxed max-w-md shadow-inner">
                        "{getPibotMessage()}"
                     </div>
                  </div>
               </div>
            </div>

            {/* Cartoonish High-End Premium Stats Grid */}
            <div className="grid grid-cols-2 gap-4">
               
               {/* 1. Daily Streak Card (Volumetric Orange) */}
               <div className="bg-gradient-to-br from-orange-400 via-amber-500 to-rose-500 text-white rounded-3xl p-5 border-4 border-slate-900 shadow-[4px_4px_0_0_#0f172a] transform hover:scale-[1.02] transition-transform duration-200">
                 <div className="flex justify-between items-start">
                   <div>
                     <span className="text-[10px] font-black uppercase tracking-widest text-orange-100 block leading-tight">Daily Streak</span>
                     <span className="text-2xl md:text-3xl font-black mt-1 block">{streak} {streak === 1 ? 'Day' : 'Days'}</span>
                   </div>
                   <div className="p-2.5 bg-white/20 rounded-2xl border border-white/30 animate-bounce">
                     <Flame className="w-6 h-6 text-white fill-white" />
                   </div>
                 </div>
                 <p className="text-[9px] md:text-[10px] font-extrabold text-orange-50 leading-tight mt-3.5">
                   {streak > 0 ? '🔥 Active training streak! Ready to expand!' : 'Initiate 1 drill to start a training streak.'}
                 </p>
               </div>

               {/* 2. Personal Best Card (Volumetric Purple) */}
               <div className="bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 text-white rounded-3xl p-5 border-4 border-slate-900 shadow-[4px_4px_0_0_#0f172a] transform hover:scale-[1.02] transition-transform duration-200">
                 <div className="flex justify-between items-start">
                   <div>
                     <span className="text-[10px] font-black uppercase tracking-widest text-indigo-100 block leading-tight border-b border-indigo-400/20 pb-0.5">High Score</span>
                     <span className="text-2xl md:text-3xl font-black mt-1 block">{highScore} <span className="text-[10px] font-bold">PTS</span></span>
                   </div>
                   <div className="p-2.5 bg-white/20 rounded-2xl border border-white/30">
                     <Crown className="w-6 h-6 text-yellow-300 fill-yellow-300 animate-pulse" />
                   </div>
                 </div>
                 <p className="text-[9px] md:text-[10px] font-extrabold text-indigo-50 leading-tight mt-3.5">
                   Peak computational performance record!
                 </p>
               </div>

               {/* 3. Total Solves (Volumetric Green) */}
               <div className="bg-gradient-to-br from-emerald-400 via-teal-500 to-green-500 text-white rounded-3xl p-5 border-4 border-slate-900 shadow-[4px_4px_0_0_#0f172a] transform hover:scale-[1.02] transition-transform duration-200">
                 <div className="flex justify-between items-start">
                   <div>
                     <span className="text-[10px] font-black uppercase tracking-widest text-emerald-100 block leading-tight">Total Solved</span>
                     <span className="text-2xl md:text-3xl font-black mt-1 block">{totalSolves}</span>
                   </div>
                   <div className="p-2.5 bg-white/20 rounded-2xl border border-white/30">
                     <Award className="w-6 h-6 text-emerald-100 fill-emerald-100" />
                   </div>
                 </div>
                 <p className="text-[9px] md:text-[10px] font-extrabold text-emerald-50 leading-tight mt-3.5">
                   Surgical arithmetic equations completed!
                 </p>
               </div>

               {/* 4. Accuracy (Volumetric Sky) */}
               <div className="bg-gradient-to-br from-sky-400 via-cyan-500 to-blue-500 text-white rounded-3xl p-5 border-4 border-slate-900 shadow-[4px_4px_0_0_#0f172a] transform hover:scale-[1.02] transition-transform duration-200">
                 <div className="flex justify-between items-start">
                   <div>
                     <span className="text-[10px] font-black uppercase tracking-widest text-sky-100 block leading-tight">Precision</span>
                     <span className="text-2xl md:text-3xl font-black mt-1 block">{accuracy}%</span>
                   </div>
                   <div className="p-2.5 bg-white/20 rounded-2xl border border-white/30">
                     <Target className="w-6 h-6 text-sky-100" />
                   </div>
                 </div>
                 <p className="text-[9px] md:text-[10px] font-extrabold text-sky-50 leading-tight mt-3.5">
                   {accuracy > 90 ? '🎯 Absolutely surgical precision!' : 'Maintain target above 85%.'}
                 </p>
               </div>

            </div>

            {/* Badges Achievements Block (Cartoon Grid) - bg-white replaced with bg-[#FAF7EC] */}
            <div className="bg-[#FAF7EC] border-4 border-slate-900 shadow-[6px_6px_0_0_#0f172a] rounded-3xl p-5">
              <div className="flex justify-between items-center mb-4 border-b-2 border-slate-900/10 pb-3">
                 <h4 className="text-xs md:text-sm font-black text-slate-800 uppercase tracking-widest flex items-center gap-1.5">
                    <Trophy className="w-4 h-4 text-amber-500 fill-amber-500" /> Medals Unlocked ({unlockedBadgesCount} / {badges.length})
                 </h4>
                 <button 
                   onClick={() => { sounds.playClick(); onViewStats(); }}
                   className="text-[10px] font-black text-indigo-600 hover:text-indigo-800 uppercase tracking-wider underline cursor-pointer"
                 >
                   View Stats Detail
                 </button>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                 {badges.map((badge) => (
                    <div 
                      key={badge.id}
                      className={`flex flex-col items-center justify-center p-2.5 rounded-2xl border-2 text-center transition-all ${
                         badge.unlocked 
                           ? 'bg-amber-50/60 border-amber-300 text-amber-900 shadow-sm' 
                           : 'bg-slate-50 border-slate-200 text-slate-300 opacity-60'
                      }`}
                      title={badge.description}
                    >
                      {badge.unlocked ? (
                         <div className="w-9 h-9 flex items-center justify-center bg-amber-100 text-amber-600 rounded-xl mb-1.5 border border-amber-200 shadow-inner relative">
                            <span className="text-lg">🏆</span>
                            <span className="absolute -top-1 -right-1 bg-emerald-500 text-[6px] text-white font-black px-1 rounded-full border border-emerald-300">OK</span>
                         </div>
                      ) : (
                         <div className="w-9 h-9 flex items-center justify-center bg-slate-100 text-slate-400 border border-slate-200 rounded-xl mb-1.5">
                            <span className="text-xs">🔒</span>
                          </div>
                      )}
                      <span className="text-[10px] font-black tracking-tight leading-tight block truncate w-full">{badge.title}</span>
                      <span className="text-[8px] text-slate-400 capitalize block truncate w-full mt-0.5">{badge.id.replace(/_/g, ' ')}</span>
                    </div>
                 ))}
              </div>
            </div>

            {/* Immediate Play Action Container - bg-white replaced with bg-[#FAF7EC] */}
            <div className="flex flex-col gap-3 items-stretch bg-[#FAF7EC] border-4 border-slate-900 shadow-[6px_6px_0_0_#0f172a] rounded-3xl p-6 text-center">
              <button 
                id="btn_start_session_dashboard"
                onClick={() => { sounds.playClick(); onStartGame(); }}
                className="w-full py-4 bg-gradient-to-b from-amber-400 to-amber-500 border-4 border-slate-900 text-amber-950 rounded-2xl font-black text-sm tracking-wider uppercase flex items-center justify-center gap-2.5 transition-all duration-150 shadow-[4px_4px_0_0_#0f172a] hover:bg-amber-300 active:scale-95 cursor-pointer"
              >
                <Play className="w-5 h-5 fill-current text-purple-950 shrink-0" />
                Start SpeedMath Drill
              </button>
              <div className="text-[10px] sm:text-xs text-slate-500 font-bold flex flex-wrap justify-center items-center gap-x-2.5 gap-y-1">
                <span className="text-slate-500 font-medium">Training Config:</span>
                <span className="px-2 py-0.5 rounded-xl bg-slate-100 text-slate-700 uppercase font-extrabold text-[9px] border border-slate-200">{settings.gameMode}</span>
                <span className="px-2 py-0.5 rounded-xl bg-indigo-50 text-indigo-700 uppercase font-extrabold text-[9px] border border-indigo-100">{settings.difficulty}</span>
                <span className="text-slate-400">•</span>
                <button
                   onClick={() => { sounds.playClick(); setActiveTab('SETTINGS'); }}
                   className="font-black text-indigo-600 hover:text-indigo-800 underline uppercase text-[10px] cursor-pointer"
                >
                   Modify Game Rules
                </button>
              </div>
            </div>

         </div>
       )}

       {/* TAB 2: DETAILED TRAINING SYSTEM SETTINGS - bg-white replaced with bg-[#FAF7EC] */}
       {activeTab === 'SETTINGS' && (
          <div id="session_setup_card" className="w-full bg-[#FAF7EC] rounded-3xl border-4 border-slate-900 shadow-[6px_6px_0_0_#0f172a] p-6 md:p-8 space-y-6">
             <div className="border-b-2 border-slate-900/10 pb-4">
               <h3 className="text-lg md:text-xl font-black text-slate-800 flex items-center gap-2">
                  <SettingsIcon className="w-5 h-5 text-indigo-600" /> Calibration Panel
               </h3>
               <p className="text-[10px] md:text-xs font-black text-slate-400 uppercase tracking-widest mt-1">Configure your numerical parameters</p>
             </div>

             <div className="space-y-6">
               {/* Practice Mode */}
               <div>
                 <h4 className="text-[11px] font-black text-slate-800 uppercase tracking-widest mb-3 border-b-2 border-slate-900/10 pb-1 flex items-center gap-1.5">
                    🎯 Training Format
                 </h4>
                 <div className="grid grid-cols-2 gap-3">
                    <button
                       id="btn_mode_timed"
                       onClick={() => { sounds.playClick(); onSettingsChange({ ...settings, gameMode: GameMode.TIMED }); }}
                       className={`py-3 px-4 rounded-2xl font-black text-xs transition-colors border-2 ${settings.gameMode === GameMode.TIMED ? 'bg-indigo-600 border-slate-900 text-white shadow-[2px_2px_0_0_#0f172a]' : 'bg-slate-50 border-slate-200 text-slate-400 hover:border-slate-300'}`}
                     >
                       Timed Drill
                     </button>
                     <button
                       id="btn_mode_untimed"
                       onClick={() => { sounds.playClick(); onSettingsChange({ ...settings, gameMode: GameMode.UNTIMED }); }}
                       className={`py-3 px-4 rounded-2xl font-black text-xs transition-colors border-2 ${settings.gameMode === GameMode.UNTIMED ? 'bg-indigo-600 border-slate-900 text-white shadow-[2px_2px_0_0_#0f172a]' : 'bg-slate-50 border-slate-200 text-slate-400 hover:border-slate-300'}`}
                     >
                       Untimed Practice
                     </button>
                 </div>
               </div>

               {/* Operations */}
               <div>
                 <h4 className="text-[11px] font-black text-slate-800 uppercase tracking-widest mb-3 border-b-2 border-slate-900/10 pb-1 flex items-center gap-1.5">
                    🎛️ Active Operations
                 </h4>
                 <div className="grid grid-cols-2 gap-3">
                   {Object.values(Operation).map((op) => (
                     <label key={op} className={`flex items-center gap-3 px-4 py-3 rounded-2xl border-2 cursor-pointer transition-colors text-xs font-black select-none ${settings.operations[op] ? 'bg-indigo-50/80 border-slate-900 text-indigo-900 shadow-[2px_2px_0_0_#0f172a]' : 'bg-slate-50 border-slate-200 text-slate-400 hover:border-slate-300'}`}>
                       <input 
                         type="checkbox" 
                         className="w-[18px] h-[18px] rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 accent-indigo-600 cursor-pointer" 
                         checked={settings.operations[op]}
                         onChange={() => toggleOperation(op)} 
                       />
                       <span className="font-extrabold capitalize">{op.toLowerCase()}</span>
                     </label>
                   ))}
                 </div>
               </div>

               {/* Difficulty */}
               <div>
                 <h4 className="text-[11px] font-black text-slate-800 uppercase tracking-widest mb-3 border-b-2 border-slate-900/10 pb-1 flex items-center gap-1.5">
                    🔋 Base Difficulty
                 </h4>
                 <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5">
                    {Object.values(Difficulty).map((diff) => (
                      <button
                        key={diff}
                        id={`btn_diff_${diff.toLowerCase()}`}
                        onClick={() => { sounds.playClick(); onSettingsChange({ ...settings, difficulty: diff }); }}
                        className={`py-2.5 px-3 rounded-xl font-black text-xs transition-colors border-2 ${settings.difficulty === diff ? 'bg-indigo-600 border-slate-900 text-white shadow-[2px_2px_0_0_#0f172a]' : 'bg-slate-50 border-slate-200 text-slate-400 hover:border-slate-300'}`}
                      >
                        {diff}
                      </button>
                    ))}
                 </div>
               </div>

               {/* AI Progressive */}
               <label className="flex items-start justify-between p-4 bg-slate-50 rounded-2xl border-2 border-slate-200 cursor-pointer active:bg-slate-100 transition-colors select-none">
                 <div>
                   <div className="text-xs font-black text-slate-800 flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-indigo-600" /> adaptive learning calibration
                   </div>
                   <p className="text-[10px] text-slate-400 leading-normal mt-1">Automatically scale mathematical complexity based on your instantaneous accuracy during the drills.</p>
                 </div>
                 <input 
                   type="checkbox" 
                   className="mt-0.5 w-5 h-5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 accent-indigo-600 cursor-pointer" 
                   checked={settings.adaptiveDifficulty}
                   onChange={(e) => { sounds.playClick(); onSettingsChange({ ...settings, adaptiveDifficulty: e.target.checked }); }}
                 />
               </label>

               {/* Duration */}
               {settings.gameMode === GameMode.TIMED && (
                 <div>
                   <h4 className="text-[11px] font-black text-slate-800 uppercase tracking-widest mb-3 border-b-2 border-slate-900/10 pb-1 flex items-center gap-1.5">
                      ⏱️ session duration
                   </h4>
                   <div className="grid grid-cols-4 gap-2.5">
                     {[30, 60, 120, 300].map((time) => (
                        <button
                         key={time}
                         id={`btn_duration_${time}`}
                         onClick={() => { sounds.playClick(); onSettingsChange({ ...settings, gameDurationSeconds: time }); }}
                         className={`py-2 px-3 rounded-xl font-black text-xs border-2 transition-colors ${settings.gameDurationSeconds === time ? 'bg-indigo-600 border-slate-900 text-white shadow-[2px_2px_0_0_#0f172a]' : 'bg-slate-50 border-slate-200 text-slate-400 hover:border-slate-300'}`}
                       >
                         {time < 60 ? `${time}s` : `${time / 60}m`}
                       </button>
                     ))}
                   </div>
                 </div>
               )}

               {/* Flow Control Actions */}
               <div className="flex flex-col sm:flex-row gap-3 pt-3">
                 <button 
                   id="btn_save_back"
                   onClick={() => { sounds.playClick(); setActiveTab('DASHBOARD'); }}
                   className="flex-1 py-4 bg-indigo-600 hover:bg-indigo-700 border-4 border-slate-900 text-white rounded-2xl font-black text-xs tracking-widest uppercase flex items-center justify-center gap-1.5 shadow-[4px_4px_0_0_#0f172a] active:scale-95 cursor-pointer"
                 >
                   <Check className="w-4 h-4 stroke-[2.5]" /> Apply & Show Dashboard
                 </button>
                 <button 
                   id="btn_play_direct"
                   onClick={() => { sounds.playClick(); onStartGame(); }}
                   className="flex-1 py-4 bg-gradient-to-b from-amber-400 to-amber-500 border-4 border-slate-900 text-amber-950 rounded-2xl font-black text-xs tracking-widest uppercase flex items-center justify-center gap-1.5 shadow-[4px_4px_0_0_#0f172a] active:scale-95 cursor-pointer"
                 >
                   <Play className="w-[18px] h-[18px] fill-current" /> Play Drills Instantly
                 </button>
                </div>
              </div>
           </div>
        )}
    </div>
  );
};

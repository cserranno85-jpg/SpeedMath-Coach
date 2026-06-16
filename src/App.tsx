import React, { useState, useEffect } from 'react';
import { Settings, Difficulty, Operation, GameMode } from './types';
import { Menu } from './components/Menu';
import { Game } from './components/Game';
import { GameOver } from './components/GameOver';
import { Stats } from './components/Stats';
import { Profile } from './components/Profile';
import { Challenges } from './components/Challenges';
import { motion, AnimatePresence } from 'motion/react';
import { Badge } from './utils/streakAndAchievements';
import { backgrounds, fx } from './assets/uiAssetRegistry';
import { sounds } from './utils/soundEngine';

type AppState = 'HOME' | 'PRACTICE' | 'PLAYING' | 'GAMEOVER' | 'PROGRESS' | 'PROFILE' | 'CHALLENGES';

const DEFAULT_SETTINGS: Settings = {
  difficulty: Difficulty.BEGINNER,
  gameMode: GameMode.TIMED,
  operations: {
    [Operation.ADDITION]: true,
    [Operation.SUBTRACTION]: false,
    [Operation.MULTIPLICATION]: false,
    [Operation.DIVISION]: false,
  },
  adaptiveDifficulty: false,
  gameDurationSeconds: 60,
};

export default function App() {
  const [appState, setAppState] = useState<AppState>('HOME');
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);
  
  // Game results
  const [lastScore, setLastScore] = useState(0);
  const [lastTotal, setLastTotal] = useState(0);
  const [lastHistory, setLastHistory] = useState<any[]>([]);
  const [lastUnlockedBadges, setLastUnlockedBadges] = useState<Badge[]>([]);

  // Load settings from local storage
  useEffect(() => {
    const savedSettings = localStorage.getItem('speedMathSettings');
    if (savedSettings) {
      try {
        const parsed = JSON.parse(savedSettings);
        if (parsed?.difficulty && parsed?.gameMode && parsed?.operations) {
          setSettings({ ...DEFAULT_SETTINGS, ...parsed, operations: { ...DEFAULT_SETTINGS.operations, ...parsed.operations } });
        }
      } catch(e) {}
    }
  }, []);

  const handleSettingsChange = (newSettings: Settings) => {
    const nextSettings = {
      ...newSettings,
      operations: { ...newSettings.operations },
    };
    const hasOp = Object.values(nextSettings.operations).some(v => v);
    if (!hasOp) nextSettings.operations[Operation.ADDITION] = true;

    setSettings(nextSettings);
    localStorage.setItem('speedMathSettings', JSON.stringify(nextSettings));
  };

  const navigateTo = (state: Exclude<AppState, 'PLAYING' | 'GAMEOVER'>) => {
    setAppState(state);
  };

  const handleStartGame = () => {
    sounds.playStart();
    setAppState('PLAYING');
  };

  const handleEndGame = (score: number, totalSubmissions: number, history: any[], unlockedBadges: Badge[]) => {
    setLastScore(score);
    setLastTotal(totalSubmissions);
    setLastHistory(history);
    setLastUnlockedBadges(unlockedBadges);
    setAppState('GAMEOVER');

    // Here you could also save history to localStorage for long-term progress tracking
    const existingProgressStr = localStorage.getItem('speedMathProgress');
    let progress: any[] = [];
    if (existingProgressStr) {
      try {
        const parsed = JSON.parse(existingProgressStr);
        progress = Array.isArray(parsed) ? parsed : [];
      } catch(e){}
    }
    progress.push({
      date: new Date().toISOString(),
      score,
      totalSubmissions,
      settings,
      history
    });
    localStorage.setItem('speedMathProgress', JSON.stringify(progress));
  };

  const screenBackground =
    appState === 'PLAYING' || appState === 'PRACTICE'
      ? backgrounds.exercise
      : appState === 'PROGRESS' || appState === 'PROFILE' || appState === 'CHALLENGES'
      ? backgrounds.profile
      : backgrounds.home;
  const isExerciseScreen = appState === 'PLAYING';

  return (
    <div
      className={`min-h-[100dvh] w-full relative bg-slate-950 text-slate-900 font-sans tracking-tight flex justify-center selection:bg-cyan-200 overflow-x-hidden pb-safe pr-safe pl-safe pt-safe ${
        isExerciseScreen ? 'items-center overflow-hidden p-0' : 'items-start overflow-y-auto p-0'
      }`}
      style={{
        backgroundImage: `linear-gradient(180deg, rgba(4, 8, 28, 0.18), rgba(4, 8, 28, 0.72)), url(${screenBackground})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }}
    >
       <div className="absolute inset-0 bg-[radial-gradient(#22d3ee_1px,transparent_1px)] [background-size:28px_28px] opacity-[0.08] pointer-events-none"></div>
       <img
         src={fx.mathParticles}
         alt=""
         aria-hidden="true"
         className="absolute inset-0 h-full w-full object-cover opacity-[0.14] mix-blend-screen pointer-events-none"
       />
       
       <div className="relative z-10 w-full flex items-start justify-center">
          <AnimatePresence mode="wait">
             {(appState === 'HOME' || appState === 'PRACTICE') && (
                 <motion.div
                   key={appState.toLowerCase()}
                   initial={{ opacity: 0, y: 30 }}
                   animate={{ opacity: 1, y: 0 }}
                   exit={{ opacity: 0, y: -20 }}
                   transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
                   className="w-full flex justify-center"
                 >
                    <Menu 
                      settings={settings} 
                      onSettingsChange={handleSettingsChange}
                      onStartGame={handleStartGame}
                      onNavigate={navigateTo}
                      initialTab={appState === 'PRACTICE' ? 'SETTINGS' : 'DASHBOARD'}
                      activeNav={appState === 'PRACTICE' ? 'practice' : 'home'}
                    />
                 </motion.div>
             )}

             {appState === 'PLAYING' && (
                 <motion.div
                   key="playing"
                   initial={{ opacity: 0, scale: 0.96, y: 15 }}
                   animate={{ opacity: 1, scale: 1, y: 0 }}
                   exit={{ opacity: 0, scale: 0.96, y: -15 }}
                   transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
                   className="w-full flex justify-center"
                 >
                    <Game 
                      settings={settings}
                      onEndGame={handleEndGame}
                      onHome={() => navigateTo('HOME')}
                    />
                 </motion.div>
             )}

             {appState === 'GAMEOVER' && (
                 <motion.div
                   key="gameover"
                   initial={{ opacity: 0, y: 30 }}
                   animate={{ opacity: 1, y: 0 }}
                   exit={{ opacity: 0, y: -20 }}
                   transition={{ duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
                   className="w-full flex justify-center"
                 >
                    <GameOver 
                      score={lastScore}
                      totalQuestions={lastTotal}
                      history={lastHistory}
                      unlockedBadges={lastUnlockedBadges}
                      onPlayAgain={handleStartGame}
                      onMenu={() => navigateTo('PRACTICE')}
                    />
                 </motion.div>
             )}

             {appState === 'PROGRESS' && (
                 <motion.div
                   key="progress"
                   initial={{ opacity: 0, y: 30 }}
                   animate={{ opacity: 1, y: 0 }}
                   exit={{ opacity: 0, y: -20 }}
                   transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
                   className="w-full flex justify-center"
                 >
                    <Stats onBack={() => navigateTo('HOME')} onStartGame={handleStartGame} onNavigate={navigateTo} />
                 </motion.div>
             )}

             {appState === 'PROFILE' && (
                 <motion.div
                   key="profile"
                   initial={{ opacity: 0, y: 30 }}
                   animate={{ opacity: 1, y: 0 }}
                   exit={{ opacity: 0, y: -20 }}
                   transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
                   className="w-full flex justify-center"
                 >
                    <Profile onStartGame={handleStartGame} onNavigate={navigateTo} />
                 </motion.div>
             )}

             {appState === 'CHALLENGES' && (
                 <motion.div
                   key="challenges"
                   initial={{ opacity: 0, y: 30 }}
                   animate={{ opacity: 1, y: 0 }}
                   exit={{ opacity: 0, y: -20 }}
                   transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
                   className="w-full flex justify-center"
                 >
                    <Challenges onStartGame={handleStartGame} onNavigate={navigateTo} />
                 </motion.div>
             )}
          </AnimatePresence>
       </div>
    </div>
  );
}

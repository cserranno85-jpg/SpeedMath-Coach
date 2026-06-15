import React, { useState, useEffect } from 'react';
import { Settings, Difficulty, Operation, GameMode } from './types';
import { Menu } from './components/Menu';
import { Game } from './components/Game';
import { GameOver } from './components/GameOver';
import { Stats } from './components/Stats';
import { motion, AnimatePresence } from 'motion/react';
import { Badge } from './utils/streakAndAchievements';
import { backgrounds, fx } from './assets/uiAssetRegistry';

type AppState = 'MENU' | 'PLAYING' | 'GAMEOVER' | 'STATS';

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
  const [appState, setAppState] = useState<AppState>('MENU');
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
        setSettings(JSON.parse(savedSettings));
      } catch(e) {}
    }
  }, []);

  const handleSettingsChange = (newSettings: Settings) => {
    // Ensure at least one operation is selected
    const hasOp = Object.values(newSettings.operations).some(v => v);
    if (!hasOp) newSettings.operations[Operation.ADDITION] = true;

    setSettings(newSettings);
    localStorage.setItem('speedMathSettings', JSON.stringify(newSettings));
  };

  const handleStartGame = () => {
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
    let progress = [];
    if (existingProgressStr) {
      try { progress = JSON.parse(existingProgressStr); } catch(e){}
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
    appState === 'PLAYING'
      ? backgrounds.exercise
      : appState === 'STATS'
      ? backgrounds.profile
      : backgrounds.home;
  const isExerciseScreen = appState === 'PLAYING';

  return (
    <div
      className={`min-h-[100dvh] w-full relative bg-slate-950 text-slate-900 font-sans tracking-tight flex items-center justify-center selection:bg-cyan-200 overflow-x-hidden pb-safe pr-safe pl-safe pt-safe ${
        isExerciseScreen ? 'overflow-hidden p-0' : 'overflow-y-auto p-3 md:p-8'
      }`}
      style={{
        backgroundImage: `linear-gradient(180deg, rgba(4, 8, 28, 0.18), rgba(4, 8, 28, 0.72)), url(${screenBackground})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundAttachment: 'fixed',
      }}
    >
       <div className="absolute inset-0 bg-[radial-gradient(#22d3ee_1px,transparent_1px)] [background-size:28px_28px] opacity-[0.08] pointer-events-none"></div>
       <img
         src={fx.mathParticles}
         alt=""
         aria-hidden="true"
         className="absolute inset-0 h-full w-full object-cover opacity-[0.14] mix-blend-screen pointer-events-none"
       />
       
       <div className="relative z-10 w-full flex items-center justify-center">
          <AnimatePresence mode="wait">
             {appState === 'MENU' && (
                 <motion.div
                   key="menu"
                   initial={{ opacity: 0, y: 30 }}
                   animate={{ opacity: 1, y: 0 }}
                   exit={{ opacity: 0, y: -20 }}
                   transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
                   className="w-full flex justify-center"
                 >
                    <Menu 
                      settings={settings} 
                      onSettingsChange={handleSettingsChange}
                      onStartGame={handleStartGame}
                      onViewStats={() => setAppState('STATS')}
                    />
                 </motion.div>
             )}

             {appState === 'PLAYING' && (
                 <motion.div
                   key="playing"
                   initial={{ opacity: 0, scale: 0.96, y: 15 }}
                   animate={{ opacity: 1, scale: 1, y: 0 }}
                   exit={{ opacity: 0, scale: 0.96, y: -15 }}
                   transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
                   className="w-full flex justify-center"
                 >
                    <Game 
                      settings={settings}
                      onEndGame={handleEndGame}
                      onHome={() => setAppState('MENU')}
                    />
                 </motion.div>
             )}

             {appState === 'GAMEOVER' && (
                 <motion.div
                   key="gameover"
                   initial={{ opacity: 0, y: 30 }}
                   animate={{ opacity: 1, y: 0 }}
                   exit={{ opacity: 0, y: -20 }}
                   transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
                   className="w-full flex justify-center"
                 >
                    <GameOver 
                      score={lastScore}
                      totalQuestions={lastTotal}
                      history={lastHistory}
                      unlockedBadges={lastUnlockedBadges}
                      onPlayAgain={handleStartGame}
                      onMenu={() => setAppState('MENU')}
                    />
                 </motion.div>
             )}

             {appState === 'STATS' && (
                 <motion.div
                   key="stats"
                   initial={{ opacity: 0, y: 30 }}
                   animate={{ opacity: 1, y: 0 }}
                   exit={{ opacity: 0, y: -20 }}
                   transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
                   className="w-full flex justify-center"
                 >
                    <Stats onBack={() => setAppState('MENU')} />
                 </motion.div>
             )}
          </AnimatePresence>
       </div>
    </div>
  );
}

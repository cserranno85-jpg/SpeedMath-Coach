import React, { useState, useEffect } from 'react';
import { Settings, Operation } from './types';
import { Menu } from './components/Menu';
import { Game } from './components/Game';
import { GameOver } from './components/GameOver';
import { Stats } from './components/Stats';
import { motion, AnimatePresence } from 'motion/react';
import { Badge } from './utils/streakAndAchievements';
import { appendProgress } from './utils/progressStorage';
import { DEFAULT_SETTINGS, loadSettings, saveSettings } from './utils/settingsValidation';

type AppState = 'MENU' | 'PLAYING' | 'GAMEOVER' | 'STATS';

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
    const normalizedSettings = loadSettings();
    setSettings(normalizedSettings);
    saveSettings(normalizedSettings);
  }, []);

  useEffect(() => {
    document.documentElement.dataset.theme = settings.theme;
    document.documentElement.style.colorScheme = settings.theme;
  }, [settings.theme]);

  const handleSettingsChange = (newSettings: Settings) => {
    const normalizedSettings = saveSettings(newSettings);
    setSettings(normalizedSettings);
  };

  const handleStartGame = () => {
    if (appState === 'PLAYING') return;
    setAppState('PLAYING');
  };

  const handleEndGame = (score: number, totalSubmissions: number, history: any[], unlockedBadges: Badge[]) => {
    setLastScore(score);
    setLastTotal(totalSubmissions);
    setLastHistory(history);
    setLastUnlockedBadges(unlockedBadges);
    setAppState('GAMEOVER');

    appendProgress({
      date: new Date().toISOString(),
      score,
      totalSubmissions,
      settings,
      history
    });
  };

  const gameSessionKey = [
    settings.gameMode,
    settings.gameDurationSeconds,
    settings.difficulty,
    Object.values(Operation).filter(op => settings.operations[op]).join(',')
  ].join('|');

  return (
    <div className="app-shell min-h-[100dvh] w-full relative font-sans flex items-stretch justify-center p-3 md:p-8 selection:bg-cyan-300/30 overflow-x-hidden overflow-y-auto pb-[calc(env(safe-area-inset-bottom,0px)+0.75rem)] pr-[calc(env(safe-area-inset-right,0px)+0.75rem)] pl-[calc(env(safe-area-inset-left,0px)+0.75rem)] pt-[calc(env(safe-area-inset-top,0px)+0.75rem)]">
       <div className="app-shell-grid absolute inset-0 pointer-events-none"></div>
       
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
                      key={gameSessionKey}
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

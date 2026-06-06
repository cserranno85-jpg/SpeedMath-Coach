import React, { useState, useEffect } from 'react';
import { Settings, Difficulty, Operation, GameMode } from './types';
import { Menu } from './components/Menu';
import { Game } from './components/Game';
import { GameOver } from './components/GameOver';
import { Stats } from './components/Stats';
import { BrainCircuit } from 'lucide-react';

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
  aiProgressiveHardening: false,
  gameDurationSeconds: 60,
};

export default function App() {
  const [appState, setAppState] = useState<AppState>('MENU');
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);
  
  // Game results
  const [lastScore, setLastScore] = useState(0);
  const [lastTotal, setLastTotal] = useState(0);
  const [lastHistory, setLastHistory] = useState<any[]>([]);

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

  const handleEndGame = (score: number, totalSubmissions: number, history: any[]) => {
    setLastScore(score);
    setLastTotal(totalSubmissions);
    setLastHistory(history);
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

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans tracking-tight flex items-center justify-center p-4 md:p-8 selection:bg-indigo-100 overflow-y-auto">
       
       {appState === 'MENU' && (
           <Menu 
             settings={settings} 
             onSettingsChange={handleSettingsChange}
             onStartGame={handleStartGame}
             onViewStats={() => setAppState('STATS')}
           />
       )}

       {appState === 'PLAYING' && (
           <Game 
             settings={settings}
             onEndGame={handleEndGame}
             onHome={() => setAppState('MENU')}
           />
       )}

       {appState === 'GAMEOVER' && (
           <GameOver 
             score={lastScore}
             totalQuestions={lastTotal}
             history={lastHistory}
             onPlayAgain={handleStartGame}
             onMenu={() => setAppState('MENU')}
           />
       )}

       {appState === 'STATS' && (
           <Stats onBack={() => setAppState('MENU')} />
       )}
    </div>
  );
}

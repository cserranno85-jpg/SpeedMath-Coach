import React from 'react';
import { Settings as SettingsType, Difficulty, Operation, GameMode } from '../types';
import { Settings as SettingsIcon, Play, BarChart2 } from 'lucide-react';

interface MenuProps {
  settings: SettingsType;
  onSettingsChange: (newSettings: SettingsType) => void;
  onStartGame: () => void;
  onViewStats: () => void;
}

export const Menu: React.FC<MenuProps> = ({ settings, onSettingsChange, onStartGame, onViewStats }) => {
  const toggleOperation = (op: Operation) => {
    onSettingsChange({
      ...settings,
      operations: {
        ...settings.operations,
        [op]: !settings.operations[op]
      }
    });
  };

  return (
    <div className="w-full max-w-xl mx-auto bg-white rounded-2xl border border-slate-200 shadow-sm p-8">
       <div className="flex justify-between items-start mb-8">
         <div>
           <h1 className="text-3xl font-bold leading-none text-slate-800 mb-2">SpeedMath Coach</h1>
           <p className="text-xs text-slate-500 font-medium tracking-tight">Fast Math, Sharper Mind.</p>
         </div>
         <button 
           onClick={onViewStats}
           className="p-3 bg-slate-50 border border-slate-200 hover:bg-slate-100 text-slate-600 rounded-xl transition-colors"
           title="View Progress"
         >
           <BarChart2 className="w-6 h-6" />
         </button>
       </div>

       <div className="space-y-8">
         {/* Practice Mode */}
         <div>
           <h3 className="text-[10px] font-bold text-slate-800 uppercase tracking-widest mb-4 border-b border-slate-100 pb-2">
             Practice Mode
           </h3>
           <div className="grid grid-cols-2 gap-2">
              <button
                 onClick={() => onSettingsChange({ ...settings, gameMode: GameMode.TIMED })}
                 className={`py-3 px-4 rounded-lg font-bold text-sm transition-colors border ${settings.gameMode === GameMode.TIMED ? 'bg-indigo-600 border-indigo-700 text-white' : 'bg-slate-100 border-slate-200 text-slate-400 hover:border-slate-300'}`}
               >
                 Timed Drill
               </button>
               <button
                 onClick={() => onSettingsChange({ ...settings, gameMode: GameMode.UNTIMED })}
                 className={`py-3 px-4 rounded-lg font-bold text-sm transition-colors border ${settings.gameMode === GameMode.UNTIMED ? 'bg-indigo-600 border-indigo-700 text-white' : 'bg-slate-100 border-slate-200 text-slate-400 hover:border-slate-300'}`}
               >
                 Untimed Practice
               </button>
           </div>
         </div>

         {/* Operations */}
         <div>
           <h3 className="text-[10px] font-bold text-slate-800 uppercase tracking-widest mb-4 border-b border-slate-100 pb-2 flex items-center gap-2">
             <SettingsIcon className="w-4 h-4" /> Config
           </h3>
           <div className="grid grid-cols-2 gap-3">
             {Object.values(Operation).map((op) => (
               <label key={op} className={`flex items-center gap-3 px-4 py-2 rounded-lg border cursor-pointer transition-colors text-sm font-bold ${settings.operations[op] ? 'bg-indigo-600 border-indigo-700 text-white' : 'bg-slate-100 border-slate-200 text-slate-400 hover:border-slate-300'}`}>
                 <input 
                   type="checkbox" 
                   className="sr-only" 
                   checked={settings.operations[op]}
                   onChange={() => toggleOperation(op)} 
                 />
                 <span className="font-medium">{op.toLowerCase()}</span>
               </label>
             ))}
           </div>
         </div>

         {/* Difficulty */}
         <div>
           <h3 className="text-[10px] font-bold text-slate-800 uppercase tracking-widest mb-4 border-b border-slate-100 pb-2">
             Base Difficulty
           </h3>
           <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              {Object.values(Difficulty).map((diff) => (
               <button
                 key={diff}
                 onClick={() => onSettingsChange({ ...settings, difficulty: diff })}
                 className={`py-2 px-3 rounded-lg font-bold text-sm transition-colors border ${settings.difficulty === diff ? 'bg-indigo-600 border-indigo-700 text-white' : 'bg-slate-100 border-slate-200 text-slate-400 hover:border-slate-300'}`}
               >
                 {diff}
               </button>
             ))}
           </div>
         </div>

         {/* AI Progressive */}
         <label className="flex items-start justify-between p-4 bg-slate-50 rounded-xl border border-slate-200 cursor-pointer">
           <div>
             <div className="text-xs font-bold text-slate-700">AI Adaptive Hardening</div>
             <p className="text-[11px] text-slate-500 leading-relaxed mt-1 hidden md:block">Automatically adjust complexity based on your speed and accuracy metrics during the session.</p>
           </div>
           <input 
             type="checkbox" 
             className="mt-1 w-5 h-5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 accent-emerald-500" 
             checked={settings.aiProgressiveHardening}
             onChange={(e) => onSettingsChange({ ...settings, aiProgressiveHardening: e.target.checked })}
           />
         </label>

         {/* Duration */}
         {settings.gameMode === GameMode.TIMED && (
           <div>
             <h3 className="text-[10px] font-bold text-slate-800 uppercase tracking-widest mb-4 border-b border-slate-100 pb-2">
               Game Duration
             </h3>
             <div className="grid grid-cols-4 gap-2">
               {[30, 60, 120, 300].map((time) => (
                  <button
                   key={time}
                   onClick={() => onSettingsChange({ ...settings, gameDurationSeconds: time })}
                   className={`py-2 px-3 rounded-lg font-bold text-sm border transition-colors ${settings.gameDurationSeconds === time ? 'bg-indigo-600 border-indigo-700 text-white' : 'bg-slate-100 border-slate-200 text-slate-400 hover:border-slate-300'}`}
                 >
                   {time < 60 ? `${time}s` : `${time / 60}m`}
                 </button>
               ))}
             </div>
           </div>
         )}

         <button 
           onClick={onStartGame}
           className="w-full py-4 bg-indigo-900 border border-indigo-900 hover:bg-indigo-800 text-white rounded-xl font-bold text-lg flex items-center justify-center gap-2 transition-transform active:scale-95 shadow-lg"
         >
           <Play className="w-5 h-5 fill-current" /> Start Performance Session
         </button>
       </div>
    </div>
  );
};

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
    <div className="w-full max-w-[430px] md:max-w-xl mx-auto bg-white rounded-3xl border border-slate-200/80 shadow-md p-5 sm:p-8 transition-all">
       <div className="flex justify-between items-center mb-6 sm:mb-8">
         <div>
           <h1 className="text-2xl sm:text-3xl font-black leading-none text-slate-800 tracking-tight">SpeedMath Coach</h1>
           <p className="text-[11px] sm:text-xs text-slate-500 font-semibold tracking-wide uppercase mt-1">Fast Math, Sharper Mind.</p>
         </div>
         <button 
           onClick={onViewStats}
           className="p-3 bg-slate-50 border border-slate-200 hover:bg-slate-100 text-slate-600 rounded-xl transition-all cursor-pointer shadow-sm active:scale-95"
           title="View Progress"
           id="btn-stats"
         >
           <BarChart2 className="w-6 h-6 stroke-[2]" />
         </button>
       </div>

       <div className="space-y-6 sm:space-y-8">
         {/* Practice Mode */}
         <div>
           <h3 className="text-[11px] font-bold text-indigo-900/80 uppercase tracking-widest mb-3 border-b border-indigo-50/80 pb-1.5 font-mono">
             Practice Mode
           </h3>
           <div className="grid grid-cols-[repeat(auto-fit,minmax(140px,1fr))] gap-2">
              <button
                 onClick={() => onSettingsChange({ ...settings, gameMode: GameMode.TIMED })}
                 className={`py-3 px-4 rounded-xl font-bold text-sm transition-all border cursor-pointer active:scale-98 ${settings.gameMode === GameMode.TIMED ? 'bg-indigo-600 border-indigo-700 text-white shadow-md' : 'bg-slate-50 border-slate-200 text-slate-600 hover:border-slate-300'}`}
                 id="mode-timed"
              >
                Timed Drill
              </button>
              <button
                 onClick={() => onSettingsChange({ ...settings, gameMode: GameMode.UNTIMED })}
                 className={`py-3 px-4 rounded-xl font-bold text-sm transition-all border cursor-pointer active:scale-98 ${settings.gameMode === GameMode.UNTIMED ? 'bg-indigo-600 border-indigo-700 text-white shadow-md' : 'bg-slate-50 border-slate-200 text-slate-600 hover:border-slate-300'}`}
                 id="mode-untimed"
              >
                Untimed Practice
              </button>
           </div>
         </div>

         {/* Operations */}
         <div>
           <h3 className="text-[11px] font-bold text-indigo-900/80 uppercase tracking-widest mb-3 border-b border-indigo-50/80 pb-1.5 flex items-center gap-1.5 font-mono">
             <SettingsIcon className="w-3.5 h-3.5" /> Operations
           </h3>
           <div className="grid grid-cols-2 gap-2">
             {Object.values(Operation).map((op) => (
               <label key={op} className={`flex items-center justify-center text-center px-3 py-3 rounded-xl border cursor-pointer transition-all text-sm font-bold active:scale-98 select-none ${settings.operations[op] ? 'bg-indigo-600 border-indigo-700 text-white shadow-md' : 'bg-slate-50 border-slate-200 text-slate-500 hover:border-slate-300'}`}>
                 <input 
                   type="checkbox" 
                   className="sr-only" 
                   checked={settings.operations[op]}
                   onChange={() => toggleOperation(op)} 
                 />
                 <span className="capitalize">{op.toLowerCase()}</span>
               </label>
             ))}
           </div>
         </div>

         {/* Difficulty */}
         <div>
           <h3 className="text-[11px] font-bold text-indigo-900/80 uppercase tracking-widest mb-3 border-b border-indigo-50/80 pb-1.5 font-mono">
             Difficulty
           </h3>
           <div className="grid grid-cols-3 sm:grid-cols-4 gap-1.5">
              {Object.values(Difficulty).map((diff) => (
               <button
                 key={diff}
                 onClick={() => onSettingsChange({ ...settings, difficulty: diff })}
                 className={`py-2 px-2.5 rounded-lg font-bold text-xs transition-colors border cursor-pointer ${settings.difficulty === diff ? 'bg-indigo-600 border-indigo-700 text-white shadow-sm' : 'bg-slate-50 border-slate-200 text-slate-500 hover:border-slate-300'}`}
               >
                 {diff}
               </button>
             ))}
           </div>
         </div>

         {/* Adaptive Difficulty option */}
         <label className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-200 hover:border-slate-300 cursor-pointer transition-all">
           <div className="pr-4">
             <div className="text-xs sm:text-sm font-bold text-slate-700">Adaptive Difficulty</div>
             <p className="text-[11px] text-slate-500 leading-normal mt-0.5 max-w-xs">Adjusts challenge based on your speed and accuracy during the session.</p>
           </div>
           <div className="relative flex items-center">
             <input 
               type="checkbox" 
               className="w-5 h-5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 accent-indigo-600 cursor-pointer" 
               checked={settings.adaptiveDifficulty}
               onChange={(e) => onSettingsChange({ ...settings, adaptiveDifficulty: e.target.checked })}
             />
           </div>
         </label>

         {/* Duration */}
         {settings.gameMode === GameMode.TIMED && (
           <div>
             <h3 className="text-[11px] font-bold text-indigo-900/80 uppercase tracking-widest mb-3 border-b border-indigo-50/80 pb-1.5 font-mono">
               Game Duration
             </h3>
             <div className="grid grid-cols-4 gap-2">
               {[30, 60, 120, 300].map((time) => (
                  <button
                   key={time}
                   onClick={() => onSettingsChange({ ...settings, gameDurationSeconds: time })}
                   className={`py-2 px-2.5 rounded-lg font-bold text-xs border transition-colors cursor-pointer ${settings.gameDurationSeconds === time ? 'bg-indigo-600 border-indigo-700 text-white shadow-sm' : 'bg-slate-50 border-slate-200 text-slate-500 hover:border-slate-300'}`}
                 >
                   {time < 60 ? `${time}s` : `${time / 60}m`}
                 </button>
               ))}
             </div>
           </div>
         )}

         <button 
           onClick={onStartGame}
           id="btn-start"
           className="w-full py-4 bg-indigo-900 hover:bg-slate-800 text-white rounded-xl font-bold text-base flex items-center justify-center gap-2 transition-all active:scale-[0.98] shadow-md hover:shadow-lg cursor-pointer"
         >
           <Play className="w-5 h-5 fill-current" /> Start Practice Session
         </button>
       </div>
    </div>
  );
};

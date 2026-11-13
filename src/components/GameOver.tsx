import React, { useEffect } from 'react';
import { ArrowRight, BarChart3, Clock3, RotateCw, Star, Trophy } from 'lucide-react';
import { Badge } from '../utils/streakAndAchievements';
import { sounds } from '../utils/soundEngine';
import { badgeArtByAchievementId, badges as badgeAssets, brandMarks, mascots } from '../assets/uiAssetRegistry';
import { PremiumGlassClass, PremiumCTA, PremiumScreen, labelClass } from './PremiumShell';

interface GameOverProps {
  score: number;
  totalQuestions: number;
  history: any[];
  unlockedBadges: Badge[];
  onPlayAgain: () => void;
  onMenu: () => void;
}

export const GameOver: React.FC<GameOverProps> = ({
  score, totalQuestions, history, unlockedBadges, onPlayAgain, onMenu,
}) => {
  const accuracy = totalQuestions > 0 ? Math.round(score / totalQuestions * 100) : 0;
  const under3s = history.filter(h => typeof h.timeSpent === 'number' && h.timeSpent <= 3).length;
  const under5s = history.filter(h => typeof h.timeSpent === 'number' && h.timeSpent > 3 && h.timeSpent <= 5).length;
  const over5s = history.filter(h => typeof h.timeSpent === 'number' && h.timeSpent > 5).length;

  useEffect(() => {
    if (accuracy >= 80 && score > 0) sounds.playAchievement();
    else if (score > 0) sounds.playGameOver();
    else sounds.playIncorrect();
  }, [accuracy, score]);

  const guidance = accuracy >= 90
    ? 'Great accuracy. Try another session to strengthen your consistency.'
    : accuracy >= 60
      ? 'Good progress. Focus on a steady pace before increasing difficulty.'
      : 'Keep practicing at a comfortable pace. Accuracy comes with repetition.';

  return (
    <PremiumScreen className="gap-4">
      <header className="flex items-center gap-3 rounded-[20px] border border-[#294C73] bg-[#0B1B3A] p-3">
        <img src={brandMarks.primaryLogo} alt="SpeedMath Coach logo"
          className="h-12 w-12 rounded-xl object-contain" />
        <div>
          <p className={labelClass + ' text-[#61E4FF]'}>SpeedMath / Coach</p>
          <h1 className="text-[24px] font-black tracking-tight text-white">Drill complete.</h1>
        </div>
      </header>

      <p className="px-1 text-sm text-[#B5CBE8]">Review your results, then go again.</p>

      <section aria-labelledby="summary-heading" className={PremiumGlassClass + ' relative p-5'}>
        <div className="flex items-center justify-between gap-4">
          <p id="summary-heading" className={labelClass + ' text-[#61E4FF]'}>Session summary</p>
          <img src={mascots.headAvatar} alt="" aria-hidden="true"
            className="h-14 w-14 object-contain opacity-80" />
        </div>
        <div className="mt-1 text-[clamp(56px,18vw,80px)] font-black leading-none tracking-tight text-white">
          {score} / {totalQuestions}
        </div>
        <p className="mt-3 text-lg font-bold text-[#C8E9FF]">
          {accuracy}% accuracy {accuracy >= 80 ? '· Well played!' : '· Keep going!'}
        </p>
        <p className="mt-2 text-sm leading-relaxed text-[#B5CBE8]">{guidance}</p>
      </section>

      <div className="grid grid-cols-2 gap-3">
        <section className="sm-stat-card">
          <Trophy aria-hidden="true" className="h-5 w-5 text-[#FFC768]" />
          <p className="mt-2 text-[30px] font-black text-white">{score}</p>
          <p className={labelClass + ' mt-1 text-[#B5CBE8]'}>Correct answers</p>
        </section>
        <section className="sm-stat-card">
          <BarChart3 aria-hidden="true" className="h-5 w-5 text-[#61E4FF]" />
          <p className="mt-2 text-[30px] font-black text-white">{totalQuestions}</p>
          <p className={labelClass + ' mt-1 text-[#B5CBE8]'}>Attempts</p>
        </section>
      </div>

      {unlockedBadges.length > 0 && (
        <section id="unlocked_badges_toast_tray" aria-label="New achievements"
          className={PremiumGlassClass + ' p-4'}>
          <h2 className={labelClass + ' flex items-center gap-2 text-[#FFC768]'}>
            <Star aria-hidden="true" className="h-4 w-4" />
            New achievements
          </h2>
          <div className="mt-3 flex flex-wrap gap-2">
            {unlockedBadges.map(badge => (
              <div key={badge.id} className="flex items-center gap-2 rounded-xl border border-[#B98F51] bg-[#352A1C] px-3 py-2 text-xs font-bold text-[#FFE1A8]">
                <img src={badgeArtByAchievementId[badge.id] ?? badgeAssets.firstSolve}
                  className="h-6 w-6 object-contain" alt="" aria-hidden="true" />
                {badge.title}
              </div>
            ))}
          </div>
        </section>
      )}

      <section aria-labelledby="speed-summary" className={PremiumGlassClass + ' p-4'}>
        <h2 id="speed-summary" className={labelClass + ' mb-3 flex items-center gap-2 text-[#61E4FF]'}>
          <Clock3 aria-hidden="true" className="h-4 w-4" /> Answer speed
        </h2>
        <div className="grid grid-cols-3 gap-2">
          {[
            { label: 'Under 3s', value: under3s },
            { label: '3–5s', value: under5s },
            { label: 'Over 5s', value: over5s },
          ].map(({ label, value }) => (
            <div key={label} className="rounded-[14px] border border-[#2B5E87] bg-[#0A1B39] px-2 py-3 text-center">
              <p className="text-[22px] font-black text-[#E8F9FF]">{value}</p>
              <p className="mt-1 text-[11px] text-[#B5CBE8]">{label}</p>
            </div>
          ))}
        </div>
      </section>

      <PremiumCTA id="btn_play_again" onClick={onPlayAgain} icon={RotateCw}>Practice again</PremiumCTA>
      <button id="btn_menu_after_game" type="button" onClick={onMenu}
        className="sm-touch-target flex min-h-[48px] items-center justify-center gap-2 rounded-[16px] border border-[#3A678E] bg-[#0B1B3A] px-4 text-sm font-bold text-[#C6E3F7]">
        Adjust my session <ArrowRight aria-hidden="true" className="h-4 w-4" />
      </button>
    </PremiumScreen>
  );
};

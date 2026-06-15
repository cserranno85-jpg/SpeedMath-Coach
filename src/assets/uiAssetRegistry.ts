import robotHeadAvatar from './ui/robot-head-avatar.png';
import robotPointingCoach from './ui/robot-pointing-coach.png';
import robotWavingCoach from './ui/robot-waving-coach.png';

import bgCosmicExercise from './ui/bg-cosmic-exercise.png';
import bgCosmicHome from './ui/bg-cosmic-home.png';
import bgCosmicProfile from './ui/bg-cosmic-profile.png';

import fxCyanOrbGlow from './ui/fx-cyan-orb-glow.png';
import fxGoldSparkBurst from './ui/fx-gold-spark-burst.png';
import fxMathParticles from './ui/fx-math-particles.png';
import fxPurpleEnergyRing from './ui/fx-purple-energy-ring.png';

import iconAddition from './ui/icon-addition.png';
import iconSubtraction from './ui/icon-subtraction.png';
import iconMultiplication from './ui/icon-multiplication.png';
import iconDivision from './ui/icon-division.png';
import iconDailyChallenge from './ui/icon-daily-challenge.png';
import iconTimedChallenge from './ui/icon-timed-challenge.png';
import iconUntimedPractice from './ui/icon-untimed-practice.png';

import speedmathIconForeground from './ui/speedmath-icon-foreground.png';
import speedmathIconSafeArea from './ui/speedmath-icon-safe-area-1024.png';

import badgeAccuracy90 from './ui/badge-accuracy-90.png';
import badgeFirstSolve from './ui/badge-first-solve.png';
import badgeFocusMaster from './ui/badge-focus-master.png';
import badgeLightningMaster from './ui/badge-lightning-master.png';
import badgeLocked from './ui/badge-locked.png';
import badgePerfectRound from './ui/badge-perfect-round.png';
import badgeSpeedBurst from './ui/badge-speed-burst.png';
import badgeStreak3 from './ui/badge-streak-3.png';
import badgeUnlockBurst from './ui/badge-unlock-burst.png';

import buttonPrimaryGlow from './ui/button-primary-glow.png';

import panelCosmicCard from './ui/panel-cosmic-card.png';
import panelExerciseCard from './ui/panel-exercise-card.png';
import panelModalGlow from './ui/panel-modal-glow.png';
import panelNavbarGlow from './ui/panel-navbar-glow.png';
import panelStatsCard from './ui/panel-stats-card.png';


export const mascots = {
  headAvatar: robotHeadAvatar,
  pointing: robotPointingCoach,
  waving: robotWavingCoach,
} as const;

export const backgrounds = {
  home: bgCosmicHome,
  exercise: bgCosmicExercise,
  profile: bgCosmicProfile,
} as const;

export const fx = {
  cyanOrbGlow: fxCyanOrbGlow,
  goldSparkBurst: fxGoldSparkBurst,
  mathParticles: fxMathParticles,
  purpleEnergyRing: fxPurpleEnergyRing,
} as const;

export const operationIcons = {
  ADDITION: iconAddition,
  SUBTRACTION: iconSubtraction,
  MULTIPLICATION: iconMultiplication,
  DIVISION: iconDivision,
} as const;

export const challengeIcons = {
  daily: iconDailyChallenge,
  timed: iconTimedChallenge,
  untimed: iconUntimedPractice,
} as const;

export const brandMarks = {
  primaryLogo: speedmathIconSafeArea,
  appIcon: speedmathIconSafeArea,
  emblem: speedmathIconSafeArea,
  foreground: speedmathIconForeground,
} as const;

export const badges = {
  accuracy90: badgeAccuracy90,
  firstSolve: badgeFirstSolve,
  focusMaster: badgeFocusMaster,
  lightningMaster: badgeLightningMaster,
  locked: badgeLocked,
  perfectRound: badgePerfectRound,
  speedBurst: badgeSpeedBurst,
  streak3: badgeStreak3,
  unlockBurst: badgeUnlockBurst,
} as const;

export const buttonGlows = {
  primary: buttonPrimaryGlow,
} as const;

export const panels = {
  cosmicCard: panelCosmicCard,
  exerciseCard: panelExerciseCard,
  modalGlow: panelModalGlow,
  navbarGlow: panelNavbarGlow,
  statsCard: panelStatsCard,
} as const;

export const badgeArtByAchievementId: Record<string, string> = {
  math_wizard: badges.perfectRound,
  speed_demon: badges.speedBurst,
  grandmaster: badges.lightningMaster,
  practice_streak: badges.streak3,
  expert_climber: badges.focusMaster,
  addition_ace: badges.firstSolve,
  multiplication_master: badges.accuracy90,
  perfect_century: badges.lightningMaster,
} as const;

export const futureUiAssetFilenames = [
  'robot-full-body-coach.png',
  'badge-streak-7.png',
  'button-secondary-glow.png',
  'button-danger-glow.png',
  'button-disabled-glow.png',
  'button-small-pill-glow.png',
] as const;

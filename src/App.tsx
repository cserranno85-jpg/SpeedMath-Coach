import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Activity,
  ArrowLeft,
  Award,
  BarChart3,
  Brain,
  Calendar,
  Check,
  CheckCircle2,
  ChevronRight,
  Clock3,
  Flame,
  Gauge,
  Home,
  Lock,
  Medal,
  Pause,
  Play,
  RefreshCw,
  RotateCw,
  Settings as SettingsIcon,
  ShieldCheck,
  Sparkles,
  Star,
  Target,
  Timer,
  Trophy,
  User,
  Volume2,
  VolumeX,
  Wand2,
  Zap,
} from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import {
  Area,
  AreaChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { evaluateAchievementUnlocks, mergeAchievementUnlocks } from './game/achievementEngine';
import { getAdaptiveDecision } from './game/adaptiveEngine';
import { refreshChallenges, updateChallengesAfterSession } from './game/challengeEngine';
import { getCoachRecommendation } from './game/coachEngine';
import { generateProblem } from './game/problemGenerator';
import { applySessionToProgress, getStrongestMastery, getWeakestMastery } from './game/progressEngine';
import { getProgressToNextLevel, mergeSessionBadgesAndChallenges } from './game/scoringEngine';
import { endSession, startSession, submitAnswer } from './game/sessionEngine';
import {
  AchievementState,
  AnswerAttempt,
  ChallengeState,
  Difficulty,
  Operation,
  PracticeMode,
  SessionState,
  SessionSummary,
  SpeedMathSaveData,
  UserPreferences,
} from './game/types';
import { loadSaveData, resetSaveData, saveData } from './state/storage';
import { sounds } from './utils/soundEngine';
import pibotMascot from './assets/images/pibot-mascot.jpg';

type Route =
  | 'SPLASH'
  | 'ONBOARDING'
  | 'HOME'
  | 'PRACTICE'
  | 'TIMED'
  | 'UNTIMED'
  | 'RESULTS'
  | 'PROGRESS'
  | 'CHALLENGES'
  | 'ACHIEVEMENTS'
  | 'COACH'
  | 'PROFILE'
  | 'SETTINGS';

type FeedbackState = {
  problemId: string;
  selectedAnswer: number;
  correctAnswer: number;
  isCorrect: boolean;
} | null;

type LastResult = {
  summary: SessionSummary;
  attempts: AnswerAttempt[];
  beforeXp: number;
  afterXp: number;
  newlyUnlocked: AchievementState[];
  completedChallenges: ChallengeState[];
};

const operationLabels: Record<Operation, string> = {
  [Operation.ADDITION]: 'Addition',
  [Operation.SUBTRACTION]: 'Subtraction',
  [Operation.MULTIPLICATION]: 'Multiplication',
  [Operation.DIVISION]: 'Division',
  [Operation.MIXED]: 'Mixed',
};

const operationGlyphs: Record<Operation, string> = {
  [Operation.ADDITION]: '+',
  [Operation.SUBTRACTION]: '-',
  [Operation.MULTIPLICATION]: 'x',
  [Operation.DIVISION]: '/',
  [Operation.MIXED]: '*',
};

const difficultyOrder = [
  Difficulty.BEGINNER,
  Difficulty.EASY,
  Difficulty.MEDIUM,
  Difficulty.HARD,
  Difficulty.EXPERT,
] as const;

const screenTitles: Partial<Record<Route, string>> = {
  HOME: 'Home',
  PRACTICE: 'Practice',
  PROGRESS: 'Progress',
  CHALLENGES: 'Challenges',
  ACHIEVEMENTS: 'Badges',
  COACH: 'Coach',
  PROFILE: 'Profile',
  SETTINGS: 'Settings',
};

const routeUsesBottomNav = (route: Route): boolean => (
  ['HOME', 'PRACTICE', 'PROGRESS', 'CHALLENGES', 'ACHIEVEMENTS', 'COACH', 'PROFILE', 'SETTINGS'].includes(route)
);

const routeIsExercise = (route: Route): boolean => route === 'TIMED' || route === 'UNTIMED';

const formatTime = (seconds: number): string => {
  const safe = Math.max(0, Math.floor(seconds));
  const minutes = Math.floor(safe / 60);
  const remaining = safe % 60;
  return `${minutes}:${remaining.toString().padStart(2, '0')}`;
};

const average = (values: number[]): number => {
  const finite = values.filter(Number.isFinite);
  return finite.length === 0 ? 0 : finite.reduce((sum, value) => sum + value, 0) / finite.length;
};

const getActiveOperations = (preferences: UserPreferences): Operation[] => (
  preferences.defaultOperations.length > 0 ? preferences.defaultOperations : [Operation.ADDITION]
);

const chooseOperationForNextProblem = (session: SessionState, recommendedOperation?: Operation): Operation => {
  if (session.operationMix.includes(Operation.MIXED)) return Operation.MIXED;
  if (recommendedOperation && session.operationMix.includes(recommendedOperation)) return recommendedOperation;
  return session.operationMix[0] ?? Operation.ADDITION;
};

const loadInitialSave = (): SpeedMathSaveData => {
  const loaded = loadSaveData();
  const refreshed = {
    ...loaded,
    challenges: refreshChallenges(loaded.challenges, loaded),
  };
  return saveData(refreshed);
};

const clampPercent = (value: number): number => Math.max(0, Math.min(100, Math.round(value)));

const BrandMark: React.FC<{ size?: 'sm' | 'md' | 'lg'; label?: boolean }> = ({ size = 'md', label = false }) => {
  const sizeClass = size === 'lg' ? 'brand-mark-lg' : size === 'sm' ? 'brand-mark-sm' : 'brand-mark-md';

  return (
    <div className={`brand-lockup ${label ? '' : 'justify-center'}`} aria-label="SpeedMath Coach">
      <div className={`brand-mark ${sizeClass}`} aria-hidden="true">
        <Clock3 className="brand-clock" />
        <Zap className="brand-bolt" />
      </div>
      {label && (
        <div className="min-w-0">
          <div className="text-[11px] font-black uppercase tracking-normal text-cyan-200">SpeedMath</div>
          <div className="text-sm font-black leading-none text-white">Coach</div>
        </div>
      )}
    </div>
  );
};

const ProgressRing: React.FC<{
  percent: number;
  label: string;
  value: string | number;
  tone?: 'blue' | 'gold' | 'green' | 'violet';
  className?: string;
}> = ({ percent, label, value, tone = 'blue', className = '' }) => {
  const safePercent = clampPercent(percent);
  return (
    <div
      className={`progress-ring progress-ring-${tone} ${className}`}
      style={{ '--ring-percent': `${safePercent}%` } as React.CSSProperties}
      role="img"
      aria-label={`${label}: ${safePercent}%`}
    >
      <div className="progress-ring-core">
        <span>{value}</span>
        <small>{label}</small>
      </div>
    </div>
  );
};

const GlassCard: React.FC<{
  children: React.ReactNode;
  className?: string;
  tone?: 'blue' | 'gold' | 'violet' | 'green' | 'neutral';
}> = ({ children, className = '', tone = 'neutral' }) => (
  <div className={`glass-card glass-card-${tone} ${className}`}>{children}</div>
);

const PremiumButton: React.FC<React.ButtonHTMLAttributes<HTMLButtonElement> & {
  tone?: 'primary' | 'secondary' | 'challenge' | 'success' | 'danger' | 'ghost';
}> = ({ tone = 'secondary', className = '', children, ...props }) => (
  <button {...props} className={`premium-action premium-action-${tone} ${className}`}>
    {children}
  </button>
);

const StatTile: React.FC<{
  label: string;
  value: string | number;
  icon: React.ElementType;
  tone: string;
}> = ({ label, value, icon: Icon, tone }) => (
  <div className={`stat-tile ${tone}`}>
    <Icon className="h-5 w-5" aria-hidden="true" />
    <div>
      <div className="text-[10px] font-black uppercase text-white/70">{label}</div>
      <div className="font-mono text-2xl font-black leading-none text-white">{value}</div>
    </div>
  </div>
);

const BottomNav: React.FC<{ route: Route; setRoute: (route: Route) => void }> = ({ route, setRoute }) => {
  const items: Array<{ route: Route; label: string; icon: React.ElementType }> = [
    { route: 'HOME', label: 'Home', icon: Home },
    { route: 'PRACTICE', label: 'Practice', icon: Zap },
    { route: 'PROGRESS', label: 'Progress', icon: BarChart3 },
    { route: 'CHALLENGES', label: 'Challenges', icon: Trophy },
    { route: 'PROFILE', label: 'Profile', icon: User },
  ];

  return (
    <nav className="bottom-nav" aria-label="Main navigation">
      {items.map((item) => {
        const Icon = item.icon;
        const active = item.route === route || (item.route === 'PROGRESS' && route === 'ACHIEVEMENTS');
        return (
          <button
            key={item.route}
            type="button"
            className={`bottom-nav-item ${active ? 'is-active' : ''}`}
            onClick={() => {
              sounds.play('uiTap');
              setRoute(item.route);
            }}
            aria-current={active ? 'page' : undefined}
          >
            <Icon className="h-5 w-5" aria-hidden="true" />
            <span>{item.label}</span>
          </button>
        );
      })}
    </nav>
  );
};

const Shell: React.FC<{
  route: Route;
  save: SpeedMathSaveData;
  setRoute: (route: Route) => void;
  children: React.ReactNode;
}> = ({ route, save, setRoute, children }) => {
  if (route === 'SPLASH' || route === 'ONBOARDING' || routeIsExercise(route)) {
    return <>{children}</>;
  }

  return (
    <div className="app-page">
      <header className="app-header">
        <BrandMark size="sm" label />
        <div className="ml-auto flex items-center gap-2">
          <button
            type="button"
            className="icon-button"
            onClick={() => {
              sounds.play('uiTap');
              setRoute('COACH');
            }}
            aria-label="Open Coach"
          >
            <Wand2 className="h-5 w-5" />
          </button>
          <button
            type="button"
            className="level-pill"
            onClick={() => {
              sounds.play('uiTap');
              setRoute('PROFILE');
            }}
            aria-label={`Profile, level ${save.level}`}
          >
            <Zap className="h-4 w-4" />
            L{save.level}
          </button>
        </div>
      </header>
      <main className="app-content" aria-labelledby="screen-title">
        <h1 id="screen-title" className="sr-only">{screenTitles[route] ?? 'SpeedMath Coach'}</h1>
        <AnimatePresence mode="wait">
          <motion.div
            key={route}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: save.preferences.reducedMotion ? 0.01 : 0.22 }}
            className="w-full"
          >
            {children}
          </motion.div>
        </AnimatePresence>
      </main>
      {routeUsesBottomNav(route) && <BottomNav route={route} setRoute={setRoute} />}
    </div>
  );
};

const SplashScreen: React.FC = () => (
  <div className="splash-screen">
    <motion.div
      initial={{ scale: 0.92, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ duration: 0.42 }}
      className="flex flex-col items-center"
    >
      <BrandMark size="lg" />
      <h1 className="mt-6 text-center text-4xl font-black text-white">SpeedMath Coach</h1>
      <div className="mt-2 text-xs font-black uppercase text-cyan-100/80">Lightning-fast mental math</div>
      <div className="loading-line mt-8" aria-label="Loading" />
    </motion.div>
  </div>
);

const OnboardingScreen: React.FC<{ onDone: () => void }> = ({ onDone }) => {
  const [index, setIndex] = useState(0);
  const slides = [
    {
      title: 'Train Your Brain Every Day.',
      icon: Brain,
      tone: 'from-cyan-300 via-blue-400 to-violet-400',
    },
    {
      title: 'Smart. Adaptive. Personalized for You.',
      icon: Wand2,
      tone: 'from-violet-300 via-fuchsia-400 to-amber-300',
    },
    {
      title: 'Track Progress. See Results.',
      icon: BarChart3,
      tone: 'from-emerald-300 via-cyan-300 to-yellow-300',
    },
  ] as const;
  const slide = slides[index];
  const Icon = slide.icon;

  const advance = () => {
    sounds.play('primaryTap');
    if (index >= slides.length - 1) {
      onDone();
      return;
    }
    setIndex((value) => value + 1);
  };

  return (
    <div className="onboarding-screen">
      <BrandMark size="sm" label />
      <div className="onboarding-visual" aria-hidden="true">
        <div className={`onboarding-orbit bg-gradient-to-br ${slide.tone}`}>
          {index === 1 ? (
            <img src={pibotMascot} alt="" className="h-36 w-36 rounded-[2rem] object-cover shadow-[0_0_42px_rgba(34,211,238,0.35)]" />
          ) : (
            <Icon className="h-28 w-28 text-slate-950" />
          )}
        </div>
        <div className="orbit-ring orbit-ring-one" />
        <div className="orbit-ring orbit-ring-two" />
      </div>
      <div className="text-center">
        <h2 className="text-balance text-3xl font-black leading-tight text-white">{slide.title}</h2>
        <div className="mt-5 flex justify-center gap-2" aria-label={`Slide ${index + 1} of ${slides.length}`}>
          {slides.map((item, slideIndex) => (
            <span key={item.title} className={`h-2 rounded-full transition-all ${slideIndex === index ? 'w-8 bg-yellow-300' : 'w-2 bg-white/25'}`} />
          ))}
        </div>
      </div>
      <PremiumButton tone="primary" onClick={advance} className="w-full max-w-sm">
        {index === slides.length - 1 ? 'Start' : 'Continue'} <ChevronRight className="h-5 w-5" />
      </PremiumButton>
    </div>
  );
};

const HomeScreen: React.FC<{
  save: SpeedMathSaveData;
  onStart: (mode: PracticeMode) => void;
  setRoute: (route: Route) => void;
}> = ({ save, onStart, setRoute }) => {
  const levelProgress = getProgressToNextLevel(save.totalXp);
  const sessions = save.sessionHistory;
  const totalProblems = sessions.reduce((sum, session) => sum + session.totalProblems, 0);
  const totalCorrect = sessions.reduce((sum, session) => sum + session.correctCount, 0);
  const accuracy = totalProblems > 0 ? Math.round((totalCorrect / totalProblems) * 100) : 0;
  const coach = getCoachRecommendation(save);
  const dailyChallenge = save.challenges.find((challenge) => challenge.type === 'daily_spark') ?? save.challenges[0];

  return (
    <div className="screen-stack">
      <section className="home-hero">
        <div className="min-w-0">
          <div className="text-xs font-black uppercase text-cyan-200">Ready for a spark?</div>
          <h2 className="mt-1 text-3xl font-black leading-tight text-white">Level {save.level}</h2>
          <p className="mt-2 text-sm text-blue-100">{coach.shortMotivation}</p>
        </div>
        <ProgressRing percent={levelProgress.percent} label="XP" value={`${levelProgress.xpIntoLevel}/${levelProgress.xpNeeded}`} tone="gold" />
      </section>

      <div className="grid grid-cols-3 gap-2">
        <StatTile label="Streak" value={save.currentStreak} icon={Flame} tone="stat-orange" />
        <StatTile label="Accuracy" value={`${accuracy}%`} icon={Target} tone="stat-green" />
        <StatTile label="Solved" value={totalCorrect} icon={Zap} tone="stat-blue" />
      </div>

      {dailyChallenge && (
        <GlassCard tone="violet" className="p-4">
          <div className="flex items-center gap-3">
            <div className="badge-spark"><Trophy className="h-6 w-6" /></div>
            <div className="min-w-0 flex-1">
              <div className="text-xs font-black uppercase text-fuchsia-100">Daily Goal</div>
              <div className="font-black text-white">{dailyChallenge.title}</div>
              <ProgressBar value={dailyChallenge.progress} max={dailyChallenge.target} tone="violet" />
            </div>
            <span className="font-mono text-sm font-black text-yellow-200">+{dailyChallenge.rewardXp}</span>
          </div>
        </GlassCard>
      )}

      <div className="grid gap-3 sm:grid-cols-2">
        <PremiumButton tone="primary" onClick={() => onStart(PracticeMode.TIMED)} className="h-16 text-base">
          <Play className="h-6 w-6 fill-current" /> Start Practice
        </PremiumButton>
        <PremiumButton tone="challenge" onClick={() => setRoute('CHALLENGES')} className="h-16 text-base">
          <Trophy className="h-6 w-6" /> Challenges
        </PremiumButton>
      </div>

      <GlassCard tone="blue" className="p-4">
        <div className="flex items-center gap-3">
          <img src={pibotMascot} alt="Coach bot" className="h-16 w-16 rounded-2xl object-cover" />
          <div className="min-w-0 flex-1">
            <div className="text-xs font-black uppercase text-cyan-200">Coach Pick</div>
            <div className="font-black text-white">{operationLabels[coach.recommendedOperation]} {coach.recommendedMode}</div>
            <p className="mt-1 line-clamp-2 text-xs text-blue-100">{coach.reason}</p>
          </div>
          <button type="button" className="icon-button" onClick={() => setRoute('COACH')} aria-label="Open coach">
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>
      </GlassCard>
    </div>
  );
};

const ProgressBar: React.FC<{ value: number; max: number; tone?: 'gold' | 'blue' | 'green' | 'violet' }> = ({ value, max, tone = 'blue' }) => {
  const percent = max > 0 ? clampPercent((value / max) * 100) : 0;
  return (
    <div className="mt-2 flex items-center gap-2">
      <div className="progress-track">
        <div className={`progress-fill progress-fill-${tone}`} style={{ width: `${percent}%` }} />
      </div>
      <span className="shrink-0 font-mono text-[11px] font-black text-blue-100">{Math.min(value, max)}/{max}</span>
    </div>
  );
};

const PracticeScreen: React.FC<{
  save: SpeedMathSaveData;
  updatePreferences: (preferences: UserPreferences) => void;
  onStart: (mode: PracticeMode, operation?: Operation, difficulty?: Difficulty) => void;
}> = ({ save, updatePreferences, onStart }) => {
  const preferences = save.preferences;
  const activeOperations = getActiveOperations(preferences);

  const setOperation = (operation: Operation) => {
    updatePreferences({ ...preferences, defaultOperations: [operation] });
  };

  const setDifficulty = (difficulty: Difficulty) => {
    updatePreferences({ ...preferences, defaultDifficulty: difficulty });
  };

  const cards = [
    {
      title: 'Quick Drill',
      subtitle: `${preferences.gameDurationSeconds}s timed`,
      icon: Timer,
      mode: PracticeMode.TIMED,
      tone: 'mode-blue',
    },
    {
      title: 'Focus Mode',
      subtitle: 'Untimed reps',
      icon: Brain,
      mode: PracticeMode.UNTIMED,
      tone: 'mode-green',
    },
    {
      title: 'Challenge',
      subtitle: 'Objectives',
      icon: Trophy,
      mode: PracticeMode.CHALLENGE,
      tone: 'mode-violet',
    },
    {
      title: 'Custom',
      subtitle: `${operationLabels[activeOperations[0]]} · ${preferences.defaultDifficulty}`,
      icon: Gauge,
      mode: PracticeMode.CUSTOM,
      tone: 'mode-gold',
    },
  ] as const;

  return (
    <div className="screen-stack">
      <div>
        <div className="section-kicker">Practice Modes</div>
        <h2 className="screen-heading">Choose your run</h2>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        {cards.map((card) => {
          const Icon = card.icon;
          return (
            <button
              key={card.title}
              type="button"
              className={`mode-card ${card.tone}`}
              onClick={() => {
                sounds.play('startRound');
                onStart(card.mode);
              }}
            >
              <Icon className="h-8 w-8" />
              <span className="text-lg font-black">{card.title}</span>
              <small>{card.subtitle}</small>
            </button>
          );
        })}
      </div>

      <GlassCard className="p-4">
        <div className="section-kicker">Custom Setup</div>
        <div className="mt-3 grid grid-cols-5 gap-2">
          {Object.values(Operation).map((operation) => (
            <button
              key={operation}
              type="button"
              className={`choice-chip ${activeOperations.includes(operation) ? 'is-active' : ''}`}
              onClick={() => setOperation(operation)}
              aria-pressed={activeOperations.includes(operation)}
            >
              <span>{operationGlyphs[operation]}</span>
              <small>{operationLabels[operation]}</small>
            </button>
          ))}
        </div>
        <div className="mt-4 grid grid-cols-5 gap-2">
          {difficultyOrder.map((difficulty) => (
            <button
              key={difficulty}
              type="button"
              className={`difficulty-chip ${preferences.defaultDifficulty === difficulty ? 'is-active' : ''}`}
              onClick={() => setDifficulty(difficulty)}
            >
              {difficulty.slice(0, 1).toUpperCase()}
            </button>
          ))}
        </div>
      </GlassCard>
    </div>
  );
};

const ExerciseTopBar: React.FC<{
  title: string;
  subtitle: string;
  onBack: () => void;
  onFinish: () => void;
}> = ({ title, subtitle, onBack, onFinish }) => (
  <header className="exercise-topbar">
    <button type="button" className="icon-button" onClick={onBack} aria-label="Back">
      <ArrowLeft className="h-5 w-5" />
    </button>
    <BrandMark size="sm" />
    <div className="min-w-0 flex-1">
      <div className="truncate text-sm font-black text-white">{title}</div>
      <div className="truncate text-[11px] font-bold text-cyan-100/80">{subtitle}</div>
    </div>
    <button type="button" className="icon-button" onClick={onFinish} aria-label="Finish session">
      <Pause className="h-5 w-5" />
    </button>
  </header>
);

const TimedPracticeScreen: React.FC<{
  session: SessionState;
  feedback: FeedbackState;
  timeLeft: number;
  duration: number;
  onAnswer: (answer: number) => void;
  onBack: () => void;
  onFinish: () => void;
}> = ({ session, feedback, timeLeft, duration, onAnswer, onBack, onFinish }) => {
  const attempts = session.attempts;
  const correct = attempts.filter((attempt) => attempt.isCorrect).length;
  const accuracy = attempts.length > 0 ? Math.round((correct / attempts.length) * 100) : 100;
  const timerPercent = duration > 0 ? (timeLeft / duration) * 100 : 0;
  const activeFeedback = feedback?.problemId === session.currentProblem.id ? feedback : null;

  return (
    <div className="exercise-screen timed-screen">
      <ExerciseTopBar
        title="Quick Drill"
        subtitle={`${operationLabels[session.currentProblem.operation]} · ${session.currentDifficulty}`}
        onBack={onBack}
        onFinish={onFinish}
      />
      <section className="exercise-main timed-main">
        <div className="timer-zone">
          <ProgressRing percent={timerPercent} label="Time" value={formatTime(timeLeft)} tone={timeLeft <= 10 ? 'gold' : 'blue'} />
        </div>
        <ProblemPanel session={session} feedback={activeFeedback} />
        <div className="answers-grid" aria-label="Answer choices">
          {session.currentProblem.choices.map((choice) => {
            const stateClass = !activeFeedback
              ? ''
              : choice === activeFeedback.correctAnswer
                ? 'is-correct'
                : choice === activeFeedback.selectedAnswer
                  ? 'is-wrong'
                  : 'is-muted';
            return (
              <button
                key={choice}
                type="button"
                disabled={Boolean(activeFeedback)}
                className={`answer-choice ${stateClass}`}
                onClick={() => onAnswer(choice)}
              >
                {choice}
              </button>
            );
          })}
        </div>
      </section>
      <footer className="exercise-footer">
        <span><Flame className="h-4 w-4 text-orange-300" /> {session.currentStreak}</span>
        <span><Target className="h-4 w-4 text-emerald-300" /> {accuracy}%</span>
        <span><Zap className="h-4 w-4 text-cyan-300" /> {correct}</span>
      </footer>
    </div>
  );
};

const UntimedPracticeScreen: React.FC<{
  session: SessionState;
  feedback: FeedbackState;
  onAnswer: (answer: number) => void;
  onBack: () => void;
  onFinish: () => void;
}> = ({ session, feedback, onAnswer, onBack, onFinish }) => {
  const attempts = session.attempts;
  const correct = attempts.filter((attempt) => attempt.isCorrect).length;
  const activeFeedback = feedback?.problemId === session.currentProblem.id ? feedback : null;

  return (
    <div className="exercise-screen untimed-screen">
      <ExerciseTopBar
        title="Focus Mode"
        subtitle={`${correct} correct · no timer`}
        onBack={onBack}
        onFinish={onFinish}
      />
      <section className="exercise-main untimed-main">
        <div className="focus-progress">
          <ProgressRing percent={(Math.min(correct, 12) / 12) * 100} label="Focus" value={`${Math.min(correct, 12)}/12`} tone="green" />
          <div>
            <div className="section-kicker">Calm reps</div>
            <div className="text-sm font-bold text-blue-50">Build clean accuracy before speed.</div>
          </div>
        </div>
        <ProblemPanel session={session} feedback={activeFeedback} />
        <div className="answers-grid untimed-answers" aria-label="Answer choices">
          {session.currentProblem.choices.map((choice) => {
            const stateClass = !activeFeedback
              ? ''
              : choice === activeFeedback.correctAnswer
                ? 'is-correct'
                : choice === activeFeedback.selectedAnswer
                  ? 'is-wrong'
                  : 'is-muted';
            return (
              <button
                key={choice}
                type="button"
                disabled={Boolean(activeFeedback)}
                className={`answer-choice ${stateClass}`}
                onClick={() => onAnswer(choice)}
              >
                {choice}
              </button>
            );
          })}
        </div>
      </section>
      <footer className="exercise-footer">
        <span><CheckCircle2 className="h-4 w-4 text-emerald-300" /> {correct}</span>
        <span><Activity className="h-4 w-4 text-cyan-300" /> {attempts.length} reps</span>
        <button type="button" className="footer-finish" onClick={onFinish}>Finish</button>
      </footer>
    </div>
  );
};

const ProblemPanel: React.FC<{ session: SessionState; feedback: FeedbackState }> = ({ session, feedback }) => (
  <div className={`problem-panel ${feedback?.isCorrect ? 'is-correct' : feedback ? 'is-wrong' : ''}`}>
    <div className="problem-kicker">
      <span>{operationLabels[session.currentProblem.operation]}</span>
      <span>{session.currentDifficulty}</span>
    </div>
    <div className="problem-prompt">{session.currentProblem.prompt}</div>
    <div className="problem-equals">= ?</div>
  </div>
);

const ResultsScreen: React.FC<{
  result: LastResult;
  save: SpeedMathSaveData;
  onPlayAgain: () => void;
  onContinue: () => void;
}> = ({ result, save, onPlayAgain, onContinue }) => {
  const { summary, newlyUnlocked, completedChallenges } = result;
  const levelProgress = getProgressToNextLevel(save.totalXp);
  const stars = summary.accuracy >= 95 ? 3 : summary.accuracy >= 80 ? 2 : summary.accuracy >= 55 ? 1 : 0;

  useEffect(() => {
    sounds.play(newlyUnlocked.length > 0 || completedChallenges.length > 0 ? 'achievement' : 'endRound');
  }, [completedChallenges.length, newlyUnlocked.length]);

  return (
    <div className="app-page">
      <main className="app-content pb-5">
        <div className="screen-stack">
          <section className="results-hero">
            <ProgressRing percent={summary.accuracy} label="Score" value={summary.score} tone="gold" className="results-ring" />
            <div className="min-w-0">
              <div className="section-kicker">Session Complete</div>
              <h2 className="screen-heading">+{summary.xpEarned} XP</h2>
              <div className="mt-2 flex gap-1" aria-label={`${stars} star rating`}>
                {[0, 1, 2].map((star) => (
                  <Star key={star} className={`h-6 w-6 ${star < stars ? 'fill-yellow-300 text-yellow-300' : 'text-white/20'}`} />
                ))}
              </div>
            </div>
          </section>

          <div className="grid grid-cols-2 gap-3">
            <StatTile label="Accuracy" value={`${summary.accuracy}%`} icon={Target} tone="stat-green" />
            <StatTile label="Correct" value={`${summary.correctCount}/${summary.totalProblems}`} icon={Check} tone="stat-blue" />
            <StatTile label="Best Streak" value={summary.bestStreak} icon={Flame} tone="stat-orange" />
            <StatTile label="Avg Time" value={`${(summary.averageResponseTimeMs / 1000).toFixed(1)}s`} icon={Timer} tone="stat-violet" />
          </div>

          <GlassCard tone="blue" className="p-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <div className="section-kicker">Level {levelProgress.level}</div>
                <div className="text-sm font-bold text-blue-50">{levelProgress.xpIntoLevel}/{levelProgress.xpNeeded} XP to next</div>
              </div>
              <ProgressRing percent={levelProgress.percent} label="Next" value={`${levelProgress.percent}%`} tone="blue" className="mini-ring" />
            </div>
          </GlassCard>

          {(newlyUnlocked.length > 0 || completedChallenges.length > 0) && (
            <GlassCard tone="gold" className="badge-reveal p-4">
              <div className="section-kicker text-yellow-100">New Rewards</div>
              <div className="mt-3 grid gap-2">
                {newlyUnlocked.map((achievement) => (
                  <div key={achievement.id} className="reward-row">
                    <Award className="h-5 w-5 text-yellow-300" />
                    <span>{achievement.title}</span>
                  </div>
                ))}
                {completedChallenges.map((challenge) => (
                  <div key={challenge.id} className="reward-row">
                    <Trophy className="h-5 w-5 text-fuchsia-200" />
                    <span>{challenge.title} +{challenge.rewardXp} XP</span>
                  </div>
                ))}
              </div>
            </GlassCard>
          )}

          <div className="grid gap-3 sm:grid-cols-2">
            <PremiumButton tone="primary" onClick={onPlayAgain}>
              <RotateCw className="h-5 w-5" /> Play Again
            </PremiumButton>
            <PremiumButton tone="secondary" onClick={onContinue}>
              Continue <ChevronRight className="h-5 w-5" />
            </PremiumButton>
          </div>
        </div>
      </main>
    </div>
  );
};

const ProgressScreen: React.FC<{ save: SpeedMathSaveData; setRoute: (route: Route) => void }> = ({ save, setRoute }) => {
  const sessions = save.sessionHistory;
  const levelProgress = getProgressToNextLevel(save.totalXp);
  const strongest = getStrongestMastery(save.topicMastery);
  const weakest = getWeakestMastery(save.topicMastery);
  const chartData = sessions.slice(-7).map((session, index) => ({
    name: `S${Math.max(1, sessions.length - 6 + index)}`,
    score: session.score,
    accuracy: session.accuracy,
    xp: session.xpEarned,
  }));
  const trend = sessions.length >= 2 ? sessions.at(-1)!.accuracy - sessions.at(-2)!.accuracy : 0;

  return (
    <div className="screen-stack">
      <div className="flex items-end justify-between gap-3">
        <div>
          <div className="section-kicker">Progress</div>
          <h2 className="screen-heading">Your math signal</h2>
        </div>
        <PremiumButton tone="ghost" onClick={() => setRoute('ACHIEVEMENTS')} className="!min-h-10 !px-3 text-xs">
          Badges
        </PremiumButton>
      </div>

      <GlassCard className="p-4">
        <div className="h-56">
          {chartData.length === 0 ? (
            <EmptyState icon={BarChart3} title="No sessions yet" text="Complete a drill to light up the chart." />
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 8, right: 10, left: -18, bottom: 0 }}>
                <defs>
                  <linearGradient id="scoreGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#22d3ee" stopOpacity={0.75} />
                    <stop offset="95%" stopColor="#22d3ee" stopOpacity={0.05} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="rgba(255,255,255,0.1)" vertical={false} />
                <XAxis dataKey="name" tick={{ fill: '#bfdbfe', fontSize: 10 }} />
                <YAxis tick={{ fill: '#bfdbfe', fontSize: 10 }} />
                <Tooltip contentStyle={{ background: '#06122c', border: '1px solid rgba(125,211,252,.35)', borderRadius: 14, color: '#fff' }} />
                <Area type="monotone" dataKey="score" stroke="#22d3ee" fill="url(#scoreGradient)" strokeWidth={3} />
                <Line type="monotone" dataKey="accuracy" stroke="#facc15" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>
      </GlassCard>

      <div className="grid grid-cols-2 gap-3">
        <StatTile label="Level XP" value={`${levelProgress.percent}%`} icon={Zap} tone="stat-blue" />
        <StatTile label="Trend" value={`${trend >= 0 ? '+' : ''}${trend}%`} icon={Activity} tone={trend >= 0 ? 'stat-green' : 'stat-orange'} />
      </div>

      <GlassCard className="p-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <TopicSummary title="Strongest" topic={strongest.operation} mastery={strongest.masteryScore} tone="green" />
          <TopicSummary title="Next Focus" topic={weakest.operation} mastery={weakest.masteryScore} tone="gold" />
        </div>
      </GlassCard>

      <div className="grid gap-3">
        {save.topicMastery.filter((topic) => topic.operation !== Operation.MIXED).map((topic) => (
          <GlassCard key={topic.operation} className="p-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <div className="font-black text-white">{operationLabels[topic.operation]}</div>
                <div className="text-xs text-blue-100">{topic.correct}/{topic.attempts} correct</div>
              </div>
              <span className="font-mono text-lg font-black text-cyan-200">{topic.masteryScore}</span>
            </div>
            <ProgressBar value={topic.masteryScore} max={100} tone={topic.masteryScore >= 70 ? 'green' : 'blue'} />
          </GlassCard>
        ))}
      </div>
    </div>
  );
};

const TopicSummary: React.FC<{ title: string; topic: Operation; mastery: number; tone: 'green' | 'gold' }> = ({ title, topic, mastery, tone }) => (
  <div className="topic-summary">
    <ProgressRing percent={mastery} label={title} value={operationGlyphs[topic]} tone={tone} className="mini-ring" />
    <div>
      <div className="text-xs font-black uppercase text-blue-100">{title}</div>
      <div className="font-black text-white">{operationLabels[topic]}</div>
      <div className="text-xs text-blue-100">{mastery}% mastery</div>
    </div>
  </div>
);

const ChallengesScreen: React.FC<{ save: SpeedMathSaveData; onStart: (mode: PracticeMode, operation?: Operation) => void }> = ({ save, onStart }) => (
  <div className="screen-stack">
    <div>
      <div className="section-kicker">Challenges</div>
      <h2 className="screen-heading">Earn extra sparks</h2>
    </div>
    <div className="grid gap-3">
      {save.challenges.map((challenge) => (
        <ChallengeCard key={challenge.id} challenge={challenge} onStart={onStart} />
      ))}
    </div>
  </div>
);

const ChallengeCard: React.FC<{ challenge: ChallengeState; onStart: (mode: PracticeMode, operation?: Operation) => void }> = ({ challenge, onStart }) => {
  const completed = challenge.status === 'completed' || challenge.status === 'claimed';
  const Icon = challenge.type === 'speed_demon' ? Zap
    : challenge.type === 'perfect_run' ? ShieldCheck
      : challenge.type === 'weekly_climb' ? BarChart3
        : challenge.type === 'focus_builder' ? Brain
          : challenge.type === 'weak_spot_fix' ? Target
            : Sparkles;

  return (
    <GlassCard tone={completed ? 'gold' : 'violet'} className={`challenge-card ${completed ? 'is-complete' : ''}`}>
      <div className="flex items-center gap-3">
        <div className="challenge-icon"><Icon className="h-6 w-6" /></div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h3 className="font-black text-white">{challenge.title}</h3>
            {completed && <CheckCircle2 className="h-4 w-4 text-yellow-300" />}
          </div>
          <p className="text-xs text-blue-100">{challenge.description}</p>
          <ProgressBar value={challenge.progress} max={challenge.target} tone={completed ? 'gold' : 'violet'} />
        </div>
        <div className="text-right">
          <div className="font-mono text-sm font-black text-yellow-200">+{challenge.rewardXp}</div>
          <button
            type="button"
            className="mt-2 rounded-full bg-white/10 px-3 py-1 text-[10px] font-black uppercase text-white"
            onClick={() => onStart(challenge.type === 'focus_builder' ? PracticeMode.UNTIMED : PracticeMode.CHALLENGE, challenge.operation)}
          >
            Go
          </button>
        </div>
      </div>
    </GlassCard>
  );
};

const AchievementsScreen: React.FC<{ save: SpeedMathSaveData }> = ({ save }) => (
  <div className="screen-stack">
    <div>
      <div className="section-kicker">Achievements</div>
      <h2 className="screen-heading">{save.achievements.filter((item) => item.unlockedAt).length}/{save.achievements.length} unlocked</h2>
    </div>
    <div className="achievement-grid">
      {save.achievements.map((achievement) => {
        const unlocked = Boolean(achievement.unlockedAt);
        return (
          <div key={achievement.id} className={`achievement-card tier-${achievement.tier} ${unlocked ? 'is-unlocked' : 'is-locked'}`}>
            <div className="achievement-medal">
              {unlocked ? <Award className="h-7 w-7" /> : <Lock className="h-7 w-7" />}
            </div>
            <div className="mt-3 font-black text-white">{unlocked || !achievement.hiddenUntilUnlocked ? achievement.title : 'Hidden Badge'}</div>
            <p className="mt-1 text-xs text-blue-100">
              {unlocked || !achievement.hiddenUntilUnlocked ? achievement.description : 'Unlock this badge to reveal the challenge.'}
            </p>
          </div>
        );
      })}
    </div>
  </div>
);

const CoachScreen: React.FC<{ save: SpeedMathSaveData; onStart: (mode: PracticeMode, operation?: Operation) => void }> = ({ save, onStart }) => {
  const coach = getCoachRecommendation(save);
  return (
    <div className="screen-stack">
      <GlassCard tone="blue" className="coach-panel">
        <div className="coach-bot-wrap">
          <img src={pibotMascot} alt="SpeedMath Coach bot" className="coach-bot" />
          <div className="coach-pulse" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="section-kicker">Local Smart Coach</div>
          <h2 className="screen-heading">{coach.shortMotivation}</h2>
          <p className="mt-2 text-sm text-blue-100">{coach.reason}</p>
        </div>
      </GlassCard>
      <div className="grid gap-3">
        <CoachRow label="Mode" value={coach.recommendedMode} icon={Timer} />
        <CoachRow label="Topic" value={operationLabels[coach.recommendedOperation]} icon={Target} />
        <CoachRow label="Next Goal" value={coach.nextGoal} icon={Sparkles} />
      </div>
      <PremiumButton tone="primary" onClick={() => onStart(coach.recommendedMode, coach.recommendedOperation)}>
        Start Coach Pick <ChevronRight className="h-5 w-5" />
      </PremiumButton>
    </div>
  );
};

const CoachRow: React.FC<{ label: string; value: string; icon: React.ElementType }> = ({ label, value, icon: Icon }) => (
  <GlassCard className="p-4">
    <div className="flex items-center gap-3">
      <div className="small-glow-icon"><Icon className="h-5 w-5" /></div>
      <div>
        <div className="text-xs font-black uppercase text-cyan-200">{label}</div>
        <div className="font-black text-white">{value}</div>
      </div>
    </div>
  </GlassCard>
);

const ProfileScreen: React.FC<{ save: SpeedMathSaveData; setRoute: (route: Route) => void }> = ({ save, setRoute }) => {
  const totalProblems = save.sessionHistory.reduce((sum, session) => sum + session.totalProblems, 0);
  const totalCorrect = save.sessionHistory.reduce((sum, session) => sum + session.correctCount, 0);
  const accuracy = totalProblems > 0 ? Math.round((totalCorrect / totalProblems) * 100) : 0;
  const levelProgress = getProgressToNextLevel(save.totalXp);
  const topBadges = save.achievements.filter((achievement) => achievement.unlockedAt).slice(0, 3);

  return (
    <div className="screen-stack">
      <GlassCard tone="gold" className="profile-card">
        <div className="profile-avatar">SM</div>
        <div className="min-w-0 flex-1">
          <div className="section-kicker">Player Profile</div>
          <h2 className="screen-heading">Level {save.level}</h2>
          <ProgressBar value={levelProgress.xpIntoLevel} max={levelProgress.xpNeeded} tone="gold" />
        </div>
      </GlassCard>
      <div className="grid grid-cols-2 gap-3">
        <StatTile label="Solved" value={totalCorrect} icon={Zap} tone="stat-blue" />
        <StatTile label="Accuracy" value={`${accuracy}%`} icon={Target} tone="stat-green" />
        <StatTile label="Streak" value={save.currentStreak} icon={Flame} tone="stat-orange" />
        <StatTile label="Best" value={save.bestStreak} icon={Medal} tone="stat-violet" />
      </div>
      <GlassCard className="p-4">
        <div className="mb-3 flex items-center justify-between">
          <div className="section-kicker">Top Badges</div>
          <button type="button" className="text-xs font-black text-cyan-200" onClick={() => setRoute('ACHIEVEMENTS')}>View all</button>
        </div>
        <div className="grid grid-cols-3 gap-2">
          {(topBadges.length > 0 ? topBadges : save.achievements.slice(0, 3)).map((achievement) => (
            <div key={achievement.id} className={`mini-badge ${achievement.unlockedAt ? 'is-on' : ''}`}>
              {achievement.unlockedAt ? <Award className="h-5 w-5" /> : <Lock className="h-5 w-5" />}
              <span>{achievement.unlockedAt ? achievement.title : 'Locked'}</span>
            </div>
          ))}
        </div>
      </GlassCard>
      <PremiumButton tone="secondary" onClick={() => setRoute('SETTINGS')}>
        <SettingsIcon className="h-5 w-5" /> Settings
      </PremiumButton>
    </div>
  );
};

const SettingsScreen: React.FC<{
  save: SpeedMathSaveData;
  updatePreferences: (preferences: UserPreferences) => void;
  onReset: () => void;
}> = ({ save, updatePreferences, onReset }) => {
  const [confirmReset, setConfirmReset] = useState(false);
  const prefs = save.preferences;
  const setPref = (patch: Partial<UserPreferences>) => updatePreferences({ ...prefs, ...patch });

  return (
    <div className="screen-stack">
      <div>
        <div className="section-kicker">Settings</div>
        <h2 className="screen-heading">Controls</h2>
      </div>
      <GlassCard className="p-4">
        <ToggleRow label="Sound" value={prefs.soundEnabled} icon={prefs.soundEnabled ? Volume2 : VolumeX} onChange={(value) => setPref({ soundEnabled: value })} />
        <ToggleRow label="Haptics" value={prefs.hapticsEnabled} icon={Activity} onChange={(value) => setPref({ hapticsEnabled: value })} />
        <ToggleRow label="Music" value={prefs.musicEnabled} icon={Sparkles} onChange={(value) => setPref({ musicEnabled: value })} />
        <ToggleRow label="Reduced Motion" value={prefs.reducedMotion} icon={ShieldCheck} onChange={(value) => setPref({ reducedMotion: value })} />
        <ToggleRow label="Larger Text" value={prefs.largerText} icon={User} onChange={(value) => setPref({ largerText: value })} />
      </GlassCard>
      <GlassCard className="p-4">
        <div className="section-kicker">Timer</div>
        <div className="mt-3 grid grid-cols-4 gap-2">
          {[30, 60, 90, 120].map((seconds) => (
            <button
              key={seconds}
              type="button"
              className={`duration-chip ${prefs.gameDurationSeconds === seconds ? 'is-active' : ''}`}
              onClick={() => setPref({ gameDurationSeconds: seconds })}
            >
              {seconds}s
            </button>
          ))}
        </div>
      </GlassCard>
      <GlassCard tone="neutral" className="p-4">
        <div className="grid gap-2 text-sm text-blue-100">
          <a href="/privacy.html" className="settings-link">Privacy</a>
          <a href="/support.html" className="settings-link">Support</a>
          <a href="/index.html" className="settings-link">About SpeedMath Coach</a>
        </div>
      </GlassCard>
      <GlassCard tone="neutral" className="border-red-300/30 p-4">
        <div className="font-black text-white">Reset Progress</div>
        <p className="mt-1 text-xs text-blue-100">Clears local XP, sessions, challenges, and badges.</p>
        {!confirmReset ? (
          <PremiumButton tone="danger" onClick={() => setConfirmReset(true)} className="mt-4 w-full">
            Reset
          </PremiumButton>
        ) : (
          <div className="mt-4 grid grid-cols-2 gap-2">
            <PremiumButton tone="danger" onClick={onReset}>Confirm</PremiumButton>
            <PremiumButton tone="ghost" onClick={() => setConfirmReset(false)}>Cancel</PremiumButton>
          </div>
        )}
      </GlassCard>
    </div>
  );
};

const ToggleRow: React.FC<{ label: string; value: boolean; icon: React.ElementType; onChange: (value: boolean) => void }> = ({ label, value, icon: Icon, onChange }) => (
  <button type="button" className="toggle-row" onClick={() => onChange(!value)} aria-pressed={value}>
    <Icon className="h-5 w-5" />
    <span>{label}</span>
    <span className={`toggle-switch ${value ? 'is-on' : ''}`} aria-hidden="true" />
  </button>
);

const EmptyState: React.FC<{ icon: React.ElementType; title: string; text: string }> = ({ icon: Icon, title, text }) => (
  <div className="empty-state">
    <Icon className="h-10 w-10 text-cyan-200" />
    <div className="mt-3 font-black text-white">{title}</div>
    <p className="mt-1 text-sm text-blue-100">{text}</p>
  </div>
);

export default function App() {
  const [save, setSave] = useState<SpeedMathSaveData>(() => loadInitialSave());
  const [route, setRoute] = useState<Route>('SPLASH');
  const [activeSession, setActiveSession] = useState<SessionState | null>(null);
  const [feedback, setFeedback] = useState<FeedbackState>(null);
  const [timeLeft, setTimeLeft] = useState(save.preferences.gameDurationSeconds);
  const [lastResult, setLastResult] = useState<LastResult | null>(null);
  const activeSessionRef = useRef<SessionState | null>(null);
  const saveRef = useRef(save);
  const finishGuardRef = useRef(false);
  const feedbackTimerRef = useRef<number | null>(null);

  useEffect(() => {
    activeSessionRef.current = activeSession;
  }, [activeSession]);

  useEffect(() => {
    saveRef.current = save;
  }, [save]);

  useEffect(() => {
    const nextRoute = save.onboardingComplete ? 'HOME' : 'ONBOARDING';
    const timer = window.setTimeout(() => setRoute(nextRoute), 950);
    return () => window.clearTimeout(timer);
  }, [save.onboardingComplete]);

  useEffect(() => {
    document.documentElement.dataset.theme = save.preferences.theme;
    document.documentElement.dataset.reducedMotion = String(save.preferences.reducedMotion);
    document.documentElement.dataset.largerText = String(save.preferences.largerText);
    sounds.setMute(!save.preferences.soundEnabled);
  }, [save.preferences]);

  useEffect(() => {
    if (route !== 'TIMED' || !activeSession) return undefined;
    const interval = window.setInterval(() => {
      setTimeLeft((current) => {
        if (current <= 1) {
          const session = activeSessionRef.current;
          if (session) finishSession(session);
          return 0;
        }
        const next = current - 1;
        sounds.playCountdownTick(next);
        return next;
      });
    }, 1000);

    return () => window.clearInterval(interval);
  }, [activeSession, route]);

  useEffect(() => () => {
    if (feedbackTimerRef.current !== null) window.clearTimeout(feedbackTimerRef.current);
  }, []);

  const persistSave = useCallback((nextSave: SpeedMathSaveData) => {
    const persisted = saveData(nextSave);
    setSave(persisted);
    saveRef.current = persisted;
    return persisted;
  }, []);

  const updatePreferences = useCallback((preferences: UserPreferences) => {
    sounds.play('uiTap');
    persistSave({ ...saveRef.current, preferences, updatedAt: new Date().toISOString() });
  }, [persistSave]);

  const completeOnboarding = useCallback(() => {
    persistSave({ ...saveRef.current, onboardingComplete: true, updatedAt: new Date().toISOString() });
    setRoute('HOME');
  }, [persistSave]);

  const startPractice = useCallback((mode: PracticeMode, operation?: Operation, difficulty?: Difficulty) => {
    const currentSave = saveRef.current;
    const operationMix = operation ? [operation] : getActiveOperations(currentSave.preferences);
    const session = startSession({
      mode,
      operationMix,
      difficulty: difficulty ?? currentSave.preferences.defaultDifficulty,
      recentProblemSignatures: currentSave.recentProblemSignatures,
    });

    finishGuardRef.current = false;
    setFeedback(null);
    setLastResult(null);
    setActiveSession(session);
    setTimeLeft(currentSave.preferences.gameDurationSeconds);
    sounds.play('startRound');
    setRoute(mode === PracticeMode.UNTIMED ? 'UNTIMED' : 'TIMED');
  }, []);

  const finishSession = useCallback((session: SessionState | null = activeSessionRef.current) => {
    if (!session || finishGuardRef.current) return;
    finishGuardRef.current = true;
    if (feedbackTimerRef.current !== null) {
      window.clearTimeout(feedbackTimerRef.current);
      feedbackTimerRef.current = null;
    }

    const now = new Date().toISOString();
    const currentSave = saveRef.current;
    const ended = endSession(session, now);
    const preliminaryProgress = applySessionToProgress(currentSave, ended.summary, ended.attempts, now);
    const challengeResult = updateChallengesAfterSession(currentSave.challenges, ended.summary, preliminaryProgress, now);
    const withChallengeRewards = mergeSessionBadgesAndChallenges(
      ended.summary,
      [],
      challengeResult.completed.map((challenge) => challenge.id),
      challengeResult.rewardXp,
    );
    const progressed = applySessionToProgress(currentSave, withChallengeRewards, ended.attempts, now);
    const newlyUnlocked = evaluateAchievementUnlocks(currentSave.achievements, progressed, withChallengeRewards);
    const finalSummary = {
      ...withChallengeRewards,
      badgesUnlocked: newlyUnlocked.map((achievement) => achievement.id),
    };
    const finalSessionHistory = [...progressed.sessionHistory.slice(0, -1), finalSummary];
    const finalSave = persistSave({
      ...progressed,
      achievements: mergeAchievementUnlocks(currentSave.achievements, newlyUnlocked),
      challenges: challengeResult.challenges,
      sessionHistory: finalSessionHistory,
      updatedAt: now,
    });

    setLastResult({
      summary: finalSummary,
      attempts: ended.attempts,
      beforeXp: currentSave.totalXp,
      afterXp: finalSave.totalXp,
      newlyUnlocked,
      completedChallenges: challengeResult.completed,
    });
    setActiveSession(null);
    setFeedback(null);
    setRoute('RESULTS');
  }, [persistSave]);

  const handleAnswer = useCallback((answer: number) => {
    const session = activeSessionRef.current;
    if (!session || feedback) return;

    const now = new Date().toISOString();
    const isCorrect = answer === session.currentProblem.correctAnswer;
    const answered = submitAnswer(session, answer, now);
    const attempts = answered.attempts;
    const correct = attempts.filter((attempt) => attempt.isCorrect).length;
    const sessionAccuracy = attempts.length > 0 ? (correct / attempts.length) * 100 : 100;
    const averageResponseTimeMs = Math.round(average(attempts.filter((attempt) => attempt.isCorrect).map((attempt) => attempt.responseTimeMs)));
    const decision = getAdaptiveDecision({
      currentDifficulty: answered.currentDifficulty,
      currentMode: answered.mode,
      recentAttempts: attempts.slice(-10),
      sessionAccuracy,
      averageResponseTimeMs,
      currentStreak: answered.currentStreak,
      topicMastery: saveRef.current.topicMastery,
      recentMistakes: saveRef.current.recentMistakes,
      challengeProgress: saveRef.current.challenges,
    });
    const adaptedSession = saveRef.current.preferences.adaptiveDifficulty
      ? {
        ...answered,
        currentDifficulty: decision.nextDifficulty,
        currentProblem: generateProblem({
          operation: chooseOperationForNextProblem(answered, decision.recommendedOperation),
          difficulty: decision.nextDifficulty,
          recentSignatures: answered.recentProblemSignatures,
        }),
      }
      : answered;

    setFeedback({
      problemId: session.currentProblem.id,
      selectedAnswer: answer,
      correctAnswer: session.currentProblem.correctAnswer,
      isCorrect,
    });
    sounds.play(isCorrect ? 'correct' : 'incorrect');
    if (saveRef.current.preferences.hapticsEnabled && typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      navigator.vibrate(isCorrect ? 16 : [20, 35, 20]);
    }

    feedbackTimerRef.current = window.setTimeout(() => {
      setActiveSession(adaptedSession);
      activeSessionRef.current = adaptedSession;
      setFeedback(null);
      feedbackTimerRef.current = null;
    }, saveRef.current.preferences.reducedMotion ? 80 : 360);
  }, [feedback]);

  const handleBackFromExercise = useCallback(() => {
    sounds.play('uiTap');
    setActiveSession(null);
    setFeedback(null);
    finishGuardRef.current = false;
    setRoute('PRACTICE');
  }, []);

  const handleReset = useCallback(() => {
    sounds.play('resetConfirm');
    const fresh = resetSaveData();
    setSave(fresh);
    saveRef.current = fresh;
    setRoute('ONBOARDING');
  }, []);

  const continueFromResults = () => setRoute('HOME');
  const playAgainFromResults = () => startPractice(lastResult?.summary.mode ?? save.preferences.defaultMode);

  const content = useMemo(() => {
    if (route === 'SPLASH') return <SplashScreen />;
    if (route === 'ONBOARDING') return <OnboardingScreen onDone={completeOnboarding} />;
    if (route === 'HOME') return <HomeScreen save={save} onStart={startPractice} setRoute={setRoute} />;
    if (route === 'PRACTICE') return <PracticeScreen save={save} updatePreferences={updatePreferences} onStart={startPractice} />;
    if (route === 'TIMED' && activeSession) {
      return (
        <TimedPracticeScreen
          session={activeSession}
          feedback={feedback}
          timeLeft={timeLeft}
          duration={save.preferences.gameDurationSeconds}
          onAnswer={handleAnswer}
          onBack={handleBackFromExercise}
          onFinish={() => finishSession(activeSessionRef.current)}
        />
      );
    }
    if (route === 'UNTIMED' && activeSession) {
      return (
        <UntimedPracticeScreen
          session={activeSession}
          feedback={feedback}
          onAnswer={handleAnswer}
          onBack={handleBackFromExercise}
          onFinish={() => finishSession(activeSessionRef.current)}
        />
      );
    }
    if (route === 'RESULTS' && lastResult) {
      return <ResultsScreen result={lastResult} save={save} onPlayAgain={playAgainFromResults} onContinue={continueFromResults} />;
    }
    if (route === 'PROGRESS') return <ProgressScreen save={save} setRoute={setRoute} />;
    if (route === 'CHALLENGES') return <ChallengesScreen save={save} onStart={startPractice} />;
    if (route === 'ACHIEVEMENTS') return <AchievementsScreen save={save} />;
    if (route === 'COACH') return <CoachScreen save={save} onStart={startPractice} />;
    if (route === 'PROFILE') return <ProfileScreen save={save} setRoute={setRoute} />;
    if (route === 'SETTINGS') return <SettingsScreen save={save} updatePreferences={updatePreferences} onReset={handleReset} />;
    return <HomeScreen save={save} onStart={startPractice} setRoute={setRoute} />;
  }, [
    activeSession,
    completeOnboarding,
    feedback,
    handleAnswer,
    handleBackFromExercise,
    handleReset,
    lastResult,
    route,
    save,
    startPractice,
    timeLeft,
    updatePreferences,
    finishSession,
  ]);

  return (
    <div className={`speedmath-root ${routeIsExercise(route) ? 'is-exercise' : ''}`}>
      <div className="ambient-grid" aria-hidden="true" />
      <Shell route={route} save={save} setRoute={setRoute}>
        {content}
      </Shell>
    </div>
  );
}

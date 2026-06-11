import { Operation, Difficulty } from '../types';

export interface Badge {
  id: string;
  title: string;
  description: string;
  category: 'accuracy' | 'speed' | 'volume' | 'streak' | 'difficulty';
  icon: string;
  colorGrade: 'bronze' | 'silver' | 'gold' | 'cosmic';
  unlocked: boolean;
  progressValue: number;
  progressTarget: number;
  progressText: string;
}

// Helper to check if two Dates represent the same calendar day (local time)
export const isSameDay = (d1: Date, d2: Date): boolean => {
  return (
    d1.getFullYear() === d2.getFullYear() &&
    d1.getMonth() === d2.getMonth() &&
    d1.getDate() === d2.getDate()
  );
};

// Helper to parse dates into midnight local time for consecutive comparison
export const getLocalDateString = (dateObj: Date): string => {
  const y = dateObj.getFullYear();
  const m = String(dateObj.getMonth() + 1).padStart(2, '0');
  const d = String(dateObj.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};

/**
 * Calculates current consecutive days streak from an array of practice sessions.
 */
export const calculateStreak = (progress: any[]): number => {
  if (!progress || progress.length === 0) return 0;

  // Get all unique local date strings
  const uniqueDatesSet = new Set<string>();
  progress.forEach((session) => {
    if (session.date) {
      const dateObj = new Date(session.date);
      uniqueDatesSet.add(getLocalDateString(dateObj));
    }
  });

  const sortedDates = Array.from(uniqueDatesSet)
    .map((dStr) => new Date(dStr + 'T12:00:00')) // center in midday to avoid UTC shifting
    .sort((a, b) => b.getTime() - a.getTime()); // input descending (newest first)

  if (sortedDates.length === 0) return 0;

  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);

  const todayStr = getLocalDateString(today);
  const yesterdayStr = getLocalDateString(yesterday);

  // If the last session is neither today nor yesterday, the streak is broken
  const lastActiveStr = getLocalDateString(sortedDates[0]);
  if (lastActiveStr !== todayStr && lastActiveStr !== yesterdayStr) {
    return 0;
  }

  let streak = 1;
  let currentRef = sortedDates[0];

  for (let i = 1; i < sortedDates.length; i++) {
    const nextDate = sortedDates[i];
    // Check difference in days
    const diffTime = currentRef.getTime() - nextDate.getTime();
    const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 1) {
      streak++;
      currentRef = nextDate;
    } else if (diffDays === 0) {
      // same day, skip
      continue;
    } else {
      // gap > 1, streak terminates
      break;
    }
  }

  return streak;
};

/**
 * Evaluates achievements completed by analyzing local session progress logs.
 */
export const evaluateAchievements = (progress: any[]): Badge[] => {
  const streak = calculateStreak(progress);
  
  // Totals across all sessions
  let totalSolvedAllTime = 0;
  let highestScore = 0;
  let operationCounts: Record<Operation, number> = {
    [Operation.ADDITION]: 0,
    [Operation.SUBTRACTION]: 0,
    [Operation.MULTIPLICATION]: 0,
    [Operation.DIVISION]: 0,
  };
  let bestSingleSpeed = Infinity; // lowest time spent for a correct answer
  let hadHighDifficulty = false;
  let hadPerfect10 = false; // session with 10+ solved and 100% accuracy

  progress.forEach((session) => {
    const score = session.score || 0;
    const totalSub = session.totalSubmissions || session.totalQuestions || 0;
    if (score > highestScore) {
      highestScore = score;
    }

    if (score >= 10 && score === totalSub) {
      hadPerfect10 = true;
    }

    const diff = session.settings?.difficulty;
    if (
      diff === Difficulty.HARD ||
      diff === Difficulty.EXPERT ||
      diff === Difficulty.MASTER
    ) {
      hadHighDifficulty = true;
    }

    // Accumulate historic operations correct solutions
    const hist = session.history || [];
    hist.forEach((h: any) => {
      // h.timeSpent, h.problem, h.difficulty
      if (h.timeSpent < bestSingleSpeed) {
        bestSingleSpeed = h.timeSpent;
      }
      const op = h.problem?.operation as Operation;
      if (op && operationCounts[op] !== undefined) {
        operationCounts[op]++;
        totalSolvedAllTime++;
      }
    });
  });

  const badgesList: Omit<Badge, 'unlocked' | 'progressValue' | 'progressTarget' | 'progressText'>[] = [
    {
      id: 'math_wizard',
      title: 'Math Wizard',
      description: 'Solve at least 10 equations in a session with 100% accuracy.',
      category: 'accuracy',
      icon: 'Award',
      colorGrade: 'gold',
    },
    {
      id: 'speed_demon',
      title: 'Speed Demon',
      description: 'Answer any speed question correctly in under 1.5 seconds.',
      category: 'speed',
      icon: 'Zap',
      colorGrade: 'cosmic',
    },
    {
      id: 'grandmaster',
      title: 'Grandmaster',
      description: 'Score 30 or more correct answers in a single drills session.',
      category: 'volume',
      icon: 'Crown',
      colorGrade: 'cosmic',
    },
    {
      id: 'practice_streak',
      title: 'Tenacious Learner',
      description: 'Maintain a 3-day daily math practice streak.',
      category: 'streak',
      icon: 'Flame',
      colorGrade: 'silver',
    },
    {
      id: 'expert_climber',
      title: 'Apex Climber',
      description: 'Complete a performance session on Hard, Expert or Master difficulty.',
      category: 'difficulty',
      icon: 'Rocket',
      colorGrade: 'gold',
    },
    {
      id: 'addition_ace',
      title: 'Addition Ace',
      description: 'Collect 25 total correct addition solutions historic.',
      category: 'volume',
      icon: 'PlusCircle',
      colorGrade: 'bronze',
    },
    {
      id: 'multiplication_master',
      title: 'Math Multiplier',
      description: 'Collect 25 total correct multiplication solutions historic.',
      category: 'volume',
      icon: 'XCircle',
      colorGrade: 'silver',
    },
    {
      id: 'perfect_century',
      title: 'Perfect Century',
      description: 'Solve 100 math problems correctly across all of your sessions.',
      category: 'volume',
      icon: 'ShieldAlert',
      colorGrade: 'gold',
    },
  ];

  return badgesList.map((badge) => {
    let unlocked = false;
    let progressValue = 0;
    let progressTarget = 1;
    let progressText = '';

    switch (badge.id) {
      case 'math_wizard':
        unlocked = hadPerfect10;
        progressValue = hadPerfect10 ? 1 : 0;
        progressTarget = 1;
        progressText = unlocked ? 'Unlocked!' : 'Requires 100% accuracy (min 10 solved)';
        break;
      case 'speed_demon':
        const validSpeed = bestSingleSpeed !== Infinity;
        unlocked = validSpeed && bestSingleSpeed < 1.5;
        progressValue = validSpeed ? Number(bestSingleSpeed.toFixed(2)) : 0;
        progressTarget = 1.5;
        // speed target is lower-is-better, we invert the display
        progressText = unlocked
          ? `Speed: ${bestSingleSpeed.toFixed(2)}s!`
          : validSpeed
          ? `Best speed: ${bestSingleSpeed.toFixed(2)}s (Target: < 1.5s)`
          : 'Answer a question!';
        break;
      case 'grandmaster':
        unlocked = highestScore >= 30;
        progressValue = highestScore;
        progressTarget = 30;
        progressText = unlocked ? `High score: ${highestScore}` : `${highestScore} / 30 correct`;
        break;
      case 'practice_streak':
        unlocked = streak >= 3;
        progressValue = streak;
        progressTarget = 3;
        progressText = unlocked ? `${streak} day streak!` : `${streak} / 3 days streak`;
        break;
      case 'expert_climber':
        unlocked = hadHighDifficulty;
        progressValue = hadHighDifficulty ? 1 : 0;
        progressTarget = 1;
        progressText = unlocked ? 'Unlocked on Hard+' : 'Complete a session on Hard+';
        break;
      case 'addition_ace':
        const addCount = operationCounts[Operation.ADDITION];
        unlocked = addCount >= 25;
        progressValue = addCount;
        progressTarget = 25;
        progressText = `${addCount} / 25 correct`;
        break;
      case 'multiplication_master':
        const multCount = operationCounts[Operation.MULTIPLICATION];
        unlocked = multCount >= 25;
        progressValue = multCount;
        progressTarget = 25;
        progressText = `${multCount} / 25 correct`;
        break;
      case 'perfect_century':
        unlocked = totalSolvedAllTime >= 100;
        progressValue = totalSolvedAllTime;
        progressTarget = 100;
        progressText = `${totalSolvedAllTime} / 100 solved`;
        break;
    }

    return {
      ...badge,
      unlocked,
      progressValue,
      progressTarget,
      progressText,
    };
  });
};

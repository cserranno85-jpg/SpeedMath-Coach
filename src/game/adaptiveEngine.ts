import {
  AdaptiveDecision,
  AnswerAttempt,
  ChallengeState,
  Difficulty,
  Operation,
  PracticeMode,
  TopicMastery,
} from './types';
import { getWeakestMastery } from './progressEngine';
import { average } from '../utils/format';

interface AdaptiveInput {
  currentDifficulty: Difficulty;
  currentMode: PracticeMode;
  recentAttempts: AnswerAttempt[];
  sessionAccuracy: number;
  averageResponseTimeMs: number;
  currentStreak: number;
  topicMastery: TopicMastery[];
  recentMistakes: AnswerAttempt[];
  challengeProgress: ChallengeState[];
}

const difficultyOrder = [
  Difficulty.BEGINNER,
  Difficulty.EASY,
  Difficulty.MEDIUM,
  Difficulty.HARD,
  Difficulty.EXPERT,
] as const;

const lowerDifficulty = (difficulty: Difficulty): Difficulty => {
  const index = difficultyOrder.indexOf(difficulty);
  return difficultyOrder[Math.max(0, index - 1)];
};

const raiseDifficulty = (difficulty: Difficulty): Difficulty => {
  const index = difficultyOrder.indexOf(difficulty);
  return difficultyOrder[Math.min(difficultyOrder.length - 1, index + 1)];
};

const findRepeatedMistakeOperation = (attempts: AnswerAttempt[]): Operation | undefined => {
  const counts = new Map<Operation, number>();
  attempts.filter((attempt) => !attempt.isCorrect).forEach((attempt) => {
    counts.set(attempt.operation, (counts.get(attempt.operation) ?? 0) + 1);
  });

  return [...counts.entries()].sort((left, right) => right[1] - left[1])[0]?.[0];
};

const getSpeedTarget = (difficulty: Difficulty): number => {
  if (difficulty === Difficulty.BEGINNER) return 4200;
  if (difficulty === Difficulty.EASY) return 3600;
  if (difficulty === Difficulty.MEDIUM) return 3100;
  if (difficulty === Difficulty.HARD) return 2800;
  return 2500;
};

export const getAdaptiveDecision = ({
  currentDifficulty,
  currentMode,
  recentAttempts,
  sessionAccuracy,
  averageResponseTimeMs,
  currentStreak,
  topicMastery,
  recentMistakes,
  challengeProgress,
}: AdaptiveInput): AdaptiveDecision => {
  const validDifficulty = difficultyOrder.includes(currentDifficulty) ? currentDifficulty : Difficulty.BEGINNER;
  const recentAccuracy = recentAttempts.length > 0
    ? (recentAttempts.filter((attempt) => attempt.isCorrect).length / recentAttempts.length) * 100
    : sessionAccuracy;
  const blendedAccuracy = average([sessionAccuracy, recentAccuracy].filter(Number.isFinite));
  const weakestTopic = getWeakestMastery(topicMastery);
  const repeatedMistakeOperation = findRepeatedMistakeOperation([...recentMistakes.slice(-8), ...recentAttempts.slice(-8)]);
  const recommendedOperation = repeatedMistakeOperation ?? weakestTopic?.operation ?? Operation.ADDITION;
  const strongSpeed = averageResponseTimeMs > 0 && averageResponseTimeMs <= getSpeedTarget(validDifficulty);
  const activeChallenge = challengeProgress.some((challenge) => challenge.status === 'active' && challenge.progress > 0);

  if (blendedAccuracy < 70) {
    return {
      nextDifficulty: lowerDifficulty(validDifficulty),
      recommendedOperation,
      recommendedMode: PracticeMode.UNTIMED,
      shouldOfferChallenge: false,
      coachMessage: `${recommendedOperation} needs a calmer round. Try untimed focus.`,
      intensityLevel: 'recovery',
    };
  }

  if (blendedAccuracy <= 85) {
    return {
      nextDifficulty: validDifficulty,
      recommendedOperation,
      recommendedMode: currentMode === PracticeMode.CHALLENGE ? PracticeMode.TIMED : currentMode,
      shouldOfferChallenge: false,
      coachMessage: `Hold ${validDifficulty} and build ${recommendedOperation} accuracy.`,
      intensityLevel: 'steady',
    };
  }

  if (blendedAccuracy > 90 && strongSpeed) {
    const shouldOfferChallenge = currentStreak >= 5 || activeChallenge;
    return {
      nextDifficulty: raiseDifficulty(validDifficulty),
      recommendedOperation: recommendedOperation === Operation.MIXED ? Operation.ADDITION : recommendedOperation,
      recommendedMode: shouldOfferChallenge ? PracticeMode.CHALLENGE : PracticeMode.TIMED,
      shouldOfferChallenge,
      coachMessage: shouldOfferChallenge ? 'You are ready for a challenge.' : 'Speed is strong. Step up gradually.',
      intensityLevel: shouldOfferChallenge ? 'challenge' : 'push',
    };
  }

  return {
    nextDifficulty: validDifficulty,
    recommendedOperation,
    recommendedMode: PracticeMode.TIMED,
    shouldOfferChallenge: currentStreak >= 8,
    coachMessage: `Keep pressure steady and sharpen ${recommendedOperation}.`,
    intensityLevel: 'steady',
  };
};

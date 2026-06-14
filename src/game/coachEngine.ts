import { CoachRecommendation, Operation, PracticeMode, SpeedMathSaveData } from './types';
import { getProgressToNextLevel } from './scoringEngine';
import { getStrongestMastery, getWeakestMastery } from './progressEngine';
import { average } from '../utils/format';

export const getCoachRecommendation = (saveData: SpeedMathSaveData): CoachRecommendation => {
  const recentSessions = saveData.sessionHistory.slice(-5);
  const recentAccuracy = average(recentSessions.map((session) => session.accuracy));
  const recentSpeed = average(recentSessions.map((session) => session.averageResponseTimeMs).filter((value) => value > 0));
  const weakest = getWeakestMastery(saveData.topicMastery);
  const strongest = getStrongestMastery(saveData.topicMastery);
  const levelProgress = getProgressToNextLevel(saveData.totalXp);
  const activeChallenge = saveData.challenges.find((challenge) => challenge.status === 'active');

  if (activeChallenge && saveData.currentStreak >= 2) {
    return {
      shortMotivation: 'You are on a streak. A challenge is ready.',
      recommendedMode: PracticeMode.CHALLENGE,
      recommendedOperation: activeChallenge.operation ?? weakest.operation,
      nextGoal: activeChallenge.title,
      reason: 'Challenge progress and streak momentum line up.',
    };
  }

  if (recentSessions.length > 0 && recentAccuracy < 70) {
    return {
      shortMotivation: `${weakest.operation} needs attention. Focus Mode is best today.`,
      recommendedMode: PracticeMode.UNTIMED,
      recommendedOperation: weakest.operation,
      nextGoal: `Raise ${weakest.operation} accuracy above 70%.`,
      reason: 'Recent accuracy is below the adaptive comfort range.',
    };
  }

  if (recentSpeed > 0 && recentSpeed < 3000 && recentAccuracy >= 85) {
    return {
      shortMotivation: 'Your speed is improving. Try Quick Drill.',
      recommendedMode: PracticeMode.TIMED,
      recommendedOperation: Operation.MIXED,
      nextGoal: `Reach level ${levelProgress.level + 1}.`,
      reason: 'Recent speed and accuracy are both strong.',
    };
  }

  return {
    shortMotivation: `${strongest.operation} is strong. Build ${weakest.operation} next.`,
    recommendedMode: PracticeMode.TIMED,
    recommendedOperation: weakest.operation,
    nextGoal: `${levelProgress.percent}% toward level ${levelProgress.level + 1}.`,
    reason: 'Topic mastery shows the best next training target.',
  };
};

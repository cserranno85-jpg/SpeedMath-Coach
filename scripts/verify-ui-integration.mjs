import fs from 'node:fs';

let failed = false;

const appPath = 'src/App.tsx';
const app = fs.readFileSync(appPath, 'utf8');

function pass(message) {
  console.log(`\x1b[32m✔ ${message}\x1b[0m`);
}

function fail(message) {
  console.log(`\x1b[31m✘ ${message}\x1b[0m`);
  failed = true;
}

function expectIncludes(label, needle) {
  if (app.includes(needle)) pass(label);
  else fail(`${label}: missing "${needle}"`);
}

function expectRegex(label, pattern) {
  if (pattern.test(app)) pass(label);
  else fail(`${label}: pattern not found`);
}

function componentBody(name) {
  const start = app.indexOf(`const ${name}`);
  if (start === -1) return '';
  const next = app.slice(start + 1).search(/\nconst [A-Z][A-Za-z0-9]+/);
  return next === -1 ? app.slice(start) : app.slice(start, start + 1 + next);
}

function expectComponentUses(component, label, patterns) {
  const body = componentBody(component);
  if (!body) {
    fail(`${component} exists`);
    return;
  }

  const missing = patterns.filter((pattern) => !pattern.test(body));
  if (missing.length === 0) pass(`${component} consumes ${label}`);
  else fail(`${component} is not wired to ${label}`);
}

const requiredImportsAndCalls = [
  'loadSaveData',
  'saveData',
  'resetSaveData',
  'startSession',
  'submitAnswer',
  'endSession',
  'applySessionToProgress',
  'updateChallengesAfterSession',
  'evaluateAchievementUnlocks',
  'getCoachRecommendation',
  'generateProblem',
  'getAdaptiveDecision',
];

for (const symbol of requiredImportsAndCalls) {
  expectRegex(`${symbol} is imported or used`, new RegExp(`\\b${symbol}\\b`));
}

expectRegex('Persistence writes go through saveData before React state update', /const persistSave[\s\S]*saveData\(nextSave\)[\s\S]*setSave\(persisted\)/);
expectRegex('Onboarding completion persists to save data', /onboardingComplete:\s*true[\s\S]*persistSave/);
expectRegex('Practice starts real typed sessions', /const session = startSession\(/);
expectRegex('Answers are submitted through sessionEngine', /const answered = submitAnswer\(session,\s*answer,\s*now\)/);
expectRegex('Adaptive engine can replace the next generated problem', /getAdaptiveDecision\([\s\S]*currentProblem:\s*generateProblem\(/);
expectRegex('Session finish applies progress before results', /endSession\(session,\s*now\)[\s\S]*applySessionToProgress\(/);
expectRegex('Session finish updates challenges', /updateChallengesAfterSession\(/);
expectRegex('Session finish evaluates achievement unlocks', /evaluateAchievementUnlocks\(/);
expectRegex('Reset uses resetSaveData', /const fresh = resetSaveData\(\)/);

const routeNames = [
  'SPLASH',
  'ONBOARDING',
  'HOME',
  'PRACTICE',
  'TIMED',
  'UNTIMED',
  'RESULTS',
  'PROGRESS',
  'CHALLENGES',
  'ACHIEVEMENTS',
  'COACH',
  'PROFILE',
  'SETTINGS',
];

for (const route of routeNames) {
  expectRegex(`Route includes ${route}`, new RegExp(`['"]${route}['"]`));
}

const screenComponents = [
  'SplashScreen',
  'OnboardingScreen',
  'HomeScreen',
  'PracticeScreen',
  'TimedPracticeScreen',
  'UntimedPracticeScreen',
  'ResultsScreen',
  'ProgressScreen',
  'ChallengesScreen',
  'AchievementsScreen',
  'CoachScreen',
  'ProfileScreen',
  'SettingsScreen',
];

for (const component of screenComponents) {
  expectRegex(`${component} is defined`, new RegExp(`const ${component}\\b`));
}

const renderMappings = [
  ['SPLASH', 'SplashScreen'],
  ['ONBOARDING', 'OnboardingScreen'],
  ['HOME', 'HomeScreen'],
  ['PRACTICE', 'PracticeScreen'],
  ['TIMED', 'TimedPracticeScreen'],
  ['UNTIMED', 'UntimedPracticeScreen'],
  ['RESULTS', 'ResultsScreen'],
  ['PROGRESS', 'ProgressScreen'],
  ['CHALLENGES', 'ChallengesScreen'],
  ['ACHIEVEMENTS', 'AchievementsScreen'],
  ['COACH', 'CoachScreen'],
  ['PROFILE', 'ProfileScreen'],
  ['SETTINGS', 'SettingsScreen'],
];

for (const [route, component] of renderMappings) {
  expectRegex(`${route} renders ${component}`, new RegExp(`route === ['"]${route}['"][\\s\\S]{0,240}<${component}\\b`));
}

expectComponentUses('ResultsScreen', 'real SessionSummary-like result data', [
  /\{\s*summary,\s*newlyUnlocked,\s*completedChallenges\s*\}\s*=\s*result/,
  /summary\.accuracy/,
  /summary\.xpEarned/,
  /summary\.correctCount/,
  /summary\.totalProblems/,
  /save\.totalXp/,
]);

expectComponentUses('ProgressScreen', 'save/session/mastery data', [
  /save\.sessionHistory/,
  /getProgressToNextLevel\(save\.totalXp\)/,
  /getStrongestMastery\(save\.topicMastery\)/,
  /getWeakestMastery\(save\.topicMastery\)/,
  /save\.topicMastery\.filter/,
]);

expectComponentUses('ChallengesScreen', 'challenge state', [
  /save\.challenges\.map/,
  /ChallengeCard/,
]);

expectComponentUses('ChallengeCard', 'individual challenge state', [
  /challenge\.progress/,
  /challenge\.target/,
  /challenge\.rewardXp/,
  /challenge\.status/,
]);

expectComponentUses('AchievementsScreen', 'achievement state', [
  /save\.achievements\.filter/,
  /save\.achievements\.map/,
  /achievement\.unlockedAt/,
]);

expectComponentUses('CoachScreen', 'coachEngine output', [
  /const coach = getCoachRecommendation\(save\)/,
  /coach\.shortMotivation/,
  /coach\.recommendedMode/,
  /coach\.recommendedOperation/,
  /coach\.nextGoal/,
]);

expectComponentUses('ProfileScreen', 'save data', [
  /save\.sessionHistory\.reduce/,
  /getProgressToNextLevel\(save\.totalXp\)/,
  /save\.currentStreak/,
  /save\.bestStreak/,
  /save\.achievements/,
]);

expectComponentUses('HomeScreen', 'real progress, challenge, and coach data', [
  /getProgressToNextLevel\(save\.totalXp\)/,
  /save\.sessionHistory/,
  /getCoachRecommendation\(save\)/,
  /save\.challenges\.find/,
]);

expectIncludes('Timed practice presents engine-generated answer choices', 'session.currentProblem.choices.map');
expectIncludes('Untimed practice presents engine-generated answer choices', 'session.currentProblem.choices.map');
expectRegex('Results are only shown with lastResult data', /route === ['"]RESULTS['"] && lastResult/);

if (failed) {
  console.log('\n\x1b[31mUI integration verification failed.\x1b[0m');
  process.exit(1);
}

console.log('\n\x1b[32mUI integration verification passed.\x1b[0m');

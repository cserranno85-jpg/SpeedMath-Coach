import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import ts from 'typescript';

const root = process.cwd();
const outDir = path.join(root, '.tmp-gamebrain-verify');

const sourceFiles = [
  'src/utils/date.ts',
  'src/utils/format.ts',
  'src/game/types.ts',
  'src/game/answerGenerator.ts',
  'src/game/problemGenerator.ts',
  'src/game/adaptiveEngine.ts',
  'src/game/scoringEngine.ts',
  'src/game/progressEngine.ts',
  'src/game/achievementEngine.ts',
  'src/game/challengeEngine.ts',
  'src/game/coachEngine.ts',
  'src/game/sessionEngine.ts',
  'src/state/defaults.ts',
  'src/state/storage.ts',
];

function assertFileExists(file) {
  if (!fs.existsSync(path.join(root, file))) {
    throw new Error(`Missing required Phase 2A module: ${file}`);
  }
}

function rewriteImports(js) {
  return js.replace(/from\s+(['"])(\.\.?\/[^'"]+)\1/g, (match, quote, specifier) => {
    if (specifier.endsWith('.js') || specifier.endsWith('.json')) return match;
    return `from ${quote}${specifier}.js${quote}`;
  });
}

function compileSources() {
  fs.rmSync(outDir, { recursive: true, force: true });
  fs.mkdirSync(outDir, { recursive: true });

  for (const file of sourceFiles) {
    assertFileExists(file);
    const sourcePath = path.join(root, file);
    const outPath = path.join(outDir, file.replace(/\.ts$/, '.js'));
    const source = fs.readFileSync(sourcePath, 'utf8');
    const transpiled = ts.transpileModule(source, {
      compilerOptions: {
        target: ts.ScriptTarget.ES2022,
        module: ts.ModuleKind.ES2022,
        moduleResolution: ts.ModuleResolutionKind.Bundler,
        jsx: ts.JsxEmit.ReactJSX,
        esModuleInterop: true,
      },
      fileName: sourcePath,
      reportDiagnostics: true,
    });

    const diagnostics = transpiled.diagnostics ?? [];
    const errors = diagnostics.filter((diagnostic) => diagnostic.category === ts.DiagnosticCategory.Error);
    if (errors.length > 0) {
      const message = errors.map((diagnostic) => ts.flattenDiagnosticMessageText(diagnostic.messageText, '\n')).join('\n');
      throw new Error(`Failed to transpile ${file}:\n${message}`);
    }

    fs.mkdirSync(path.dirname(outPath), { recursive: true });
    fs.writeFileSync(outPath, rewriteImports(transpiled.outputText), 'utf8');
  }
}

async function importCompiled(file) {
  return import(pathToFileURL(path.join(outDir, file)).href);
}

function assertValidProblem(problem) {
  assert.ok(problem.id, 'problem has id');
  assert.ok(problem.prompt && typeof problem.prompt === 'string', 'problem has prompt');
  assert.ok(Number.isFinite(problem.correctAnswer), 'problem has finite answer');
  assert.equal(new Set(problem.choices).size, problem.choices.length, 'choices are unique');
  assert.equal(problem.choices.filter((choice) => choice === problem.correctAnswer).length, 1, 'exactly one correct choice');
  assert.ok(!problem.prompt.includes('NaN'), 'prompt is not malformed');
  assert.ok(!problem.prompt.includes('Infinity'), 'prompt is finite');
}

compileSources();

const types = await importCompiled('src/game/types.js');
const problems = await importCompiled('src/game/problemGenerator.js');
const adaptive = await importCompiled('src/game/adaptiveEngine.js');
const scoring = await importCompiled('src/game/scoringEngine.js');
const progress = await importCompiled('src/game/progressEngine.js');
const achievements = await importCompiled('src/game/achievementEngine.js');
const challenges = await importCompiled('src/game/challengeEngine.js');
const coach = await importCompiled('src/game/coachEngine.js');
const session = await importCompiled('src/game/sessionEngine.js');
const defaults = await importCompiled('src/state/defaults.js');
const storage = await importCompiled('src/state/storage.js');

for (const operation of [
  types.Operation.ADDITION,
  types.Operation.SUBTRACTION,
  types.Operation.MULTIPLICATION,
  types.Operation.DIVISION,
  types.Operation.MIXED,
]) {
  for (const difficulty of Object.values(types.Difficulty)) {
    const generated = problems.generateProblem({ operation, difficulty, recentSignatures: [] });
    assertValidProblem(generated);
  }
}

for (let i = 0; i < 50; i += 1) {
  const division = problems.generateProblem({
    operation: types.Operation.DIVISION,
    difficulty: types.Difficulty.BEGINNER,
    recentSignatures: [],
  });
  assert.equal(division.operands[0] % division.operands[1], 0, 'beginner division is clean');

  const subtraction = problems.generateProblem({
    operation: types.Operation.SUBTRACTION,
    difficulty: types.Difficulty.EASY,
    recentSignatures: [],
  });
  assert.ok(subtraction.correctAnswer >= 0, 'easy subtraction avoids negative answers');
}

const repeated = [];
for (let i = 0; i < 12; i += 1) {
  const problem = problems.generateProblem({
    operation: types.Operation.ADDITION,
    difficulty: types.Difficulty.BEGINNER,
    recentSignatures: repeated,
  });
  repeated.push(problem.signature);
}
assert.ok(new Set(repeated.slice(-8)).size > 1, 'anti-repeat produces varied recent signatures');

const attempts = [
  {
    problemId: 'p1',
    selectedAnswer: 4,
    correctAnswer: 5,
    isCorrect: false,
    responseTimeMs: 6200,
    operation: types.Operation.MULTIPLICATION,
    difficulty: types.Difficulty.MEDIUM,
    timestamp: '2026-06-13T12:00:00.000Z',
  },
  {
    problemId: 'p2',
    selectedAnswer: 12,
    correctAnswer: 12,
    isCorrect: true,
    responseTimeMs: 1800,
    operation: types.Operation.ADDITION,
    difficulty: types.Difficulty.MEDIUM,
    timestamp: '2026-06-13T12:01:00.000Z',
  },
];

const defaultSave = defaults.createDefaultSaveData('2026-06-13T12:00:00.000Z');
const adaptiveDecision = adaptive.getAdaptiveDecision({
  currentDifficulty: types.Difficulty.MEDIUM,
  currentMode: types.PracticeMode.TIMED,
  recentAttempts: attempts,
  sessionAccuracy: 50,
  averageResponseTimeMs: 4000,
  currentStreak: 0,
  topicMastery: defaultSave.topicMastery,
  recentMistakes: defaultSave.recentMistakes,
  challengeProgress: defaultSave.challenges,
});
assert.ok(Object.values(types.Difficulty).includes(adaptiveDecision.nextDifficulty), 'adaptive difficulty is valid');
assert.ok(Object.values(types.Operation).includes(adaptiveDecision.recommendedOperation), 'adaptive operation is valid');
assert.ok(Object.values(types.PracticeMode).includes(adaptiveDecision.recommendedMode), 'adaptive mode is valid');

assert.equal(scoring.getXpForLevel(1), 0, 'level 1 starts at 0 xp');
assert.ok(scoring.getXpForLevel(5) > scoring.getXpForLevel(4), 'level thresholds increase');
assert.equal(scoring.getLevelFromXp(scoring.getXpForLevel(4)), 4, 'level lookup is stable');
assert.ok(scoring.getProgressToNextLevel(scoring.getXpForLevel(4) + 1).percent > 0, 'level progress advances');

const sessionState = session.startSession({
  mode: types.PracticeMode.TIMED,
  operationMix: [types.Operation.ADDITION],
  difficulty: types.Difficulty.BEGINNER,
  now: '2026-06-13T12:00:00.000Z',
});
const answered = session.submitAnswer(sessionState, sessionState.currentProblem.correctAnswer, '2026-06-13T12:00:02.000Z');
const ended = session.endSession(answered, '2026-06-13T12:00:30.000Z');
assert.equal(ended.summary.correctCount, 1, 'session tracks correct answer');
assert.ok(ended.summary.xpEarned > 0, 'session earns xp');

const saveAfterProgress = progress.applySessionToProgress(defaultSave, ended.summary, ended.attempts, '2026-06-13T12:01:00.000Z');
assert.ok(saveAfterProgress.totalXp > defaultSave.totalXp, 'progress applies xp');
assert.ok(saveAfterProgress.sessionHistory.length === 1, 'progress stores summary');

const newlyUnlocked = achievements.evaluateAchievementUnlocks(defaultSave.achievements, saveAfterProgress, ended.summary);
assert.ok(newlyUnlocked.some((achievement) => achievement.id === 'first_steps'), 'first session unlocks First Steps');

const challengeResult = challenges.updateChallengesAfterSession(defaultSave.challenges, ended.summary, saveAfterProgress, '2026-06-13T12:01:00.000Z');
assert.ok(challengeResult.challenges.length > 0, 'challenges update after session');
assert.ok(challengeResult.challenges.some((challenge) => challenge.id.includes('daily_spark')), 'daily challenge exists');

const recommendation = coach.getCoachRecommendation(saveAfterProgress);
assert.ok(recommendation.shortMotivation.length > 0, 'coach returns motivation');
assert.ok(Object.values(types.Operation).includes(recommendation.recommendedOperation), 'coach operation is valid');
assert.ok(Object.values(types.PracticeMode).includes(recommendation.recommendedMode), 'coach mode is valid');

assert.deepEqual(storage.migrateSaveData(undefined).sessionHistory, [], 'missing storage migrates safely');
assert.deepEqual(storage.migrateSaveData('{bad json').sessionHistory, [], 'corrupt storage migrates safely');
const migratedLegacy = storage.migrateSaveData({
  legacyProgress: [
    {
      date: '2026-06-13T12:00:00.000Z',
      score: 4,
      totalSubmissions: 5,
      settings: { difficulty: 'BEGINNER', gameMode: 'TIMED' },
      history: [],
    },
  ],
  legacySettings: {
    difficulty: 'BEGINNER',
    gameMode: 'TIMED',
    operations: { ADDITION: true },
    adaptiveDifficulty: true,
    gameDurationSeconds: 60,
    theme: 'dark',
  },
  legacyMuted: 'true',
  legacyTheme: 'dark',
});
assert.equal(migratedLegacy.sessionHistory.length, 1, 'legacy progress migrates');
assert.equal(migratedLegacy.preferences.soundEnabled, false, 'legacy mute migrates');

fs.rmSync(outDir, { recursive: true, force: true });
console.log('Game brain verification passed.');

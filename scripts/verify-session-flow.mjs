import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import ts from 'typescript';

const root = process.cwd();
const outDir = path.join(root, '.tmp-session-flow-verify');

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
    const sourcePath = path.join(root, file);
    if (!fs.existsSync(sourcePath)) throw new Error(`Missing source file: ${file}`);

    const outPath = path.join(outDir, file.replace(/\.ts$/, '.js'));
    const transpiled = ts.transpileModule(fs.readFileSync(sourcePath, 'utf8'), {
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

    const errors = (transpiled.diagnostics ?? []).filter((diagnostic) => diagnostic.category === ts.DiagnosticCategory.Error);
    if (errors.length > 0) {
      throw new Error(`Failed to transpile ${file}:\n${errors.map((diagnostic) => ts.flattenDiagnosticMessageText(diagnostic.messageText, '\n')).join('\n')}`);
    }

    fs.mkdirSync(path.dirname(outPath), { recursive: true });
    fs.writeFileSync(outPath, rewriteImports(transpiled.outputText), 'utf8');
  }
}

async function importCompiled(file) {
  return import(pathToFileURL(path.join(outDir, file)).href);
}

function createLocalStorageMock() {
  const store = new Map();
  return {
    getItem: (key) => store.has(key) ? store.get(key) : null,
    setItem: (key, value) => store.set(key, String(value)),
    removeItem: (key) => store.delete(key),
    clear: () => store.clear(),
    key: (index) => [...store.keys()][index] ?? null,
    get length() {
      return store.size;
    },
  };
}

function assertValidProblem(problem) {
  assert.ok(problem.id, 'problem has id');
  assert.ok(problem.prompt, 'problem has prompt');
  assert.ok(Number.isFinite(problem.correctAnswer), 'problem answer is finite');
  assert.equal(new Set(problem.choices).size, problem.choices.length, 'answer choices are unique');
  assert.ok(problem.choices.includes(problem.correctAnswer), 'answer choices include correct answer');
}

compileSources();
globalThis.localStorage = createLocalStorageMock();

const types = await importCompiled('src/game/types.js');
const problems = await importCompiled('src/game/problemGenerator.js');
const sessionEngine = await importCompiled('src/game/sessionEngine.js');
const progress = await importCompiled('src/game/progressEngine.js');
const achievements = await importCompiled('src/game/achievementEngine.js');
const challenges = await importCompiled('src/game/challengeEngine.js');
const coach = await importCompiled('src/game/coachEngine.js');
const scoring = await importCompiled('src/game/scoringEngine.js');
const defaults = await importCompiled('src/state/defaults.js');
const storage = await importCompiled('src/state/storage.js');

function completeSessionFlow({ mode, operation, startTime }) {
  const save = storage.loadSaveData();
  const started = sessionEngine.startSession({
    mode,
    operationMix: [operation],
    difficulty: types.Difficulty.BEGINNER,
    now: startTime,
    recentProblemSignatures: save.recentProblemSignatures,
  });

  assert.equal(started.mode, mode, `${mode} session starts in requested mode`);
  assertValidProblem(started.currentProblem);

  const standaloneProblem = problems.generateProblem({
    operation,
    difficulty: types.Difficulty.BEGINNER,
    recentSignatures: started.recentProblemSignatures,
    now: startTime,
  });
  assertValidProblem(standaloneProblem);

  const firstAnswerAt = new Date(new Date(startTime).getTime() + 1800).toISOString();
  const afterCorrect = sessionEngine.submitAnswer(started, started.currentProblem.correctAnswer, firstAnswerAt);
  assert.equal(afterCorrect.attempts.length, 1, `${mode} records correct attempt`);
  assert.equal(afterCorrect.attempts[0].isCorrect, true, `${mode} correct attempt is marked correct`);

  const wrongAnswer = afterCorrect.currentProblem.correctAnswer + 9999;
  const secondAnswerAt = new Date(new Date(startTime).getTime() + 4300).toISOString();
  const afterIncorrect = sessionEngine.submitAnswer(afterCorrect, wrongAnswer, secondAnswerAt);
  assert.equal(afterIncorrect.attempts.length, 2, `${mode} records incorrect attempt`);
  assert.equal(afterIncorrect.attempts[1].isCorrect, false, `${mode} incorrect attempt is marked wrong`);

  const endedAt = new Date(new Date(startTime).getTime() + 30000).toISOString();
  const ended = sessionEngine.endSession(afterIncorrect, endedAt);
  assert.equal(ended.summary.totalProblems, 2, `${mode} summary counts submitted answers`);
  assert.equal(ended.summary.correctCount, 1, `${mode} summary counts correct answers`);
  assert.equal(ended.summary.incorrectCount, 1, `${mode} summary counts incorrect answers`);
  assert.equal(ended.summary.mode, mode, `${mode} summary preserves mode`);
  assert.ok(ended.summary.xpEarned > 0, `${mode} summary earns XP`);

  const beforeXp = save.totalXp;
  const progressed = progress.applySessionToProgress(save, ended.summary, ended.attempts, endedAt);
  assert.ok(progressed.totalXp > beforeXp, `${mode} progress applies XP`);
  assert.equal(progressed.level, scoring.getLevelFromXp(progressed.totalXp), `${mode} level follows XP`);
  assert.equal(progressed.sessionHistory.length, save.sessionHistory.length + 1, `${mode} progress stores session history`);

  const practicedTopic = progressed.topicMastery.find((topic) => topic.operation === operation);
  assert.ok(practicedTopic.attempts >= 2, `${mode} topic mastery records attempts`);
  assert.ok(progressed.recentMistakes.length >= save.recentMistakes.length + 1, `${mode} recent mistakes update`);

  const challengeResult = challenges.updateChallengesAfterSession(save.challenges, ended.summary, progressed, endedAt);
  assert.ok(challengeResult.challenges.length > 0, `${mode} challenges remain available`);
  assert.ok(challengeResult.challenges.some((challenge) => challenge.progress > 0), `${mode} challenge progress updates`);

  const withChallengeRewards = scoring.mergeSessionBadgesAndChallenges(
    ended.summary,
    [],
    challengeResult.completed.map((challenge) => challenge.id),
    challengeResult.rewardXp,
  );
  const finalProgress = progress.applySessionToProgress(save, withChallengeRewards, ended.attempts, endedAt);
  const newlyUnlocked = achievements.evaluateAchievementUnlocks(save.achievements, finalProgress, withChallengeRewards);
  const finalSummary = {
    ...withChallengeRewards,
    badgesUnlocked: newlyUnlocked.map((achievement) => achievement.id),
  };
  const finalSave = storage.saveData({
    ...finalProgress,
    achievements: achievements.mergeAchievementUnlocks(save.achievements, newlyUnlocked),
    challenges: challengeResult.challenges,
    sessionHistory: [...finalProgress.sessionHistory.slice(0, -1), finalSummary],
    updatedAt: endedAt,
  });

  assert.ok(finalSave.totalXp >= progressed.totalXp, `${mode} final save keeps XP`);
  assert.equal(finalSave.sessionHistory.at(-1).id, finalSummary.id, `${mode} final summary is saved`);
  assert.deepEqual(finalSave.sessionHistory.at(-1).badgesUnlocked, finalSummary.badgesUnlocked, `${mode} saved summary includes achievements`);
  assert.deepEqual(finalSave.sessionHistory.at(-1).challengesCompleted, finalSummary.challengesCompleted, `${mode} saved summary includes challenges`);
  assert.ok(achievements.evaluateAchievementUnlocks(finalSave.achievements, finalSave, finalSummary).length === 0, `${mode} achievements do not unlock twice`);

  const recommendation = coach.getCoachRecommendation(finalSave);
  assert.ok(Object.values(types.PracticeMode).includes(recommendation.recommendedMode), `${mode} coach returns valid mode`);
  assert.ok(Object.values(types.Operation).includes(recommendation.recommendedOperation), `${mode} coach returns valid operation`);
  assert.ok(recommendation.reason.length > 0, `${mode} coach returns reason`);

  const reloaded = storage.loadSaveData();
  assert.equal(reloaded.totalXp, finalSave.totalXp, `${mode} reload preserves XP`);
  assert.equal(reloaded.level, finalSave.level, `${mode} reload preserves level`);
  assert.equal(reloaded.sessionHistory.at(-1).id, finalSave.sessionHistory.at(-1).id, `${mode} reload preserves latest session`);
  assert.equal(reloaded.challenges.length, finalSave.challenges.length, `${mode} reload preserves challenges`);
  assert.equal(reloaded.achievements.length, finalSave.achievements.length, `${mode} reload preserves achievements`);

  return reloaded;
}

localStorage.clear();
storage.saveData(defaults.createDefaultSaveData('2026-06-13T21:00:00.000Z'));
const afterTimed = completeSessionFlow({
  mode: types.PracticeMode.TIMED,
  operation: types.Operation.ADDITION,
  startTime: '2026-06-13T21:00:00.000Z',
});
assert.ok(afterTimed.sessionHistory.some((session) => session.mode === types.PracticeMode.TIMED), 'timed path persisted');

const afterUntimed = completeSessionFlow({
  mode: types.PracticeMode.UNTIMED,
  operation: types.Operation.MULTIPLICATION,
  startTime: '2026-06-13T21:10:00.000Z',
});
assert.ok(afterUntimed.sessionHistory.some((session) => session.mode === types.PracticeMode.UNTIMED), 'untimed path persisted');
assert.ok(afterUntimed.totalXp > afterTimed.totalXp, 'second session accumulates XP');

fs.rmSync(outDir, { recursive: true, force: true });
console.log('Session flow regression verification passed.');

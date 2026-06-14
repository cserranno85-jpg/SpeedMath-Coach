import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import ts from 'typescript';

const root = process.cwd();
const outDir = path.join(root, '.tmp-persistence-verify');

const sourceFiles = [
  'src/utils/date.ts',
  'src/utils/format.ts',
  'src/game/types.ts',
  'src/game/answerGenerator.ts',
  'src/game/problemGenerator.ts',
  'src/game/scoringEngine.ts',
  'src/game/achievementEngine.ts',
  'src/game/challengeEngine.ts',
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

compileSources();
globalThis.localStorage = createLocalStorageMock();

const types = await importCompiled('src/game/types.js');
const defaults = await importCompiled('src/state/defaults.js');
const storage = await importCompiled('src/state/storage.js');
const scoring = await importCompiled('src/game/scoringEngine.js');

const now = '2026-06-13T20:00:00.000Z';
const later = '2026-06-13T20:05:00.000Z';

const missing = storage.loadSaveData();
assert.equal(missing.schemaVersion, defaults.SAVE_SCHEMA_VERSION, 'missing save uses current schema');
assert.equal(missing.onboardingComplete, false, 'missing save defaults onboarding to incomplete');
assert.ok(Array.isArray(missing.achievements), 'missing save has achievements');
assert.ok(Array.isArray(missing.challenges), 'missing save has challenges');
assert.deepEqual(missing.sessionHistory, [], 'missing save has empty session history');

localStorage.clear();
localStorage.setItem(defaults.SAVE_STORAGE_KEY, '{bad json');
const corrupt = storage.loadSaveData();
assert.equal(corrupt.schemaVersion, defaults.SAVE_SCHEMA_VERSION, 'corrupt JSON returns current schema defaults');
assert.equal(corrupt.totalXp, 0, 'corrupt JSON resets XP safely');

localStorage.clear();
localStorage.setItem('speedMathProgress', JSON.stringify([
  {
    date: now,
    score: 7,
    totalSubmissions: 10,
    settings: { difficulty: 'BEGINNER', gameMode: 'TIMED' },
    history: [],
  },
]));
localStorage.setItem('speedMathSettings', JSON.stringify({
  difficulty: 'EASY',
  gameMode: 'UNTIMED',
  operations: { ADDITION: true, MULTIPLICATION: true },
  adaptiveDifficulty: true,
  gameDurationSeconds: 90,
  theme: 'light',
}));
localStorage.setItem('speedMathMuted', 'true');
localStorage.setItem('speedMathTheme', 'light');

const migratedLegacy = storage.loadSaveData();
assert.equal(migratedLegacy.sessionHistory.length, 1, 'legacy progress migrates into session history');
assert.equal(migratedLegacy.preferences.soundEnabled, false, 'legacy mute preference migrates');
assert.equal(migratedLegacy.preferences.theme, 'light', 'legacy theme migrates');
assert.equal(migratedLegacy.preferences.defaultMode, types.PracticeMode.UNTIMED, 'legacy mode migrates');
assert.ok(migratedLegacy.preferences.defaultOperations.includes(types.Operation.ADDITION), 'legacy operations migrate');

const typedSession = {
  id: 'session:persistence:1',
  mode: types.PracticeMode.TIMED,
  startedAt: now,
  endedAt: later,
  operationMix: [types.Operation.ADDITION],
  difficultyStart: types.Difficulty.BEGINNER,
  difficultyEnd: types.Difficulty.EASY,
  totalProblems: 3,
  correctCount: 2,
  incorrectCount: 1,
  accuracy: 67,
  averageResponseTimeMs: 2100,
  bestStreak: 2,
  xpEarned: 22,
  score: 46,
  badgesUnlocked: ['first_steps'],
  challengesCompleted: ['daily_spark_2026-06-13'],
};

const base = defaults.createDefaultSaveData(now);
const unlockedAchievement = { ...base.achievements[0], unlockedAt: later };
const completedChallenge = { ...base.challenges[0], progress: base.challenges[0].target, status: 'completed', completedAt: later };
const saved = storage.saveData({
  ...base,
  onboardingComplete: true,
  preferences: {
    ...base.preferences,
    soundEnabled: false,
    hapticsEnabled: false,
    reducedMotion: true,
    theme: 'light',
    defaultMode: types.PracticeMode.UNTIMED,
    defaultOperations: [types.Operation.MULTIPLICATION],
    gameDurationSeconds: 120,
  },
  totalXp: 240,
  level: scoring.getLevelFromXp(240),
  achievements: [unlockedAchievement, ...base.achievements.slice(1)],
  challenges: [completedChallenge, ...base.challenges.slice(1)],
  sessionHistory: [typedSession],
  updatedAt: later,
});

assert.equal(saved.schemaVersion, defaults.SAVE_SCHEMA_VERSION, 'saveData preserves current schema version');
assert.equal(saved.onboardingComplete, true, 'onboardingComplete persists through saveData');
assert.equal(saved.preferences.theme, 'light', 'preferences persist through saveData');
assert.equal(saved.totalXp, 240, 'XP persists through saveData');
assert.equal(saved.level, scoring.getLevelFromXp(240), 'level is normalized from persisted XP');
assert.equal(saved.achievements[0].unlockedAt, later, 'achievement unlocks persist through saveData');
assert.equal(saved.challenges[0].status, 'completed', 'challenge status persists through saveData');
assert.equal(saved.sessionHistory[0].id, typedSession.id, 'typed session id persists through saveData');
assert.equal(saved.sessionHistory[0].mode, typedSession.mode, 'typed session mode persists through saveData');
assert.equal(saved.sessionHistory[0].totalProblems, typedSession.totalProblems, 'typed session totals persist through saveData');
assert.deepEqual(saved.sessionHistory[0].badgesUnlocked, typedSession.badgesUnlocked, 'typed session badge ids persist');

const reloaded = storage.loadSaveData();
assert.equal(reloaded.onboardingComplete, true, 'onboardingComplete reloads');
assert.equal(reloaded.preferences.gameDurationSeconds, 120, 'preferences reload');
assert.equal(reloaded.totalXp, 240, 'XP reloads');
assert.equal(reloaded.level, scoring.getLevelFromXp(240), 'level reloads');
assert.equal(reloaded.achievements[0].unlockedAt, later, 'achievements reload');
assert.equal(reloaded.challenges[0].status, 'completed', 'challenges reload');
assert.equal(reloaded.sessionHistory[0].id, typedSession.id, 'session history reloads with typed id');
assert.equal(reloaded.sessionHistory[0].score, typedSession.score, 'session history reloads score');

const reset = storage.resetSaveData();
assert.equal(reset.schemaVersion, defaults.SAVE_SCHEMA_VERSION, 'reset returns current schema');
assert.equal(reset.onboardingComplete, false, 'reset clears onboarding state');
assert.equal(reset.totalXp, 0, 'reset clears XP');
assert.equal(reset.level, 1, 'reset returns level 1');
assert.deepEqual(reset.sessionHistory, [], 'reset clears session history');
assert.ok(reset.achievements.every((achievement) => !achievement.unlockedAt), 'reset clears achievement unlocks');
assert.ok(reset.challenges.length > 0, 'reset returns fresh challenges');

fs.rmSync(outDir, { recursive: true, force: true });
console.log('Persistence regression verification passed.');

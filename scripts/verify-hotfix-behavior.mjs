import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8');
const fail = (message) => {
  console.error(`FAIL: ${message}`);
  process.exitCode = 1;
};
const readRequired = (file, requirement) => {
  const fullPath = path.join(root, file);
  if (!fs.existsSync(fullPath)) {
    fail(requirement);
    return '';
  }
  return fs.readFileSync(fullPath, 'utf8');
};

const game = read('src/components/Game.tsx');
const gameOver = read('src/components/GameOver.tsx');
const app = read('src/App.tsx');
const durationPresets = readRequired('src/utils/durationPresets.ts', 'src/utils/durationPresets.ts must provide shared approved timer presets.');
const progressStorage = readRequired('src/utils/progressStorage.ts', 'src/utils/progressStorage.ts must provide resettable progress storage helpers.');
const settingsValidation = readRequired('src/utils/settingsValidation.ts', 'src/utils/settingsValidation.ts must centralize settings and theme validation.');
const soundEngine = readRequired('src/utils/soundEngine.ts', 'src/utils/soundEngine.ts must provide an isolated procedural sound engine.');
const menu = read('src/components/Menu.tsx');

if (game.includes('const [toasts, setToasts]')) {
  fail('Game.tsx must not keep in-round achievement toast state.');
}

if (game.includes('triggerToast(')) {
  fail('Game.tsx must not trigger achievement, badge, streak, score, or speed toast popups during gameplay.');
}

if (game.includes('fixed top-24') || game.includes('Non-intrusive Toast Notifications Container')) {
  fail('Game.tsx must not render an in-round achievement notification container.');
}

if (!game.includes('roundUnlockedBadgesRef')) {
  fail('Game.tsx must queue newly unlocked badges silently for the round.');
}

if (!game.includes('onEndGame(score, totalSubmissions, history, roundUnlockedBadgesRef.current)')) {
  fail('Game.tsx must pass silently queued badges to the end-game flow.');
}

if (!app.includes('lastUnlockedBadges') || !app.includes('unlockedBadges={lastUnlockedBadges}')) {
  fail('App.tsx must carry round-unlocked badges into GameOver.');
}

if (!gameOver.includes('unlockedBadges') || gameOver.includes('setUnlockedNow(badgesList.filter(b => b.unlocked))')) {
  fail('GameOver.tsx must display only badges unlocked by the just-finished round.');
}

for (const preset of ['30', '60', '120', '300']) {
  if (!durationPresets.includes(preset)) {
    fail(`durationPresets.ts must include approved ${preset}-second timer preset.`);
  }
}

if (!durationPresets.includes('APPROVED_DURATION_PRESETS') || !durationPresets.includes('normalizeDurationSeconds')) {
  fail('Timer duration presets must live in a shared source of truth with a normalizer.');
}

if (game.includes('useState(settings.gameDurationSeconds)')) {
  fail('Game.tsx must not initialize timer state only once from props; it must reset from normalized duration on game start.');
}

if (!game.includes('normalizeDurationSeconds(settings.gameDurationSeconds)')) {
  fail('Game.tsx must normalize settings.gameDurationSeconds before starting the timer.');
}

if (!app.includes('key={gameSessionKey}')) {
  fail('App.tsx must key Game by settings that affect a new round to avoid stale mounted game state.');
}

if (!progressStorage.includes('PROGRESS_STORAGE_KEYS_TO_CLEAR') || !progressStorage.includes('speedMathProgress')) {
  fail('progressStorage.ts must define resettable progress keys including speedMathProgress.');
}

for (const preservedKey of ['speedMathSettings', 'speedMathMuted', 'speedMathTheme']) {
  if (progressStorage.includes(preservedKey)) {
    fail(`progressStorage.ts must not clear ${preservedKey}.`);
  }
}

if (!menu.includes('Reset Progress & Stats') || !menu.includes('Reset all progress?')) {
  fail('Menu.tsx must expose a confirmed Reset Progress & Stats action in Settings.');
}

for (const eventName of [
  'uiTap',
  'primaryTap',
  'keypadTap',
  'correct',
  'incorrect',
  'startRound',
  'endRound',
  'achievement',
  'resetConfirm',
  'timerWarning',
]) {
  if (!soundEngine.includes(`'${eventName}'`)) {
    fail(`soundEngine.ts must expose the ${eventName} sound event.`);
  }
}

if (!soundEngine.includes('AudioContext') || !soundEngine.includes('webkitAudioContext')) {
  fail('soundEngine.ts must safely support standard and iOS-prefixed Web Audio contexts.');
}

if (!soundEngine.includes('speedMathMuted')) {
  fail('soundEngine.ts must persist and respect speedMathMuted.');
}

if (/(new Audio\s*\(|\.mp3|\.wav|\.ogg|\.m4a|fetch\(|import .*audio)/i.test(soundEngine)) {
  fail('soundEngine.ts must use procedural Web Audio only, without external copyrighted audio assets.');
}

if (!soundEngine.includes('lastPlayedAt') || !soundEngine.includes('minGapMs')) {
  fail('soundEngine.ts must throttle short sounds to avoid overlapping audio spam.');
}

if (!settingsValidation.includes("export type ThemePreference = 'light' | 'dark'")) {
  fail('Theme validation must expose a light/dark ThemePreference type.');
}

if (!settingsValidation.includes("DEFAULT_THEME: ThemePreference = 'dark'")) {
  fail('Theme validation must default invalid or missing theme values to dark.');
}

if (!settingsValidation.includes('normalizeThemePreference')) {
  fail('Theme validation must provide normalizeThemePreference.');
}

if (!settingsValidation.includes("value === 'light' || value === 'dark'")) {
  fail('Theme validation must accept only light and dark theme values.');
}

if (process.exitCode) {
  process.exit(process.exitCode);
}

console.log('Hotfix behavior checks passed.');

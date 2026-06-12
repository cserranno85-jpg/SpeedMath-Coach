import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8');
const fail = (message) => {
  console.error(`FAIL: ${message}`);
  process.exitCode = 1;
};

const game = read('src/components/Game.tsx');
const gameOver = read('src/components/GameOver.tsx');
const app = read('src/App.tsx');

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

if (process.exitCode) {
  process.exit(process.exitCode);
}

console.log('Hotfix behavior checks passed.');

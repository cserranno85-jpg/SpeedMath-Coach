import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const read = (relativePath) => fs.readFileSync(new URL(relativePath, import.meta.url), 'utf8');

test('Figma-inspired home and practice have real navigation and game actions', () => {
  const menu = read('../src/components/Menu.tsx');
  const app = read('../src/App.tsx');
  assert.match(menu, /id="dashboard_tab_content"/);
  assert.match(menu, /id="session_setup_card"/);
  assert.match(menu, /id="btn_start_session_dashboard"/);
  assert.match(menu, /id="btn_play_direct"/);
  assert.match(menu, /onStartGame\(\)/);
  assert.match(menu, /Object\.values\(Operation\)/);
  assert.match(menu, /Object\.values\(Difficulty\)/);
  assert.match(menu, /settings\.gameDurationSeconds/);
  assert.match(menu, /adaptiveDifficulty/);
  assert.match(app, /localStorage\.setItem\('speedMathProgress'/);
  assert.match(app, /localStorage\.setItem\('speedMathSettings'/);
});

test('stacked compliance privacy route remains reachable', () => {
  const menu = read('../src/components/Menu.tsx');
  const app = read('../src/App.tsx');
  assert.match(menu, /id="btn_privacy_policy"/);
  assert.match(menu, /onNavigate\?\.\('PRIVACY'\)/);
  assert.match(app, /appState === 'PRIVACY'/);
});

test('results keep score, accuracy, achievements, and expected actions', () => {
  const result = read('../src/components/GameOver.tsx');
  assert.match(result, /totalQuestions > 0/);
  assert.match(result, /unlockedBadges\.map/);
  assert.match(result, /id="unlocked_badges_toast_tray"/);
  assert.match(result, /onPlayAgain/);
  assert.match(result, /onMenu/);
});

test('shared chrome keeps accessible destination labels, sound toggle, and back icon', () => {
  const shell = read('../src/components/PremiumShell.tsx');
  assert.match(shell, /aria-label="Primary navigation"/);
  assert.match(shell, /aria-current=\{selected \? 'page' : undefined\}/);
  assert.match(shell, /primaryTitle\.toLowerCase\(\)\.includes\('back'\)/);
  assert.match(shell, /<VolumeX/);
  assert.match(shell, /<ArrowLeft/);
});

test('clean palette and reduced motion are implemented without new packages', () => {
  const css = read('../src/index.css');
  assert.match(css, /--sm-primary: #61e4ff/);
  assert.match(css, /--sm-bg: #040c24/);
  assert.match(css, /@media \(prefers-reduced-motion: reduce\)/);
  const config = JSON.parse(read('../package.json'));
  assert.equal(config.dependencies['@capacitor/core'] != null, true);
});

test('Badges tab routes to existing achievement gallery; Daily Arena remains a distinct action', () => {
  const shell = read('../src/components/PremiumShell.tsx');
  const app = read('../src/App.tsx');
  const menu = read('../src/components/Menu.tsx');
  const stats = read('../src/components/Stats.tsx');
  const profile = read('../src/components/Profile.tsx');
  const challenges = read('../src/components/Challenges.tsx');
  assert.match(shell, /\{ key: 'badges', label: 'Badges', icon: Trophy \}/);
  assert.doesNotMatch(shell, /\{ key: 'challenges', label: 'Badges'/);
  assert.match(app, /appState === 'BADGES'/);
  assert.match(app, /view=\{appState === 'BADGES' \? 'badges' : 'progress'\}/);
  assert.match(stats, /id="achievements_section"/);
  assert.match(stats, /id="badges_page_title"/);
  assert.match(stats, /active=\{view === 'badges' \? 'badges' : 'progress'\}/);
  assert.match(menu, /target === 'badges'\) onNavigate\?\.\('BADGES'\)/);
  assert.match(menu, /target === 'challenges'\) onNavigate\?\.\('CHALLENGES'\)/);
  for (const other of [profile, challenges]) assert.match(other, /onNavigate\('BADGES'\)/);
  assert.match(challenges, /active=\{null\}/);
});


import fs from 'node:fs';

const app = fs.readFileSync('src/App.tsx', 'utf8');
const css = fs.readFileSync('src/index.css', 'utf8');
const shell = fs.readFileSync('src/components/PremiumShell.tsx', 'utf8');
const game = fs.readFileSync('src/components/Game.tsx', 'utf8');

const failures = [];

function expect(condition, message) {
  if (!condition) failures.push(message);
}

expect(
  css.includes('html, body, #root') && /overflow-y:\s*auto/.test(css) && css.includes('-webkit-overflow-scrolling: touch'),
  'Global html/body/#root must support vertical touch scrolling.',
);

expect(
  app.includes('app-shell-scroll') && app.includes('app-shell-gameplay'),
  'App shell must distinguish scrollable screens from gameplay-only locked screens.',
);

expect(
  shell.includes('mobile-light-glass') && game.includes('mobile-light-glass'),
  'Glass/backdrop effects must be routed through the mobile-light-glass class for Android-sized viewports.',
);

expect(
  css.includes('@media (max-width: 820px), (max-height: 760px)') &&
    css.includes('backdrop-filter: none') &&
    css.includes('animation: none'),
  'Small Android-sized viewports must disable heavy blur and continuous decorative animation.',
);

expect(
  css.includes('@media (prefers-reduced-motion: reduce)') && css.includes('animation: none !important'),
  'Reduced-motion users must get animations disabled, not near-zero infinite animation loops.',
);

expect(
  !/isExerciseScreen \? 'items-center overflow-hidden p-0'/.test(app),
  'Top-level app shell must not use raw overflow-hidden without the gameplay-only class.',
);

expect(
  game.includes('gameplay-viewport-lock') && !/max-h-\[100dvh\].*overflow-hidden/.test(game),
  'Gameplay viewport lock must be isolated behind a named class, not raw Tailwind height/overflow locks.',
);

if (failures.length > 0) {
  console.error('Android WebView hotfix verification failed:');
  for (const failure of failures) {
    console.error(`- ${failure}`);
  }
  process.exit(1);
}

console.log('Android WebView hotfix verification passed.');

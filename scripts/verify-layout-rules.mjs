import fs from 'node:fs';

let failed = false;

const css = fs.readFileSync('src/index.css', 'utf8');
const app = fs.readFileSync('src/App.tsx', 'utf8');

function pass(message) {
  console.log(`\x1b[32m✔ ${message}\x1b[0m`);
}

function fail(message) {
  console.log(`\x1b[31m✘ ${message}\x1b[0m`);
  failed = true;
}

function ruleBody(selector) {
  const escaped = selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const match = css.match(new RegExp(`${escaped}\\s*\\{([\\s\\S]*?)\\}`, 'm'));
  return match?.[1] ?? '';
}

function expectCss(label, pattern) {
  if (pattern.test(css)) pass(label);
  else fail(label);
}

function expectRule(label, selector, patterns) {
  const body = ruleBody(selector);
  if (!body) {
    fail(`${label}: missing ${selector}`);
    return;
  }

  const missing = patterns.filter((pattern) => !pattern.test(body));
  if (missing.length === 0) pass(label);
  else fail(`${label}: ${selector} is missing ${missing.map(String).join(', ')}`);
}

function expectApp(label, pattern) {
  if (pattern.test(app)) pass(label);
  else fail(label);
}

expectCss('CSS uses dynamic viewport units for mobile exercise sizing', /\b100dvh\b/);
expectCss('CSS uses safe-area inset variables', /env\(safe-area-inset-(top|bottom|left|right)/);
expectCss('CSS uses clamp() for responsive exercise sizing', /clamp\(/);

expectRule('Normal app pages may scroll vertically', '.speedmath-root', [
  /min-height:\s*100dvh/,
  /overflow-y:\s*auto/,
]);

expectRule('Exercise route root blocks document scrolling', '.speedmath-root.is-exercise', [
  /height:\s*100dvh/,
  /overflow:\s*hidden/,
]);

expectRule('Exercise screen is viewport-bound and hidden-overflow', '.exercise-screen', [
  /height:\s*100dvh/,
  /overflow:\s*hidden/,
  /display:\s*grid/,
  /grid-template-rows:\s*auto\s+minmax\(0,\s*1fr\)\s+auto/,
  /var\(--safe-top\)/,
  /var\(--safe-bottom\)/,
  /clamp\(/,
]);

expectRule('Exercise main uses fixed/flexible zones', '.exercise-main', [
  /min-height:\s*0/,
  /display:\s*grid/,
  /gap:\s*clamp\(/,
]);

expectRule('Timed practice has explicit layout zones', '.timed-main', [
  /grid-template-rows:\s*auto\s+minmax\(0,\s*1fr\)\s+auto/,
]);

expectRule('Untimed practice has explicit layout zones', '.untimed-main', [
  /grid-template-rows:\s*auto\s+minmax\(0,\s*1fr\)\s+auto/,
]);

expectRule('Problem panel cannot force document scroll', '.problem-panel', [
  /min-height:\s*0/,
  /overflow:\s*hidden/,
]);

expectRule('Answer controls remain in a visible grid region', '.answers-grid', [
  /display:\s*grid/,
  /grid-template-columns:\s*repeat\(2,\s*minmax\(0,\s*1fr\)\)/,
  /gap:\s*clamp\(/,
]);

expectRule('Answer buttons use responsive bounded sizing', '.answer-choice', [
  /min-height:\s*clamp\(/,
  /font-size:\s*clamp\(/,
]);

expectRule('Correct answers include non-color feedback', '.answer-choice.is-correct::after', [
  /content:\s*["']✓["']/,
]);

expectRule('Wrong answers include non-color feedback', '.answer-choice.is-wrong::after', [
  /content:\s*["']×["']/,
]);

expectRule('Top and footer zones are bounded', '.exercise-topbar,\n.exercise-footer', [
  /min-height:\s*clamp\(/,
  /display:\s*flex/,
]);

expectCss('Exercise footer keeps safe-area clearance', /\.exercise-footer\s*\{[\s\S]*padding-bottom:\s*max\(0px,\s*var\(--safe-bottom\)\)/);

expectCss('Compact-height exercise mode is defined', /@media \(max-height:\s*620px\)[\s\S]*\.exercise-screen/);
expectCss('Tablet dashboard layouts are defined', /@media \(min-width:\s*760px\)[\s\S]*\.tablet-dashboard-grid/);
expectCss('User reduced-motion preference disables decorative animation', /:root\[data-reduced-motion="true"\][\s\S]*animation:\s*none/);

expectCss('Timed and untimed CSS hooks exist', /\.timed-main[\s\S]*\.untimed-main/);
expectCss('Exercise answer hooks exist', /\.answer-choice[\s\S]*\.answer-choice:active/);

expectApp('App marks timed and untimed routes as exercise routes', /routeIsExercise[\s\S]*route === ['"]TIMED['"][\s\S]*route === ['"]UNTIMED['"]/);
expectApp('Exercise routes apply the no-scroll root class', /speedmath-root \$\{routeIsExercise\(route\) \? ['"]is-exercise['"] : ['"]['"]\}/);
expectApp('Timed screen uses exercise-screen and timed-screen classes', /className=['"]exercise-screen timed-screen['"]/);
expectApp('Untimed screen uses exercise-screen and untimed-screen classes', /className=['"]exercise-screen untimed-screen['"]/);
expectApp('Timed and untimed answers are inside exercise layout', /className=['"]answers-grid['"][\s\S]*session\.currentProblem\.choices\.map[\s\S]*className=\{`answer-choice/);
expectApp('Answer buttons have semantic labels', /aria-label=\{`Answer \$\{choice\}`\}/);
expectApp('Bottom navigation is omitted on exercise routes', /routeUsesBottomNav[\s\S]*HOME[\s\S]*SETTINGS[\s\S]*routeIsExercise\(route\)/);

if (failed) {
  console.log('\n\x1b[31mLayout rules verification failed.\x1b[0m');
  process.exit(1);
}

console.log('\n\x1b[32mLayout rules verification passed.\x1b[0m');

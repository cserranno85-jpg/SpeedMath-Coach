import test, { after } from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { createServer } from 'vite';

// Exercise the actual TSX component implementation, not just source-string
// matches: TypeScript and Vite compile malformed CSS/JSX template strings.
let vite;
let shell;
const loadShell = async () => {
  if (!shell) {
    vite = await createServer({
      appType: 'custom',
      logLevel: 'silent',
      server: { middlewareMode: true },
    });
    shell = await vite.ssrLoadModule('/src/components/PremiumShell.tsx');
  }
  return shell;
};
after(async () => { await vite?.close(); });

test('panel background interpolates the actual overlay and asset', async () => {
  const { premiumPanelStyle } = await loadShell();
  const overlay = 'rgba(10, 20, 30, 0.75)';
  const asset = '/assets/speedmath-validation-panel.svg';
  const style = premiumPanelStyle(asset, overlay);
  assert.equal(
    style.backgroundImage,
    'linear-gradient(155deg, rgba(10, 20, 30, 0.75), rgba(4, 12, 36, 0.96)), url(/assets/speedmath-validation-panel.svg)',
  );
  assert.equal(style.backgroundPosition, 'center');
  assert.equal(style.backgroundSize, 'cover');
  assert.doesNotMatch(style.backgroundImage, /%%\{/);
});

test('screen renders real narrow/wide max-width and forwarded className', async () => {
  const { PremiumScreen } = await loadShell();
  const content = React.createElement('span', null, 'Content');
  const narrow = renderToStaticMarkup(React.createElement(PremiumScreen, { className: 'test-narrow' }, content));
  const wide = renderToStaticMarkup(React.createElement(PremiumScreen, { wide: true, className: 'test-wide' }, content));

  assert.match(narrow, /max-w-\[460px\]/);
  assert.match(narrow, /test-narrow/);
  assert.doesNotMatch(narrow, /max-w-4xl/);
  assert.match(wide, /max-w-4xl/);
  assert.match(wide, /test-wide/);
  assert.doesNotMatch(wide, /max-w-\[460px\]/);
  assert.doesNotMatch(narrow + wide, /%%\{/);
});

test('primary nav renders one selected item with corresponding visual state', async () => {
  const { PremiumBottomNav } = await loadShell();
  const markup = renderToStaticMarkup(
    React.createElement(PremiumBottomNav, { active: 'progress', onSelect: () => {} }),
  );
  assert.equal((markup.match(/aria-current="page"/g) || []).length, 1);
  assert.match(markup, /aria-label="Progress" aria-current="page" class="[^"]*bg-\[#153A60\][^"]*text-\[#69E5FF\]/);
  assert.match(markup, /aria-label="Home" class="[^"]*text-\[#AFC6E6\]/);
  for (const destination of ['Home', 'Practice', 'Progress', 'Badges', 'Profile']) {
    assert.match(markup, new RegExp('aria-label="' + destination + '"'));
  }
  assert.doesNotMatch(markup, /%%\{/);
});

test('energy decoration forwards caller class without literal placeholders', async () => {
  const { CardEnergy } = await loadShell();
  const markup = renderToStaticMarkup(React.createElement(CardEnergy, { className: 'test-energy-offset' }));
  assert.match(markup, /test-energy-offset/);
  assert.doesNotMatch(markup, /%%\{/);
});

test('Badges is a selected accessible destination, while Daily Arena has no false selection', async () => {
  const { PremiumBottomNav } = await loadShell();
  const badges = renderToStaticMarkup(React.createElement(PremiumBottomNav, { active: 'badges', onSelect: () => {} }));
  const arena = renderToStaticMarkup(React.createElement(PremiumBottomNav, { active: null, onSelect: () => {} }));
  assert.match(badges, /aria-label="Badges" aria-current="page"/);
  assert.equal((badges.match(/aria-current="page"/g) || []).length, 1);
  assert.equal((arena.match(/aria-current="page"/g) || []).length, 0);
});


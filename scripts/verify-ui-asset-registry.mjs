import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const registryPath = path.join(root, 'src/assets/uiAssetRegistry.ts');
const uiAssetDir = path.join(root, 'src/assets/ui');
const requiredGroups = [
  'mascots',
  'backgrounds',
  'fx',
  'operationIcons',
  'challengeIcons',
  'badges',
  'buttonGlows',
  'panels',
];

const requiredWiredAssetFiles = [
  'robot-head-avatar.png',
  'robot-pointing-coach.png',
  'robot-waving-coach.png',
  'bg-cosmic-exercise.png',
  'bg-cosmic-home.png',
  'bg-cosmic-profile.png',
  'fx-cyan-orb-glow.png',
  'fx-gold-spark-burst.png',
  'fx-math-particles.png',
  'fx-purple-energy-ring.png',
  'icon-addition.png',
  'icon-daily-challenge.png',
  'icon-division.png',
  'icon-multiplication.png',
  'icon-subtraction.png',
  'icon-timed-challenge.png',
  'icon-untimed-practice.png',
  'badge-accuracy-90.png',
  'badge-first-solve.png',
  'badge-focus-master.png',
  'badge-lightning-master.png',
  'badge-locked.png',
  'badge-perfect-round.png',
  'badge-speed-burst.png',
  'badge-streak-3.png',
  'badge-unlock-burst.png',
  'button-primary-glow.png',
  'panel-cosmic-card.png',
  'panel-exercise-card.png',
  'panel-modal-glow.png',
  'panel-navbar-glow.png',
  'panel-stats-card.png',
];

const futureOnlyAssetFiles = [
  'robot-full-body-coach.png',
  'badge-streak-7.png',
  'button-secondary-glow.png',
  'button-danger-glow.png',
  'button-disabled-glow.png',
  'button-small-pill-glow.png',
];

let failed = false;

function fail(message) {
  console.error(`FAIL: ${message}`);
  failed = true;
}

if (!fs.existsSync(registryPath)) {
  fail('src/assets/uiAssetRegistry.ts is missing.');
} else {
  const registry = fs.readFileSync(registryPath, 'utf8');
  const importMatches = registry.matchAll(/import\s+\w+\s+from\s+['"]\.\/ui\/([^'"]+\.png)['"];?/g);
  const importedAssetFiles = new Set([...importMatches].map((match) => match[1]));

  for (const group of requiredGroups) {
    if (!registry.includes(`export const ${group}`)) {
      fail(`Asset registry is missing the "${group}" group.`);
    }
  }

  for (const file of importedAssetFiles) {
    if (!fs.existsSync(path.join(uiAssetDir, file))) {
      fail(`Asset registry imports missing UI asset: ${file}`);
    }
  }

  for (const file of requiredWiredAssetFiles) {
    if (!fs.existsSync(path.join(uiAssetDir, file))) {
      fail(`Required wired UI asset is missing on disk: ${file}`);
    }

    if (!importedAssetFiles.has(file)) {
      fail(`Required wired UI asset is not imported by the registry: ${file}`);
    }
  }

  for (const file of futureOnlyAssetFiles) {
    if (importedAssetFiles.has(file)) {
      fail(`Future-only UI asset must not be statically imported: ${file}`);
    }

    if (!registry.includes(`'${file}'`) && !registry.includes(`"${file}"`)) {
      fail(`Future-only UI asset should remain documented as plain metadata: ${file}`);
    }
  }
}

const componentDir = path.join(root, 'src/components');
for (const file of fs.readdirSync(componentDir)) {
  if (!file.endsWith('.tsx')) continue;

  const fullPath = path.join(componentDir, file);
  const content = fs.readFileSync(fullPath, 'utf8');
  if (content.includes('../assets/ui/')) {
    fail(`${path.relative(root, fullPath)} imports Phase 2H UI assets directly.`);
  }
}

if (failed) {
  process.exit(1);
}

console.log('UI asset registry contract passed.');

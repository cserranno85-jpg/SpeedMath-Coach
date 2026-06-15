import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const registryPath = path.join(root, 'src/assets/uiAssetRegistry.ts');
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

let failed = false;

function fail(message) {
  console.error(`FAIL: ${message}`);
  failed = true;
}

if (!fs.existsSync(registryPath)) {
  fail('src/assets/uiAssetRegistry.ts is missing.');
} else {
  const registry = fs.readFileSync(registryPath, 'utf8');
  for (const group of requiredGroups) {
    if (!registry.includes(`export const ${group}`)) {
      fail(`Asset registry is missing the "${group}" group.`);
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

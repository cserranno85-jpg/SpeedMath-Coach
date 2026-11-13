import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const read = (file) => fs.readFileSync(new URL(file, import.meta.url), 'utf8');

test('privacy policy is reachable from the Settings screen and readable offline', () => {
  const menu = read('../src/components/Menu.tsx');
  const app = read('../src/App.tsx');
  const policy = read('../src/components/PrivacyPolicy.tsx');
  assert.match(menu, /id="btn_privacy_policy"/);
  assert.match(menu, /onNavigate\?\.\('PRIVACY'\)/);
  assert.match(app, /appState === 'PRIVACY'/);
  assert.match(app, /<PrivacyPolicy onBack=\{\(\) => navigateTo\('PRACTICE'\)\}/);
  assert.match(policy, /aria-labelledby="privacy-policy-title"/);
  assert.match(policy, /Back to Settings/);
  assert.match(policy, /Retention and Deletion/);
  assert.match(policy, /Caivra Tech LLC/);
  assert.doesNotMatch(policy, /fetch\(|window\.open\(/);
});

test('Android backup and device-transfer paths are explicitly excluded', () => {
  const manifest = read('../android/app/src/main/AndroidManifest.xml');
  const rules = read('../android/app/src/main/res/xml/data_extraction_rules.xml');
  assert.match(manifest, /android:allowBackup="false"/);
  assert.match(manifest, /android:fullBackupContent="false"/);
  assert.match(manifest, /android:dataExtractionRules="@xml\/data_extraction_rules"/);
  for (const section of ['cloud-backup','device-transfer']) {
    const match = rules.match(new RegExp('<'+section+'>([\\s\\S]*?)<\\/'+section+'>'));
    assert.ok(match, section+' missing');
    assert.match(match[1], /<exclude domain="root" path="\."\s*\/>/);
    assert.match(match[1], /<exclude domain="device_root" path="\."\s*\/>/);
  }
});

test('public privacy-policy copy discloses retention and OS migration caveat', () => {
  const policy = read('../docs/privacy.html');
  assert.match(policy, /Data Retention and Deletion/);
  assert.match(policy, /Operating-system and device-manufacturer behavior may vary/);
  assert.match(policy, /Locally stored progress and preferences remain/);
});

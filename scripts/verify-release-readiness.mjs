import fs from 'node:fs';
import path from 'node:path';

const APP_ID = 'com.caivratech.speedmathcoach';
const APP_NAME = 'SpeedMath Coach';

let failed = false;

const requiredFiles = [
  'package.json',
  'capacitor.config.ts',
  'android/app/build.gradle',
  'android/app/src/main/AndroidManifest.xml',
  'android/app/src/main/java/com/caivratech/speedmathcoach/MainActivity.java',
  'android/app/src/main/res/values/strings.xml',
  'ios/App/App/Info.plist',
  'ios/App/App.xcodeproj/project.pbxproj',
  'src/manifest.webmanifest',
  'docs/SPEEDMATH_FINAL_UI_QA_CHECKLIST.md',
  'docs/SPEEDMATH_DEVICE_QA_PACKET.md',
  'docs/SPEEDMATH_PHASE_2E_BUILD_READINESS_REPORT.md',
  'scripts/verify-game-brain.mjs',
  'scripts/verify-ui-integration.mjs',
  'scripts/verify-layout-rules.mjs',
  'scripts/verify-persistence-regression.mjs',
  'scripts/verify-session-flow.mjs',
  'scripts/verify-mobile-readiness.mjs',
  'scripts/verify-release.mjs',
];

const requiredPngs = [
  { file: 'assets/icon.png', width: 1024, height: 1024, noAlpha: true },
  { file: 'assets/speedmath-ios-icon-correct.png', width: 1024, height: 1024, noAlpha: true },
  { file: 'assets/splash.png', width: 2732, height: 2732 },
  { file: 'src/assets/icons/icon-48.png', width: 48, height: 48 },
  { file: 'src/assets/icons/icon-72.png', width: 72, height: 72 },
  { file: 'src/assets/icons/icon-96.png', width: 96, height: 96 },
  { file: 'src/assets/icons/icon-128.png', width: 128, height: 128 },
  { file: 'src/assets/icons/icon-192.png', width: 192, height: 192 },
  { file: 'src/assets/icons/icon-256.png', width: 256, height: 256 },
  { file: 'src/assets/icons/icon-512.png', width: 512, height: 512 },
  { file: 'android/app/src/main/res/drawable/splash.png' },
  { file: 'ios/App/App/Assets.xcassets/AppIcon.appiconset/AppIcon-512@2x.png', width: 1024, height: 1024 },
  { file: 'ios/App/App/Assets.xcassets/Splash.imageset/Default@1x~universal~anyany.png', width: 2732, height: 2732 },
];

const forbiddenDependencyPatterns = [
  /firebase/i,
  /@firebase/i,
  /analytics/i,
  /admob/i,
  /adsense/i,
  /facebook/i,
  /sentry/i,
  /segment/i,
  /mixpanel/i,
  /amplitude/i,
  /auth0/i,
  /supabase/i,
  /stripe/i,
];

function ok(message) {
  console.log(`OK ${message}`);
}

function fail(message) {
  console.error(`FAIL ${message}`);
  failed = true;
}

function read(file) {
  return fs.readFileSync(file, 'utf8');
}

function expectFile(file) {
  if (fs.existsSync(file)) ok(`${file} exists`);
  else fail(`${file} is missing`);
}

function expectIncludes(file, value, label = value) {
  if (!fs.existsSync(file)) {
    fail(`${file} is missing`);
    return;
  }

  const content = read(file);
  if (content.includes(value)) ok(`${file} includes ${label}`);
  else fail(`${file} is missing ${label}`);
}

function readPng(file) {
  if (!fs.existsSync(file)) {
    fail(`${file} is missing`);
    return null;
  }

  const buffer = fs.readFileSync(file);
  const isPng = buffer.length >= 29 &&
    buffer[0] === 0x89 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x4e &&
    buffer[3] === 0x47 &&
    buffer[4] === 0x0d &&
    buffer[5] === 0x0a &&
    buffer[6] === 0x1a &&
    buffer[7] === 0x0a;

  if (!isPng) {
    fail(`${file} is not a valid PNG`);
    return null;
  }

  return {
    width: buffer.readUInt32BE(16),
    height: buffer.readUInt32BE(20),
    colorType: buffer[25],
  };
}

function verifyPng({ file, width, height, noAlpha = false }) {
  const metadata = readPng(file);
  if (!metadata) return;

  if (width && metadata.width !== width) {
    fail(`${file} width expected ${width}, found ${metadata.width}`);
  }

  if (height && metadata.height !== height) {
    fail(`${file} height expected ${height}, found ${metadata.height}`);
  }

  if (noAlpha && (metadata.colorType === 4 || metadata.colorType === 6)) {
    fail(`${file} must not contain alpha channel`);
  }

  if (!width && !height) {
    ok(`${file} is valid PNG ${metadata.width}x${metadata.height}`);
  } else if (
    (!width || metadata.width === width) &&
    (!height || metadata.height === height) &&
    (!noAlpha || (metadata.colorType !== 4 && metadata.colorType !== 6))
  ) {
    ok(`${file} is valid PNG`);
  }
}

function verifyManifestIcons() {
  if (!fs.existsSync('src/manifest.webmanifest')) {
    fail('src/manifest.webmanifest is missing');
    return;
  }

  const manifest = JSON.parse(read('src/manifest.webmanifest'));
  for (const icon of manifest.icons ?? []) {
    const iconPath = path.join('src', icon.src);
    if (!String(icon.src).endsWith('.png')) fail(`${icon.src} must use .png`);
    if (icon.type !== 'image/png') fail(`${icon.src} must declare image/png`);
    const metadata = readPng(iconPath);
    if (!metadata) continue;
    if (`${metadata.width}x${metadata.height}` !== icon.sizes) {
      fail(`${icon.src} declares ${icon.sizes}, found ${metadata.width}x${metadata.height}`);
    }
  }
  ok('PWA manifest icons reference valid PNG files');
}

function verifyForbiddenDependencies() {
  const pkg = JSON.parse(read('package.json'));
  const allDeps = {
    ...(pkg.dependencies ?? {}),
    ...(pkg.devDependencies ?? {}),
  };
  const names = Object.keys(allDeps);
  const forbidden = names.filter((name) => forbiddenDependencyPatterns.some((pattern) => pattern.test(name)));
  if (forbidden.length > 0) fail(`forbidden dependencies present: ${forbidden.join(', ')}`);
  else ok('no forbidden backend/auth/ad/analytics/tracking dependencies found');
}

function verifyAndroidPermissions() {
  const manifest = read('android/app/src/main/AndroidManifest.xml');
  const permissions = [...manifest.matchAll(/<uses-permission\s+android:name="([^"]+)"/g)].map((match) => match[1]);
  const allowed = new Set(['android.permission.INTERNET']);
  const unexpected = permissions.filter((permission) => !allowed.has(permission));
  if (unexpected.length > 0) fail(`unexpected Android permissions: ${unexpected.join(', ')}`);
  else ok(`Android permissions are limited to: ${permissions.join(', ') || 'none'}`);
}

for (const file of requiredFiles) expectFile(file);

expectIncludes('capacitor.config.ts', `appId: '${APP_ID}'`, 'Capacitor appId');
expectIncludes('capacitor.config.ts', `appName: '${APP_NAME}'`, 'Capacitor appName');
expectIncludes('android/app/build.gradle', `namespace = "${APP_ID}"`, 'Android namespace');
expectIncludes('android/app/build.gradle', `applicationId "${APP_ID}"`, 'Android applicationId');
expectIncludes('android/app/src/main/java/com/caivratech/speedmathcoach/MainActivity.java', `package ${APP_ID};`, 'MainActivity package');
expectIncludes('android/app/src/main/res/values/strings.xml', `<string name="app_name">${APP_NAME}</string>`, 'Android app_name');
expectIncludes('ios/App/App/Info.plist', `<string>${APP_NAME}</string>`, 'iOS display name');
expectIncludes('ios/App/App.xcodeproj/project.pbxproj', `PRODUCT_BUNDLE_IDENTIFIER = ${APP_ID};`, 'iOS bundle identifier');

verifyAndroidPermissions();
verifyForbiddenDependencies();
for (const png of requiredPngs) verifyPng(png);
verifyManifestIcons();

if (failed) {
  console.error('\nRelease-readiness verification failed.');
  process.exit(1);
}

console.log('\nRelease-readiness verification passed.');

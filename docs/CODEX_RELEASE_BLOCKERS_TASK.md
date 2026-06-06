# Codex Task: Fix SpeedMath Coach Release Blockers

Work only on this branch:

speedmath-coach-release-blockers-v1

Do not edit main directly.

## Project

- Vite React + Capacitor
- App name: SpeedMath Coach
- Capacitor appId: com.caivratech.speedmathcoach
- Android package ID: com.caivratech.speedmathcoach
- iOS bundle ID: com.caivratech.speedmathcoach
- v1 must remain offline/local-only

## Do not do these things

Do not:
- convert to Expo
- rewrite the app
- add ads
- add analytics
- add auth/login
- add backend services
- add payments
- add Gemini/API calls
- add camera
- add microphone
- add contacts
- add location
- add push notifications
- add unnecessary native plugins

## Current known blockers

1. PNG assets may still be corrupted.
2. src/manifest.webmanifest may reference missing .webp files.
3. package.json may be missing generate:brand-assets.
4. src/index.css may import Google Fonts.
5. AndroidManifest.xml may still request INTERNET permission.
6. npm run verify:mobile must pass.
7. GitHub Actions Mobile CI must pass.

## Required fixes

### 1. Fix binary PNG assets safely

Use binary-safe asset generation only.

Do not edit image files as text.
Do not paste binary image data into patches.
Do not save JPEG data with a .png extension.

Generate valid PNGs:

- assets/icon.png
- assets/splash.png
- src/assets/icons/icon-48.png
- src/assets/icons/icon-72.png
- src/assets/icons/icon-96.png
- src/assets/icons/icon-128.png
- src/assets/icons/icon-192.png
- src/assets/icons/icon-256.png
- src/assets/icons/icon-512.png

Every PNG must start with:

89 50 4E 47 0D 0A 1A 0A

### 2. Fix package scripts

Ensure package.json includes:

"generate:brand-assets": "node scripts/generate-speedmath-assets.mjs"

Keep:

"build": "vite build"
"verify:mobile": "node scripts/verify-mobile-readiness.mjs"

### 3. Fix manifest icons

Update src/manifest.webmanifest so icon paths use real .png files:

- assets/icons/icon-48.png
- assets/icons/icon-72.png
- assets/icons/icon-96.png
- assets/icons/icon-128.png
- assets/icons/icon-192.png
- assets/icons/icon-256.png
- assets/icons/icon-512.png

Each icon must use:

"type": "image/png"

### 4. Remove external font network request

Remove Google Fonts import from src/index.css.

Use system font stacks only:

system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif

For monospace:

ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", monospace

### 5. Android INTERNET permission review

Inspect:

android/app/src/main/AndroidManifest.xml

If no app code requires network access, remove:

<uses-permission android:name="android.permission.INTERNET" />

Keep v1 offline/local-only.

### 6. Clean generated output

Delete:

- dist
- android/app/src/main/assets/public
- ios/App/App/public

### 7. Run verification commands

Run:

npm install
npm run generate:brand-assets
npm run build
npx @capacitor/assets generate
npx cap sync android
npm run verify:mobile

If possible, also run:

npx cap sync ios
npx cap doctor

## Do not claim completion unless

- npm run verify:mobile passes
- all PNGs have valid headers
- app identity remains SpeedMath Coach / com.caivratech.speedmathcoach
- no stale ArithSprint references remain outside verifier blacklist
- no stale MathFlow references remain outside verifier blacklist
- no stale com.speedmath.app references remain
- no GEMINI_API_KEY references remain
- no Google AI Studio API claims remain
- GitHub Actions Mobile CI passes

## Commit

Commit message:

Fix SpeedMath Coach release blockers

## Pull request

Open a pull request into main after checks pass.

## Return report

Return:

- files changed
- commands run
- verifier result
- GitHub Actions result
- whether Android is ready for Android Studio release signing
- whether iOS is ready for Xcode signing/archive
- remaining manual steps

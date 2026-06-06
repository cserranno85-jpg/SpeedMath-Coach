# Codex Task: Finish SpeedMath Coach Release Blockers

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
- add AI/API calls
- add camera
- add microphone
- add contacts
- add location
- add push notifications
- add unnecessary native plugins

## Current status

The app identity, source brand asset generation, native asset generation, Android sync, and PNG signature verification have been improved.

The remaining goal is to make this branch pass:

npm run verify:mobile

and the GitHub Actions workflow:

SpeedMath Coach Mobile CI

## Required checks

1. Confirm all PNG assets are valid binary PNG files.

2. Confirm manifest icons use real PNG files.

3. Confirm package scripts include:
   - generate:brand-assets
   - build
   - verify:mobile

4. Confirm the app remains offline/local-only.

5. Confirm no legacy app names, legacy package IDs, old prototype labels, or API-key references remain in app source, native output, docs, metadata, or copied web assets.

6. Confirm Android package and namespace are:
   - com.caivratech.speedmathcoach

7. Confirm iOS bundle ID is:
   - com.caivratech.speedmathcoach

8. Confirm app display name is:
   - SpeedMath Coach

## Run

npm install
npm run generate:brand-assets
npm run build
npx @capacitor/assets generate
npx cap sync android
npm run verify:mobile

If available:

npx cap sync ios
npx cap doctor

## Completion criteria

Do not claim completion unless:

- npm run verify:mobile passes
- GitHub Actions Mobile CI passes
- all PNGs have valid headers
- app identity remains SpeedMath Coach / com.caivratech.speedmathcoach
- no legacy identifiers remain in searchable project files
- Android is ready for Android Studio release signing
- iOS is ready for Xcode signing/archive on macOS or a macOS cloud runner

## Commit

Use commit message:

Fix SpeedMath Coach verifier false positive

## Pull request

Open a pull request into main after checks pass.

## Return report

Return:

- files changed
- commands run
- verifier result
- GitHub Actions result
- Android readiness
- iOS readiness
- remaining manual steps

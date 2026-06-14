# SpeedMath Phase 2C Regression QA

Phase 2C adds lightweight Node verification scripts around the Phase 2A game brain and Phase 2B premium UI integration. These checks are regression guards, not a browser automation suite.

## Commands

Run individual checks:

```bash
npm run verify:ui-integration
npm run verify:layout
npm run verify:persistence
npm run verify:session-flow
```

Run the full release gate:

```bash
npm run verify:release
```

The release gate runs:

```bash
npm run lint
npm run verify:game-brain
npm run verify:ui-integration
npm run verify:layout
npm run verify:persistence
npm run verify:session-flow
npm run verify:mobile
npm run build
```

## What The Scripts Protect

`verify:ui-integration` statically checks that `src/App.tsx` remains wired to the real local systems: storage load/save/reset, session start/submit/end, progress application, challenge updates, achievement unlocks, coach recommendations, problem generation, adaptive decisions, and all expected screens.

`verify:layout` statically checks the critical no-scroll exercise layout contract: dynamic viewport sizing, hidden overflow on exercise routes, grid/flexible zones, safe-area padding, responsive `clamp()` sizing, timed/untimed layout hooks, and visible answer-control regions.

`verify:persistence` runs storage in Node with a mocked `localStorage`. It checks missing data, corrupt JSON, legacy key migration, onboarding, preferences, XP/level, achievements, challenges, typed session history, reset defaults, schema version handling, and Node-like safety.

`verify:session-flow` runs timed and untimed local sessions end to end. It starts sessions, generates problems, submits correct and incorrect answers, ends sessions, applies progress, updates XP/level/topic mastery/challenges, evaluates achievements, gets coach recommendations, saves, and reloads.

`verify:release` runs the full release-readiness command sequence through a cross-platform Node runner instead of shell chaining.

## What They Do Not Protect

These scripts do not render the app in a browser, capture screenshots, inspect real layout pixels, test touch input, test native shell behavior, or validate App Store / Play Store upload flows.

They also do not replace manual accessibility review, visual polish review, or real-device no-scroll checks.

## Remaining Manual QA

- Android phone real-device pass.
- Android tablet real-device pass.
- iPhone real-device pass.
- iPad real-device pass.
- Timed and untimed no-scroll exercise check on real devices.
- Visual screenshot review before store upload.
- Confirm native Android/iOS identity files remain unchanged before release.

## Known Limitation

There is no automated screenshot or browser-backed pass in Phase 2C. Add that later only if a browser test dependency or existing browser automation tool is approved.

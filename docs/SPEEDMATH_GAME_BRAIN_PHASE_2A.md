# SpeedMath Coach Game Brain Phase 2A

## Engine Overview

Phase 2A adds a typed, offline-only game-brain foundation under `src/game` and `src/state`. The current UI can continue using the existing screens while later phases connect these engines more deeply.

Core modules:
- `src/game/types.ts` defines lowercase app-facing operations, difficulties, modes, problems, attempts, session summaries, mastery, achievements, challenges, progress, preferences, and save data.
- `src/game/problemGenerator.ts` creates valid arithmetic problems with anti-repeat signatures.
- `src/game/answerGenerator.ts` creates one correct answer plus plausible mobile-readable distractors.
- `src/game/sessionEngine.ts` provides pure session start, answer submission, and session end helpers.

## Adaptive Logic Summary

`src/game/adaptiveEngine.ts` evaluates recent attempts, accuracy, speed, streaks, topic mastery, recent mistakes, and challenge state.

Rules:
- Below 70% accuracy: reduce difficulty by at most one level and recommend untimed focus.
- 70-85% accuracy: maintain difficulty and reinforce the weakest or mistake-heavy topic.
- Above 90% accuracy with strong speed: increase difficulty by one level and optionally offer a challenge.
- Repeated topic mistakes bias recommendations toward that operation.
- All outputs are constrained to valid operation, difficulty, and mode values.

## Progression System Summary

`src/game/scoringEngine.ts` handles score, XP, level thresholds, and progress to next level.

Progression behavior:
- Correct answers earn XP.
- Higher difficulty earns more XP.
- Speed and streaks add small bonuses.
- Perfect sessions receive bonus score and XP.
- XP thresholds grow quickly early and slower later.

`src/game/progressEngine.ts` applies completed sessions to the local save model, updates streaks, stores recent mistakes, appends session summaries, and updates topic mastery.

## Challenge System Summary

`src/game/challengeEngine.ts` creates deterministic local challenges:
- Daily Spark
- Speed Demon
- Perfect Run
- Weekly Climb
- Focus Builder
- Weak Spot Fix

Daily challenges reset by local date. Weekly challenges reset by local week. Weak Spot Fix targets the current weakest topic from mastery data.

## Achievement System Summary

`src/game/achievementEngine.ts` defines and unlocks:
- First Steps
- Quick Thinker
- Streak Master
- Accuracy Ace
- Perfect Run
- Daily Champion
- Weekly Warrior
- Addition Master
- Multiplication Master
- Division Climber
- Lightning Legend

The engine returns only newly unlocked achievements after a session and preserves existing unlock timestamps.

## Storage Schema Summary

`src/state/storage.ts` and `src/state/defaults.ts` define schema version `2` under `speedMathSaveDataV2`.

The save data includes:
- preferences
- total XP and level
- current and best streaks
- topic mastery
- achievements
- challenges
- session history
- recent mistakes
- recent problem signatures
- creation and update timestamps

The migration path reads legacy keys without deleting them:
- `speedMathProgress`
- `speedMathSettings`
- `speedMathMuted`
- `speedMathTheme`

Corrupt or missing data falls back to safe defaults.

## Offline Coach Summary

`src/game/coachEngine.ts` provides short local recommendations. It uses recent accuracy, recent speed, weakest and strongest topic, streak, active challenges, and level progress. It does not call any API.

## Verification Commands

Run:

```bash
npm run lint
npm run verify:game-brain
npm run verify:mobile
```

`npm run verify:game-brain` compiles the TypeScript game-brain modules into a temporary local directory and validates generation, adaptation, XP, achievements, challenges, coach recommendations, sessions, and storage migration.

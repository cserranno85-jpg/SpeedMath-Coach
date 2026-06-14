# SpeedMath Final UI QA Checklist

## Phase 2A Foundation QA

- [ ] Existing legacy progress migrates from `speedMathProgress` into the new schema.
- [ ] Existing settings migrate from `speedMathSettings`.
- [ ] Existing mute and theme preferences migrate from `speedMathMuted` and `speedMathTheme`.
- [ ] Corrupt local save data falls back to safe defaults without crashing.
- [ ] A completed session produces a typed `SessionSummary`.
- [ ] XP increases after correct answers.
- [ ] Level progress updates from total XP.
- [ ] Topic mastery updates from answer accuracy, response speed, mistakes, and difficulty.
- [ ] Newly completed challenges are detected after a session.
- [ ] Newly unlocked achievements are returned once and persist afterward.
- [ ] Coach recommendation returns a valid mode, operation, next goal, and reason.
- [ ] Save data persists offline with no backend, auth, analytics, ads, tracking, or cloud storage.
- [ ] App restart reloads the same new save data.

## Verification

- [ ] `npm run lint` passes.
- [ ] `npm run verify:game-brain` passes.
- [ ] `npm run verify:mobile` passes.

## Phase 2B UI Readiness Notes

- [ ] Timed and untimed exercise screens should be made no-scroll in the premium UI pass.
- [ ] New XP, level, mastery, achievement, challenge, and coach data should be surfaced without changing native app identity.
- [ ] Existing Capacitor `appId`, app name, package ID, and bundle ID must remain unchanged.

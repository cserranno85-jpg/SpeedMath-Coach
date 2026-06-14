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
- [ ] `npm run verify:ui-integration` passes.
- [ ] `npm run verify:layout` passes.
- [ ] `npm run verify:persistence` passes.
- [ ] `npm run verify:session-flow` passes.
- [ ] `npm run verify:mobile` passes.
- [ ] `npm run build` passes.
- [ ] `npm run verify:release` passes.

## Phase 2B UI Readiness Notes

- [ ] Timed and untimed exercise screens should be made no-scroll in the premium UI pass.
- [ ] New XP, level, mastery, achievement, challenge, and coach data should be surfaced without changing native app identity.
- [ ] Existing Capacitor `appId`, app name, package ID, and bundle ID must remain unchanged.

## Phase 2B Premium UI Integration QA

- [ ] Splash renders full-screen with premium gradient, lightning-clock mark, app name, and animated blue/gold/violet loading line.
- [ ] Onboarding shows exactly 3 slides: `Train Your Brain Every Day.`, `Smart. Adaptive. Personalized for You.`, and `Track Progress. See Results.`
- [ ] Onboarding completion persists through `speedMathSaveDataV2` and is skipped after app restart.
- [ ] Home uses real XP, level, current streak, accuracy, solved count, active challenge progress, and local coach recommendation data.
- [ ] Practice Modes shows Quick Drill, Focus Mode, Challenge, and Custom cards with real preference-backed topic/difficulty controls.
- [ ] Timed Practice starts a real Phase 2A session and uses generated `MathProblem.choices` from the typed engine.
- [ ] Timed Practice fits without vertical document scrolling on small Android phone, large Android phone, iPhone, iPad, and Android tablet viewports.
- [ ] Untimed Practice starts a real Phase 2A session and uses generated problems from the typed engine.
- [ ] Untimed Practice fits without vertical document scrolling on small Android phone, large Android phone, iPhone, iPad, and Android tablet viewports.
- [ ] Answer submission records typed `AnswerAttempt` entries with correctness and response time.
- [ ] Correct answer feedback includes green/cyan pulse and does not rely only on color.
- [ ] Wrong answer feedback includes warm red/orange shake and does not rely only on color.
- [ ] Session end creates a real `SessionSummary` with score, XP, accuracy, counts, streak, average time, badges, and challenges.
- [ ] Results shows real score ring, XP earned, level progress, stars, accuracy, correct count, time, unlocked badge reveal, and completed challenge reveal.
- [ ] XP and level changes persist after app restart.
- [ ] Topic mastery updates after sessions and renders as real mastery bars.
- [ ] Challenges update after sessions for Daily Spark, Speed Demon, Perfect Run, Weekly Climb, Focus Builder, and Weak Spot Fix.
- [ ] Achievements unlock after valid requirements, locked achievements appear as silhouettes, and hidden achievements do not reveal details before unlock.
- [ ] Coach screen uses local `coachEngine` output for motivation, recommended mode, topic, next goal, and reason.
- [ ] Progress charts use real session history and show strongest topic, weakest topic, level progress, and trend.
- [ ] Profile uses real save data for level, XP progress, lifetime solved, accuracy, streak, best streak, and top badges.
- [ ] Settings preferences persist for sound, haptics, music, reduced motion, larger text, and timer duration.
- [ ] Reset progress requires confirmation and recovers to safe default save data.
- [ ] Corrupted save data recovers safely without crashing.
- [ ] Legacy local progress remains migration-safe.
- [ ] Offline restart reloads the same progress, preferences, onboarding state, challenges, achievements, and coach basis.
- [ ] Android phone layout has no clipped nav, header, or exercise controls.
- [ ] Android tablet layout remains centered and does not stretch awkwardly.
- [ ] iPhone layout respects safe areas and no-scroll exercise screens.
- [ ] iPad layout respects safe areas and keeps exercise controls visible.
- [ ] No backend, auth, ads, analytics, tracking, paid service, or unnecessary permission was introduced.
- [ ] Native Android/iOS identity files remain unchanged.

## Phase 2C Regression QA

- [ ] `npm run verify:ui-integration` passes and confirms the visible UI still imports/uses the local game brain, persistence helpers, adaptive engine, coach engine, challenge engine, achievement engine, and typed session flow.
- [ ] `npm run verify:layout` passes and confirms timed/untimed exercise routes keep the no-scroll dynamic viewport layout protections.
- [ ] `npm run verify:persistence` passes and confirms missing/corrupt/legacy storage, onboarding, preferences, XP/level, achievements, challenges, session history, reset behavior, and schema version handling.
- [ ] `npm run verify:session-flow` passes and confirms timed and untimed local sessions progress through generated problems, correct/incorrect answers, summary creation, progress, challenge updates, achievement checks, coach recommendations, save, and reload.
- [ ] `npm run verify:release` passes before release upload.
- [ ] Manual real-device Android phone pass is still required.
- [ ] Manual real-device Android tablet pass is still required.
- [ ] Manual iPhone pass is still required.
- [ ] Manual iPad pass is still required.
- [ ] No-scroll timed and untimed exercise checks on real devices are still required.
- [ ] Visual screenshot review is still required before store upload.

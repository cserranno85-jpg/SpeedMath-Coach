# SpeedMath Device QA Packet

Use this packet for real-device QA after `npm run verify:release`, Capacitor sync, and Android debug build readiness checks pass.

## Build Inputs

- App name: `SpeedMath Coach`
- App ID / package / bundle ID: `com.caivratech.speedmathcoach`
- Android QA build type: debug APK only
- iOS QA build path: TestFlight from a valid macOS/Xcode or GitHub Actions build
- Network mode: offline-first; no account, auth, ads, analytics, or backend service required

## Android Phone QA

1. Build or retrieve the debug APK from `android/app/build/outputs/apk/debug/app-debug.apk`.
2. Install on a phone with `adb install -r android/app/build/outputs/apk/debug/app-debug.apk`.
3. Launch SpeedMath Coach from the app icon.
4. Complete onboarding and confirm the home screen loads.
5. Start timed practice and confirm no document/page scroll, all answer choices are tappable, timer is visible, and back/finish controls are reachable.
6. Start untimed practice and confirm no document/page scroll, all answer choices are tappable, progress is visible, and finish is reachable.
7. Submit correct and wrong answers and confirm non-color feedback appears.
8. Finish a session and confirm results show score, XP, stars, and real session values.
9. Open Challenges and confirm cards are readable, progress bars fit, and `Go` actions start practice.
10. Open Achievements and confirm locked/unlocked badges are readable.
11. Open Progress and confirm chart or empty state, mastery rows, and badge link render cleanly.
12. Open Coach and confirm recommendation text uses real local progress state.
13. Open Profile and confirm level, XP, stats, badges, and Settings button fit.
14. Open Settings and toggle sound, haptics, reduced motion, larger text, and timer values.
15. Force close and restart the app; confirm onboarding is skipped and progress/settings persist.
16. Enable airplane mode and repeat a short timed practice; confirm gameplay and persistence still work.

## Android Tablet QA

Run the Android phone checklist, plus:

1. Confirm home/profile/coach/challenges use tablet spacing and do not look like a stretched phone.
2. Confirm timed and untimed practice remain centered, no-scroll, and tappable in portrait.
3. Confirm bottom nav does not clip or overlap content.
4. Confirm charts, mastery rows, challenge cards, and badge grid scale cleanly.

## iPhone QA

1. Install through TestFlight after a valid iOS build.
2. Launch SpeedMath Coach and confirm the splash/onboarding safe areas are correct.
3. Complete onboarding and verify persistence after app restart.
4. Start timed practice and confirm no document/page scroll, answer choices are tappable, timer is visible, and top controls avoid the notch/status area.
5. Start untimed practice and confirm no document/page scroll, answer choices are tappable, and finish remains reachable above the home indicator.
6. Submit correct/wrong answers and confirm non-color feedback appears.
7. Finish a session and verify XP, results, challenge progress, achievement state, and coach recommendation.
8. Toggle reduced motion and larger text in Settings and repeat timed/untimed layout checks.
9. Enable airplane mode and confirm a short practice session works offline.

## iPad QA

Run the iPhone checklist, plus:

1. Confirm tablet dashboards avoid a stretched-phone appearance.
2. Confirm safe areas are respected in portrait and landscape if rotation is allowed by the installed build.
3. Confirm timed and untimed practice controls remain visible and tappable.
4. Confirm progress charts and challenge cards remain readable at iPad widths.

## Pass / Fail Table

| Device | OS Version | Build | Area | Expected Result | Pass/Fail | Notes |
| --- | --- | --- | --- | --- | --- | --- |
| Android phone |  | Debug APK | Onboarding | Completes once and persists |  |  |
| Android phone |  | Debug APK | Timed practice | No-scroll, controls visible, answers tappable |  |  |
| Android phone |  | Debug APK | Untimed practice | No-scroll, controls visible, answers tappable |  |  |
| Android phone |  | Debug APK | Results | Real score, XP, rewards, and session values |  |  |
| Android phone |  | Debug APK | Offline restart | Save data persists without network |  |  |
| Android tablet |  | Debug APK | Tablet layout | Centered/wide layout, not stretched phone |  |  |
| Android tablet |  | Debug APK | Timed/untimed | No-scroll and tappable in portrait |  |  |
| iPhone |  | TestFlight | Safe areas | Notch/home indicator do not cover controls |  |  |
| iPhone |  | TestFlight | Timed/untimed | No-scroll and tappable |  |  |
| iPhone |  | TestFlight | Persistence/offline | Saves and plays offline |  |  |
| iPad |  | TestFlight | Tablet layout | Not stretched phone; safe areas respected |  |  |
| iPad |  | TestFlight | Timed/untimed | No-scroll and tappable |  |  |

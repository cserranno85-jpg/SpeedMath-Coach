# SpeedMath Coach — Figma Focus v2 UI/UX design-to-code mapping

**Review-only UI stack:** `feat/speedmath-figma-ui-refresh-20261112` (base: `fix/gpcg-001-privacy-backup-20261112`). This document records a design direction and candidate implementation, **not** an authorization to merge or publish.

**Editable Figma source:** https://www.figma.com/design/OqDxbXsdkOz4SY88GZ32TP

## Five screen concepts and implementation owners

| Figma screen | Implementation | Behavioral owner |
| --- | --- | --- |
| 01 Home / daily momentum | `Menu.tsx` DASHBOARD + `PremiumShell.tsx` | `App.tsx` navigation/game start and local history |
| 02 Practice / session setup | `Menu.tsx` SETTINGS | `App.tsx` settings normalization; `types.ts` enumerations |
| 03 Gameplay / answer flow | `Game.tsx` existing logic + `index.css` surface styling | `Game.tsx` question, scoring, timer, input |
| 04 Results / celebration | `GameOver.tsx` + `PremiumCTA` | `App.tsx` session completion callback |
| 05 Progress / insight | `Stats.tsx` existing chart/achievement logic + `PremiumShell.tsx` | Local `speedMathProgress` and achievement evaluators |

## Design system

- Base #040C24; raised surface #10254B; secondary surface #0B1B3A.
- Primary CTA #61E4FF, reward accent #FFC768, semantic border #2B5E87.
- High-contrast Roboto-like platform sans-serif typography; 48–60px minimum action surfaces.
- Five persistent main destinations where applicable: Home, Practice, Progress, Badges, Profile.
- Gameplay deliberately uses the entire available screen without the bottom destination bar.
- The actual product artwork and Pi-bot remain sourced from the existing repository rather than regenerated or downloaded via a third-party builder.
- Reduced motion honored, and no additional SDK, app builder, or hosted runtime was introduced.

## Release and review safeguards

- This is intentionally a **stacked PR** against compliance PR #11. Do not merge it ahead of that base.
- App ID, versionCode (8), JavaScript game mechanics, Android signing configuration, and Play publication authority are outside this PR.
- The verified AAB from run #43281681049 predates the compliance and UI PRs. It does **not** include this work.
- User decided device-to-device progress restoration is not a release blocker; do not introduce data migration work into this UI PR. Existing on-device storage keys remain unchanged where used.
- Before any release: visually compare Figma layouts to an Android build on narrow and tall devices; inspect keypad hit areas, scrolling under the nav, orientation, reduced motion and TalkBack; run CI and requalify the exact signed AAB; confirm current Play Console policy/track requirements.

# SpeedMath Phase 2D Visual Polish

## Visual System Refinements

- Tightened the premium navy/indigo glass system with stronger blue/cyan active states, gold reward emphasis, violet challenge hierarchy, and clearer green/red answer feedback.
- Added visual hooks for home, challenges, coach, profile, chart, XP reveal, and challenge action hierarchy while keeping all data connected to the local save/session/challenge/achievement/coach systems.
- Improved locked achievement treatment, challenge card readability, bottom-nav active glow, button hover/press states, and chart legend clarity.

## Responsive Rules

- Timed and untimed practice remain viewport-bound with `100dvh`, safe-area padding, grid zones, `clamp()` sizing, and hidden overflow on exercise routes.
- Compact-height rules reduce topbar/footer height, ring size, problem text, answer button height, and panel padding for short phones.
- Tablet rules use centered two-column dashboard layouts and wider challenge/coach grids instead of stretching single-column phone layouts.
- Small-phone rules preserve bottom nav labels, stat tiles, and exercise controls around 360px width.

## Exercise Screen Layout Notes

- Exercise screens keep three stable zones: top controls, flexible problem/answer area, and footer stats.
- Answer choices keep bounded minimum heights and semantic labels.
- Correct and wrong answers now include non-color symbols on the selected buttons plus stable live feedback text in the problem panel.
- The exercise footer includes safe-area clearance and remains outside the bottom navigation flow because exercise routes omit bottom nav.

## Accessibility Notes

- Visible focus states remain available for buttons and links.
- Reduced motion is respected through both the system media query and the app preference data attribute.
- Larger text mode continues to use the existing root font-size preference while the exercise layout uses bounded responsive sizing to avoid clipping.
- Tap targets remain at or above practical mobile sizes for primary actions, nav, answers, and finish/back controls.

## Large Chunk Warning Decision

- The previous Vite build produced one JavaScript chunk over 500 kB after minification.
- Phase 2D adds `manualChunks` in `vite.config.ts` for charts, Motion, icons, and shared vendor code.
- This removes the chunk-size warning without adding dependencies or refactoring route flow.

## Remaining Manual Device QA

- Small Android phone visual pass.
- Large Android phone visual pass.
- Android tablet visual pass.
- iPhone safe-area pass.
- iPad safe-area pass.
- Timed and untimed no-scroll real-device pass.
- Reduced motion and larger text preference pass.
- Final screenshot review before store upload.

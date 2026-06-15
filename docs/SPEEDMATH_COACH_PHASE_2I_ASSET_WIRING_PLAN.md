# SpeedMath Coach Phase 2I Asset Wiring Plan

## Objective

Wire the completed Phase 2H premium UI asset pack into SpeedMath Coach so the live app moves toward the approved cosmic/robot-coach mockup direction.

## Source Assets

All UI assets are located in:

src/assets/ui/

## Branching Recommendation

Create Phase 2I from the completed Phase 2H asset branch after the Phase 2H closeout commit.

Recommended branch:

speedmath-v1.2-phase-2i-asset-wiring-v1

## Implementation Strategy

### 1. Centralize Asset Imports

Create or update:

src/assets/uiAssetRegistry.ts

The registry should export named references for:

- Mascots
- Backgrounds
- FX overlays
- Operation icons
- Challenge icons
- Badge assets
- Button glow assets
- Panel/card assets
- Splash/icon references if useful in the web UI

### 2. Wire Assets by Screen

Home screen:
- Cosmic home background
- Robot full-body or waving coach
- Math particles / glow overlays
- Mode icons
- Challenge icons
- Premium panel/card treatments

Exercise screen:
- Cosmic exercise background
- Operation icons
- Timed/untimed icons
- Exercise card/panel treatment
- Subtle FX only where readability is preserved

Profile screen:
- Robot head avatar
- Badge grid/reward section
- Cosmic profile background
- Stats card / premium panel treatments
- Gold/cyan achievement visuals

Challenge / Daily area:
- Timed challenge icon
- Daily challenge icon
- Badge/reward visuals
- Gold reward accents

### 3. Styling Rules

- Premium cosmic blue/purple base.
- Cyan for active/focus/energy states.
- Gold for rewards, badges, streaks, and achievement moments.
- Purple as supporting accent.
- Robot is mascot only, not the primary logo.
- Lightning-speedometer remains the logo direction.
- Avoid rainbow card palettes.
- Purple as supporting accent.
- Robot is mascot only, not the primary logo.
- Lightning-speedometer remains the logo direction.
- Avoid rainbow card palettes.
- Avoid visual clutter.
- Keep math readability first.

### 4. Technical Guardrails

- Do not change math generation.
- Do not change scoring.
- Do not change timer behavior except visual presentation.
- Do not change app routing unless needed for asset placement.
- Do not add remote asset loading.
- Do not add paid services.
- Do not add backend/auth/ads/analytics.
- Do not modify native Android/iOS folders unless explicitly required later.
- Do not change package or lockfiles unless absolutely necessary.
- Avoid case-sensitive filename mistakes.

### 5. Verification Commands

Run after implementation:

npm run lint
npm run verify:release-readiness
npm run verify:release
npm run verify:mobile

If Capacitor sync is needed:

npx cap sync android
npx cap sync ios

### 6. Definition of Done

- Asset registry exists and is used by UI components.
- Main screens use Phase 2H assets.
- Badges appear in profile/rewards area.
- Mascot appears naturally without overpowering the UI.
- Operation/challenge icons appear where useful.
- Button/panel/glow assets are used where appropriate.
- No gameplay/math regression.
- All verification scripts pass.
- Git working tree is clean.

## Recommended Commit Message

feat: wire Phase 2H assets into premium UI

## Final Phase 2I Prep Status

PHASE_2I_ASSET_WIRING_READY

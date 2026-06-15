# SpeedMath Coach — Expanded Asset Manifest

**Phase:** 2H.1  
**Purpose:** Lock the complete premium UI asset list before Phase 2H.2 asset generation and Phase 2I implementation.  
**App:** SpeedMath Coach  
**Bundle/App ID:** `com.caivratech.speedmathcoach`  
**Brand Direction:** Premium cosmic blue/purple UI with cyan glow, gold rewards, clean readable math-coach styling, mascot support, and 95%+ mock-up similarity target.

---

## 1. Asset Rules

- Use **PNG** for raster UI, mascot, icon, splash, badge, and glow assets.
- Use transparent background where the asset is meant to be layered over app UI.
- Do **not** add text to icon foreground/background layers unless explicitly listed.
- Do **not** use the robot mascot as the primary logo.
- Primary logo remains the **lightning-speedometer emblem**.
- Robot is mascot/coach/avatar only.
- Avoid rainbow card palettes. Use blue/cyan/gold/purple premium system.
- Keep all filenames lowercase, hyphenated, and stable.
- For Phase 2H, place all approved PNG source assets in `src/assets/ui/` as the staging/source-of-truth folder.
- Do not split the 9 baseline PNGs into `branding/`, `mascot/`, or `splash/` during Phase 2H. Reorganization is optional only after implementation is stable.
- Capacitor/app-store icon and splash generation may later copy/derive files from `src/assets/ui/` into platform-specific locations, but the Phase 2H source files stay in `src/assets/ui/`.
- Do not commit licensed/commercial font files unless the license explicitly allows redistribution and app embedding.

---

## 2. Approved Core Brand Assets

| Status | Filename | Type | Size | Background | Purpose |
|---|---|---:|---:|---|---|
| Required | `speedmath-icon-safe-area-1024.png` | PNG | 1024×1024 | Opaque | Primary store/app icon source with safe area for Google Play circle crop. |
| Required | `speedmath-icon-foreground.png` | PNG | 1024×1024 preferred | Transparent | Adaptive icon foreground emblem only. |
| Required | `speedmath-icon-background.png` | PNG | 1024×1024 preferred | Opaque | Adaptive icon background plate only, no emblem/text/robot. |
| Required | `splash-dark-premium.png` | PNG | 2732×2732 preferred | Opaque | Main premium splash source. Dark cosmic background, emblem, wordmark, mascot, cyan/gold/purple energy. |
| Optional | `splash-light-minimal.png` | PNG | 2732×2732 preferred | Opaque | Light fallback splash source with logo + wordmark only. |

---

## 3. Approved Mascot Assets

| Status | Filename | Type | Size | Background | Purpose |
|---|---|---:|---:|---|---|
| Required | `robot-head-avatar.png` | PNG | 1024×1024 preferred | Transparent | Profile/avatar robot head: white/silver shell, large blue eyes, cyan glow, dark face panel. |
| Required | `robot-full-body-coach.png` | PNG | 1536×2048 preferred | Transparent | Main mascot: white/silver body, blue accents, dark blue cape, gold lightning medallion. |
| Required | `robot-waving-coach.png` | PNG | 1536×2048 preferred | Transparent | Friendly onboarding/home coach pose with right-hand wave. |
| Required | `robot-pointing-coach.png` | PNG | 1536×2048 preferred | Transparent | Instruction/tip/result coach pose with right hand pointing. |

---

## 4. Expanded Premium UI Assets

### 4.1 Glowing Edge Buttons

| Status | Filename | Type | Size | Background | Purpose |
|---|---|---:|---:|---|---|
| Required | `button-primary-glow.png` | PNG | 1024×256 | Transparent | Cyan/gold premium primary CTA button frame. Used for Start, Continue, Submit, Next. |
| Required | `button-secondary-glow.png` | PNG | 1024×256 | Transparent | Purple/cyan secondary button frame. Used for Practice, Settings, Back. |
| Required | `button-danger-glow.png` | PNG | 1024×256 | Transparent | Red/magenta warning button frame for reset/quit confirmations only. |
| Required | `button-disabled-glow.png` | PNG | 1024×256 | Transparent | Muted inactive button frame. |
| Optional | `button-small-pill-glow.png` | PNG | 512×160 | Transparent | Compact pill button for chips, filters, and difficulty selectors. |

**Implementation note:** These should be used as scalable decorative frames or nine-slice-style backgrounds where possible. The app should still render live text through CSS/React for accessibility and localization.

---

### 4.2 Cards, Panels, and Containers

| Status | Filename | Type | Size | Background | Purpose |
|---|---|---:|---:|---|---|
| Required | `panel-cosmic-card.png` | PNG | 1200×900 | Transparent | Main reusable card/panel background with subtle glassmorphism and cyan rim light. |
| Required | `panel-stats-card.png` | PNG | 1200×700 | Transparent | Stats/progress card with premium gradient edge. |
| Required | `panel-exercise-card.png` | PNG | 1200×900 | Transparent | Exercise problem container; must stay highly readable. |
| Optional | `panel-modal-glow.png` | PNG | 1200×900 | Transparent | Modal/dialog frame for confirmations, streak popups, badge unlocks. |
| Optional | `panel-navbar-glow.png` | PNG | 1200×220 | Transparent | Bottom/top navigation glow plate if app uses custom nav chrome. |

---

### 4.3 Badges and Achievement Assets

| Status | Filename | Type | Size | Background | Purpose |
|---|---|---:|---:|---|---|
| Required | `badge-first-solve.png` | PNG | 1024×1024 | Transparent | Achievement badge for first completed exercise. |
| Required | `badge-streak-3.png` | PNG | 1024×1024 | Transparent | 3-day streak badge. |
| Required | `badge-streak-7.png` | PNG | 1024×1024 | Transparent | 7-day streak badge. |
| Required | `badge-speed-burst.png` | PNG | 1024×1024 | Transparent | Fast answer / speed milestone badge. |
| Required | `badge-perfect-round.png` | PNG | 1024×1024 | Transparent | Perfect round badge. |
| Required | `badge-accuracy-90.png` | PNG | 1024×1024 | Transparent | 90%+ accuracy badge. |
| Required | `badge-focus-master.png` | PNG | 1024×1024 | Transparent | Timed/untimed focus milestone badge. |
| Required | `badge-lightning-master.png` | PNG | 1024×1024 | Transparent | High-tier gold/cyan mastery badge. |
| Required | `badge-locked.png` | PNG | 1024×1024 | Transparent | Locked/hidden badge state. |
| Optional | `badge-unlock-burst.png` | PNG | 1536×1536 | Transparent | Radial glow/confetti burst layered behind newly unlocked badge. |

**Badge style:** Gold reward metal, cyan rim light, subtle purple shadow, clear center symbol, no small unreadable text.

---

### 4.4 Backgrounds and Decorative FX

| Status | Filename | Type | Size | Background | Purpose |
|---|---|---:|---:|---|---|
| Required | `bg-cosmic-home.png` | PNG | 1536×2732 | Opaque | Main home/menu background. |
| Required | `bg-cosmic-exercise.png` | PNG | 1536×2732 | Opaque | Exercise screen background, darker and less distracting. |
| Required | `bg-cosmic-profile.png` | PNG | 1536×2732 | Opaque | Profile/stats background. |
| Optional | `fx-cyan-orb-glow.png` | PNG | 1024×1024 | Transparent | Decorative cyan glow orb. |
| Optional | `fx-gold-spark-burst.png` | PNG | 1024×1024 | Transparent | Reward sparkle burst. |
| Optional | `fx-purple-energy-ring.png` | PNG | 1024×1024 | Transparent | Modal/reward background ring. |
| Optional | `fx-math-particles.png` | PNG | 1536×1536 | Transparent | Subtle floating math symbols/particles overlay. |

---

### 4.5 Exercise/Challenge Icons

| Status | Filename | Type | Size | Background | Purpose |
|---|---|---:|---:|---|---|
| Required | `icon-addition.png` | PNG | 512×512 | Transparent | Addition exercise category. |
| Required | `icon-subtraction.png` | PNG | 512×512 | Transparent | Subtraction exercise category. |
| Required | `icon-multiplication.png` | PNG | 512×512 | Transparent | Multiplication exercise category. |
| Required | `icon-division.png` | PNG | 512×512 | Transparent | Division exercise category. |
| Required | `icon-timed-challenge.png` | PNG | 512×512 | Transparent | Timed challenge mode. |
| Required | `icon-untimed-practice.png` | PNG | 512×512 | Transparent | Untimed practice mode. |
| Optional | `icon-daily-challenge.png` | PNG | 512×512 | Transparent | Daily challenge mode if implemented. |

---

## 5. Typography / Font Manifest

### 5.1 Default Recommendation

Use system/UI-safe fonts first unless a redistributable font is selected and licensed properly.

Recommended stack:

```css
font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
```

### 5.2 Optional Custom Font Files

| Status | Filename | Format | Purpose | License Requirement |
|---|---|---|---|---|
| Optional | `Inter-Regular.ttf` | TTF | Body text if bundled. | Must allow app embedding/redistribution. |
| Optional | `Inter-SemiBold.ttf` | TTF | Buttons, labels, cards. | Must allow app embedding/redistribution. |
| Optional | `Inter-Bold.ttf` | TTF | Headers, score, achievements. | Must allow app embedding/redistribution. |
| Optional | `Orbitron-Bold.ttf` | TTF | Limited premium display headings only. | Must allow app embedding/redistribution. |

**Important:** Do not include paid, unknown, or unlicensed font files in the repo. If using Google Fonts, document the exact font family, license, source, and downloaded weights in `docs/FONT_LICENSES.md`.

---

## 6. Asset Placement Map

Approved Phase 2H staging path:

```text
src/assets/ui/
```

The original 9 approved PNGs must remain here for Phase 2H:

```text
src/assets/ui/robot-head-avatar.png
src/assets/ui/robot-full-body-coach.png
src/assets/ui/robot-waving-coach.png
src/assets/ui/robot-pointing-coach.png
src/assets/ui/speedmath-icon-safe-area-1024.png
src/assets/ui/speedmath-icon-foreground.png
src/assets/ui/speedmath-icon-background.png
src/assets/ui/splash-dark-premium.png
src/assets/ui/splash-light-minimal.png
```

All newly generated expanded Phase 2H PNG assets should also be staged in `src/assets/ui/` for now:

```text
src/assets/ui/button-primary-glow.png
src/assets/ui/button-secondary-glow.png
src/assets/ui/button-danger-glow.png
src/assets/ui/button-disabled-glow.png
src/assets/ui/button-small-pill-glow.png
src/assets/ui/panel-cosmic-card.png
src/assets/ui/panel-stats-card.png
src/assets/ui/panel-exercise-card.png
src/assets/ui/panel-modal-glow.png
src/assets/ui/panel-navbar-glow.png
src/assets/ui/badge-first-solve.png
src/assets/ui/badge-streak-3.png
src/assets/ui/badge-streak-7.png
src/assets/ui/badge-speed-burst.png
src/assets/ui/badge-perfect-round.png
src/assets/ui/badge-accuracy-90.png
src/assets/ui/badge-focus-master.png
src/assets/ui/badge-lightning-master.png
src/assets/ui/badge-locked.png
src/assets/ui/badge-unlock-burst.png
src/assets/ui/bg-cosmic-home.png
src/assets/ui/bg-cosmic-exercise.png
src/assets/ui/bg-cosmic-profile.png
src/assets/ui/fx-cyan-orb-glow.png
src/assets/ui/fx-gold-spark-burst.png
src/assets/ui/fx-purple-energy-ring.png
src/assets/ui/fx-math-particles.png
src/assets/ui/icon-addition.png
src/assets/ui/icon-subtraction.png
src/assets/ui/icon-multiplication.png
src/assets/ui/icon-division.png
src/assets/ui/icon-timed-challenge.png
src/assets/ui/icon-untimed-practice.png
src/assets/ui/icon-daily-challenge.png
```

Optional font files, only if legally redistributable, should be placed here:

```text
src/assets/fonts/
```

Repo documentation target:

```text
docs/SPEEDMATH_COACH_EXPANDED_ASSET_MANIFEST_Phase_2H_1.md
docs/FONT_LICENSES.md
```

---

## 7. Phase 2H.1 Decision Lock

For the current implementation cycle, `src/assets/ui/` is the approved source/staging folder for the original 9 PNGs and all expanded Phase 2H PNGs. Do not move the original 9 PNGs before Phase 2I.

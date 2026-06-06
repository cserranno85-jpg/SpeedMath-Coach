# SpeedMath Coach

SpeedMath Coach is an offline/local-only mental math practice application designed to help users build faster arithmetic habits, sharpen logical agility, and keep minds active through timed drills and clean, instant feedback. 

All stats, high scores, and activity logs are stored purely locally on the user's device for 100% privacy and full offline availability.

## Features

- **Drills & Custom Operations:** Set addition, subtraction, multiplication, division, or mixed parameters.
- **Adaptive Speed Run Mode:** Answer math questions under pressure with a racing progress bar.
- **Instant Response Feedback:** Highly optimized responsive layout with large touch targets.
- **Private local analytics:** Track daily counts, accuracy percentages, and average solution speeds over time.

---

## Technical Stack & Configuration

The application is built using standard:
- **React (Vite)** with TypeScript
- **Tailwind CSS** for design system responsiveness
- **Capacitor CLI** for iOS (Xcode) and Android (Android Studio) shell synchronization

### Prerequisites

You need standard Node.js installed locally to build and run the development pipeline. No external backend databases or AI credentials (like Gemini or Google AI Studio keys) are required.

### Installation

1. Install project dependencies securely:
   ```bash
   npm install
   ```

2. Run the local development server:
   ```bash
   npm run dev
   ```

---

## Mobile Build Pipeline

### 1. Verification
Before syncing with Capacitor, run the custom mobile readiness verifier:
```bash
npm run verify:mobile
```
The script validates your bundle IDs, image assets, and configuration files to ensure there are no native compilation or App Store review blockers.

### 2. Generate Native Brand Assets
To automatically generate a full suite of responsive, valid, binary-safe PNG icon and splash screen resources:
```bash
npm run generate:brand-assets
npx @capacitor/assets generate
```

### 3. Build & Capacitor Sync

For Android:
```bash
# Sync web assets and Capacitor configuration to the Android shell
npm run sync:android
```

For iOS (Requires macOS / Xcode for compilation):
```bash
# Sync web assets and Capacitor configuration to the iOS shell
npm run sync:ios
```

---

## Local Development Verification
You can also run standard inspection scripts to confirm Capacitor sync integrity and package parameters:
- `npx cap doctor` - Validates cocoa pods, gradle versions, and SDK constraints
- `npm run verify:mobile` - Validates PNG headers, bundle IDs and MainActivity mappings

# Mobile Build Guide for ArithSprint (iOS & Android)

This guide documents how to build **ArithSprint** for **iOS (Xcode)** and **Android (.aab)** using Capacitor. Since this sandbox environment runs on Linux, **native compilation (Xcode/iOS builds) must be performed on a macOS machine**, or through cloud build services like EAS/Appflow. All native shell project structures have been correctly initialized and synced in this project (`/ios` and `/android`).

---

## 🛠️ Prerequisites

To build and run the app on physical and virtual devices, you will need the following tools installed on your development machine:

### For iOS Builds (macOS only)
1. **macOS** (Required for Xcode)
2. **Xcode** (v15+ recommended, installed from the Mac App Store)
3. **Xcode Command Line Tools**
   ```bash
   xcode-select --install
   ```
4. **Cocoapods** (if using plugins that require CocoaPods, though Capacitor 6+ uses Swift Package Manager by default)

### For Android Builds (.aab / .apk)
1. **Java Development Kit (JDK)** (JDK 17 recommended)
2. **Android Studio** (with the correct SDK, Android SDK Command-line Tools, and virtual devices configured)

---

## ⚡ Unified Developer Workflow

Whether you are targeting iOS or Android, the build pipeline follows these steps:

### 1. Build the Web Application
First, compile your production-ready React web assets:
```bash
npm run build
```
This writes the static assets (HTML, CSS, JS) into the `/dist` directory.

### 2. Synchronize Assets with Native Projects
Copy your built web assets and sync plugins with the native container frameworks:
```bash
npx cap sync
```
*(Combined Shortcut)*: In this project's `package.json`, you can run both steps with a single command:
```bash
npm run build:mobile
```

---

##  Fulfilling iOS / Xcode Builds (Generating .ipa / Simulator Build)

Because compiling iOS apps requires a compiler with Apple's proprietary SDKs, you must perform these steps on a macOS system:

### Step 1: Clone or Copy Your Code to your Mac
Download or export this project's ZIP/GitHub repository and open it on your macOS machine. Ensure you've run `npm install` inside the project folder.

### Step 2: Open the Project in Xcode
You can open the workspace directly using Capacitor's helper CLI:
```bash
npx cap open ios
```
Alternatively, open the Xcode Workspace directly from finder:
- **Path**: `ios/App/App.xcworkspace`

### Step 3: Configure Signing & Team
For Xcode to archive and bundle your iOS app, you must configure signing:
1. In Xcode, select the root **App** project on the left sidebar.
2. Select the **App** target underneath targets.
3. Open the **Signing & Capabilities** tab.
4. Check **"Automatically manage signing"**.
5. Select your **Team** (Apple Developer Account). If you don't have a paid account, you can select your Personal Team for free testing on custom devices.
6. Under **Bundle Identifier**, ensure it's set to `com.caivratech.arithsprint` (or change to a domain you own).

### Step 4: Archive and Export (.ipa file)
To prepare your app for TestFlight or App Store:
1. In Xcode, set the active scheme to **Any iOS Device (arm64)** from the top selection dropdown.
2. Go to the menu bar and select **Product > Archive**.
3. Once the archive succeeds, the Organizer window will open:
   - Click **Distribute App** on the right side.
   - Choose **TestFlight & App Store** (or **Ad Hoc** for local enterprise testing).
   - Follow the wizard to sign and upload your build to App Store Connect.

---

## 🤖 Fulfilling Android Builds (Generating .aab for Google Play)

To build your Android App Bundle (`.aab`) to release on Google Play:

### Step 1: Open the Project in Android Studio
Use the Capacitor CLI helper or open Android Studio:
```bash
npx cap open android
```
Or open the `/android` directory inside Android Studio.

### Step 2: Generate Signed Bundle (.aab)
1. Go to **Build > Generate Signed Bundle / APK...**
2. Select **Android App Bundle** and click **Next**.
3. Choose/Create your secure key store credential (.jks path) and enter your passwords.
4. Select the build variant **release**.
5. Click **Finish**.

Your signed `.aab` will be generated in `android/app/release/app-release.aab` and is ready for upload to the Google Play Console!

---

## 🔄 Updating Custom Icons & Launch Screens

To replace the default Capacitor placeholder assets with your custom game branding:

1. Place your native high-resolution logo or icon file at `/assets/logo.png`.
2. Run the generator script configured in your `package.json`:
   ```bash
   npm run generate:icons
   ```
   This will automatically resize and copy your logo into all iOS and Android asset catalogs with the correct scale rules (`1x, 2x, 3x`).

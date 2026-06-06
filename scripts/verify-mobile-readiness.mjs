import fs from 'fs';
import path from 'path';

let failed = false;

function logSuccess(msg) {
  console.log(`\x1b[32m✔ SUCCESS: ${msg}\x1b[0m`);
}

function logError(msg) {
  console.log(`\x1b[31m❌ FAILURE: ${msg}\x1b[0m`);
  failed = true;
}

// 1. check capacitor.config.ts contains key names
try {
  const capConfig = fs.readFileSync('capacitor.config.ts', 'utf8');
  if (capConfig.includes('SpeedMath Coach') && capConfig.includes('com.caivratech.speedmathcoach')) {
    logSuccess('capacitor.config.ts contains correct appName and appId');
  } else {
    logError('capacitor.config.ts does not contain correct appName (SpeedMath Coach) or appId (com.caivratech.speedmathcoach)');
  }
} catch (err) {
  logError(`Failed to read capacitor.config.ts: ${err.message}`);
}

// 2. check android/app/build.gradle contains package id
try {
  const gradle = fs.readFileSync('android/app/build.gradle', 'utf8');
  if (gradle.includes('com.caivratech.speedmathcoach')) {
    logSuccess('android/app/build.gradle contains com.caivratech.speedmathcoach');
  } else {
    logError('android/app/build.gradle is missing com.caivratech.speedmathcoach');
  }
} catch (err) {
  logError(`Failed to read android/app/build.gradle: ${err.message}`);
}

// 3. check android MainActivity exists and package is correct
const mainActivityPath = 'android/app/src/main/java/com/caivratech/speedmathcoach/MainActivity.java';
if (fs.existsSync(mainActivityPath)) {
  try {
    const mainActivity = fs.readFileSync(mainActivityPath, 'utf8');
    if (mainActivity.includes('package com.caivratech.speedmathcoach;')) {
      logSuccess('MainActivity exists and has correct package header');
    } else {
      logError('MainActivity has incorrect package header');
    }
  } catch (err) {
    logError(`Failed to read MainActivity.java: ${err.message}`);
  }
} else {
  logError(`MainActivity.java is missing at expected path: ${mainActivityPath}`);
}

// 4. check ios pbxproj contains package id
try {
  const pbxproj = fs.readFileSync('ios/App/App.xcodeproj/project.pbxproj', 'utf8');
  if (pbxproj.includes('com.caivratech.speedmathcoach')) {
    logSuccess('ios project.pbxproj contains com.caivratech.speedmathcoach');
  } else {
    logError('ios project.pbxproj does not contain com.caivratech.speedmathcoach');
  }
} catch (err) {
  logError(`Failed to read project.pbxproj: ${err.message}`);
}

// 5. check ios Info.plist contains SpeedMath Coach
try {
  const plist = fs.readFileSync('ios/App/App/Info.plist', 'utf8');
  if (plist.includes('SpeedMath Coach')) {
    logSuccess('ios Info.plist contains SpeedMath Coach');
  } else {
    logError('ios Info.plist does not contain SpeedMath Coach');
  }
} catch (err) {
  logError(`Failed to read Info.plist: ${err.message}`);
}

// 6. Check for stale references
const staleReferences = [
  'ArithSprint',
  'com.caivratech.arithsprint',
  'com.speedmath.app',
  'My Google AI Studio App',
  'MathFlow',
  'GEMINI_API_KEY',
  'MAJOR_CAPABILITY_SERVER_SIDE_GEMINI_API'
];

function scanForStale(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fullPath.includes('node_modules') || fullPath.includes('.git') || fullPath.includes('dist') || fullPath.includes('build') || fullPath.includes('scripts')) {
      continue;
    }
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      scanForStale(fullPath);
    } else {
      // Avoid checking binary files for simple string matches to prevent false positives and process errors
      const ext = path.extname(file).toLowerCase();
      if (['.png', '.jpg', '.jpeg', '.webp', '.zip', '.jar', '.aar', '.aab', '.apk', '.pbxproj'].includes(ext)) {
        continue;
      }
      try {
        const content = fs.readFileSync(fullPath, 'utf8');
        for (const stale of staleReferences) {
          if (content.includes(stale)) {
            logError(`File "${fullPath}" contains stale reference: "${stale}"`);
          }
        }
      } catch (err) {
        // Skip files that cannot be read as text
      }
    }
  }
}

try {
  scanForStale('.');
} catch (err) {
  logError(`Failed during stale reference scanning: ${err.message}`);
}

// 7. Verify all .png files outside excluded dirs have valid header
function scanPngs(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fullPath.includes('node_modules') || fullPath.includes('.git') || fullPath.includes('dist') || fullPath.includes('build')) {
      continue;
    }
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      scanPngs(fullPath);
    } else if (file.toLowerCase().endsWith('.png')) {
      try {
        const buffer = fs.readFileSync(fullPath);
        const isValid = buffer.length >= 8 &&
          buffer[0] === 0x89 &&
          buffer[1] === 0x50 &&
          buffer[2] === 0x4e &&
          buffer[3] === 0x47 &&
          buffer[4] === 0x0d &&
          buffer[5] === 0x0a &&
          buffer[6] === 0x1a &&
          buffer[7] === 0x0a;
        if (isValid) {
          // quiet success
        } else {
          logError(`PNG file "${fullPath}" is corrupted! Hex: ${buffer.slice(0, 8).toString('hex')}`);
        }
      } catch (err) {
        logError(`Failed to read PNG file "${fullPath}": ${err.message}`);
      }
    }
  }
}

try {
  scanPngs('.');
} catch (err) {
  logError(`Failed during PNG verification scanning: ${err.message}`);
}

if (failed) {
  console.log('\n\x1b[31m❌ Verification failed. Please review the errors above.\x1b[0m\n');
  process.exit(1);
} else {
  console.log('\n\x1b[32m✔ Verification passed successfully. App is mobile build-ready!\x1b[0m\n');
  process.exit(0);
}

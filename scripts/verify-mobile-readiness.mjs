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

function readPngMetadata(filePath) {
  const buffer = fs.readFileSync(filePath);
  const isPng = buffer.length >= 29 &&
    buffer[0] === 0x89 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x4e &&
    buffer[3] === 0x47 &&
    buffer[4] === 0x0d &&
    buffer[5] === 0x0a &&
    buffer[6] === 0x1a &&
    buffer[7] === 0x0a;

  if (!isPng) {
    return { isPng: false };
  }

  return {
    isPng: true,
    width: buffer.readUInt32BE(16),
    height: buffer.readUInt32BE(20),
    bitDepth: buffer[24],
    colorType: buffer[25],
  };
}

function pngColorTypeHasAlpha(colorType) {
  return colorType === 4 || colorType === 6;
}

function verifyFinalIconSource(filePath) {
  if (!fs.existsSync(filePath)) {
    logError(`${filePath} is missing`);
    return;
  }

  try {
    const metadata = readPngMetadata(filePath);
    if (!metadata.isPng) {
      logError(`${filePath} is not a valid PNG`);
      return;
    }

    if (metadata.width !== 1024 || metadata.height !== 1024) {
      logError(`${filePath} must be 1024x1024, found ${metadata.width}x${metadata.height}`);
    }

    if (pngColorTypeHasAlpha(metadata.colorType)) {
      logError(`${filePath} must be RGB/no-alpha PNG, found PNG color type ${metadata.colorType}`);
    }
  } catch (err) {
    logError(`Failed to verify ${filePath}: ${err.message}`);
  }
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

// 7. Verify final icon source assets
verifyFinalIconSource('assets/icon.png');
verifyFinalIconSource('assets/speedmath-ios-icon-correct.png');

// 8. Verify PWA manifest icon references point to real PNG files
try {
  const manifestPath = 'src/manifest.webmanifest';
  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
  for (const icon of manifest.icons ?? []) {
    const iconPath = path.join('src', icon.src);
    const metadata = fs.existsSync(iconPath) ? readPngMetadata(iconPath) : null;

    if (!metadata) {
      logError(`${manifestPath} references missing icon: ${icon.src}`);
      continue;
    }

    if (icon.type !== 'image/png') {
      logError(`${manifestPath} icon ${icon.src} must declare type image/png`);
    }

    if (path.extname(icon.src).toLowerCase() !== '.png') {
      logError(`${manifestPath} icon ${icon.src} must use a .png file extension`);
    }

    if (!metadata.isPng) {
      logError(`${manifestPath} icon ${icon.src} must point to a PNG file`);
      continue;
    }

    if (metadata.width !== metadata.height || `${metadata.width}x${metadata.height}` !== icon.sizes) {
      logError(`${manifestPath} icon ${icon.src} declares ${icon.sizes}, found ${metadata.width}x${metadata.height}`);
    }
  }
} catch (err) {
  logError(`Failed to verify src/manifest.webmanifest icons: ${err.message}`);
}

// 9. Verify the brand asset generator uses assets/icon.png as input, not an output target
try {
  const brandGenerator = fs.readFileSync('scripts/generate-speedmath-assets.mjs', 'utf8');
  if (brandGenerator.includes("icon.write('assets/icon.png'") || brandGenerator.includes('icon.write("assets/icon.png"')) {
    logError('scripts/generate-speedmath-assets.mjs must not overwrite final source asset assets/icon.png');
  }
} catch (err) {
  logError(`Failed to read scripts/generate-speedmath-assets.mjs: ${err.message}`);
}

// 10. Verify all .png files outside excluded dirs have valid header
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

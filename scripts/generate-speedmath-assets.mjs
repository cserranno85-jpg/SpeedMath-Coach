import { Jimp } from 'jimp';
import fs from 'fs';
import path from 'path';

// Helper for Line Segment Signed Distance Field (SDF)
function sdfSegment(x, y, x0, y0, x1, y1) {
  const dx = x1 - x0;
  const dy = y1 - y0;
  const l2 = dx * dx + dy * dy;
  if (l2 === 0) return Math.hypot(x - x0, y - y0);
  let t = ((x - x0) * dx + (y - y0) * dy) / l2;
  t = Math.max(0, Math.min(1, t));
  return Math.hypot(x - (x0 + t * dx), y - (y0 + t * dy));
}

// Helper for Box SDF
function sdfBox(x, y, cx, cy, rx, ry) {
  const dx = Math.abs(x - cx) - rx;
  const dy = Math.abs(y - cy) - ry;
  return Math.max(dx, 0) + Math.max(dy, 0) + Math.min(Math.max(dx, dy), 0);
}

// Custom resize tool to bypass any version mismatches in Jimp APIs
function resizeBitmap(srcData, srcW, srcH, dstW, dstH) {
  const dstData = Buffer.alloc(dstW * dstH * 4);
  for (let dy = 0; dy < dstH; dy++) {
    for (let dx = 0; dx < dstW; dx++) {
      // Bilinear or nearest-neighbor filtering
      const sx = Math.min(srcW - 1, Math.floor(dx * srcW / dstW));
      const sy = Math.min(srcH - 1, Math.floor(dy * srcH / dstH));
      const srcIdx = (sy * srcW + sx) * 4;
      const dstIdx = (dy * dstW + dx) * 4;
      dstData[dstIdx] = srcData[srcIdx];
      dstData[dstIdx + 1] = srcData[srcIdx + 1];
      dstData[dstIdx + 2] = srcData[srcIdx + 2];
      dstData[dstIdx + 3] = srcData[srcIdx + 3];
    }
  }
  return dstData;
}

async function main() {
  console.log('Starting custom, binary-safe SpeedMath Coach asset generation...');

  // Ensure directories exist
  fs.mkdirSync('assets', { recursive: true });
  fs.mkdirSync('src/assets/icons', { recursive: true });

  // 1. Generate Icon (1024x1024)
  const iconSize = 1024;
  const icon = new Jimp({ width: iconSize, height: iconSize });
  
  // Fill icon and compute graphics
  for (let y = 0; y < iconSize; y++) {
    for (let x = 0; x < iconSize; x++) {
      const cx = 512, cy = 512;
      const r = Math.hypot(x - cx, y - cy);
      
      // Radial glow
      const glow = Math.max(0, 1 - r / 600);
      const bgR = Math.round(11 + glow * 15);
      const bgG = Math.round(17 + glow * 25);
      const bgB = Math.round(30 + glow * 35);
      
      const distPlus = Math.min(
        sdfBox(x, y, cx, cy, 45, 180),
        sdfBox(x, y, cx, cy, 180, 45)
      );
      
      const distCheck = Math.min(
        sdfSegment(x, y, 320, 520, 460, 680),
        sdfSegment(x, y, 460, 680, 740, 340)
      ) - 36; // 72px thick

      const plusAlpha = Math.max(0, Math.min(1, 0.5 - distPlus / 3.0));
      const checkAlpha = Math.max(0, Math.min(1, 0.5 - distCheck / 3.0));

      let rOut = bgR;
      let gOut = bgG;
      let bOut = bgB;

      // Layer plus (Cyan)
      if (plusAlpha > 0) {
        rOut = Math.round(rOut * (1 - plusAlpha) + 6 * plusAlpha);
        gOut = Math.round(gOut * (1 - plusAlpha) + 182 * plusAlpha);
        bOut = Math.round(bOut * (1 - plusAlpha) + 212 * plusAlpha);
      }

      // Layer checkmark (Green)
      if (checkAlpha > 0) {
        rOut = Math.round(rOut * (1 - checkAlpha) + 34 * checkAlpha);
        gOut = Math.round(gOut * (1 - checkAlpha) + 197 * checkAlpha);
        bOut = Math.round(bOut * (1 - checkAlpha) + 94 * checkAlpha);
      }

      const idx = (y * iconSize + x) * 4;
      icon.bitmap.data[idx] = rOut;
      icon.bitmap.data[idx + 1] = gOut;
      icon.bitmap.data[idx + 2] = bOut;
      icon.bitmap.data[idx + 3] = 255;
    }
  }

  // Save the main icon using Jimp (writing binary PNG)
  await icon.write('assets/icon.png');
  console.log('Created valid PNG assets/icon.png');

  // 2. Downsample PWA Icons
  const sizes = [48, 72, 96, 128, 192, 256, 512];
  for (const sz of sizes) {
    const resizedData = resizeBitmap(icon.bitmap.data, iconSize, iconSize, sz, sz);
    const subIcon = new Jimp({ width: sz, height: sz });
    resizedData.copy(subIcon.bitmap.data);
    
    const destPath = `src/assets/icons/icon-${sz}.png`;
    await subIcon.write(destPath);
    console.log(`Created PWA PNG Icon: ${destPath}`);
  }

  // 3. Generate Splash Screen (2732x2732)
  const splashSize = 2732;
  const splash = new Jimp({ width: splashSize, height: splashSize });
  
  // Fill with beautiful gradient matched with the branding colors
  for (let y = 0; y < splashSize; y++) {
    for (let x = 0; x < splashSize; x++) {
      const cx = splashSize / 2, cy = splashSize / 2;
      const r = Math.hypot(x - cx, y - cy);
      
      const glow = Math.max(0, 1 - r / 1600);
      const bgR = Math.round(11 + glow * 10);
      const bgG = Math.round(17 + glow * 18);
      const bgB = Math.round(30 + glow * 28);
      
      const idx = (y * splashSize + x) * 4;
      splash.bitmap.data[idx] = bgR;
      splash.bitmap.data[idx + 1] = bgG;
      splash.bitmap.data[idx + 2] = bgB;
      splash.bitmap.data[idx + 3] = 255;
    }
  }

  // Composite the icon artwork scaled down onto the splash screen center
  // Center is at 1366, 1366. Let's make a centered 512x512 branding logo.
  const logoSize = 512;
  const logoData = resizeBitmap(icon.bitmap.data, iconSize, iconSize, logoSize, logoSize);
  
  const startX = (splashSize - logoSize) / 2;
  const startY = (splashSize - logoSize) / 2 - 150; // offset slightly upward to make room for tagline

  for (let ly = 0; ly < logoSize; ly++) {
    for (let lx = 0; lx < logoSize; lx++) {
      const sx = startX + lx;
      const sy = startY + ly;
      
      const logoIdx = (ly * logoSize + lx) * 4;
      const splashIdx = (sy * splashSize + sx) * 4;
      
      // Blend opacity (ours is solid 255, but let's do safe copy)
      splash.bitmap.data[splashIdx] = logoData[logoIdx];
      splash.bitmap.data[splashIdx + 1] = logoData[logoIdx + 1];
      splash.bitmap.data[splashIdx + 2] = logoData[logoIdx + 2];
      splash.bitmap.data[splashIdx + 3] = logoData[logoIdx + 3];
    }
  }

  await splash.write('assets/splash.png');
  console.log('Created valid PNG assets/splash.png');

  console.log('All SpeedMath Coach branding assets generated successfully as true binary PNGs!');
}

main().catch(err => {
  console.error('Error during asset generation:', err);
  process.exit(1);
});

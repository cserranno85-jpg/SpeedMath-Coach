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

  // 1. Load the canonical Icon (1024x1024)
  const iconSize = 1024;
  const icon = await Jimp.read('assets/icon.png');

  if (icon.bitmap.width !== iconSize || icon.bitmap.height !== iconSize) {
    throw new Error(`assets/icon.png must be ${iconSize}x${iconSize}; found ${icon.bitmap.width}x${icon.bitmap.height}`);
  }
  console.log('Using canonical PNG assets/icon.png');

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

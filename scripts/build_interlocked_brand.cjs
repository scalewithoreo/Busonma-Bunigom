const fs = require('fs');
const sharp = require('sharp');
const opentype = require('opentype.js');

const frFont = opentype.parse(fs.readFileSync('C:/Windows/Fonts/FRSCRIPT.TTF'));

async function buildInterlocked() {
  const origLogo = sharp('public/assets/busonma-bunigom/logo.png');
  const { data: logoData, info } = await origLogo.raw().toBuffer({ resolveWithObject: true });
  
  const width = 1600;
  const height = 1600;
  const cx = 800;
  const cy = 800;

  // 1. Pristine wreath buffer: ONLY r >= 556
  // This completely eliminates the old circle and ghost arc between 520 and 555!
  const wreathWhiteBuf = Buffer.alloc(width * height * 4);
  const wreathGoldBuf = Buffer.alloc(width * height * 4);

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = (y * width + x) * 4;
      const r = Math.hypot(x - cx, y - cy);
      if (r >= 556) {
        const a = logoData[idx + 3];
        if (a > 20) {
          // White version
          wreathWhiteBuf[idx] = 255;
          wreathWhiteBuf[idx + 1] = 255;
          wreathWhiteBuf[idx + 2] = 255;
          wreathWhiteBuf[idx + 3] = a;

          // Gold version (#E6C98A)
          wreathGoldBuf[idx] = 230;
          wreathGoldBuf[idx + 1] = 201;
          wreathGoldBuf[idx + 2] = 138;
          wreathGoldBuf[idx + 3] = a;
        }
      }
    }
  }

  // 2. Interlocking BB letterform geometry
  const size = 520;
  const gapX = 145;
  const gapY = 185;
  const maskStroke = 14;

  const bW = 0.582 * size;
  const bH = 0.66 * size;
  const totalW = bW + gapX;
  const totalH = bH + gapY;

  const left = 800 - totalW / 2;
  const top = 800 - totalH / 2;

  const b1X = left - 0.045 * size;
  const b1Y = top + 0.644 * size;
  const b2X = b1X + gapX;
  const b2Y = b1Y + gapY;

  const pB1 = frFont.getPath('B', b1X, b1Y, size).toPathData(2);
  const pB2 = frFont.getPath('B', b2X, b2Y, size).toPathData(2);

  // SVG for White Interlocked Monogram
  const svgWhite = `
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1600 1600" width="1600" height="1600">
    <defs>
      <mask id="interlockMaskWhite">
        <rect width="1600" height="1600" fill="white" />
        <!-- Knockout cutout where B1 passes over B2 -->
        <path d="${pB1}" fill="black" stroke="black" stroke-width="${maskStroke}" stroke-linejoin="round" stroke-linecap="round" />
      </mask>
    </defs>

    <!-- Single, pristine mathematical circle ring -->
    <circle cx="800" cy="800" r="535" fill="none" stroke="#FFFFFF" stroke-width="5" />

    <!-- Interlocked B2 with knockout mask -->
    <path d="${pB2}" fill="#FFFFFF" mask="url(#interlockMaskWhite)" />
    <!-- B1 woven on top -->
    <path d="${pB1}" fill="#FFFFFF" />
  </svg>
  `;

  // SVG for Gold Interlocked Monogram
  const svgGold = `
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1600 1600" width="1600" height="1600">
    <defs>
      <mask id="interlockMaskGold">
        <rect width="1600" height="1600" fill="white" />
        <path d="${pB1}" fill="black" stroke="black" stroke-width="${maskStroke}" stroke-linejoin="round" stroke-linecap="round" />
      </mask>
    </defs>

    <circle cx="800" cy="800" r="535" fill="none" stroke="#E6C98A" stroke-width="5" />

    <path d="${pB2}" fill="#E6C98A" mask="url(#interlockMaskGold)" />
    <path d="${pB1}" fill="#E6C98A" />
  </svg>
  `;

  const whiteOverlay = await sharp(Buffer.from(svgWhite)).png().toBuffer();
  const goldOverlay = await sharp(Buffer.from(svgGold)).png().toBuffer();

  const finalWhite = await sharp(wreathWhiteBuf, { raw: { width, height, channels: 4 } })
    .composite([{ input: whiteOverlay, blend: 'over' }])
    .png()
    .toBuffer();

  const finalGold = await sharp(wreathGoldBuf, { raw: { width, height, channels: 4 } })
    .composite([{ input: goldOverlay, blend: 'over' }])
    .png()
    .toBuffer();

  // Save white and gold logos
  await sharp(finalWhite).toFile('public/assets/busonma-bunigom/logo.png');
  await sharp(finalWhite).toFile('public/assets/busonma-bunigom/logo-transparent-white.png');
  await sharp(finalGold).toFile('public/assets/busonma-bunigom/logo-transparent-gold.png');
  console.log('Saved logo.png, logo-transparent-white.png, logo-transparent-gold.png');

  // 3. Photorealistic Wax Seal with interlocked emblem
  const waxSvg = `
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1024 1024" width="1024" height="1024">
    <defs>
      <radialGradient id="waxDome" cx="42%" cy="38%" r="62%">
        <stop offset="0%" stop-color="#9E1B2D" />
        <stop offset="45%" stop-color="#7B1E2B" />
        <stop offset="80%" stop-color="#550E17" />
        <stop offset="100%" stop-color="#38080E" />
      </radialGradient>

      <radialGradient id="waxInnerBed" cx="50%" cy="48%" r="55%">
        <stop offset="0%" stop-color="#721723" />
        <stop offset="70%" stop-color="#5E111C" />
        <stop offset="100%" stop-color="#480B14" />
      </radialGradient>

      <linearGradient id="rimLight" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#BA283D" stop-opacity="0.9" />
        <stop offset="50%" stop-color="#7B1E2B" stop-opacity="0.5" />
        <stop offset="100%" stop-color="#280509" stop-opacity="0.9" />
      </linearGradient>
    </defs>

    <!-- Outer Seal Body -->
    <circle cx="512" cy="512" r="472" fill="url(#waxDome)" />

    <!-- 3D Outer Raised Lip Rim -->
    <circle cx="512" cy="512" r="470" fill="none" stroke="url(#rimLight)" stroke-width="6" />
    <circle cx="512" cy="512" r="424" fill="none" stroke="#38080E" stroke-width="4" opacity="0.6" />

    <!-- Inner Pressed Bed -->
    <circle cx="512" cy="512" r="420" fill="url(#waxInnerBed)" />

    <!-- Subtle inner groove shadow -->
    <circle cx="512" cy="512" r="418" fill="none" stroke="#250408" stroke-width="5" opacity="0.7" />
  </svg>
  `;

  const waxBaseBuffer = await sharp(Buffer.from(waxSvg)).png().toBuffer();

  const crestResized = await sharp(finalWhite)
    .resize(650, 650)
    .png()
    .toBuffer();

  const finalSeal = await sharp(waxBaseBuffer)
    .composite([
      {
        input: crestResized,
        top: Math.round((1024 - 650) / 2),
        left: Math.round((1024 - 650) / 2),
        blend: 'over'
      }
    ])
    .png()
    .toBuffer();

  await sharp(finalSeal).toFile('public/assets/busonma-bunigom/wax-seal-bb.png');
  console.log('Saved photorealistic interlocked wax-seal-bb.png!');
}

buildInterlocked().catch(console.error);

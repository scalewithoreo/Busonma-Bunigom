const fs = require('fs');
const sharp = require('sharp');
const opentype = require('opentype.js');

const frFont = opentype.parse(fs.readFileSync('C:/Windows/Fonts/FRSCRIPT.TTF'));

async function makeFlawless() {
  // Load original logo.png to extract wreath
  const origLogo = sharp('public/assets/busonma-bunigom/logo.png');
  const { data: logoData, info } = await origLogo.raw().toBuffer({ resolveWithObject: true });
  
  const width = 1600;
  const height = 1600;
  const cx = 800;
  const cy = 800;

  // 1. Pristine wreath buffer (only r >= 528)
  const wreathWhiteBuf = Buffer.alloc(width * height * 4);
  const wreathGoldBuf = Buffer.alloc(width * height * 4);

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = (y * width + x) * 4;
      const r = Math.hypot(x - cx, y - cy);
      if (r >= 528) {
        const a = logoData[idx + 3];
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

  // 2. Letters BB perfectly centered:
  // Top-left B at (500, 815)
  // Bottom-right B at (765, 1075)
  const frB1 = frFont.getPath('B', 500, 815, 470).toPathData(2);
  const frB2 = frFont.getPath('B', 765, 1075, 470).toPathData(2);

  // SVG for White Logo
  const svgWhite = `
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1600 1600" width="1600" height="1600">
    <circle cx="800" cy="800" r="522" fill="none" stroke="#FFFFFF" stroke-width="5" />
    <g fill="#FFFFFF">
      <path d="${frB1}" />
      <path d="${frB2}" />
    </g>
  </svg>
  `;

  // SVG for Gold Logo
  const svgGold = `
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1600 1600" width="1600" height="1600">
    <circle cx="800" cy="800" r="522" fill="none" stroke="#E6C98A" stroke-width="5" />
    <g fill="#E6C98A">
      <path d="${frB1}" />
      <path d="${frB2}" />
    </g>
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

  // Save to public assets
  await sharp(finalWhite).toFile('public/assets/busonma-bunigom/logo.png');
  await sharp(finalWhite).toFile('public/assets/busonma-bunigom/logo-transparent-white.png');
  await sharp(finalGold).toFile('public/assets/busonma-bunigom/logo-transparent-gold.png');
  console.log('Saved logo.png, logo-transparent-white.png, logo-transparent-gold.png');

  // 3. Flawless 3D Wax Seal (1024x1024)
  // Let's create the wax disk with rich lighting, smooth bevel, and stamp the white emblem
  // Outer radius: ~480, Inner rim: ~410, Indentation: ~370
  // Color: Royal Burgundy #7B1E2B / #580E18
  const waxSvg = `
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1024 1024" width="1024" height="1024">
    <defs>
      <!-- Drop shadow for the wax seal -->
      <filter id="waxShadow" x="-20%" y="-20%" width="140%" height="140%">
        <feDropShadow dx="0" dy="16" stdDeviation="20" flood-color="#000000" flood-opacity="0.45" />
        <feDropShadow dx="0" dy="6" stdDeviation="8" flood-color="#000000" flood-opacity="0.35" />
      </filter>

      <!-- Radial gradient for 3D wax dome -->
      <radialGradient id="waxDome" cx="42%" cy="38%" r="62%">
        <stop offset="0%" stop-color="#9E1B2D" />
        <stop offset="45%" stop-color="#7B1E2B" />
        <stop offset="80%" stop-color="#550E17" />
        <stop offset="100%" stop-color="#38080E" />
      </radialGradient>

      <!-- Radial gradient for inner pressed bed -->
      <radialGradient id="waxInnerBed" cx="50%" cy="48%" r="55%">
        <stop offset="0%" stop-color="#721723" />
        <stop offset="70%" stop-color="#5E111C" />
        <stop offset="100%" stop-color="#480B14" />
      </radialGradient>

      <!-- Inner rim lighting -->
      <linearGradient id="rimLight" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#BA283D" stop-opacity="0.9" />
        <stop offset="50%" stop-color="#7B1E2B" stop-opacity="0.5" />
        <stop offset="100%" stop-color="#280509" stop-opacity="0.9" />
      </linearGradient>

      <!-- Emboss filter for white crest -->
      <filter id="crestEmboss" x="-10%" y="-10%" width="120%" height="120%">
        <feDropShadow dx="0" dy="1.5" stdDeviation="1" flood-color="#FFFFFF" flood-opacity="0.4" />
        <feDropShadow dx="0" dy="-1.5" stdDeviation="1.5" flood-color="#000000" flood-opacity="0.6" />
      </filter>
    </defs>

    <!-- Outer Seal Body with Shadow -->
    <circle cx="512" cy="512" r="472" fill="url(#waxDome)" filter="url(#waxShadow)" />

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

  // Resize final white logo to 650x650 and stamp into the seal center
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
  console.log('Saved photorealistic wax-seal-bb.png!');
}

makeFlawless().catch(console.error);

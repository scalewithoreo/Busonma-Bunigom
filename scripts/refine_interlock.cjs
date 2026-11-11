const fs = require('fs');
const sharp = require('sharp');
const opentype = require('opentype.js');

const frFont = opentype.parse(fs.readFileSync('C:/Windows/Fonts/FRSCRIPT.TTF'));

async function testPositioning(gapX, gapY, size, maskStroke) {
  // Let's compute bbox of single B at this size
  // In French Script, B bbox at size:
  // x: 0.045*size to 0.627*size
  // y: -0.644*size to 0.016*size
  // Width ~ 0.582*size, Height ~ 0.66*size
  // With gapX, total width = 0.582*size + gapX
  // With gapY, total height = 0.66*size + gapY
  // We want center to be (800, 800)
  const bW = 0.582 * size;
  const bH = 0.66 * size;
  const totalW = bW + gapX;
  const totalH = bH + gapY;

  const left = 800 - totalW / 2;
  const top = 800 - totalH / 2;

  // B1 origin (x, y at baseline)
  // Baseline is near bottom of B1: y = top + 0.644*size
  const b1X = left - 0.045 * size;
  const b1Y = top + 0.644 * size;

  // B2 origin
  const b2X = b1X + gapX;
  const b2Y = b1Y + gapY;

  const pB1 = frFont.getPath('B', b1X, b1Y, size).toPathData(2);
  const pB2 = frFont.getPath('B', b2X, b2Y, size).toPathData(2);

  const svg = `
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1600 1600" width="800" height="800">
    <rect width="1600" height="1600" fill="#1B1714" />
    <circle cx="800" cy="800" r="535" fill="none" stroke="#FFFFFF" stroke-width="5" />
    
    <defs>
      <mask id="interlockMask">
        <rect width="1600" height="1600" fill="white" />
        <path d="${pB1}" fill="black" stroke="black" stroke-width="${maskStroke}" stroke-linejoin="round" stroke-linecap="round" />
      </mask>
    </defs>

    <!-- B2 masked so B1 cleanly cuts through it -->
    <path d="${pB2}" fill="#FFFFFF" mask="url(#interlockMask)" />
    <!-- B1 in front -->
    <path d="${pB1}" fill="#FFFFFF" />
  </svg>
  `;

  const tag = `sz${size}_gx${gapX}_gy${gapY}_st${maskStroke}`;
  const outPath = `C:/Users/PC/.gemini/antigravity/brain/719127a4-6c8f-4ddb-a89b-0c5af039e5fd/test_${tag}.png`;
  await sharp(Buffer.from(svg)).png().toFile(outPath);
  console.log('Saved', tag);
}

async function run() {
  // Test several combinations:
  // size 520, gapX 160, gapY 200, maskStroke 14
  await testPositioning(150, 190, 520, 14);
  await testPositioning(140, 180, 520, 14);
  await testPositioning(160, 200, 500, 14);
  await testPositioning(130, 170, 510, 14);
}

run().catch(console.error);

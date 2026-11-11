const fs = require('fs');
const sharp = require('sharp');
const opentype = require('opentype.js');

const frFont = opentype.parse(fs.readFileSync('C:/Windows/Fonts/FRSCRIPT.TTF'));
const laoraFont = opentype.parse(fs.readFileSync('public/fonts/Laora.otf'));

async function buildLogos() {
  // Load original logo.png to extract wreath
  const origLogo = sharp('public/assets/busonma-bunigom/logo.png');
  const { data: logoData, info } = await origLogo.raw().toBuffer({ resolveWithObject: true });
  
  const width = info.width;   // 1600
  const height = info.height; // 1600
  const cx = width / 2;       // 800
  const cy = height / 2;       // 800

  // Create clean wreath buffer: keep only r >= 528
  const wreathBuf = Buffer.alloc(width * height * 4);
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = (y * width + x) * 4;
      const r = Math.hypot(x - cx, y - cy);
      if (r >= 528) {
        wreathBuf[idx] = logoData[idx];
        wreathBuf[idx + 1] = logoData[idx + 1];
        wreathBuf[idx + 2] = logoData[idx + 2];
        wreathBuf[idx + 3] = logoData[idx + 3];
      }
    }
  }

  // Generate SVG with:
  // 1. Pristine circle ring at r=522 with stroke-width 5
  // 2. Letters BB
  
  // Script candidate (French Script)
  // Sized and positioned with generous padding
  // Size 480: Bounding box fits safely within r < 410
  const frB1 = frFont.getPath('B', 500, 740, 480).toPathData(2);
  const frB2 = frFont.getPath('B', 760, 1000, 480).toPathData(2);

  const frSvg = `
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1600 1600" width="1600" height="1600">
    <circle cx="800" cy="800" r="522" fill="none" stroke="#FFFFFF" stroke-width="5" />
    <g fill="#FFFFFF">
      <path d="${frB1}" />
      <path d="${frB2}" />
    </g>
  </svg>
  `;

  const frOverlay = await sharp(Buffer.from(frSvg)).png().toBuffer();
  const finalFrWhite = await sharp(wreathBuf, { raw: { width, height, channels: 4 } })
    .composite([{ input: frOverlay, blend: 'over' }])
    .png()
    .toBuffer();

  await sharp(finalFrWhite).toFile('C:/Users/PC/.gemini/antigravity/brain/719127a4-6c8f-4ddb-a89b-0c5af039e5fd/final_logo_fr.png');
  console.log('Saved final_logo_fr.png');

  // Also build Gold version for transparent gold logo
  const frGoldSvg = `
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1600 1600" width="1600" height="1600">
    <circle cx="800" cy="800" r="522" fill="none" stroke="#E6C98A" stroke-width="5" />
    <g fill="#E6C98A">
      <path d="${frB1}" />
      <path d="${frB2}" />
    </g>
  </svg>
  `;
  const frGoldOverlay = await sharp(Buffer.from(frGoldSvg)).png().toBuffer();
  
  // Tint wreath to gold
  const wreathGoldBuf = Buffer.alloc(width * height * 4);
  for (let i = 0; i < wreathBuf.length; i += 4) {
    const a = wreathBuf[i + 3];
    if (a > 10) {
      wreathGoldBuf[i] = 230;     // #E6
      wreathGoldBuf[i + 1] = 201; // #C9
      wreathGoldBuf[i + 2] = 138; // #8A
      wreathGoldBuf[i + 3] = a;
    }
  }

  const finalFrGold = await sharp(wreathGoldBuf, { raw: { width, height, channels: 4 } })
    .composite([{ input: frGoldOverlay, blend: 'over' }])
    .png()
    .toBuffer();

  await sharp(finalFrGold).toFile('C:/Users/PC/.gemini/antigravity/brain/719127a4-6c8f-4ddb-a89b-0c5af039e5fd/final_logo_gold.png');
  console.log('Saved final_logo_gold.png');

  // Now stamp onto photorealistic wax seal (1024x1024)
  // Let's load the clean wax seal background (without any old letters or artifacts)
  // We can scale the white logo down to 600x600 and composite onto wax seal
  const waxBase = sharp('public/assets/busonma-bunigom/wax-seal-bb.png');
  const waxMeta = await waxBase.metadata();
  console.log('Wax seal size:', waxMeta.width, waxMeta.height);

  // In wax seal: center is at width/2, height/2
  // Let's create an engraved / embossed white seal emblem from the clean logo
  const emblemForSeal = await sharp(finalFrWhite)
    .resize(680, 680)
    .png()
    .toBuffer();

  // Create clean wax disk from the wax seal outer edge
  // Or composite emblem over wax seal
  console.log('Ready to generate seal!');
}

buildLogos().catch(console.error);

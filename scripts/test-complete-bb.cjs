const sharp = require('sharp');
const fs = require('fs');

async function testCompleteInterlockingBB() {
  const sourcePath = 'public/assets/busonma-bunigom/logo.png';
  const { data, info } = await sharp(sourcePath).raw().toBuffer({ resolveWithObject: true });
  const w = 1600, h = 1600;

  // 1. Extract the complete Right B
  const bBuf = Buffer.alloc(w * h * 4);
  for (let y = 600; y < 1180; y++) {
    for (let x = 750; x < 1180; x++) {
      const idx = (y * w + x) * 4;
      bBuf[idx] = data[idx];
      bBuf[idx + 1] = data[idx + 1];
      bBuf[idx + 2] = data[idx + 2];
      bBuf[idx + 3] = data[idx + 3];
    }
  }

  const singleB = await sharp(bBuf, { raw: { width: w, height: h, channels: 4 } })
    .trim({ threshold: 5 })
    .png()
    .toBuffer({ resolveWithObject: true });

  console.log('Single complete B:', singleB.info.width, 'x', singleB.info.height);

  // Resize single B to ~520x680
  const b1 = await sharp(singleB.data)
    .resize(500, 660, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png()
    .toBuffer({ resolveWithObject: true });

  const b2 = await sharp(singleB.data)
    .resize(500, 660, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png()
    .toBuffer({ resolveWithObject: true });

  // Composite the two B's:
  // B1 (Left B, higher): left = 480, top = 460
  // B2 (Right B, lower): left = 680, top = 580
  // Total span: X from 480 to 1180 (700px wide), Y from 460 to 1240 (780px high)
  // Perfectly centered around (800, 800) with center at X=830, Y=850!
  // To center around 800, 800:
  // Left B: left = 440, top = 470
  // Right B: left = 660, top = 570
  // Center: (440 + 660 + 500)/2 = 800, (470 + 570 + 660)/2 = 850

  const canvas = Buffer.alloc(w * h * 4);
  const blankPng = await sharp(canvas, { raw: { width: w, height: h, channels: 4 } }).png().toBuffer();

  const interlockingBB = await sharp(blankPng)
    .composite([
      { input: b1.data, left: 450, top: 480 },
      { input: b2.data, left: 660, top: 560 }
    ])
    .png()
    .toBuffer();

  // 2. Extract ONLY the outer laurel wreath (radius > 530)
  const wreathBuf = Buffer.alloc(w * h * 4);
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const idx = (y * w + x) * 4;
      const dist = Math.sqrt((x - 800) ** 2 + (y - 800) ** 2);
      if (dist >= 530) {
        wreathBuf[idx] = data[idx];
        wreathBuf[idx + 1] = data[idx + 1];
        wreathBuf[idx + 2] = data[idx + 2];
        wreathBuf[idx + 3] = data[idx + 3];
      }
    }
  }

  // Draw a crisp, pristine SVG circular ring at radius = 524 with stroke-width = 4.5
  const ringSvg = `<svg width="1600" height="1600" xmlns="http://www.w3.org/2000/svg">
    <circle cx="800" cy="800" r="522" fill="none" stroke="white" stroke-width="4.5" />
  </svg>`;
  const ringPng = await sharp(Buffer.from(ringSvg)).png().toBuffer();

  const wreathPng = await sharp(wreathBuf, { raw: { width: w, height: h, channels: 4 } }).png().toBuffer();

  // Composite everything together:
  // 1. Wreath
  // 2. Crisp circular ring (NO jagged broken arcs!)
  // 3. Interlocking complete BB
  const finalLogo = await sharp(wreathPng)
    .composite([
      { input: ringPng, left: 0, top: 0 },
      { input: interlockingBB, left: 0, top: 0 }
    ])
    .png({ quality: 100 })
    .toBuffer();

  fs.writeFileSync('C:/Users/PC/.gemini/antigravity/brain/719127a4-6c8f-4ddb-a89b-0c5af039e5fd/test_complete_bb_logo.png', finalLogo);
  console.log('Saved test_complete_bb_logo.png for review!');
}

testCompleteInterlockingBB().catch(console.error);

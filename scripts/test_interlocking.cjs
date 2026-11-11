const fs = require('fs');
const sharp = require('sharp');
const opentype = require('opentype.js');

const frFont = opentype.parse(fs.readFileSync('C:/Windows/Fonts/FRSCRIPT.TTF'));
const ksFont = opentype.parse(fs.readFileSync('C:/Windows/Fonts/KUNSTLER.TTF'));
const vivFont = opentype.parse(fs.readFileSync('C:/Windows/Fonts/VIVALDII.TTF'));

async function generateInterlockPreview(name, b1Path, b2Path, b1OverB2 = true) {
  // b1 is top-left, b2 is lower-right
  // If b1OverB2: b1 has a knockout stroke over b2
  // Or weave: b2 rendered, then b1 knockout, then b1 white
  const svg = `
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1600 1600" width="800" height="800">
    <rect width="1600" height="1600" fill="#1B1714" />
    <circle cx="800" cy="800" r="535" fill="none" stroke="#FFFFFF" stroke-width="5" />
    <!-- Safe boundary circle -->
    <circle cx="800" cy="800" r="440" fill="none" stroke="#E6C98A" stroke-width="1" stroke-dasharray="8 8" opacity="0.3" />
    
    <!-- Lower-right B (B2) -->
    <path d="${b2Path}" fill="#FFFFFF" />

    <!-- Knockout gap for Interlocking Depth -->
    <path d="${b1Path}" fill="none" stroke="#1B1714" stroke-width="16" stroke-linejoin="round" stroke-linecap="round" />

    <!-- Top-left B (B1) -->
    <path d="${b1Path}" fill="#FFFFFF" />
  </svg>
  `;

  const outPath = 'C:/Users/PC/.gemini/antigravity/brain/719127a4-6c8f-4ddb-a89b-0c5af039e5fd/interlock_' + name + '.png';
  await sharp(Buffer.from(svg)).png().toFile(outPath);
  console.log('Saved', outPath);
}

async function run() {
  // Variation 1: French Script MT interlocked (moderate overlap)
  // B1 at (520, 780, 520), B2 at (680, 960, 520)
  const frB1_1 = frFont.getPath('B', 520, 780, 520).toPathData(2);
  const frB2_1 = frFont.getPath('B', 680, 960, 520).toPathData(2);
  await generateInterlockPreview('fr_interlock_1', frB1_1, frB2_1);

  // Variation 2: French Script MT interlocked (closer overlap, classic crest)
  // B1 at (540, 770, 530), B2 at (660, 970, 530)
  const frB1_2 = frFont.getPath('B', 530, 770, 530).toPathData(2);
  const frB2_2 = frFont.getPath('B', 660, 970, 530).toPathData(2);
  await generateInterlockPreview('fr_interlock_2', frB1_2, frB2_2);

  // Variation 3: Künstler Script interlocked
  const ksB1 = ksFont.getPath('B', 480, 740, 480).toPathData(2);
  const ksB2 = ksFont.getPath('B', 650, 970, 480).toPathData(2);
  await generateInterlockPreview('ks_interlock', ksB1, ksB2);

  // Variation 4: Vivaldi Script interlocked
  const vivB1 = vivFont.getPath('B', 500, 740, 480).toPathData(2);
  const vivB2 = vivFont.getPath('B', 680, 970, 480).toPathData(2);
  await generateInterlockPreview('viv_interlock', vivB1, vivB2);
}

run().catch(console.error);

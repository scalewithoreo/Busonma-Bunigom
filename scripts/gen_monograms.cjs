const fs = require('fs');
const sharp = require('sharp');
const opentype = require('opentype.js');

const ks = opentype.parse(fs.readFileSync('C:/Windows/Fonts/KUNSTLER.TTF'));
const fr = opentype.parse(fs.readFileSync('C:/Windows/Fonts/FRSCRIPT.TTF'));
const laora = opentype.parse(fs.readFileSync('public/fonts/Laora.otf'));

async function generatePreview(name, pathSvg) {
  const svg = [
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1600 1600" width="800" height="800">',
    '  <rect width="1600" height="1600" fill="#1B1714" />',
    '  <!-- Single pristine circle at r=522 -->',
    '  <circle cx="800" cy="800" r="522" fill="none" stroke="#FFFFFF" stroke-width="6" />',
    '  <g fill="#FFFFFF">',
    pathSvg,
    '  </g>',
    '</svg>'
  ].join('\n');

  const outPath = 'C:/Users/PC/.gemini/antigravity/brain/719127a4-6c8f-4ddb-a89b-0c5af039e5fd/monogram_preview_' + name + '.png';
  await sharp(Buffer.from(svg)).png().toFile(outPath);
  console.log('Saved', outPath);
}

async function run() {
  // Option 1: Künstler Script - staggered B and B, carefully sized and positioned within r=420 safe circle
  // Bounding box of KS 'B' at size 450: width ~470, height ~315
  // Top-left B: positioned so its top-left stays well within circle
  const ksB1 = ks.getPath('B', 460, 720, 440).toPathData(2);
  const ksB2 = ks.getPath('B', 710, 980, 440).toPathData(2);
  await generatePreview('ks_staggered', '<path d="' + ksB1 + '" /><path d="' + ksB2 + '" />');

  // Option 2: French Script - staggered
  const frB1 = fr.getPath('B', 480, 730, 500).toPathData(2);
  const frB2 = fr.getPath('B', 750, 1000, 500).toPathData(2);
  await generatePreview('fr_staggered', '<path d="' + frB1 + '" /><path d="' + frB2 + '" />');

  // Option 3: Laora - staggered luxury editorial serif
  const laB1 = laora.getPath('B', 500, 720, 450).toPathData(2);
  const laB2 = laora.getPath('B', 750, 980, 450).toPathData(2);
  await generatePreview('laora_staggered', '<path d="' + laB1 + '" /><path d="' + laB2 + '" />');

  // Option 4: Laora - side by side with elegant &
  const laB_left = laora.getPath('B', 430, 880, 400).toPathData(2);
  const laAmp = laora.getPath('&', 710, 850, 240).toPathData(2);
  const laB_right = laora.getPath('B', 860, 880, 400).toPathData(2);
  await generatePreview('laora_side_by_side', '<path d="' + laB_left + '" /><path d="' + laAmp + '" /><path d="' + laB_right + '" />');
}

run().catch(console.error);

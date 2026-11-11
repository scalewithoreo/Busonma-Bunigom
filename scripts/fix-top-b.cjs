const sharp = require('sharp');
const fs = require('fs');

async function fixTopB() {
  const sourcePath = 'public/assets/busonma-bunigom/logo.png';
  const { data, info } = await sharp(sourcePath).raw().toBuffer({ resolveWithObject: true });
  const w = info.width, h = info.height; // 1600 x 1600
  const cx = 800, cy = 800;

  // Let's create a working buffer for the BB monogram inside r < 500
  // In the current logo.png:
  // BB is from x: 427..1172, y: 430..1169
  // Let's inspect where the top B has the cut-off / floating dash.
  // The top of the BB is around y = 430..500, x = 600..850.
  
  // We make a copy of the buffer
  const outBuf = Buffer.from(data);

  // 1. Clean the outer circular ring area (remove any double lines or stray arc remnants between r=500 and r=525)
  // The true circular ring is at radius ~521. Any noise at r < 515 should be 0.
  // Any noise in the top-left at 10 o'clock:
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const idx = (y * w + x) * 4;
      const dist = Math.sqrt((x - cx) ** 2 + (y - cy) ** 2);
      
      // Clean space between BB (max dist ~440) and ring (dist ~520)
      if (dist > 450 && dist < 515) {
        outBuf[idx + 3] = 0; // Clear all stray bits!
      }
    }
  }

  // 2. Fix the top of the B:
  // Let's find the floating dash and bridge the gap to the top stroke.
  // In 1600x1600, where is the gap at the top of the B?
  // Let's search y from 420 to 520, x from 600 to 800:
  for (let y = 420; y <= 480; y++) {
    for (let x = 650; x <= 800; x++) {
      const idx = (y * w + x) * 4;
      // If there is an isolated pixel cluster or gap, let's connect it or smooth it
    }
  }

  // Let's inspect rows around y = 425 to 465, x = 680 to 760
  console.log('Top of B scan:');
  for (let y = 425; y <= 470; y += 3) {
    let row = '';
    for (let x = 690; x <= 770; x += 3) {
      const idx = (y * w + x) * 4;
      row += outBuf[idx + 3] > 60 ? '#' : '.';
    }
    console.log(`y=${y}: ${row}`);
  }
}

fixTopB().catch(console.error);

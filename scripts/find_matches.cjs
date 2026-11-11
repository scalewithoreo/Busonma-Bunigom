const fs = require('fs');
const sharp = require('sharp');

async function findMatches() {
  const masters = ['IMG_8756.JPG.jpeg', 'IMG_8759.JPG.jpeg', 'IMG_8760.JPG.jpeg', 'IMG_8377.JPG.jpeg', 'IMG_8378.JPG.jpeg', 'IMG_8379.JPG.jpeg', 'IMG_8380.JPG.jpeg', 'IMG_8381.JPG.jpeg', 'IMG_8382.JPG.jpeg'];

  // Let's compute average color or small thumbnail for each master
  const mStats = {};
  for (const m of masters) {
    const stat = await sharp('public/assets/busonma-bunigom/' + m).resize(50, 50).raw().toBuffer();
    mStats[m] = stat;
  }

  for (let i = 1; i <= 7; i++) {
    const gFile = 'public/assets/busonma-bunigom/gallery-' + i + '.jpg';
    const gStat = await sharp(gFile).resize(50, 50).raw().toBuffer();
    let best = null;
    let minDiff = 1e9;
    for (const m of masters) {
      let diff = 0;
      for (let j = 0; j < gStat.length; j++) {
        diff += Math.abs(gStat[j] - mStats[m][j]);
      }
      if (diff < minDiff) {
        minDiff = diff;
        best = m;
      }
    }
    console.log('gallery-' + i + ' closest to ' + best + ' (diff ' + minDiff + ')');
  }

  // Also check wishlist.jpg and rsvp-avatar.jpg
  for (const f of ['wishlist.jpg', 'rsvp-avatar.jpg', 'story.jpg']) {
    const fStat = await sharp('public/assets/busonma-bunigom/' + f).resize(50, 50).raw().toBuffer();
    let best = null;
    let minDiff = 1e9;
    for (const m of masters) {
      let diff = 0;
      for (let j = 0; j < fStat.length; j++) {
        diff += Math.abs(fStat[j] - mStats[m][j]);
      }
      if (diff < minDiff) {
        minDiff = diff;
        best = m;
      }
    }
    console.log(f + ' closest to ' + best + ' (diff ' + minDiff + ')');
  }
}
findMatches().catch(console.error);

const fs = require('fs');
const sharp = require('sharp');

async function analyze() {
  const photos = [
    'IMG_8756.JPG.jpeg',
    'IMG_8759.JPG.jpeg',
    'IMG_8760.JPG.jpeg',
    'IMG_8377.JPG.jpeg',
    'IMG_8378.JPG.jpeg',
    'IMG_8379.JPG.jpeg',
    'IMG_8380.JPG.jpeg',
    'IMG_8381.JPG.jpeg',
    'IMG_8382.JPG.jpeg'
  ];

  for (const p of photos) {
    const meta = await sharp('public/assets/busonma-bunigom/' + p).metadata();
    console.log(p, meta.width + 'x' + meta.height);
  }
}
analyze().catch(console.error);

const fs = require('fs');
const sharp = require('sharp');

async function test() {
  const list = [
    { name: 'Hero', path: 'public/assets/busonma-bunigom/Hero.jpeg' },
    { name: 'IMG_8756', path: 'public/assets/busonma-bunigom/IMG_8756.JPG.jpeg' },
    { name: 'IMG_8759', path: 'public/assets/busonma-bunigom/IMG_8759.JPG.jpeg' },
    { name: 'IMG_8760', path: 'public/assets/busonma-bunigom/IMG_8760.JPG.jpeg' },
    { name: 'IMG_8377', path: 'public/assets/busonma-bunigom/IMG_8377.JPG.jpeg' },
    { name: 'IMG_8378', path: 'public/assets/busonma-bunigom/IMG_8378.JPG.jpeg' },
    { name: 'IMG_8379', path: 'public/assets/busonma-bunigom/IMG_8379.JPG.jpeg' },
    { name: 'IMG_8380', path: 'public/assets/busonma-bunigom/IMG_8380.JPG.jpeg' },
    { name: 'IMG_8381', path: 'public/assets/busonma-bunigom/IMG_8381.JPG.jpeg' },
    { name: 'IMG_8382', path: 'public/assets/busonma-bunigom/IMG_8382.JPG.jpeg' },
    { name: 'IMG_3770', path: 'C:/Users/PC/Downloads/IMG_3770.JPG.jpeg' },
    { name: 'IMG_3781', path: 'C:/Users/PC/Downloads/IMG_3781.JPG.jpeg' },
    { name: 'IMG_3796', path: 'C:/Users/PC/Downloads/IMG_3796.JPG.jpeg' },
    { name: 'IMG_3803', path: 'C:/Users/PC/Downloads/IMG_3803.JPG.jpeg' },
    { name: 'IMG_3816', path: 'C:/Users/PC/Downloads/IMG_3816.JPG.jpeg' },
  ];

  for (const item of list) {
    const meta = await sharp(item.path).metadata();
    const stats = await sharp(item.path).stats();
    console.log(item.name.padEnd(10), meta.width + 'x' + meta.height, 'means:', stats.channels.slice(0, 3).map(c => Math.round(c.mean)));
  }
}

test().catch(console.error);

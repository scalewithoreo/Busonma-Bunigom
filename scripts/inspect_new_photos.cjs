const fs = require('fs');
const sharp = require('sharp');

async function check() {
  const list = ['IMG_3770.JPG.jpeg', 'IMG_3781.JPG.jpeg', 'IMG_3796.JPG.jpeg', 'IMG_3803.JPG.jpeg', 'IMG_3816.JPG.jpeg', 'IMG_3204.JPG.jpeg'];
  for (const f of list) {
    const src = 'C:/Users/PC/Downloads/' + f;
    const dest = 'C:/Users/PC/.gemini/antigravity/brain/719127a4-6c8f-4ddb-a89b-0c5af039e5fd/preview_' + f.replace('.JPG.jpeg', '').replace('.jpeg', '') + '.jpg';
    await sharp(src).resize(400, 400, { fit: 'inside' }).jpeg({ quality: 80 }).toFile(dest);
    console.log('Generated preview:', dest);
  }
}

check().catch(console.error);

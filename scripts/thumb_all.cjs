const fs = require('fs');
const sharp = require('sharp');

async function testAll() {
  const list = ['IMG_8377', 'IMG_8378', 'IMG_8379', 'IMG_8380', 'IMG_8381', 'IMG_8382'];
  for (const name of list) {
    const file = 'public/assets/busonma-bunigom/' + name + '.JPG.jpeg';
    const out = 'C:/Users/PC/.gemini/antigravity/brain/719127a4-6c8f-4ddb-a89b-0c5af039e5fd/thumb_' + name + '.jpg';
    await sharp(file).resize(400, 400, { fit: 'cover' }).toFile(out);
    console.log('Saved', out);
  }
}
testAll().catch(console.error);

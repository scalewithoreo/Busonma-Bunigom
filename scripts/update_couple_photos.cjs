const fs = require('fs');
const sharp = require('sharp');

async function updatePhotos() {
  // 1. Wishlist: 1200x1500 from IMG_8382 (rich full color vertical portrait)
  await sharp('public/assets/busonma-bunigom/IMG_8382.JPG.jpeg')
    .resize(1200, 1500, { fit: 'cover', position: 'top' })
    .jpeg({ quality: 92, mozjpeg: true })
    .toFile('public/assets/busonma-bunigom/wishlist.jpg');
  console.log('Updated wishlist.jpg from IMG_8382.JPG.jpeg');

  // 2. RSVP Avatar: 800x800 from IMG_8380 (warm joyful couple portrait)
  await sharp('public/assets/busonma-bunigom/IMG_8380.JPG.jpeg')
    .resize(800, 800, { fit: 'cover', position: 'center' })
    .jpeg({ quality: 95, mozjpeg: true })
    .toFile('public/assets/busonma-bunigom/rsvp-avatar.jpg');
  console.log('Updated rsvp-avatar.jpg from IMG_8380.JPG.jpeg');
}

updatePhotos().catch(console.error);

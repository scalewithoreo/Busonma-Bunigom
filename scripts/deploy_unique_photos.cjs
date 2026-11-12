const fs = require('fs');
const sharp = require('sharp');
const path = require('path');

async function deploy() {
  const destDir = 'public/assets/busonma-bunigom';

  console.log('Generating 100% unique web-optimized images for all 12 slots...');

  // 1. Hero: from Hero.jpeg (2560x1440 cover)
  await sharp('public/assets/busonma-bunigom/Hero.jpeg')
    .resize(2560, 1440, { fit: 'cover', position: 'center' })
    .jpeg({ quality: 84, mozjpeg: true })
    .toFile(path.join(destDir, 'hero-opt.jpg'));
  console.log('✓ Hero: from Hero.jpeg -> hero-opt.jpg');

  // 2. Story: from IMG_8756 (1200x1600 vertical)
  await sharp('public/assets/busonma-bunigom/IMG_8756.JPG.jpeg')
    .resize(1200, 1600, { fit: 'cover', position: 'center' })
    .jpeg({ quality: 85, mozjpeg: true })
    .toFile(path.join(destDir, 'story.jpg'));
  console.log('✓ Story: from IMG_8756 -> story.jpg');

  // 3. Save the Date: from IMG_8759 (couple at boat railing overlooking Zuma rock, full rich color)
  await sharp('public/assets/busonma-bunigom/IMG_8759.JPG.jpeg')
    .resize(1200, 1000, { fit: 'cover', position: 'center' })
    .modulate({ saturation: 1.1, brightness: 1.02 })
    .jpeg({ quality: 88, mozjpeg: true })
    .toFile(path.join(destDir, 'save-the-date.jpg'));
  console.log('✓ Save the Date: from IMG_8759 -> save-the-date.jpg');

  // 4. Wishlist: from IMG_8760 (intimate close-up gaze)
  await sharp('public/assets/busonma-bunigom/IMG_8760.JPG.jpeg')
    .resize(1200, 1500, { fit: 'cover', position: 'center' })
    .jpeg({ quality: 88, mozjpeg: true })
    .toFile(path.join(destDir, 'wishlist.jpg'));
  console.log('✓ Wishlist: from IMG_8760 -> wishlist.jpg');

  // 5. RSVP Avatar: from IMG_8382 (gorgeous high-res couple portrait, 800x800 square)
  await sharp('public/assets/busonma-bunigom/IMG_8382.JPG.jpeg')
    .resize(800, 800, { fit: 'cover', position: 'top' })
    .jpeg({ quality: 90, mozjpeg: true })
    .toFile(path.join(destDir, 'rsvp-avatar.jpg'));
  console.log('✓ RSVP Avatar: from IMG_8382 -> rsvp-avatar.jpg');

  // 6. Gallery 1: from IMG_8377
  await sharp('public/assets/busonma-bunigom/IMG_8377.JPG.jpeg')
    .resize(1200, 1600, { fit: 'cover', position: 'center' })
    .jpeg({ quality: 85, mozjpeg: true })
    .toFile(path.join(destDir, 'gallery-1.jpg'));
  console.log('✓ Gallery 1: from IMG_8377 -> gallery-1.jpg');

  // 7. Gallery 2: from IMG_8378
  await sharp('public/assets/busonma-bunigom/IMG_8378.JPG.jpeg')
    .resize(1200, 1600, { fit: 'cover', position: 'center' })
    .jpeg({ quality: 85, mozjpeg: true })
    .toFile(path.join(destDir, 'gallery-2.jpg'));
  console.log('✓ Gallery 2: from IMG_8378 -> gallery-2.jpg');

  // 8. Gallery 3: from IMG_8379
  await sharp('public/assets/busonma-bunigom/IMG_8379.JPG.jpeg')
    .resize(1200, 1600, { fit: 'cover', position: 'center' })
    .jpeg({ quality: 85, mozjpeg: true })
    .toFile(path.join(destDir, 'gallery-3.jpg'));
  console.log('✓ Gallery 3: from IMG_8379 -> gallery-3.jpg');

  // 9. Gallery 4: from IMG_8380
  await sharp('public/assets/busonma-bunigom/IMG_8380.JPG.jpeg')
    .resize(1200, 1600, { fit: 'cover', position: 'center' })
    .jpeg({ quality: 85, mozjpeg: true })
    .toFile(path.join(destDir, 'gallery-4.jpg'));
  console.log('✓ Gallery 4: from IMG_8380 -> gallery-4.jpg');

  // 10. Gallery 5: from IMG_8381
  await sharp('public/assets/busonma-bunigom/IMG_8381.JPG.jpeg')
    .resize(1200, 1600, { fit: 'cover', position: 'center' })
    .jpeg({ quality: 85, mozjpeg: true })
    .toFile(path.join(destDir, 'gallery-5.jpg'));
  console.log('✓ Gallery 5: from IMG_8381 -> gallery-5.jpg');

  // 11. Gallery 6: from C:/Users/PC/Downloads/IMG_3770.JPG.jpeg
  await sharp('C:/Users/PC/Downloads/IMG_3770.JPG.jpeg')
    .resize(1200, 1600, { fit: 'cover', position: 'center' })
    .jpeg({ quality: 85, mozjpeg: true })
    .toFile(path.join(destDir, 'gallery-6.jpg'));
  console.log('✓ Gallery 6: from IMG_3770 -> gallery-6.jpg');

  // 12. Gallery 7: from C:/Users/PC/Downloads/IMG_3816.JPG.jpeg
  await sharp('C:/Users/PC/Downloads/IMG_3816.JPG.jpeg')
    .resize(1200, 1600, { fit: 'cover', position: 'center' })
    .jpeg({ quality: 85, mozjpeg: true })
    .toFile(path.join(destDir, 'gallery-7.jpg'));
  console.log('✓ Gallery 7: from IMG_3816 -> gallery-7.jpg');

  console.log('\n🎉 SUCCESS: All 12 photo slots across the entire site are now 100% UNIQUE!');
}

deploy().catch(console.error);

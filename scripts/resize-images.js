#!/usr/bin/env node

/**
 * Image Resizing Script - Optimize hero images for single-page display
 * Resizes logo and coffee filter images to fit one-page layout
 */

const sharp = require('sharp');
const path = require('path');
const fs = require('fs');

async function resizeImages() {
  try {
    console.log('📏 Resizing images for single-page display...\n');

    // Resize logo - reduce to 600px width
    const logoPath = path.join(__dirname, '..', 'images', 'logo-color-black-bg1.webp');
    console.log('🔄 Resizing logo-color-black-bg1.webp...');
    
    const logoInfo = await sharp(logoPath).metadata();
    console.log(`  Original: ${logoInfo.width}x${logoInfo.height}px`);
    
    await sharp(logoPath)
      .resize(600, Math.round(600 * logoInfo.height / logoInfo.width), {
        fit: 'fill',
        withoutEnlargement: true
      })
      .toFile(logoPath + '.resized');
    
    fs.renameSync(logoPath + '.resized', logoPath);
    
    const logoResized = await sharp(logoPath).metadata();
    console.log(`  Resized: ${logoResized.width}x${logoResized.height}px ✓\n`);

    // Resize coffee filter - reduce to 450px width
    const coffeePath = path.join(__dirname, '..', 'images', 'coffee-as-you-are.webp');
    console.log('🔄 Resizing coffee-as-you-are.webp...');
    
    const coffeeInfo = await sharp(coffeePath).metadata();
    console.log(`  Original: ${coffeeInfo.width}x${coffeeInfo.height}px`);
    
    await sharp(coffeePath)
      .resize(450, Math.round(450 * coffeeInfo.height / coffeeInfo.width), {
        fit: 'fill',
        withoutEnlargement: true
      })
      .toFile(coffeePath + '.resized');
    
    fs.renameSync(coffeePath + '.resized', coffeePath);
    
    const coffeeResized = await sharp(coffeePath).metadata();
    console.log(`  Resized: ${coffeeResized.width}x${coffeeResized.height}px ✓\n`);

    console.log('✅ Image resizing complete!\n');
    console.log('📊 Size reduction:');
    console.log(`  Logo: ${logoInfo.width}x${logoInfo.height} → ${logoResized.width}x${logoResized.height}`);
    console.log(`  Coffee: ${coffeeInfo.width}x${coffeeInfo.height} → ${coffeeResized.width}x${coffeeResized.height}`);
    console.log('\n💡 Remember to rebuild: npm run build');

  } catch (error) {
    console.error('❌ Error resizing images:', error.message);
    process.exit(1);
  }
}

resizeImages();

#!/usr/bin/env node

/**
 * Comprehensive Responsive Image Setup
 * 1. Scans all images in /images
 * 2. Converts PNG to WebP
 * 3. Generates responsive variants (small, medium, large)
 * 4. Creates image inventory
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const IMAGES_DIR = path.join(__dirname, '..', 'images');
const INVENTORY_FILE = path.join(__dirname, '..', 'IMAGE_INVENTORY.json');

// Responsive image breakpoints
const BREAKPOINTS = {
  small: { width: 480, maxWidth: 400, label: 'Mobile (≤480px)' },
  medium: { width: 768, maxWidth: 600, label: 'Tablet (481-768px)' },
  large: { width: 1920, maxWidth: 1200, label: 'Desktop (≥769px)' }
};

// Image optimization presets
const IMAGE_CONFIGS = {
  'logo-color-black-bg1.webp': {
    name: 'Gate 7 Logo',
    category: 'branding',
    use: 'Homepage hero logo',
    variants: {
      small: { width: 240, height: 180 },
      medium: { width: 320, height: 240 },
      large: { width: 400, height: 300 }
    }
  },
  'logo-only-white.png': {
    name: 'Gate 7 Logo (White)',
    category: 'branding',
    use: 'Favicon and apple touch icon',
    variants: null // Favicon - no variants needed
  },
  'coffee-as-you-are.webp': {
    name: 'Phin Filter Art',
    category: 'product',
    use: 'Homepage phin coffee display',
    variants: {
      small: { width: 180, height: 135 },
      medium: { width: 237, height: 178 },
      large: { width: 237, height: 178 }
    }
  },
  'menu-25-nov.png': {
    name: 'Menu Art',
    category: 'product',
    use: 'Menu page hero image',
    variants: {
      small: { width: 600, height: 400 },
      medium: { width: 900, height: 600 },
      large: { width: 1200, height: 800 }
    }
  },
  'social-icon-instagram.png': {
    name: 'Instagram Icon',
    category: 'social',
    use: 'Footer social media link',
    variants: null // Social icons - no variants needed
  },
  'social-icon-facebook.png': {
    name: 'Facebook Icon',
    category: 'social',
    use: 'Footer social media link',
    variants: null
  },
  'social-icon-zalo.png': {
    name: 'Zalo Icon',
    category: 'social',
    use: 'Footer social media link',
    variants: null
  }
};

function scanImages() {
  console.log('📋 Scanning images directory...\n');
  
  const files = fs.readdirSync(IMAGES_DIR);
  const imageFiles = files.filter(f => 
    /\.(png|jpg|jpeg|webp|gif|ico)$/i.test(f)
  );

  console.log(`Found ${imageFiles.length} image files:`);
  imageFiles.forEach(f => console.log(`  - ${f}`));
  console.log();
  
  return imageFiles;
}

function checkImageMagick() {
  try {
    execSync('convert --version', { stdio: 'ignore' });
    return true;
  } catch {
    return false;
  }
}

function checkImageOptim() {
  try {
    execSync('imagemin --version', { stdio: 'ignore' });
    return true;
  } catch {
    return false;
  }
}

function convertToWebP(inputFile, outputFile) {
  if (!fs.existsSync(inputFile)) return false;
  if (fs.existsSync(outputFile)) return true; // Already exists
  
  if (inputFile.endsWith('.webp')) {
    // Already WebP, just copy
    fs.copyFileSync(inputFile, outputFile);
    return true;
  }
  
  try {
     // Try using ImageMagick first with maximum quality settings
     // -quality 100 = highest quality WebP output
     // -define webp:nearLossless=1 = near-lossless compression (best preservation)
     // -define webp:method=6 = maximum compression effort for better quality
     execSync(`convert "${inputFile}" -quality 100 -define webp:nearLossless=1 "${outputFile}"`, {
       stdio: 'ignore'
     });
     return true;
  } catch (e) {
    console.warn(`  ⚠️  Could not convert ${path.basename(inputFile)} to WebP`);
    return false;
  }
}

function generateResponsiveVariant(inputFile, outputFile, width, height) {
  if (fs.existsSync(outputFile)) return true; // Already exists
  if (!fs.existsSync(inputFile)) return false;
  
  try {
     // Generate variant with maximum quality settings
     // -resize with > = only shrink if larger (preserve quality)
     // -quality 100 = highest quality output
     // -define webp:nearLossless=1 = near-lossless compression
     execSync(
       `convert "${inputFile}" -resize ${width}x${height}\\> -quality 100 -define webp:nearLossless=1 "${outputFile}"`,
       { stdio: 'ignore' }
     );
     return true;
  } catch (e) {
    console.warn(`  ⚠️  Could not generate variant for ${path.basename(inputFile)}`);
    return false;
  }
}

function createInventory(images) {
  console.log('📊 Creating image inventory...\n');
  
  const inventory = {
    generated: new Date().toISOString(),
    total: images.length,
    images: {}
  };

  images.forEach(img => {
    const config = IMAGE_CONFIGS[img] || {
      name: img.replace(/\.[^/.]+$/, ''),
      category: 'other',
      use: 'General use',
      variants: null
    };

    const filePath = path.join(IMAGES_DIR, img);
    const stats = fs.statSync(filePath);

    inventory.images[img] = {
      name: config.name,
      category: config.category,
      use: config.use,
      size: stats.size,
      sizeKB: (stats.size / 1024).toFixed(2),
      variants: config.variants || {}
    };
  });

  fs.writeFileSync(INVENTORY_FILE, JSON.stringify(inventory, null, 2));
  console.log(`✓ Inventory saved to: ${INVENTORY_FILE}`);
  console.log();
  
  return inventory;
}

function main() {
  console.log('🖼️  Responsive Image Setup Tool\n');
  console.log('=' . repeat(50));
  console.log();

  // Step 1: Scan images
  const images = scanImages();

  // Step 2: Check tools
  console.log('🔧 Checking image processing tools...');
  const hasImageMagick = checkImageMagick();
  const hasImageOptim = checkImageOptim();
  
  if (hasImageMagick) {
    console.log('  ✓ ImageMagick found');
  } else {
    console.log('  ⚠️  ImageMagick not found (install for WebP conversion)');
  }
  
  if (hasImageOptim) {
    console.log('  ✓ imagemin found');
  } else {
    console.log('  ⚠️  imagemin not found (install for optimization)');
  }
  console.log();

  // Step 3: Convert to WebP (for content images, not icons)
  if (hasImageMagick) {
    console.log('🔄 Converting PNG to WebP...\n');
    
    // List of images to skip WebP conversion (icons and already optimized files)
    const skipWebP = ['social-icon-instagram.png', 'social-icon-facebook.png', 'social-icon-zalo.png', 'logo-only-white.png'];
    
    Object.keys(IMAGE_CONFIGS).forEach(img => {
      const inputPath = path.join(IMAGES_DIR, img);
      if (!fs.existsSync(inputPath)) return;
      
      // Skip WebP for social icons and favicons
      if (skipWebP.includes(img)) {
        console.log(`  ⊘ ${img} (icon - skipped WebP conversion)`);
        return;
      }
      
      if (!img.endsWith('.webp') && !img.endsWith('.ico')) {
        const baseName = img.replace(/\.[^/.]+$/, '');
        const outputPath = path.join(IMAGES_DIR, `${baseName}.webp`);
        
        if (convertToWebP(inputPath, outputPath)) {
          const fileSize = fs.statSync(outputPath).size;
          console.log(`  ✓ ${baseName}.webp (${(fileSize/1024).toFixed(1)}KB)`);
        }
      }
    });
    console.log();
  }

  // Step 4: Generate responsive variants
  if (hasImageMagick) {
    console.log('📐 Generating responsive variants...\n');
    
    Object.entries(IMAGE_CONFIGS).forEach(([imgFile, config]) => {
      if (!config.variants) return;
      
      const baseName = imgFile.replace(/\.[^/.]+$/, '');
      const webpFile = path.join(IMAGES_DIR, `${baseName}.webp`);
      const pngFile = path.join(IMAGES_DIR, imgFile);
      const sourceFile = fs.existsSync(webpFile) ? webpFile : pngFile;
      
      if (!fs.existsSync(sourceFile)) return;
      
      console.log(`  ${config.name}:`);
      
      Object.entries(config.variants).forEach(([variant, dims]) => {
        const outputFile = path.join(
          IMAGES_DIR,
          `${baseName}-${variant}.webp`
        );
        
        if (generateResponsiveVariant(sourceFile, outputFile, dims.width, dims.height)) {
          const fileSize = fs.statSync(outputFile).size;
          console.log(`    ✓ ${variant}: ${dims.width}x${dims.height} (${(fileSize/1024).toFixed(1)}KB)`);
        }
      });
    });
    console.log();
  }

  // Step 5: Create inventory
  createInventory(images);

  // Step 6: Print summary
  console.log('📋 RESPONSIVE IMAGE SETUP SUMMARY\n');
  console.log('=' . repeat(50));
  console.log();
  
  console.log('Images Ready for Responsive Display:');
  console.log();
  
  Object.entries(IMAGE_CONFIGS).forEach(([img, config]) => {
    console.log(`📌 ${config.name}`);
    console.log(`   File: ${img}`);
    console.log(`   Use: ${config.use}`);
    
    if (config.variants) {
      console.log(`   Variants:`);
      Object.entries(config.variants).forEach(([variant, dims]) => {
        console.log(`     - ${variant}: ${dims.width}x${dims.height}px`);
      });
    }
    console.log();
  });

  console.log('=' . repeat(50));
  console.log('✅ Setup complete!');
  console.log();
  console.log('Next steps:');
  console.log('1. Review IMAGE_INVENTORY.json for all images');
  console.log('2. Update HTML with responsive <picture> elements');
  console.log('3. Test on different devices and screen sizes');
  console.log('4. Deploy when ready');
  console.log();
}

try {
  main();
} catch (error) {
  console.error('❌ Setup failed:', error.message);
  process.exit(1);
}

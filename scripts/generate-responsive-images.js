#!/usr/bin/env node

/**
 * Responsive Image Generator - Maximum Quality
 * 
 * Generates responsive image variants from source images with highest quality settings.
 * 
 * Quality Settings:
 * - WebP Quality: 100 (highest/lossless-like)
 * - Alpha Quality: 100 (preserves transparency)
 * - Effort: 6 (maximum compression for best quality)
 * - Near-Lossless: true (imperceptible quality loss)
 * - Smart Subsampling: true (intelligent color preservation)
 * - Resize Kernel: cubic (best quality interpolation)
 * - No Upscaling: true (preserves original detail)
 * 
 * Requires: Sharp library (npm install sharp)
 * Usage: node scripts/generate-responsive-images.js
 */

const fs = require('fs');
const path = require('path');

try {
    const sharp = require('sharp');
    
    const images = [
        {
            source: 'images/logo-color-black-bg1.webp',
            variants: [
                { size: { width: 240, height: 180 }, suffix: '-small', quality: 100 },
                { size: { width: 320, height: 240 }, suffix: '-medium', quality: 100 },
                { size: { width: 400, height: 300 }, suffix: '', quality: 100 }
            ]
        },
        {
            source: 'images/coffee-as-you-are.webp',
            variants: [
                { size: { width: 180, height: 135 }, suffix: '-small', quality: 100 },
                { size: { width: 237, height: 178 }, suffix: '-medium', quality: 100 },
                { size: { width: 237, height: 178 }, suffix: '', quality: 100 }
            ]
        },
        {
            source: 'images/menu-25-nov.png',
            variants: [
                { size: { width: 600, height: 400 }, suffix: '-small', quality: 100 },
                { size: { width: 900, height: 600 }, suffix: '-medium', quality: 100 },
                { size: { width: 1200, height: 800 }, suffix: '', quality: 100 }
            ]
        }
    ];
    
    console.log('🖼️  Generating responsive image variants...\n');
    
    let totalGenerated = 0;
    
    images.forEach(imageGroup => {
        const sourceFile = imageGroup.source;
        
        if (!fs.existsSync(sourceFile)) {
            console.warn(`⚠️  Source file not found: ${sourceFile}`);
            return;
        }
        
        const baseName = path.basename(sourceFile, path.extname(sourceFile));
        const dir = path.dirname(sourceFile);
        
        imageGroup.variants.forEach(variant => {
            const outputName = `${baseName}${variant.suffix}.webp`;
            const outputPath = path.join(dir, outputName);
            
            sharp(sourceFile)
                // High-quality resize with best interpolation
                .resize(variant.size.width, variant.size.height, {
                    fit: 'contain',
                    background: { r: 255, g: 255, b: 255, alpha: 0 },
                    kernel: 'cubic',        // Use cubic convolution for best quality resize
                    withoutEnlargement: true // Don't upscale small images
                })
                // Maximum quality WebP conversion
                .webp({
                    quality: 100,           // Highest quality (lossless-like)
                    alphaQuality: 100,      // Preserve alpha channel at maximum quality
                    effort: 6,              // Maximum compression effort for best results
                    nearLossless: true,     // Near-lossless compression preserves detail
                    smartSubsample: true    // Smart subsampling for better quality
                })
                .toFile(outputPath, (err, info) => {
                     if (err) {
                         console.error(`❌ Error generating ${outputName}:`, err.message);
                     } else {
                         const sizeKB = Math.round(info.size / 1024);
                         console.log(`✓ ${outputName} (${variant.size.width}x${variant.size.height}, ${sizeKB}KB, quality: 100)`);
                         totalGenerated++;
                     }
                 });
        });
    });
    
    console.log(`\n✨ Generated ${totalGenerated} image variants!`);
    console.log('📝 Make sure to update HTML files with new responsive picture elements.');
    
} catch (error) {
    if (error.code === 'MODULE_NOT_FOUND') {
        console.error('❌ Sharp library not found!');
        console.error('\nTo use this script, install Sharp:');
        console.error('  npm install sharp');
        console.error('\nAlternatively, use online tools:');
        console.error('  - Squoosh: https://squoosh.app/');
        console.error('  - CloudConvert: https://cloudconvert.com/');
        process.exit(1);
    } else {
        throw error;
    }
}

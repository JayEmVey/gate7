#!/usr/bin/env node

/**
 * Simple Static Site Builder for Gate 7 Coffee
 * Minifies HTML, CSS, and JS without external dependencies
 */

const fs = require('fs');
const path = require('path');

const DIST_DIR = path.join(__dirname, 'dist');
const SOURCE_FILES = [
  { src: 'index.html', dest: 'index.html' },
  { src: 'menu/index.html', dest: 'menu/index.html' },
  { src: 'music/index.html', dest: 'music/index.html' },
  { src: 'hiring/index.html', dest: 'hiring/index.html' },
    { src: 'hiring/banner.html', dest: 'hiring/banner.html' }
];

const STATIC_FILES = [
  'CNAME',
  'robots.txt',
  'sitemap.xml',
  'wrangler.jsonc',
  '_headers'
];

const DIRS_TO_COPY = [
  'css',
  'js',
  'images'
];

// Simple HTML minifier
function minifyHTML(content) {
  return content
    .replace(/<!--[\s\S]*?-->/g, '') // Remove comments
    .replace(/\n\s+/g, '\n') // Remove extra whitespace
    .replace(/\s{2,}/g, ' ') // Multiple spaces to single
    .trim();
}

// Simple CSS minifier
function minifyCSS(content) {
  return content
    .replace(/\/\*[\s\S]*?\*\//g, '') // Remove comments
    .replace(/\s{2,}/g, ' ') // Multiple spaces to single
    .replace(/\s*([{}:;,>+~])\s*/g, '$1') // Remove spaces around symbols
    .replace(/;}/g, '}') // Remove last semicolon
    .trim();
}

// Simple JS minifier
function minifyJS(content) {
  return content
    .replace(/\/\/.*$/gm, '') // Remove single-line comments
    .replace(/\/\*[\s\S]*?\*\//g, '') // Remove multi-line comments
    .replace(/\n\s+/g, '\n') // Remove indentation
    .replace(/\s{2,}/g, ' ') // Multiple spaces to single
    .trim();
}

// Create directory if not exists
function ensureDir(dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

// Copy directory recursively
function copyDir(src, dest) {
  ensureDir(dest);
  const files = fs.readdirSync(src);
  
  files.forEach(file => {
    const srcPath = path.join(src, file);
    const destPath = path.join(dest, file);
    
    if (fs.statSync(srcPath).isDirectory()) {
      copyDir(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  });
}

// Main build function
function build() {
  console.log('🔨 Building production bundle...\n');

  // Clean dist directory
  if (fs.existsSync(DIST_DIR)) {
    fs.rmSync(DIST_DIR, { recursive: true });
  }
  ensureDir(DIST_DIR);

  // Process HTML files
  console.log('📝 Minifying HTML files...');
  SOURCE_FILES.forEach(file => {
    const srcPath = path.join(__dirname, file.src);
    const destPath = path.join(DIST_DIR, file.dest);
    
    ensureDir(path.dirname(destPath));
    
    let content = fs.readFileSync(srcPath, 'utf8');
    content = minifyHTML(content);
    
    fs.writeFileSync(destPath, content);
    
    const originalSize = fs.statSync(srcPath).size;
    const minifiedSize = content.length;
    const savings = (((originalSize - minifiedSize) / originalSize) * 100).toFixed(1);
    
    console.log(`  ✓ ${file.src} (${minifiedSize} bytes, ${savings}% smaller)`);
  });

  // Copy and minify CSS
  console.log('\n🎨 Processing CSS files...');
  if (fs.existsSync(path.join(__dirname, 'css'))) {
    const cssDir = path.join(DIST_DIR, 'css');
    ensureDir(cssDir);
    
    const cssFiles = fs.readdirSync(path.join(__dirname, 'css'));
    cssFiles.forEach(file => {
      const srcPath = path.join(__dirname, 'css', file);
      const stat = fs.statSync(srcPath);
      const destPath = path.join(cssDir, file);
      
      if (stat.isDirectory()) {
        // Skip directories
        return;
      }
      
      if (file.endsWith('.css')) {
        let content = fs.readFileSync(srcPath, 'utf8');
        const minified = minifyCSS(content);
        fs.writeFileSync(destPath, minified);
        
        const originalSize = content.length;
        const minifiedSize = minified.length;
        const savings = (((originalSize - minifiedSize) / originalSize) * 100).toFixed(1);
        
        console.log(`  ✓ ${file} (${minifiedSize} bytes, ${savings}% smaller)`);
      } else {
        fs.copyFileSync(srcPath, destPath);
      }
    });
  }



  // Copy images
  console.log('\n🖼️  Copying images...');
  DIRS_TO_COPY.forEach(dir => {
    const srcPath = path.join(__dirname, dir);
    const destPath = path.join(DIST_DIR, dir);
    
    if (fs.existsSync(srcPath)) {
      copyDir(srcPath, destPath);
      const fileCount = fs.readdirSync(destPath).length;
      console.log(`  ✓ ${dir}/ (${fileCount} files)`);
    }
  });

  // Copy static files
  console.log('\n📋 Copying static files...');
  STATIC_FILES.forEach(file => {
    const srcPath = path.join(__dirname, file);
    if (fs.existsSync(srcPath)) {
      const destPath = path.join(DIST_DIR, file);
      fs.copyFileSync(srcPath, destPath);
      console.log(`  ✓ ${file}`);
    }
  });

  // Calculate totals
  console.log('\n✅ Build complete!\n');
  
  let totalSize = 0;
  function getSize(dir) {
    const files = fs.readdirSync(dir);
    files.forEach(file => {
      const filePath = path.join(dir, file);
      const stat = fs.statSync(filePath);
      if (stat.isDirectory()) {
        getSize(filePath);
      } else {
        totalSize += stat.size;
      }
    });
  }
  
  getSize(DIST_DIR);
  const totalMB = (totalSize / 1024 / 1024).toFixed(2);
  
  console.log(`📦 Output: ${DIST_DIR}/`);
  console.log(`📊 Total size: ${totalSize} bytes (${totalMB} MB)\n`);
}

// Run build
try {
  build();
} catch (error) {
  console.error('❌ Build failed:', error.message);
  process.exit(1);
}

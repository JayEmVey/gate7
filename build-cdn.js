#!/usr/bin/env node

/**
 * CDN-Aware Build System for Gate 7 Coffee
 * Supports Self-Hosted (local), GitHub Raw, jsDelivr, and Cloudflare
 * 
 * Usage:
 *   npm run build              # Default: Self-Hosted (no CDN)
 *   npm run build:cdn-github   # GitHub Raw (fallback)
 *   npm run build:cdn-jsdelivr # jsDelivr CDN
 *   npm run build:cdn-cloudflare # Cloudflare CDN (legacy)
 */

const fs = require('fs');
const path = require('path');

// Determine which CDN to use
const cdnType = process.argv[2] || 'local';

const DIST_DIR = path.join(__dirname, 'dist');
const CDN_CONFIG_PATH = path.join(__dirname, 'cdn-config.json');

const CDN_CONFIGS = {
  local: {
    name: 'Self-Hosted (Local)',
    baseUrl: '',
    provider: 'local'
  },
  github: {
    name: 'GitHub Raw (Fallback)',
    baseUrl: 'https://raw.githubusercontent.com/JayEmVey/gate7/master',
    provider: 'github'
  },
  jsdelivr: {
    name: 'jsDelivr CDN',
    baseUrl: 'https://cdn.jsdelivr.net/gh/JayEmVey/gate7@latest',
    provider: 'jsdelivr'
  },
  cloudflare: {
    name: 'Cloudflare CDN (legacy)',
    baseUrl: 'https://cdn.jsdelivr.net/gh/JayEmVey/gate7@master/dist/',
    provider: 'cloudflare'
  }
};

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
  'sitemap.xml'
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

// Inject CDN loader script into HTML
function injectCDNLoader(htmlContent, selectedCdn) {
  // For self-hosted, only use local fallback
  const fallbackOrder = selectedCdn === 'local' 
    ? ["local"]
    : ["local", "github", "jsdelivr", "cloudflare"];
  
  const cdnLoaderScript = `
<script id="cdn-loader">
(function() {
  // CDN Configuration Loader
  window.CDN_CONFIG = {
    "primaryCdn": "${selectedCdn}",
    "cdns": {
      "local": "",
      "github": "https://raw.githubusercontent.com/JayEmVey/gate7/master",
      "jsdelivr": "https://cdn.jsdelivr.net/gh/JayEmVey/gate7@latest",
      "cloudflare": "https://cdn.jsdelivr.net/gh/JayEmVey/gate7@master/dist/"
    },
    "fallbackOrder": ${JSON.stringify(fallbackOrder)},
    "timeout": 5000,
    "retryAttempts": 2
  };
  
  // CDN Asset Helper
  window.getCdnUrl = function(assetPath) {
    const cdnUrl = window.CDN_CONFIG.cdns[window.CDN_CONFIG.primaryCdn];
    return cdnUrl + assetPath;
  };
  
  // CDN Fallback Resolver
  window.resolveCdnAsset = async function(assetPath) {
    const config = window.CDN_CONFIG;
    const timeoutMs = config.timeout;
    
    for (let cdn of config.fallbackOrder) {
      const baseUrl = config.cdns[cdn];
      const url = baseUrl + assetPath;
      
      try {
        const response = await Promise.race([
          fetch(url, { method: 'HEAD' }),
          new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Timeout')), timeoutMs)
          )
        ]);
        
        if (response.ok) {
          console.log('[CDN] Using ' + cdn + ' for ' + assetPath);
          return url;
        }
      } catch (error) {
        console.warn('[CDN] Failed on ' + cdn + ': ' + error.message);
      }
    }
    
    // Fallback to current domain
    console.warn('[CDN] All CDNs failed, using local: ' + assetPath);
    return assetPath;
  };
  
  // Store current CDN in localStorage
  localStorage.setItem('activeCdn', window.CDN_CONFIG.primaryCdn);
})();
</script>`;

  // Insert before closing head or at the beginning of body
  if (htmlContent.includes('</head>')) {
    return htmlContent.replace('</head>', cdnLoaderScript + '\n</head>');
  } else if (htmlContent.includes('<body')) {
    const bodyMatch = htmlContent.match(/<body[^>]*>/);
    if (bodyMatch) {
      return htmlContent.replace(bodyMatch[0], bodyMatch[0] + cdnLoaderScript);
    }
  }
  
  return cdnLoaderScript + htmlContent;
}

// Rewrite asset paths to use CDN
function rewriteAssetPaths(htmlContent, baseUrl) {
  // Rewrite script src paths (but keep inline scripts)
  htmlContent = htmlContent.replace(/<script\s+defer\s+src="([^"]+)">/g, (match, src) => {
    if (src.startsWith('/')) {
      return `<script defer src="${baseUrl}${src}">`;
    }
    return match;
  });
  
  // Rewrite link href for CSS
  htmlContent = htmlContent.replace(/<link\s+rel="stylesheet"\s+href="([^"]+)">/g, (match, href) => {
    if (href.startsWith('/')) {
      return `<link rel="stylesheet" href="${baseUrl}${href}">`;
    }
    return match;
  });
  
  // Rewrite data-src for lazy-loaded images
  htmlContent = htmlContent.replace(/data-src="([^"]+)"/g, (match, src) => {
    if (src.startsWith('/')) {
      return `data-src="${baseUrl}${src}"`;
    }
    return match;
  });
  
  // Rewrite src for images (img tags)
  htmlContent = htmlContent.replace(/<img\s+([^>]*?)src="([^"]+)"/g, (match, attrs, src) => {
    if (src.startsWith('/')) {
      return `<img ${attrs}src="${baseUrl}${src}"`;
    }
    return match;
  });
  
  return htmlContent;
}

// Inject asset loader and cdn-resolver scripts before closing body
function injectAssetLoaders(htmlContent) {
  const assetLoaderScript = `
<script defer src="js/cdn-resolver.js"><\/script>
<script defer src="js/asset-loader.js"><\/script>
<script defer>
  // Load CSS and JS from CDN with fallback
  document.addEventListener('DOMContentLoaded', async function() {
    const loader = window.assetLoader;
    if (loader) {
      // Load main CSS
      await loader.loadCSS('/css/style-gate7.css');
      console.log('[CDN] CSS loading complete');
    }
  });
<\/script>`;

  if (htmlContent.includes('</body>')) {
    return htmlContent.replace('</body>', assetLoaderScript + '\n</body>');
  }
  
  return htmlContent + assetLoaderScript;
}

// Update cdn-config.json with current build info
function updateCdnConfig(selectedCdn) {
  const config = require(CDN_CONFIG_PATH);
  config.default = selectedCdn;
  config.buildDate = new Date().toISOString().split('T')[0];
  config.activeCdn = {
    name: CDN_CONFIGS[selectedCdn].name,
    provider: selectedCdn,
    baseUrl: CDN_CONFIGS[selectedCdn].baseUrl
  };
  
  fs.writeFileSync(CDN_CONFIG_PATH, JSON.stringify(config, null, 2));
}

// Main build function
function build() {
  const selectedCdn = cdnType;
  
  if (!CDN_CONFIGS[selectedCdn]) {
    console.error(`❌ Unknown CDN: ${selectedCdn}`);
    console.error(`Available options: ${Object.keys(CDN_CONFIGS).join(', ')}`);
    process.exit(1);
  }

  console.log(`\n🔨 Building production bundle with ${CDN_CONFIGS[selectedCdn].name}...\n`);
  console.log(`📋 Default CDN set to: ${selectedCdn}\n`);

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
    content = injectCDNLoader(content, selectedCdn);
    content = rewriteAssetPaths(content, CDN_CONFIGS[selectedCdn].baseUrl);
    content = injectAssetLoaders(content);
    
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

  // Copy CDN config
  console.log('\n⚙️  Configuring CDN...');
  const cdnDestPath = path.join(DIST_DIR, 'cdn-config.json');
  updateCdnConfig(selectedCdn);
  fs.copyFileSync(CDN_CONFIG_PATH, cdnDestPath);
  console.log(`  ✓ cdn-config.json (active CDN: ${selectedCdn})`);

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
  console.log(`🌐 CDN: ${CDN_CONFIGS[selectedCdn].name}`);
  console.log(`📊 Total size: ${totalSize} bytes (${totalMB} MB)\n`);
}

// Run build
try {
  build();
} catch (error) {
  console.error('❌ Build failed:', error.message);
  process.exit(1);
}

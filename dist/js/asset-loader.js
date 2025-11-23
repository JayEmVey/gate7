/**
 * Asset Loader - CDN-Aware Image and Script Loading
 * Dynamically loads images and scripts from configured CDN with fallback
 * 
 * Features:
 * - Loads images from CDN with fallback to local
 * - Loads scripts from CDN with fallback to local
 * - Automatic retry on failure
 * - Progress tracking
 * - Error recovery
 */

class AssetLoader {
  constructor() {
    this.config = window.CDN_CONFIG || this.getDefaultConfig();
    this.resolver = window.cdnResolver;
    this.loadedAssets = new Set();
    this.failedAssets = new Set();
    this.pendingAssets = new Map();
  }

  /**
   * Default configuration fallback
   */
  getDefaultConfig() {
    return {
      primaryCdn: 'cloudflare',
      cdns: {
        cloudflare: 'https://cdn.jsdelivr.net/gh/JayEmVey/gate7@master/dist',
        jsdelivr: 'https://cdn.jsdelivr.net/gh/JayEmVey/gate7@latest',
        github: 'https://raw.githubusercontent.com/JayEmVey/gate7/master'
      },
      fallbackOrder: ['cloudflare', 'jsdelivr', 'github'],
      timeout: 5000,
      retryAttempts: 2
    };
  }

  /**
   * Load image from CDN with fallback to local
   * @param {string} imagePath - Image path (e.g., '/images/logo.png')
   * @param {HTMLImageElement} imgElement - Image element to load into
   * @returns {Promise<boolean>} - Success status
   */
  async loadImage(imagePath, imgElement) {
    const cacheKey = `image:${imagePath}`;
    
    // Check if already loaded
    if (this.loadedAssets.has(cacheKey)) {
      imgElement.src = this.getCdnUrl(imagePath) || imagePath;
      return true;
    }

    // Check if already failed
    if (this.failedAssets.has(cacheKey)) {
      imgElement.src = imagePath;
      return true;
    }

    try {
      const cdnUrl = await this.resolver.resolveAsset(imagePath);
      imgElement.src = cdnUrl;
      this.loadedAssets.add(cacheKey);
      
      return new Promise((resolve) => {
        imgElement.onload = () => resolve(true);
        imgElement.onerror = () => {
          console.warn(`[AssetLoader] Image failed from CDN: ${imagePath}, using local`);
          imgElement.src = imagePath;
          this.failedAssets.add(cacheKey);
          resolve(true);
        };
        
        // Timeout fallback
        setTimeout(() => {
          if (imgElement.src === cdnUrl && !imgElement.complete) {
            imgElement.src = imagePath;
            this.failedAssets.add(cacheKey);
          }
        }, 3000);
      });
    } catch (error) {
      console.warn(`[AssetLoader] Failed to load image ${imagePath}:`, error);
      imgElement.src = imagePath;
      this.failedAssets.add(cacheKey);
      return true;
    }
  }

  /**
   * Load script from CDN with fallback to local
   * @param {string} scriptPath - Script path (e.g., '/js/script.js')
   * @param {object} options - Script options
   * @returns {Promise<boolean>} - Success status
   */
  async loadScript(scriptPath, options = {}) {
    const cacheKey = `script:${scriptPath}`;
    
    // Check if already loaded
    if (this.loadedAssets.has(cacheKey)) {
      return true;
    }

    // Check if pending
    if (this.pendingAssets.has(cacheKey)) {
      return this.pendingAssets.get(cacheKey);
    }

    const scriptPromise = this._loadScriptInternal(scriptPath, options);
    this.pendingAssets.set(cacheKey, scriptPromise);

    try {
      const success = await scriptPromise;
      if (success) {
        this.loadedAssets.add(cacheKey);
      }
      return success;
    } finally {
      this.pendingAssets.delete(cacheKey);
    }
  }

  /**
   * Internal script loading logic
   * @private
   */
  async _loadScriptInternal(scriptPath, options) {
    const cdnUrl = await this.resolver.resolveAsset(scriptPath);
    
    return new Promise((resolve) => {
      const script = document.createElement('script');
      
      // Apply options
      if (options.defer !== false) script.defer = true;
      if (options.async) script.async = true;
      if (options.module) script.type = 'module';
      if (options.noModule) script.noModule = true;
      
      script.src = cdnUrl;

      script.onload = () => {
        console.log(`[AssetLoader] Script loaded: ${scriptPath}`);
        resolve(true);
      };

      script.onerror = () => {
        console.warn(`[AssetLoader] Script failed from CDN: ${scriptPath}, trying local`);
        script.src = scriptPath;
        
        script.onload = () => {
          console.log(`[AssetLoader] Script loaded from local: ${scriptPath}`);
          resolve(true);
        };
        
        script.onerror = () => {
          console.error(`[AssetLoader] Script failed from all sources: ${scriptPath}`);
          resolve(false);
        };
        
        document.head.appendChild(script);
      };

      // Timeout fallback
      setTimeout(() => {
        if (script.src === cdnUrl && !script.loaded) {
          script.src = scriptPath;
          console.warn(`[AssetLoader] Script timeout, switching to local: ${scriptPath}`);
          
          script.onload = () => resolve(true);
          script.onerror = () => resolve(false);
          
          if (!script.parentElement) {
            document.head.appendChild(script);
          }
        }
      }, this.config.timeout);

      document.head.appendChild(script);
    });
  }

  /**
   * Get CDN URL for an asset
   * @private
   */
  getCdnUrl(assetPath) {
    const baseUrl = this.config.cdns[this.config.primaryCdn];
    if (!baseUrl) return null;
    
    const cleanBase = baseUrl.replace(/\/$/, '');
    const cleanPath = assetPath.startsWith('/') ? assetPath : `/${assetPath}`;
    
    return `${cleanBase}${cleanPath}`;
  }

  /**
   * Load all images in a container
   * @param {HTMLElement} container - Container element (default: document.body)
   * @returns {Promise<void>}
   */
  async loadAllImages(container = document.body) {
    const images = container.querySelectorAll('img[data-src]');
    const promises = [];

    images.forEach(img => {
      const imagePath = img.getAttribute('data-src');
      if (imagePath) {
        promises.push(this.loadImage(imagePath, img));
      }
    });

    if (promises.length > 0) {
      console.log(`[AssetLoader] Loading ${promises.length} images from CDN`);
      await Promise.all(promises);
    }
  }

  /**
   * Load scripts sequentially from list
   * @param {string[]} scripts - Array of script paths
   * @param {object} options - Options for all scripts
   * @returns {Promise<boolean>} - All loaded successfully
   */
  async loadScripts(scripts, options = {}) {
    let allLoaded = true;

    for (const script of scripts) {
      const loaded = await this.loadScript(script, options);
      if (!loaded) {
        allLoaded = false;
        console.warn(`[AssetLoader] Failed to load: ${script}`);
      }
    }

    return allLoaded;
  }

  /**
   * Get asset statistics
   */
  getStats() {
    return {
      loaded: this.loadedAssets.size,
      failed: this.failedAssets.size,
      pending: this.pendingAssets.size,
      primaryCdn: this.config.primaryCdn,
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Log asset loading statistics
   */
  logStats() {
    const stats = this.getStats();
    console.group('[AssetLoader] Statistics');
    console.log('Primary CDN:', stats.primaryCdn);
    console.log('Loaded Assets:', stats.loaded);
    console.log('Failed Assets:', stats.failed);
    console.log('Pending Assets:', stats.pending);
    console.groupEnd();
  }
}

// Initialize globally accessible asset loader
window.assetLoader = window.assetLoader || new AssetLoader();

// Auto-initialize on DOM ready for data-src images
document.addEventListener('DOMContentLoaded', function() {
  // Load images that use data-src attribute
  const images = document.querySelectorAll('img[data-src]');
  if (images.length > 0) {
    images.forEach(img => {
      const imagePath = img.getAttribute('data-src');
      if (imagePath) {
        window.assetLoader.loadImage(imagePath, img);
      }
    });
  }
});

// Export for use in modules if needed
if (typeof module !== 'undefined' && module.exports) {
  module.exports = AssetLoader;
}

/**
 * CDN Resolver - Multi-CDN Fallback System
 * Handles automatic CDN fallback and asset resolution
 * 
 * Features:
 * - Primary CDN selection (Cloudflare, jsDelivr, or GitHub)
 * - Automatic fallback to secondary CDNs
 * - Network timeout handling
 * - Retry mechanism with exponential backoff
 * - localStorage caching of successful CDN
 * - Performance metrics and logging
 */

class CDNResolver {
  constructor() {
    this.config = window.CDN_CONFIG || this.getDefaultConfig();
    this.cdnCache = new Map();
    this.performanceMetrics = {};
    this.loadCache();
  }

  /**
   * Default CDN configuration fallback
   */
  getDefaultConfig() {
    return {
      primaryCdn: 'local',
      cdns: {
        local: '',
        github: 'https://raw.githubusercontent.com/JayEmVey/gate7/master',
        jsdelivr: 'https://cdn.jsdelivr.net/gh/JayEmVey/gate7@latest',
        cloudflare: 'https://cdn.jsdelivr.net/gh/JayEmVey/gate7@master/dist'
      },
      fallbackOrder: ['local', 'github', 'jsdelivr', 'cloudflare'],
      timeout: 5000,
      retryAttempts: 2
    };
  }

  /**
   * Load CDN preferences from localStorage
   */
  loadCache() {
    try {
      const cached = localStorage.getItem('cdn-cache');
      if (cached) {
        this.cdnCache = new Map(JSON.parse(cached));
      }
      
      const metrics = localStorage.getItem('cdn-metrics');
      if (metrics) {
        this.performanceMetrics = JSON.parse(metrics);
      }
    } catch (error) {
      console.warn('[CDN] Cache load error:', error);
    }
  }

  /**
   * Save CDN cache to localStorage
   */
  saveCache() {
    try {
      localStorage.setItem('cdn-cache', JSON.stringify(Array.from(this.cdnCache)));
      localStorage.setItem('cdn-metrics', JSON.stringify(this.performanceMetrics));
    } catch (error) {
      console.warn('[CDN] Cache save error:', error);
    }
  }

  /**
   * Get CDN URL for an asset with fallback strategy
   * @param {string} assetPath - Asset path (e.g., '/css/style.css')
   * @param {object} options - Resolution options
   * @returns {Promise<string>} - Resolved CDN URL
   */
  async resolveAsset(assetPath, options = {}) {
    const cacheKey = `asset:${assetPath}`;
    
    // Check cache first
    if (this.cdnCache.has(cacheKey)) {
      const cached = this.cdnCache.get(cacheKey);
      if (this.config.enableDetailedLogging) {
        console.log(`[CDN] Cache hit for ${assetPath}`);
      }
      return cached;
    }

    // For self-hosted (local) builds, skip fallback entirely
    if (this.config.primaryCdn === 'local') {
      const url = this.buildUrl('local', assetPath);
      this.cdnCache.set(cacheKey, url);
      this.saveCache();
      if (this.config.enableDetailedLogging) {
        console.log(`[CDN] Using local asset directly: ${assetPath}`);
      }
      return url;
    }

    const cdnOrder = options.preferredCdns || this.config.fallbackOrder;
    const isDetailedLogging = this.config.enableDetailedLogging || false;
    
    if (isDetailedLogging) {
      console.log(`[CDN] Resolving ${assetPath} with order: ${cdnOrder.join(' → ')}`);
    }
    
    for (let attempt = 0; attempt < this.config.retryAttempts; attempt++) {
      for (let cdn of cdnOrder) {
        try {
          const url = this.buildUrl(cdn, assetPath);
          const resolvedUrl = await this.testCdnUrl(url, cdn);
          
          if (resolvedUrl) {
            this.cdnCache.set(cacheKey, resolvedUrl);
            this.saveCache();
            if (isDetailedLogging) {
              console.log(`[CDN] ✓ Resolved ${assetPath} via ${cdn}`);
            }
            return resolvedUrl;
          }
        } catch (error) {
          if (isDetailedLogging) {
            console.debug(`[CDN] Attempt ${attempt + 1}/${this.config.retryAttempts} on ${cdn} failed: ${error.message}`);
          }
        }
      }
      
      // Exponential backoff before retry
      if (attempt < this.config.retryAttempts - 1) {
        const backoffTime = Math.pow(2, attempt) * 100;
        if (isDetailedLogging) {
          console.log(`[CDN] Retrying after ${backoffTime}ms...`);
        }
        await this.delay(backoffTime);
      }
    }

    // Ultimate fallback: use local path
    if (isDetailedLogging) {
      console.warn(`[CDN] ⚠ All CDNs exhausted for ${assetPath}, falling back to local`);
    }
    this.cdnCache.set(cacheKey, assetPath);
    this.saveCache();
    return assetPath;
  }

  /**
   * Test if a CDN URL is accessible
   * @private
   */
  async testCdnUrl(url, cdnName) {
    const startTime = performance.now();
    const isDetailedLogging = this.config.enableDetailedLogging || false;
    
    try {
      const response = await Promise.race([
        fetch(url, { method: 'HEAD', mode: 'no-cors' }),
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Timeout')), this.config.timeout)
        )
      ]);

      const duration = performance.now() - startTime;
      this.recordMetric(cdnName, duration, true);
      
      if (isDetailedLogging) {
        console.log(`[CDN] ✓ ${cdnName} responded in ${duration.toFixed(0)}ms: ${url}`);
      }
      
      // no-cors mode doesn't provide status, assume success if fetch completes
      return url;
    } catch (error) {
      const duration = performance.now() - startTime;
      this.recordMetric(cdnName, duration, false);
      
      if (isDetailedLogging) {
        console.warn(`[CDN] ✗ ${cdnName} failed after ${duration.toFixed(0)}ms: ${error.message}`);
      }
      
      throw error;
    }
  }

  /**
   * Build full CDN URL from base and asset path
   * @private
   */
  buildUrl(cdnName, assetPath) {
    const baseUrl = this.config.cdns[cdnName];
    if (!baseUrl) {
      throw new Error(`Unknown CDN: ${cdnName}`);
    }
    
    // Ensure no double slashes
    const cleanBase = baseUrl.replace(/\/$/, '');
    const cleanPath = assetPath.startsWith('/') ? assetPath : `/${assetPath}`;
    
    return `${cleanBase}${cleanPath}`;
  }

  /**
   * Record CDN performance metrics
   * @private
   */
  recordMetric(cdnName, duration, success) {
    if (!this.performanceMetrics[cdnName]) {
      this.performanceMetrics[cdnName] = {
        attempts: 0,
        successes: 0,
        failures: 0,
        totalDuration: 0,
        avgDuration: 0,
        lastUsed: null
      };
    }

    const metric = this.performanceMetrics[cdnName];
    metric.attempts++;
    metric.totalDuration += duration;
    metric.avgDuration = metric.totalDuration / metric.attempts;
    metric.lastUsed = new Date().toISOString();

    if (success) {
      metric.successes++;
    } else {
      metric.failures++;
    }
  }

  /**
   * Simple delay utility for retries
   * @private
   */
  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Get current CDN stats
   */
  getStats() {
    return {
      config: this.config,
      cacheSize: this.cdnCache.size,
      metrics: this.performanceMetrics,
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Clear all caches
   */
  clearCache() {
    this.cdnCache.clear();
    this.performanceMetrics = {};
    localStorage.removeItem('cdn-cache');
    localStorage.removeItem('cdn-metrics');
    console.log('[CDN] Cache cleared');
  }

  /**
   * Set preferred CDN order
   */
  setPreferredCdns(cdnArray) {
    this.config.fallbackOrder = cdnArray;
    console.log('[CDN] Preferred CDNs set to:', cdnArray);
  }

  /**
   * Log CDN statistics to console
   */
  logStats() {
    const stats = this.getStats();
    console.group('[CDN] Statistics');
    console.log('Primary CDN:', stats.config.primaryCdn);
    console.log('Fallback Order:', stats.config.fallbackOrder);
    console.log('Cache Size:', stats.cacheSize);
    console.table(stats.metrics);
    console.groupEnd();
  }
}

// Initialize globally accessible CDN resolver
window.cdnResolver = window.cdnResolver || new CDNResolver();

// Export for use in modules if needed
if (typeof module !== 'undefined' && module.exports) {
  module.exports = CDNResolver;
}

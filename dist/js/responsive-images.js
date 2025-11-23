/**
 * Responsive Images Handler
 * Optimizes picture elements and provides fallback for browsers without support
 */

(function() {
    'use strict';

    // Initialize responsive image handling
    function initResponsiveImages() {
        const pictures = document.querySelectorAll('picture');
        
        pictures.forEach(picture => {
            const img = picture.querySelector('img');
            if (img) {
                // Mark as responsive image
                img.setAttribute('data-responsive', 'true');
                
                // Log responsive variant selection (development)
                if (process.env.NODE_ENV === 'development') {
                    const sources = picture.querySelectorAll('source');
                    console.log(`✓ Responsive picture element initialized with ${sources.length} sources`);
                }
            }
        });

        // Observe for dynamically added picture elements
        observeNewPictures();
    }

    // Observer for dynamically added picture elements
    function observeNewPictures() {
        if ('MutationObserver' in window) {
            const observer = new MutationObserver((mutations) => {
                mutations.forEach((mutation) => {
                    if (mutation.addedNodes.length) {
                        mutation.addedNodes.forEach((node) => {
                            if (node.nodeType === 1) { // Element node
                                const pictures = node.querySelectorAll ? node.querySelectorAll('picture') : [];
                                if (node.tagName === 'PICTURE') {
                                    initResponsiveImages();
                                } else if (pictures.length) {
                                    initResponsiveImages();
                                }
                            }
                        });
                    }
                });
            });

            observer.observe(document.body, {
                childList: true,
                subtree: true
            });
        }
    }

    // Performance: Track image loading
    function trackImagePerformance() {
        const images = document.querySelectorAll('img[data-responsive]');
        
        images.forEach(img => {
            const observer = new PerformanceObserver((list) => {
                list.getEntries().forEach((entry) => {
                    if (entry.name.includes(img.src)) {
                        const loadTime = entry.responseEnd - entry.startTime;
                        // Store metric for analysis
                        if (!window.imageLoadMetrics) {
                            window.imageLoadMetrics = [];
                        }
                        window.imageLoadMetrics.push({
                            src: img.src,
                            loadTime: loadTime,
                            size: entry.transferSize
                        });
                    }
                });
            });

            try {
                observer.observe({ entryTypes: ['resource'] });
            } catch (e) {
                // PerformanceObserver not supported
            }
        });
    }

    // Initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            initResponsiveImages();
            trackImagePerformance();
        });
    } else {
        initResponsiveImages();
        trackImagePerformance();
    }
})();

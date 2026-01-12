/**
 * Portrait Orientation Detector
 * Detects mobile devices in portrait mode and applies responsive styling
 */

(function() {
    const portraitClass = 'portrait-mode';
    const landscapeClass = 'landscape-mode';
    
    /**
     * Detects if device is in portrait orientation
     * @returns {boolean}
     */
    function isPortraitMode() {
        return window.innerHeight > window.innerWidth;
    }
    
    /**
     * Detects if device is mobile/tablet
     * @returns {boolean}
     */
    function isMobileDevice() {
        const userAgent = navigator.userAgent || navigator.vendor || window.opera;
        const mobileRegex = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i;
        return mobileRegex.test(userAgent.toLowerCase()) || window.innerWidth < 768;
    }
    
    /**
     * Applies appropriate CSS class based on orientation
     */
    function applyOrientationClass() {
        const html = document.documentElement;
        const body = document.body;
        
        if (isPortraitMode()) {
            html.classList.add(portraitClass);
            html.classList.remove(landscapeClass);
            body.classList.add(portraitClass);
            body.classList.remove(landscapeClass);
            
            // Store state for debugging/reference
            document.documentElement.dataset.orientation = 'portrait';
        } else {
            html.classList.add(landscapeClass);
            html.classList.remove(portraitClass);
            body.classList.add(landscapeClass);
            body.classList.remove(portraitClass);
            
            document.documentElement.dataset.orientation = 'landscape';
        }
    }
    
    /**
     * Initialize portrait detection
     */
    function init() {
        // Apply on initial load
        applyOrientationClass();
        
        // Listen for orientation change
        window.addEventListener('orientationchange', applyOrientationClass);
        
        // Listen for resize (handles device orientation changes on desktop, rotating phones, etc.)
        window.addEventListener('resize', applyOrientationClass);
    }
    
    // Initialize when DOM is ready or document already loaded
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
    
    // Expose API for debugging
    window.portraitDetector = {
        isPortrait: isPortraitMode,
        isMobile: isMobileDevice,
        refresh: applyOrientationClass
    };
})();

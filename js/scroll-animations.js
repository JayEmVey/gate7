// Scroll animations - Can be deferred
document.addEventListener('DOMContentLoaded', function() {
    const mainEl = document.querySelector('main');
    const indicator = document.querySelector('.scroll-indicator');
    let isCompacted = false;

    // Check if portrait mode
    function isPortraitMode() {
        return window.innerHeight > window.innerWidth;
    }

    // Scroll indicator fade out + main section compact and pin
    let transitioning = false;
    
    window.addEventListener('scroll', function() {
        const scrollY = window.scrollY;
        const threshold = 87; // Scroll distance before compact

        // Fade out indicator
        if (indicator) {
            indicator.style.opacity = scrollY > threshold ? '0' : '1';
        }

        // Display Header and Hide the Main only in the portrait mode
        if (isPortraitMode() && !transitioning) {
            const shouldCompact = scrollY > threshold;
            
            if (shouldCompact !== isCompacted) {
                transitioning = true;
                isCompacted = shouldCompact;
                
                document.querySelector('.header').style.display = shouldCompact ? 'flex' : 'none';
                document.querySelector('main').style.display = shouldCompact ? 'none' : 'flex';
                
                requestAnimationFrame(() => {
                    transitioning = false;
                });
            } 
        } else {
            document.querySelector('.header').style.display = 'none';
            document.querySelector('main').style.display = 'flex';                  
        }
    });

    // Intersection Observer for scroll animations
    const observerOptions = {
        threshold: 0,
        rootMargin: '7px'
    };

    const observer = new IntersectionObserver(function(entries) {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('animate-in');
                // Don't unobserve - keep observing to maintain state
            }
        });
    }, observerOptions);

    // Observe elements that should animate on scroll
    const animateElements = document.querySelectorAll('.menu, .latest-blogs, .footer');
    animateElements.forEach(el => {
        observer.observe(el);
    });

    // Recalculate scroll animations on window resize
    window.addEventListener('resize', function() {
        // Trigger scroll event to recalculate animations based on new viewport dimensions
        window.dispatchEvent(new Event('scroll'));
    });
});

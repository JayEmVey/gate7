// Scroll animations - Can be deferred
document.addEventListener('DOMContentLoaded', function() {
    // Scroll indicator fade out
    window.addEventListener('scroll', function() {
        const indicator = document.querySelector('.scroll-indicator');
        if (indicator) indicator.style.opacity = '0';
    });

    // Intersection Observer for scroll animations
    const observerOptions = {
        threshold: 0,
        rootMargin: '0px'
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
    const animateElements = document.querySelectorAll('.menu, .footer');
    animateElements.forEach(el => {
        observer.observe(el);
    });
});

// Language switcher - Enhanced with proper synchronization
document.addEventListener('DOMContentLoaded', function() {
    const langBtns = document.querySelectorAll('.lang-btn');
    
    // Detect language from URL pathname (/en/ = English)
    const pathname = window.location.pathname;
    let urlLang = pathname.startsWith('/en/') ? 'en' : 'vn';
    
    let currentLang = 'vn'; // Default to Vietnamese (primary language)

    function switchLanguage(lang) {
        // Validate language code
        if (!['en', 'vn'].includes(lang)) {
            console.warn(`Invalid language: ${lang}, defaulting to en`);
            lang = 'en';
        }

        // Update button states
        langBtns.forEach(btn => {
            if (btn.dataset.lang === lang) {
                btn.classList.add('active');
            } else {
                btn.classList.remove('active');
            }
        });

        // Update all translatable elements with data attributes
        const elements = document.querySelectorAll('[data-en][data-vn]');
        elements.forEach(el => {
            const translations = {
                'en': el.getAttribute('data-en'),
                'vn': el.getAttribute('data-vn')
            };
            
            if (translations[lang]) {
                el.textContent = translations[lang];
            }
        });

        // Update current language and save preference
        currentLang = lang;
        localStorage.setItem('selectedLanguage', lang);
        
        // Optional: Add language attribute to HTML element for CSS targeting
        document.documentElement.lang = lang;
    }

    // Load language: prioritize URL path, then saved preference, then default
    const savedLang = localStorage.getItem('selectedLanguage') || 'vn';
    const langToUse = urlLang || savedLang;
    switchLanguage(langToUse);

    // Event listeners for language buttons
    langBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            const lang = btn.dataset.lang;
            switchLanguage(lang);
        });
    });

    // Expose switchLanguage to window for manual control if needed
    window.switchLanguage = switchLanguage;
});

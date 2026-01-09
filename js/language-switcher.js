// Language switcher - Enhanced with proper synchronization
document.addEventListener('DOMContentLoaded', function() {
    const langBtns = document.querySelectorAll('.lang-btn');
    
    // Detect language from URL parameter (?lang=en or ?lang=vi)
    const urlParams = new URLSearchParams(window.location.search);
    const urlLang = urlParams.get('lang');
    
    let currentLang = 'vn'; // Default to Vietnamese (primary language)

    function updateLanguageContent(lang) {
        // Normalize language code (vi -> vn for internal consistency)
        if (lang === 'vi') {
            lang = 'vn';
        }
        
        // Validate language code
        if (!['en', 'vn'].includes(lang)) {
            console.warn(`Invalid language: ${lang}, defaulting to vn`);
            lang = 'vn';
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

    // Main switchLanguage function that handles both URL and content updates
    function switchLanguage(lang) {
        // Update content
        updateLanguageContent(lang);
        
        // Update URL with lang parameter
        if (lang === 'vn') {
            // Use ?lang=vi for Vietnamese (matching the requirement)
            window.history.replaceState({}, '', '?lang=vi');
        } else {
            // Use ?lang=en for English
            window.history.replaceState({}, '', '?lang=en');
        }
    }

    // Load language: prioritize URL parameter, then saved preference, then default
    const savedLang = localStorage.getItem('selectedLanguage') || 'vn';
    let langToUse = urlLang || savedLang;
    
    // Normalize language code if URL has ?lang=vi
    if (langToUse === 'vi') {
        langToUse = 'vn';
    }
    
    updateLanguageContent(langToUse);

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

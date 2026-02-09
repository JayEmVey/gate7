// Language switcher - Consistent use of 'vi' (language code) throughout
document.addEventListener('DOMContentLoaded', function() {
    const langBtns = document.querySelectorAll('.lang-btn');
    
    // Detect language from URL parameter (?lang=en or ?lang=vi)
    const urlParams = new URLSearchParams(window.location.search);
    const urlLang = urlParams.get('lang');
    
    let currentLang = 'vi'; // Default to Vietnamese (ISO 639-1 language code)
    
    // Map button data-lang values to internal language codes
    const langMap = {
        'vn': 'vi',  // Button shows 'vn' (country code) but internally use 'vi'
        'en': 'en',  // English remains 'en'
        'vi': 'vi'   // Support 'vi' from URL params
    };

    function updateLanguageContent(lang) {
        // Normalize language code using map
        lang = langMap[lang] || 'vi';
        
        // Validate language code
        if (!['en', 'vi'].includes(lang)) {
            console.warn(`Invalid language: ${lang}, defaulting to vi`);
            lang = 'vi';
        }

        // Update button states (match against data-lang attribute values)
        langBtns.forEach(btn => {
            const btnLang = langMap[btn.dataset.lang] || btn.dataset.lang;
            if (btnLang === lang) {
                btn.classList.add('active');
            } else {
                btn.classList.remove('active');
            }
        });

        // Update all translatable elements with data attributes
        const elements = document.querySelectorAll('[data-en][data-vi]');
        elements.forEach(el => {
            const translations = {
                'en': el.getAttribute('data-en'),
                'vi': el.getAttribute('data-vi') || el.getAttribute('data-vn') // Support legacy data-vn
            };
            
            if (translations[lang]) {
                el.textContent = translations[lang];
            }
        });

        // Update current language and save preference
        currentLang = lang;
        localStorage.setItem('selectedLanguage', lang);
        
        // Set language attribute on HTML element (use 'vi' not 'vn')
        document.documentElement.lang = lang;
    }

    // Main switchLanguage function that handles both URL and content updates
    function switchLanguage(lang) {
        // Normalize incoming language code
        lang = langMap[lang] || lang;
        
        // Update content
        updateLanguageContent(lang);
        
        // Update URL with lang parameter while preserving other params
        const urlParams = new URLSearchParams(window.location.search);
        urlParams.set('lang', lang); // Use 'vi' in URLs (not 'vn')
        
        const newUrl = window.location.pathname + '?' + urlParams.toString();
        window.history.replaceState({}, '', newUrl);
        
        // Dispatch custom event for dynamic content reload (blog, articles, etc.)
        window.dispatchEvent(new CustomEvent('languageChanged', { detail: { lang: lang } }));
    }

    // Load language: prioritize URL parameter, then saved preference, then default
    const savedLang = localStorage.getItem('selectedLanguage') || 'vi';
    let langToUse = urlLang || savedLang;
    
    // Normalize language code
    langToUse = langMap[langToUse] || langToUse;
    
    updateLanguageContent(langToUse);

    // Event listeners for language buttons
    langBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            const btnLang = btn.dataset.lang; // Gets 'vn' or 'en'
            switchLanguage(btnLang);
        });
    });

    // Expose switchLanguage to window for manual control if needed
    window.switchLanguage = switchLanguage;
});

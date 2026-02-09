// Blogs Carousel Functionality - Fetches from GitHub Gists API
// Uses same thumbnail extraction mechanism as blog.js
const GIST_USER = 'JayEmVey';
const GIST_API_URL = `https://api.github.com/users/${GIST_USER}/gists`;

// Calculate reading time from text (average 200 words per minute)
function calculateReadingTime(text) {
    if (!text) return 1;
    
    // Remove markdown syntax and HTML tags
    const cleanText = text
        .replace(/[#*`\[\](){}]/g, '') // Remove markdown syntax
        .replace(/<[^>]*>/g, '') // Remove HTML tags
        .replace(/\n+/g, ' '); // Replace newlines with spaces
    
    // Count words
    const wordCount = cleanText.trim().split(/\s+/).filter(word => word.length > 0).length;
    
    // Calculate reading time (200 words per minute)
    const readingTime = Math.ceil(wordCount / 200);
    
    return readingTime || 1; // Minimum 1 minute
}

// Format reading time display with language support
function formatReadingTime(minutes, lang = null) {
    // Get language if not provided
    if (!lang) {
        const urlParams = new URLSearchParams(window.location.search);
        let langToUse = urlParams.get('lang') || localStorage.getItem('selectedLanguage') || 'vi';
        if (langToUse === 'vn') langToUse = 'vi';
        lang = langToUse;
    }
    
    // Format based on language
    if (lang === 'vi') {
        if (minutes === 1) {
            return '1 phút đọc';
        }
        return `${minutes} phút đọc`;
    } else {
        // English
        if (minutes === 1) {
            return '1 min read';
        }
        return `${minutes} min read`;
    }
}

// Markdown to HTML converter using marked.js (same as blog.js)
function markdownToHtml(markdown) {
    if (!markdown) return '';
    
    // marked is loaded from /lib/marked.js
    if (typeof marked !== 'undefined') {
        let html = marked.parse(markdown);
        
        // Wrap images with centered container
        html = html.replace(/<img([^>]*?)>/g, '<div class="centered-image"><img$1></div>');
        
        return html;
    }
    
    // Fallback if marked is not loaded
    console.warn('marked.js not loaded, using basic converter');
    return markdown;
}

document.addEventListener('DOMContentLoaded', function() {
    const blogsContainer = document.getElementById('blogsContainer');
    const loadingIndicator = document.getElementById('loadingBlogsIndicator');
    const prevBtn = document.getElementById('prevBtn');
    const nextBtn = document.getElementById('nextBtn');
    
    // Safety check - ensure elements exist
    if (!blogsContainer || !prevBtn || !nextBtn) {
        console.error('Blog carousel elements not found');
        return;
    }
    
    let currentIndex = 0;
    let blogs = [];
    let cardsPerView = 3;
    
    // Determine cards per view based on screen size
    function updateCardsPerView() {
        if (window.innerWidth <= 480) {
            cardsPerView = 1;
        } else if (window.innerWidth <= 768) {
            cardsPerView = 1;
        } else {
            cardsPerView = 3;
        }
        currentIndex = 0; // Reset to first slide on resize
    }
    
    // Create URL-friendly slug from title (supports Vietnamese)
    function createSlug(title) {
        return title
            .toLowerCase()
            .trim()
            .normalize('NFD') // Decompose Vietnamese diacritics
            .replace(/[\u0300-\u036f]/g, '') // Remove diacritics
            .replace(/[^\w\s-]/g, '') // Remove special characters
            .replace(/\s+/g, '-') // Replace spaces with hyphens
            .replace(/-+/g, '-'); // Replace multiple hyphens with single hyphen
    }
    
    // Get current language setting (matches language-switcher.js logic)
    function getCurrentLanguage() {
        const urlParams = new URLSearchParams(window.location.search);
        const urlLang = urlParams.get('lang');
        const savedLang = localStorage.getItem('selectedLanguage') || 'vi';
        
        let langToUse = urlLang || savedLang;
        // Normalize language code to use 'vi' consistently
        if (langToUse === 'vn') {
            langToUse = 'vi';
        }
        
        return langToUse;
    }
    
    // Extract language code from filename (first 4 characters: [Vi] or [En])
    function extractLanguageFromFilename(filename) {
        // Match pattern like [Vi] or [En] at the start
        const match = filename.match(/^\[(Vi|En)\]/i);
        if (match) {
            const langCode = match[1].toLowerCase();
            // Normalize to internal format: vi (consistent with ISO 639-1)
            return langCode === 'vi' ? 'vi' : 'en';
        }
        return null; // No language identifier found
    }
    
    // Fetch all gists from JayEmVey
    async function fetchGists() {
        try {
            const response = await fetch(GIST_API_URL);
            if (!response.ok) throw new Error('Failed to fetch gists');
            
            const gists = await response.json();
            const currentLang = getCurrentLanguage();
            
            // Filter gists with markdown files and matching language
            const filteredGists = gists.filter(gist => {
                const hasMarkdown = Object.values(gist.files).some(file => file.language === 'Markdown');
                if (!hasMarkdown) return false;
                
                // Filter by language: only show articles matching current language
                const mdFile = Object.values(gist.files).find(file => file.language === 'Markdown');
                const fileLanguage = extractLanguageFromFilename(mdFile.filename);
                
                // Only include if language matches current setting
                return fileLanguage === currentLang;
            });
            
            return filteredGists;
        } catch (error) {
            console.error('Error fetching gists:', error);
            return [];
        }
    }
    
    // Extract thumbnail and reading time from markdown content
    async function extractThumbnailAndReadingTime(rawUrl) {
        const result = {
            thumbnail: '/images/01122025-menu-sc.webp',
            readingTime: 1
        };
        
        try {
            const response = await fetch(rawUrl);
            const content = await response.text();
            
            // Calculate reading time
            result.readingTime = calculateReadingTime(content);
            
            // Convert markdown to HTML
            const html = markdownToHtml(content);
            
            // Find first img tag and extract src (same as blog.js)
            const imgMatch = html.match(/<img[^>]+src=["']([^"']+)["']/);
            if (imgMatch) {
                result.thumbnail = imgMatch[1].trim();
                console.log('Found thumbnail in carousel:', result.thumbnail);
            } else {
                console.warn('No image found in markdown');
            }
        } catch (error) {
            console.error('Error extracting thumbnail and reading time:', error);
        }
        
        return result;
    }
    
    // Load blog articles from GitHub Gists
    async function loadBlogs() {
        try {
            const gists = await fetchGists();
            
            if (gists.length === 0) {
                blogsContainer.innerHTML = '<p style="grid-column: 1/-1; text-align: center; color: #999;">No articles found</p>';
                if (loadingIndicator && loadingIndicator.parentNode) {
                    loadingIndicator.parentNode.removeChild(loadingIndicator);
                }
                return;
            }
            
            // Sort gists by created_at (newest first) and take top 3
            const sortedGists = gists.sort((a, b) => 
                new Date(b.created_at) - new Date(a.created_at)
            ).slice(0, 3);
            
            // Extract blog data from gists
            blogs = await Promise.all(sortedGists.map(async (gist) => {
                const mdFile = Object.values(gist.files).find(file => file.language === 'Markdown');
                let title = mdFile?.filename?.replace('.md', '') || gist.description || 'Untitled Article';
                // Remove language identifier from title (e.g., "[Vi]" or "[En]")
                title = title.replace(/^\[(Vi|En)\]\s*/i, '');
                const description = gist.description || 'No description available';
                const author = gist.owner.login || 'Gate 7 Team';
                const date = new Date(gist.created_at).toLocaleDateString();
                const slug = createSlug(title);
                
                // Extract thumbnail and reading time from markdown
                let image = '/images/01122025-menu-sc.webp';
                let readingTime = 1;
                if (mdFile?.raw_url) {
                    const result = await extractThumbnailAndReadingTime(mdFile.raw_url);
                    image = result.thumbnail;
                    readingTime = result.readingTime;
                }
                
                return {
                    id: gist.id,
                    slug: slug,
                    title: title,
                    description: description,
                    image: image,
                    author: author,
                    date: date,
                    readingTime: readingTime
                };
            }));
            
            renderBlogs();
        } catch (error) {
            console.error('Error loading blogs:', error);
            blogsContainer.innerHTML = '<p style="grid-column: 1/-1; text-align: center; color: #999;">Unable to load articles. Please try again later.</p>';
            if (loadingIndicator && loadingIndicator.parentNode) {
                loadingIndicator.parentNode.removeChild(loadingIndicator);
            }
        }
    }
    
    function renderBlogs() {
        if (!blogsContainer) return;
        
        if (loadingIndicator && loadingIndicator.parentNode) {
            loadingIndicator.parentNode.removeChild(loadingIndicator);
        }
        
        blogsContainer.innerHTML = '';
        
        // Get current language
        const urlParams = new URLSearchParams(window.location.search);
        let currentLanguage = urlParams.get('lang') || localStorage.getItem('selectedLanguage') || 'vi';
        if (currentLanguage === 'vn') currentLanguage = 'vi';
        
        // For responsive grid layout, show all cards
        blogs.forEach((blog, index) => {
            const card = document.createElement('div');
            card.className = 'blog-card';
            card.style.animationDelay = `${index * 0.1}s`;
            
            const readingTimeStr = formatReadingTime(blog.readingTime, currentLanguage);
            
            card.innerHTML = `
                <img src="${blog.image}" alt="${blog.title}" class="blog-image" onerror="this.src='/images/01122025-menu-sc.webp'">
                <div class="blog-content">
                    <div class="blog-meta">
                        <span class="blog-author">${blog.author}</span>
                        <span class="blog-date">${blog.date} • ${readingTimeStr}</span>
                    </div>
                    <h3 class="blog-title">${blog.title}</h3>
                    <p class="blog-description">${blog.description}</p>
                </div>
            `;
            
            card.addEventListener('click', function() {
                // Navigate to blog article page with slug and language
                const langParam = currentLanguage === 'en' ? 'en' : 'vi';
                sessionStorage.setItem('gistId', blog.id);
                window.location.href = `/blog/article/?slug=${blog.slug}&lang=${langParam}`;
            });
            
            blogsContainer.appendChild(card);
        });
        
        updateCarouselButtons();
    }
    
    // Reload carousel when language changes
    async function reloadCarousel() {
        currentIndex = 0; // Reset to first slide
        loadBlogs();
    }
    
    // Listen for language change event and reload carousel
    function setupLanguageSwitchListener() {
        window.addEventListener('languageChanged', reloadCarousel);
    }
    
    function updateCarouselButtons() {
        // Hide buttons on mobile/tablet (using responsive grid instead)
        if (window.innerWidth <= 768) {
            prevBtn.style.display = 'none';
            nextBtn.style.display = 'none';
        } else {
            prevBtn.style.display = 'flex';
            nextBtn.style.display = 'flex';
            
            prevBtn.disabled = currentIndex === 0;
            nextBtn.disabled = currentIndex >= blogs.length - cardsPerView;
        }
    }
    
    function scroll(direction) {
        if (direction === 'next') {
            if (currentIndex < blogs.length - cardsPerView) {
                currentIndex++;
            }
        } else {
            if (currentIndex > 0) {
                currentIndex--;
            }
        }
        updateCarouselButtons();
        animateScroll();
    }
    
    function animateScroll() {
        const cards = document.querySelectorAll('.blog-card');
        if (cards.length === 0) return;
        
        const cardWidth = cards[0].offsetWidth + 32; // 32px is the gap
        const offset = -currentIndex * cardWidth;
        blogsContainer.style.transform = `translateX(${offset}px)`;
    }
    
    // Event listeners
    if (prevBtn) prevBtn.addEventListener('click', () => scroll('prev'));
    if (nextBtn) nextBtn.addEventListener('click', () => scroll('next'));
    
    // Update on window resize
    window.addEventListener('resize', function() {
        updateCardsPerView();
        updateCarouselButtons();
    });
    
    // Initial load
    updateCardsPerView();
    loadBlogs();
    setupLanguageSwitchListener();
});

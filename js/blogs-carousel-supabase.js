/**
 * Gate 7 Coffee - Blogs Carousel using Supabase
 * Displays latest blog articles with carousel functionality
 */

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
    
    // Get current language setting
    function getCurrentLanguage() {
        const urlParams = new URLSearchParams(window.location.search);
        const urlLang = urlParams.get('lang');
        const savedLang = localStorage.getItem('selectedLanguage') || 'vi';
        
        let langToUse = urlLang || savedLang;
        // Normalize language code to use 'vi' consistently (ISO 639-1)
        if (langToUse === 'vn') {
            langToUse = 'vi';
        }
        
        return langToUse;
    }
    
    // Calculate reading time from word count (average 200 words per minute)
    function calculateReadingTime(wordCount) {
        if (!wordCount || wordCount < 1) return 1;
        const readingTime = Math.ceil(wordCount / 200);
        return readingTime || 1; // Minimum 1 minute
    }
    
    // Format reading time display with language support
    function formatReadingTime(minutes, lang = null) {
        if (!lang) {
            lang = getCurrentLanguage();
        }
        
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
    
    // Load blog articles from Supabase
    async function loadBlogs() {
        try {
            // Wait for Supabase client to be initialized
            let retries = 0;
            const maxRetries = 100; // 10 seconds
            
            while (!window.supabaseClient && retries < maxRetries) {
                await new Promise(resolve => setTimeout(resolve, 100));
                retries++;
            }
            
            if (!window.supabaseClient) {
                throw new Error('Supabase client not initialized');
            }
            
            const currentLang = getCurrentLanguage() === 'vi' ? 'vi' : 'en';
            
            // Fetch latest articles from Supabase
            const { data: articles, error } = await window.supabaseClient
                .from(CONFIG.tables.articles)
                .select('*')
                .eq('language', currentLang)
                .order('published_at', { ascending: false })
                .limit(6); // Get more to ensure we have enough visible items
            
            if (error) {
                throw new Error(`Supabase query error: ${error.message}`);
            }
            
            if (!articles || articles.length === 0) {
                blogsContainer.innerHTML = '<p style="grid-column: 1/-1; text-align: center; color: #999;">No articles found</p>';
                if (loadingIndicator && loadingIndicator.parentNode) {
                    loadingIndicator.parentNode.removeChild(loadingIndicator);
                }
                return;
            }
            
            // Transform articles to blog card format
            blogs = articles.map(article => {
                // Extract featured image from thumbnail_base64 (null if not available)
                let image = null;
                if (article.thumbnail_base64 && typeof article.thumbnail_base64 === 'string' && article.thumbnail_base64.length > 0) {
                    image = article.thumbnail_base64.startsWith('data:')
                        ? article.thumbnail_base64
                        : `data:image/jpeg;base64,${article.thumbnail_base64}`;
                }
                
                // Create excerpt from content
                let excerpt = article.excerpt || '';
                if (!excerpt && article.content) {
                    const plainText = article.content.replace(/<[^>]*>/g, '').trim();
                    excerpt = plainText.length > 150
                        ? plainText.substring(0, 150).trim() + '...'
                        : plainText;
                }
                
                return {
                    id: article.id,
                    slug: article.slug,
                    title: article.title || 'Untitled',
                    excerpt: excerpt || 'No description available',
                    image: image,
                    author: article.author_name || 'Gate 7 Team',
                    date: new Date(article.published_at).toLocaleDateString(),
                    topic: article.topic_name || 'Coffee',
                    readingTime: calculateReadingTime(article.word_count)
                };
            });
            
            renderBlogs();
        } catch (error) {
            console.error('Error loading blogs from Supabase:', error);
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
        const currentLanguage = getCurrentLanguage();
        
        // For responsive grid layout, show all cards
        blogs.forEach((blog, index) => {
            const card = document.createElement('div');
            card.className = 'blog-card';
            card.style.animationDelay = `${index * 0.1}s`;
            
            const readingTimeStr = formatReadingTime(blog.readingTime, currentLanguage);
            
            card.innerHTML = `
                ${blog.image ? `<img src="${blog.image}" alt="${blog.title}" class="blog-image">` : ''}
                <div class="blog-content">
                    <div class="blog-meta">
                        <span class="blog-date">${blog.date}</span>
                        ${blog.topic ? `<span class="blog-topic">${blog.topic.toUpperCase()}</span>` : ''}
                        <span class="blog-author">${blog.author}</span>
                    </div>
                    <h3 class="blog-title">${blog.title}</h3>
                    <p class="blog-description">${blog.excerpt}</p>
                </div>
            `;
            
            card.addEventListener('click', function() {
                // Navigate to blog article page
                const langParam = currentLanguage === 'en' ? 'en' : 'vi';
                window.location.href = `/blog/article?slug=${blog.slug}&lang=${langParam}`;
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

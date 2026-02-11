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
    let startX = 0;
    let startOffset = 0;
    let currentOffset = 0;
    
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
            
            // Fetch latest 7 articles from Supabase (minimal fields for fast loading)
            const { data: articles, error } = await window.supabaseClient
                .from(CONFIG.tables.articles)
                .select('id,slug,title,description,author_name,topic_name,topic_slug,published_at,thumbnail_base64')
                .eq('language', currentLang)
                .order('published_at', { ascending: false })
                .range(0, 6);
            
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
            
            const defaultImage = (CONFIG && CONFIG.seo && CONFIG.seo.defaultImage)
                ? CONFIG.seo.defaultImage
                : '/images/article-default.png';

            // Transform articles to blog card format
            blogs = articles.map(article => {
                // Extract featured image from thumbnail_base64 (null if not available)
                let image = null;
                if (article.thumbnail_base64 && typeof article.thumbnail_base64 === 'string' && article.thumbnail_base64.length > 0) {
                    image = article.thumbnail_base64.startsWith('data:')
                        ? article.thumbnail_base64
                        : `data:image/jpeg;base64,${article.thumbnail_base64}`;
                }

                if (!image) {
                    image = defaultImage;
                }
                
                // Create description from description field only (avoid loading full content)
                let description = article.description || '';
                if (description) {
                    const plainText = description.replace(/<[^>]*>/g, '').trim();
                    const maxLength = (CONFIG && CONFIG.site && Number.isFinite(CONFIG.site.descLength))
                        ? CONFIG.site.descLength
                        : 500;
                    description = plainText.length > maxLength
                        ? plainText.substring(0, maxLength).trim() + '...'
                        : plainText;
                }
                
                return {
                    id: article.id,
                    slug: article.slug,
                    title: article.title || 'Untitled',
                    description: description || 'No description available',
                    image: image,
                    author: article.author_name || 'Gate 7 Coffee Roastery',
                    date: new Date(article.published_at).toLocaleDateString(),
                    topic: article.topic_name || 'Coffee',
                    topic_slug: article.topic_slug || 'topic-slug'
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
            const articleUrl = `/blog/article?slug=${blog.slug}`;
            const topicUrl = `/blog/?topic=${blog.topic_slug}`;
            
            card.innerHTML = `
                ${blog.image ? `<a class="blog-image-link" href="${articleUrl}" aria-label="${blog.title}"><img src="${blog.image}" alt="${blog.title}" class="blog-image" onerror="this.onerror=null;this.src='${(CONFIG && CONFIG.seo && CONFIG.seo.defaultImage) ? CONFIG.seo.defaultImage : '/images/logo-color-black-bg1.webp'}';"></a>` : ''}
                <div class="blog-content">
                    <div class="blog-meta">
                        <span class="blog-date">${blog.date}</span>
                        <a href="${topicUrl}" aria-label="${blog.topic.toUpperCase()}">
                            ${blog.topic ? `<span class="blog-topic">${blog.topic.toUpperCase()}</span>` : ''}
                        </a>
                        <span class="blog-author">${blog.author}</span>
                    </div>
                    <h3 class="blog-title">${blog.title}</h3>
                    <p class="blog-description">${blog.description}</p>
                    <a class="read-more" href="${articleUrl}">
                        ${currentLanguage === 'en' ? 'Read More' : 'Đọc Thêm'} →
                    </a>
                </div>
            `;
            
            card.addEventListener('click', function(event) {
                if (event.target.closest('a')) {
                    return;
                }
                // Navigate to blog article page
                window.location.href = articleUrl;
            });
            
            blogsContainer.appendChild(card);
        });

        animateScroll();
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

    function getCarouselGap() {
        const containerStyle = window.getComputedStyle(blogsContainer);
        const gapValue = containerStyle.columnGap || containerStyle.gap || '0px';
        const gap = parseFloat(gapValue);
        return Number.isFinite(gap) ? gap : 0;
    }

    function getCarouselMetrics() {
        const cards = document.querySelectorAll('.blog-card');
        if (cards.length === 0) return null;

        const cardWidth = cards[0].getBoundingClientRect().width;
        const gap = getCarouselGap();
        const step = cardWidth + gap;
        const maxOffset = Math.max(0, (blogs.length - cardsPerView) * step);

        return { step, maxOffset };
    }

    function clamp(value, min, max) {
        return Math.min(max, Math.max(min, value));
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
        const metrics = getCarouselMetrics();
        if (!metrics) return;

        const offset = -currentIndex * metrics.step;
        currentOffset = clamp(offset, -metrics.maxOffset, 0);
        blogsContainer.style.transform = `translateX(${currentOffset}px)`;
    }

    // Event listeners
    if (prevBtn) prevBtn.addEventListener('click', () => scroll('prev'));
    if (nextBtn) nextBtn.addEventListener('click', () => scroll('next'));
    
    // Update on window resize
    window.addEventListener('resize', function() {
        updateCardsPerView();
        updateCarouselButtons();
        animateScroll();
    });
    
    // Initial load
    updateCardsPerView();
    loadBlogs();
    setupLanguageSwitchListener();
});

// Blogs Carousel Functionality - Fetches from GitHub Gists API
// Uses same thumbnail extraction mechanism as blog.js
const GIST_USER = 'JayEmVey';
const GIST_API_URL = `https://api.github.com/users/${GIST_USER}/gists`;

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
    
    // Fetch all gists from JayEmVey
    async function fetchGists() {
        try {
            const response = await fetch(GIST_API_URL);
            if (!response.ok) throw new Error('Failed to fetch gists');
            
            const gists = await response.json();
            
            // Filter gists with markdown files
            const filteredGists = gists.filter(gist => {
                return Object.values(gist.files).some(file => file.language === 'Markdown');
            });
            
            return filteredGists;
        } catch (error) {
            console.error('Error fetching gists:', error);
            return [];
        }
    }
    
    // Extract thumbnail from markdown content (same mechanism as blog.js)
    async function extractThumbnail(rawUrl) {
        try {
            const response = await fetch(rawUrl);
            const content = await response.text();
            
            // Convert markdown to HTML
            const html = markdownToHtml(content);
            
            // Find first img tag and extract src (same as blog.js)
            const imgMatch = html.match(/<img[^>]+src=["']([^"']+)["']/);
            if (imgMatch) {
                const thumbnailUrl = imgMatch[1].trim();
                console.log('Found thumbnail in carousel:', thumbnailUrl);
                return thumbnailUrl;
            } else {
                console.warn('No image found in markdown');
                return '/images/01122025-menu-sc.webp';
            }
        } catch (error) {
            console.error('Error extracting thumbnail:', error);
            return '/images/01122025-menu-sc.webp';
        }
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
                const title = mdFile?.filename?.replace('.md', '') || gist.description || 'Untitled Article';
                const description = gist.description || 'No description available';
                const author = gist.owner.login || 'Gate 7 Team';
                const date = new Date(gist.created_at).toLocaleDateString();
                const slug = createSlug(title);
                
                // Extract thumbnail from markdown (same mechanism as blog.js)
                let image = '/images/01122025-menu-sc.webp';
                if (mdFile?.raw_url) {
                    image = await extractThumbnail(mdFile.raw_url);
                }
                
                return {
                    id: gist.id,
                    slug: slug,
                    title: title,
                    description: description,
                    image: image,
                    author: author,
                    date: date
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
        const currentLanguage = document.documentElement.lang || localStorage.getItem('selectedLanguage') || 'vn';
        
        // For responsive grid layout, show all cards
        blogs.forEach((blog, index) => {
            const card = document.createElement('div');
            card.className = 'blog-card';
            card.style.animationDelay = `${index * 0.1}s`;
            
            card.innerHTML = `
                <img src="${blog.image}" alt="${blog.title}" class="blog-image" onerror="this.src='/images/01122025-menu-sc.webp'">
                <div class="blog-content">
                    <div class="blog-meta">
                        <span class="blog-author">${blog.author}</span>
                        <span class="blog-date">${blog.date}</span>
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
    
    // Re-render blogs when language changes
    function setupLanguageSwitchListener() {
        const langBtns = document.querySelectorAll('.lang-btn');
        langBtns.forEach(btn => {
            btn.addEventListener('click', function() {
                // Language change will be reflected in navigation URL
                // No need to re-render as content is from Gists
            });
        });
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

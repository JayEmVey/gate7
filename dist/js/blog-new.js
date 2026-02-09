/**
 * Gate 7 Coffee Blog - Blog Listing Page
 * Handles article fetching, filtering, and display
 */

class BlogManager {
    constructor() {
         // Use 'selectedLanguage' from localStorage (set by language-switcher.js)
         // Normalize: convert 'en' to 'en', 'vn' to 'vi', default to 'vi' for Vietnamese
         const savedLang = localStorage.getItem('selectedLanguage') || 'vi';
         this.currentLanguage = (savedLang === 'en') ? 'en' : 'vi';
         this.currentCategory = 'all';
         this.currentPage = 1;
         this.articlesPerPage = CONFIG.site.articlesPerPage;
         this.allArticles = [];
         this.filteredArticles = [];

         this.init();
     }

     getTopicFromUrl() {
         const params = new URLSearchParams(window.location.search);
         const topicSlug = params.get('topic');
         if (!topicSlug) return null;
         
         // Convert slug back to original topic name
         return this.slugToTopic(topicSlug);
     }

     slugToTopic(slug) {
         // Find matching topic in articles by comparing slugs
         // This will be set after articles are loaded
         if (!this.allArticles || this.allArticles.length === 0) {
             return null;
         }
         
         const topic = this.allArticles
             .map(a => a.topic_name)
             .filter(Boolean)
             .find(topicName => this.topicToSlug(topicName) === slug);
         
         return topic || null;
     }

     topicToSlug(topicName) {
         return topicName
             .toLowerCase()
             .trim()
             .replace(/\s+/g, '-')
             .replace(/[^\w-]/g, '');
     }

    async init() {
        // Wait for Supabase client to be initialized
        let retries = 0;
        const maxRetries = 100; // 10 seconds

        const waitForClient = async () => {
             if (window.supabaseClient) {
                 console.log('BlogManager: Supabase client ready');
                 this.setupEventListeners();
                 await this.loadArticles();
                 
                 // Re-check URL topic parameter after articles are loaded
                 const urlTopic = this.getTopicFromUrl();
                 if (urlTopic) {
                     this.currentCategory = urlTopic;
                 }
                 
                 this.renderCategories();
                 // Apply category filter if topic was in URL
                 if (this.currentCategory !== 'all') {
                     this.filterByCategory(this.currentCategory);
                 } else {
                     this.renderArticles();
                 }
             } else if (retries < maxRetries) {
                 retries++;
                 console.log(`BlogManager: Waiting for Supabase client (${retries}/${maxRetries})`);
                 setTimeout(waitForClient, 100);
             } else {
                 console.error('BlogManager: Supabase client timeout');
                 this.showError('Database connection not initialized');
             }
         };

        await waitForClient();
    }



    setupEventListeners() {
        // Category filter
        document.querySelectorAll('.category-filter').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.filterByCategory(e.target.dataset.category);
            });
        });

        // Listen for language changes from language-switcher.js
        window.addEventListener('languageChanged', (e) => {
            // Normalize language: vn -> vi for Supabase
            const newLang = (e.detail.lang === 'en') ? 'en' : 'vi';
            if (newLang !== this.currentLanguage) {
                this.currentLanguage = newLang;
                this.currentPage = 1;
                this.loadArticles().then(() => {
                    this.renderCategories();
                    this.renderArticles();
                });
            }
            // Update search placeholder
            this.updateSearchPlaceholder();
        });

        // Search functionality
        const searchInput = document.getElementById('blogSearch');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                this.searchArticles(e.target.value);
            });
        }
    }

    updateSearchPlaceholder() {
        const searchInput = document.getElementById('blogSearch');
        if (searchInput) {
            const isEN = this.currentLanguage === 'en';
            searchInput.placeholder = isEN ? 'Search articles...' : 'Tìm kiếm bài viết...';
        }
    }

    async loadArticles() {
      try {
        this.showLoading(true);

        // Fetch articles from articles_full table
        const { data: articles, error } = await window.supabaseClient
          .from(CONFIG.tables.articles)
          .select('*')
          .eq('language', this.currentLanguage)
          .order('published_at', { ascending: false });

        if (error) throw error;

        console.log('Total articles loaded for language:', this.currentLanguage, articles?.length);
        console.log('First article columns:', Object.keys(articles[0] || {}));
        console.log('First article data:', articles[0]);

        // Process articles
        this.allArticles = articles.map(article => {
          // Extract featured image from thumbnail_base64 column
          let featuredImage = {
            src: '/images/gate7-default-blog.jpg',
            alt: 'Gate 7 Coffee'
          };
          
          // Use thumbnail_base64 if available
          if (article.thumbnail_base64 && typeof article.thumbnail_base64 === 'string' && article.thumbnail_base64.length > 0) {
            featuredImage.src = article.thumbnail_base64.startsWith('data:') 
              ? article.thumbnail_base64 
              : `data:image/jpeg;base64,${article.thumbnail_base64}`;
            console.log(`Article ${article.id || 'unknown'}: Using thumbnail_base64`);
          }
          
          return {
            ...article,
            featuredImage: featuredImage,
            excerpt: this.createExcerpt(article)
          };
        });

        this.filteredArticles = [...this.allArticles];
        this.renderCategories();
        console.log('Articles processed:', this.allArticles.length);
        
      } catch (error) {
        console.error('Error loading articles:', error);
        this.showError('Failed to load articles. Please try again later.');
      } finally {
        this.showLoading(false);
      }
    }

    getFeaturedImage(images) {
        if (!images || images.length === 0) {
            return {
                src: '/images/gate7-default-blog.jpg',
                alt: 'Gate 7 Coffee'
            };
        }

        // Get image with lowest display_order (featured image)
        const featured = images.sort((a, b) => a.display_order - b.display_order)[0];

        return {
            src: `data:image/jpeg;base64,${featured.image_data}`,
            alt: this.currentLanguage === 'en' ? featured.alt_text_en : featured.alt_text_vi
        };
    }

    createExcerpt(article) {
      // Use excerpt column (already language-specific from the query)
      const content = article.excerpt || article.content || '';
      
      if (!content) return '';
      
      const plainText = content.replace(/<[^>]*>/g, '');
      
      if (plainText.length <= CONFIG.site.excerptLength) {
        return plainText;
      }
      
      return plainText.substring(0, CONFIG.site.excerptLength).trim() + '...';
    }

    filterByCategory(category) {
      this.currentCategory = category;
      this.currentPage = 1;

      // Update active button
      document.querySelectorAll('.category-filter').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.category === category);
      });

      if (category === 'all') {
        this.filteredArticles = [...this.allArticles];
      } else {
        this.filteredArticles = this.allArticles.filter(article => 
          article.topic_name === category
        );
      }

      this.renderArticles();
    }

    searchArticles(query) {
      const searchTerm = query.toLowerCase().trim();
      
      if (!searchTerm) {
        this.filteredArticles = [...this.allArticles];
      } else {
        this.filteredArticles = this.allArticles.filter(article => {
          const title = article.title || '';
          const content = article.excerpt || article.content || '';
          
          return title.toLowerCase().includes(searchTerm) ||
                 content.toLowerCase().includes(searchTerm);
        });
      }

      this.currentPage = 1;
      this.renderArticles();
    }

    renderCategories() {
      const categories = [...new Set(this.allArticles.map(a => a.topic_name).filter(Boolean))];
      const categoryContainer = document.getElementById('categoryFilters');
      
      if (!categoryContainer) return;

      const buttonsHTML = `
        <button class="category-filter active" data-category="all">
          ${this.currentLanguage === 'en' ? 'All' : 'Tất Cả'}
        </button>
        ${categories.map(cat => `
          <button class="category-filter" data-category="${cat}">
            ${cat}
          </button>
        `).join('')}
      `;

      categoryContainer.innerHTML = buttonsHTML;

      // Re-attach event listeners
      categoryContainer.querySelectorAll('.category-filter').forEach(btn => {
        btn.addEventListener('click', (e) => {
          this.filterByCategory(e.target.dataset.category);
        });
      });
    }

    renderArticles() {
        const container = document.getElementById('blogGrid');
        if (!container) return;

        if (this.filteredArticles.length === 0) {
            const noArticlesMsg = this.currentLanguage === 'en'
                ? 'No articles found.'
                : 'Không tìm thấy bài viết nào.';
            container.innerHTML = `
        <div class="no-articles">
          <p>${noArticlesMsg}</p>
        </div>
      `;
            return;
        }

        // Pagination
        const startIndex = (this.currentPage - 1) * this.articlesPerPage;
        const endIndex = startIndex + this.articlesPerPage;
        const articlesToShow = this.filteredArticles.slice(startIndex, endIndex);

        container.innerHTML = articlesToShow.map(article => this.createArticleCard(article)).join('');
        this.renderPagination();
    }

    createArticleCard(article) {
      const title = article.title || 'Untitled';
      const publishDate = new Date(article.published_at).toLocaleDateString(
        this.currentLanguage === 'en' ? 'en-US' : 'vi-VN',
        { year: 'numeric', month: 'long', day: 'numeric' }
      );

      // Check if article has a valid thumbnail
      const hasThumbnail = article.thumbnail_base64 && typeof article.thumbnail_base64 === 'string' && article.thumbnail_base64.length > 0;

      return `
        <article class="blog-card-brick">
          <a href="/blog/article?slug=${article.slug || article.id}" class="card-link">
            ${hasThumbnail ? `
              <div class="card-image">
                <img 
                  src="${article.featuredImage.src}" 
                  alt="${article.featuredImage.alt}"
                  loading="lazy"
                >
              </div>
            ` : ''}
            <div class="card-content">
              <div class="card-meta">
                <span class="card-date">${publishDate}</span>
                ${article.topic_name ? `<span class="card-category">${article.topic_name}</span>` : ''}
                ${article.author_name ? `<span class="card-author">${article.author_name}</span>` : `<span class="card-author">Gate 7</span>`}
              </div>
              <h2 class="card-title">${title}</h2>
              <p class="card-excerpt">${article.excerpt}</p>
              <span class="read-more">
                ${this.currentLanguage === 'en' ? 'Read More' : 'Đọc Thêm'} →
              </span>
            </div>
          </a>
        </article>
      `;
    }

    renderPagination() {
        const paginationContainer = document.getElementById('pagination');
        if (!paginationContainer) return;

        const totalPages = Math.ceil(this.filteredArticles.length / this.articlesPerPage);

        if (totalPages <= 1) {
            paginationContainer.innerHTML = '';
            return;
        }

        let paginationHTML = '';

        // Previous button
        if (this.currentPage > 1) {
            paginationHTML += `
        <button class="page-btn" onclick="blogManager.goToPage(${this.currentPage - 1})">
          ← ${this.currentLanguage === 'en' ? 'Previous' : 'Trước'}
        </button>
      `;
        }

        // Page numbers
        for (let i = 1; i <= totalPages; i++) {
            if (
                i === 1 ||
                i === totalPages ||
                (i >= this.currentPage - 1 && i <= this.currentPage + 1)
            ) {
                paginationHTML += `
          <button 
            class="page-btn ${i === this.currentPage ? 'active' : ''}" 
            onclick="blogManager.goToPage(${i})"
          >
            ${i}
          </button>
        `;
            } else if (i === this.currentPage - 2 || i === this.currentPage + 2) {
                paginationHTML += '<span class="page-ellipsis">...</span>';
            }
        }

        // Next button
        if (this.currentPage < totalPages) {
            paginationHTML += `
        <button class="page-btn" onclick="blogManager.goToPage(${this.currentPage + 1})">
          ${this.currentLanguage === 'en' ? 'Next' : 'Tiếp'} →
        </button>
      `;
        }

        paginationContainer.innerHTML = paginationHTML;
    }

    goToPage(pageNum) {
        this.currentPage = pageNum;
        this.renderArticles();
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    showLoading(show) {
        const loader = document.getElementById('blogLoader');
        if (loader) {
            loader.style.display = show ? 'flex' : 'none';
        }
    }

    showError(message) {
        const container = document.getElementById('blogGrid');
        if (container) {
            container.innerHTML = `
        <div class="error-message">
          <p>${message}</p>
        </div>
      `;
        }
    }
}

// Initialize blog manager when DOM is ready
let blogManager;
document.addEventListener('DOMContentLoaded', () => {
    blogManager = new BlogManager();
    // Update search placeholder after initialization
    setTimeout(() => {
        blogManager.updateSearchPlaceholder();
    }, 100);
});

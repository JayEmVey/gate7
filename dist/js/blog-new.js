/**
 * Gate 7 Coffee Blog - Blog Listing Page
 * Handles article fetching, filtering, and display
 */

class BlogManager {
  constructor() {
    this.currentLanguage = localStorage.getItem('language') || CONFIG.site.defaultLanguage;
    this.currentCategory = 'all';
    this.currentPage = 1;
    this.articlesPerPage = CONFIG.site.articlesPerPage;
    this.allArticles = [];
    this.filteredArticles = [];
    
    this.init();
  }

  async init() {
    if (!supabase) {
      this.showError('Database connection not initialized');
      return;
    }

    this.setupEventListeners();
    await this.loadArticles();
    this.renderCategories();
    this.renderArticles();
  }

  setupEventListeners() {
    // Category filter
    document.querySelectorAll('.category-filter').forEach(btn => {
      btn.addEventListener('click', (e) => {
        this.filterByCategory(e.target.dataset.category);
      });
    });

    // Language switcher (integrate with existing system)
    const langSwitcher = document.getElementById('languageSwitcher');
    if (langSwitcher) {
      langSwitcher.addEventListener('click', () => {
        this.currentLanguage = this.currentLanguage === 'en' ? 'vi' : 'en';
        localStorage.setItem('language', this.currentLanguage);
        this.renderArticles();
      });
    }

    // Search functionality
    const searchInput = document.getElementById('blogSearch');
    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        this.searchArticles(e.target.value);
      });
    }
  }

  async loadArticles() {
    try {
      this.showLoading(true);

      // Fetch published articles with images
      const { data: articles, error } = await supabase
        .from(CONFIG.tables.articles)
        .select(`
          *,
          article_images (
            image_data,
            alt_text_en,
            alt_text_vi,
            display_order
          )
        `)
        .eq('status', 'published')
        .order('published_at', { ascending: false });

      if (error) throw error;

      // Process articles and images
      this.allArticles = articles.map(article => ({
        ...article,
        featuredImage: this.getFeaturedImage(article.article_images),
        excerpt: this.createExcerpt(article)
      }));

      this.filteredArticles = [...this.allArticles];
      
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
    const content = this.currentLanguage === 'en' ? article.content_en : article.content_vi;
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
        article.category === category
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
        const title = this.currentLanguage === 'en' ? article.title_en : article.title_vi;
        const content = this.currentLanguage === 'en' ? article.content_en : article.content_vi;
        
        return title.toLowerCase().includes(searchTerm) ||
               content.toLowerCase().includes(searchTerm) ||
               article.tags?.some(tag => tag.toLowerCase().includes(searchTerm));
      });
    }

    this.currentPage = 1;
    this.renderArticles();
  }

  renderCategories() {
    const categories = [...new Set(this.allArticles.map(a => a.category))];
    const categoryContainer = document.getElementById('categoryFilters');
    
    if (!categoryContainer) return;

    const categoryNames = {
      'coffee-culture': { en: 'Coffee Culture', vi: 'Văn Hóa Cà Phê' },
      'brewing-guides': { en: 'Brewing Guides', vi: 'Hướng Dẫn Pha Chế' },
      'bean-spotlight': { en: 'Bean Spotlight', vi: 'Điểm Danh Hạt' },
      'shop-news': { en: 'Shop News', vi: 'Tin Tức' }
    };

    const buttonsHTML = `
      <button class="category-filter active" data-category="all">
        ${this.currentLanguage === 'en' ? 'All' : 'Tất Cả'}
      </button>
      ${categories.map(cat => `
        <button class="category-filter" data-category="${cat}">
          ${categoryNames[cat]?.[this.currentLanguage] || cat}
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
      container.innerHTML = `
        <div class="no-articles">
          <p>${this.currentLanguage === 'en' 
            ? 'No articles found.' 
            : 'Không tìm thấy bài viết nào.'}</p>
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
    const title = this.currentLanguage === 'en' ? article.title_en : article.title_vi;
    const publishDate = new Date(article.published_at).toLocaleDateString(
      this.currentLanguage === 'en' ? 'en-US' : 'vi-VN',
      { year: 'numeric', month: 'long', day: 'numeric' }
    );

    return `
      <article class="blog-card">
        <a href="/blog/article.html?id=${article.id}" class="card-link">
          <div class="card-image">
            <img 
              src="${article.featuredImage.src}" 
              alt="${article.featuredImage.alt}"
              loading="lazy"
            >
          </div>
          <div class="card-content">
            <div class="card-meta">
              <span class="card-date">${publishDate}</span>
              <span class="card-category">${article.category}</span>
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
});

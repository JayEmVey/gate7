/**
 * Gate 7 Coffee Blog - Single Article Page
 * Handles individual article display with images and metadata
 */

class ArticleViewer {
  constructor() {
    this.currentLanguage = localStorage.getItem('language') || CONFIG.site.defaultLanguage;
    this.articleId = this.getArticleIdFromUrl();
    this.article = null;
    this.imageMap = new Map(); // Map of image references to base64 data
    
    this.init();
  }

  getArticleIdFromUrl() {
    const params = new URLSearchParams(window.location.search);
    return params.get('id');
  }

  async init() {
    if (!this.articleId) {
      this.showError('Article not found');
      return;
    }

    if (!window.supabaseClient) {
      this.showError('Database connection not initialized');
      return;
    }

    this.setupEventListeners();
    await this.loadArticle();
  }

  setupEventListeners() {
    // Language switcher
    const langSwitcher = document.getElementById('languageSwitcher');
    if (langSwitcher) {
      langSwitcher.addEventListener('click', () => {
        this.currentLanguage = this.currentLanguage === 'en' ? 'vi' : 'en';
        localStorage.setItem('language', this.currentLanguage);
        this.renderArticle();
      });
    }

    // Share buttons
    this.setupShareButtons();
  }

  async loadArticle() {
    try {
      this.showLoading(true);

      // Fetch article - simple query first
      const { data: article, error } = await window.supabaseClient
        .from(CONFIG.tables.articles)
        .select('*')
        .eq('id', this.articleId)
        .single();

      if (error) throw error;

      if (!article) {
        this.showError('Article not found');
        return;
      }

      // Fetch images separately
      const { data: images, error: imagesError } = await window.supabaseClient
        .from(CONFIG.tables.images)
        .select('*')
        .eq('article_id', this.articleId)
        .order('position', { ascending: true });

      if (imagesError) {
        console.warn('Warning loading images:', imagesError);
      }

      this.article = article;
      this.article.article_images = images || [];
      
      this.renderArticle();
      this.updateMetaTags();
      this.loadRelatedArticles();
      
    } catch (error) {
      console.error('Error loading article:', error);
      this.showError('Failed to load article. Please try again later.');
    } finally {
      this.showLoading(false);
    }
  }

  calculateReadingTime(text) {
    // Average reading speed: 200 words per minute
    const wordsPerMinute = 200;
    const words = text.trim().split(/\s+/).length;
    const minutes = Math.ceil(words / wordsPerMinute);
    return Math.max(1, minutes); // Minimum 1 minute
  }

  renderArticle() {
    if (!this.article) return;

    const title = this.article.title || 'Article';
    const content = this.article.content || '';
    const publishDate = this.article.published_at 
      ? new Date(this.article.published_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
      : '';
    
    // Calculate reading time
    const readingTime = this.calculateReadingTime(content);
    const author = this.article.author || 'Gate 7 Coffee';
    
    // Format metadata: "February 4, 2026 • Giang Nguyen • 4 minute read"
    const readTimeText = readingTime === 1 ? 'minute read' : 'minute read';
    const metaString = `${publishDate} • ${author} • ${readingTime} ${readTimeText}`;

    // Update page title
    document.title = `${title} - Gate 7 Coffee Blog`;

    // Render article header
    const headerContainer = document.getElementById('articleHeader');
    if (headerContainer) {
      headerContainer.innerHTML = `
        <div class="article-breadcrumb">
          <a href="/blog">Blog</a>
          <span>→</span>
          <span>${title}</span>
        </div>
        <h1 class="article-title">${title}</h1>
        <div class="article-meta">
          <span class="article-metadata">${metaString}</span>
        </div>
      `;
    }

    // Render featured image
    const featuredImageContainer = document.getElementById('featuredImage');
    if (featuredImageContainer && this.article.article_images && this.article.article_images.length > 0) {
      const featuredImg = this.article.article_images[0];
      const altText = featuredImg.alt_text || 'Featured image';
      featuredImageContainer.innerHTML = `
        <img 
          src="data:image/jpeg;base64,${featuredImg.image_data}" 
          alt="${altText}"
          class="featured-image"
        >
      `;
    }

    // Render article content
    const contentContainer = document.getElementById('articleContent');
    if (contentContainer) {
      contentContainer.innerHTML = this.processContent(content);
    }

    // Render tags
    this.renderTags();
  }

  processContent(content) {
    // Build image map for replacement
    this.imageMap.clear();
    if (this.article.article_images && this.article.article_images.length > 0) {
      // Skip first image (it's the featured image)
      this.article.article_images.slice(1).forEach((img, index) => {
        const altText = img.alt_text || 'Article image';
        const base64Data = img.image_data.startsWith('data:') 
          ? img.image_data 
          : `data:image/jpeg;base64,${img.image_data}`;
        
        this.imageMap.set(
          `{{image_${index + 1}}}`,
          {
            src: base64Data,
            alt: altText
          }
        );
      });
    }

    // Convert markdown to HTML using marked.js
    let htmlContent = '';
    if (window.marked) {
      htmlContent = marked.parse(content);
    } else {
      // Fallback if marked.js is not loaded
      htmlContent = `<p>${content.replace(/\n/g, '</p><p>')}</p>`;
    }

    // Replace image markers with actual images
    let processedContent = htmlContent;
    this.imageMap.forEach((imgData, marker) => {
      const figureHtml = `
        <figure class="article-image">
          <img 
            src="${imgData.src}" 
            alt="${imgData.alt}"
            loading="lazy"
          >
          <figcaption>${imgData.alt}</figcaption>
        </figure>
      `;
      processedContent = processedContent.replace(marker, figureHtml);
    });

    return processedContent;
  }

  renderTags() {
    if (!this.article.tags || this.article.tags.length === 0) return;

    const tagsContainer = document.getElementById('articleTags');
    if (!tagsContainer) return;

    tagsContainer.innerHTML = `
      <div class="article-tags">
        <span class="tags-label">${this.currentLanguage === 'en' ? 'Tags:' : 'Thẻ:'}</span>
        ${this.article.tags.map(tag => `
          <a href="/blog?tag=${encodeURIComponent(tag)}" class="tag">#${tag}</a>
        `).join('')}
      </div>
    `;
  }

  async loadRelatedArticles() {
    try {
      const { data: related, error } = await window.supabaseClient
        .from(CONFIG.tables.articles)
        .select('*')
        .neq('id', this.articleId)
        .order('published_at', { ascending: false })
        .limit(3);

      if (error) throw error;

      if (related && related.length > 0) {
        this.renderRelatedArticles(related);
      }
    } catch (error) {
      console.error('Error loading related articles:', error);
    }
  }

  renderRelatedArticles(articles) {
    const container = document.getElementById('relatedArticles');
    if (!container) return;

    const heading = this.currentLanguage === 'en' ? 'Related Articles' : 'Bài Viết Liên Quan';
    const readMoreText = this.currentLanguage === 'en' ? 'Read More' : 'Đọc Thêm';

    container.innerHTML = `
      <h2 class="related-heading">${heading}</h2>
      <div class="related-grid">
        ${articles.map(article => {
          const title = article.title || 'Article';
          const imgSrc = article.thumbnail_base64 && article.thumbnail_base64.length > 0
            ? (article.thumbnail_base64.startsWith('data:') ? article.thumbnail_base64 : `data:image/jpeg;base64,${article.thumbnail_base64}`)
            : '';
          
          // Format published date
          const publishDate = article.published_at 
            ? new Date(article.published_at).toLocaleDateString(
                this.currentLanguage === 'en' ? 'en-US' : 'vi-VN',
                { year: 'numeric', month: 'long', day: 'numeric' }
              )
            : '';
          
          // Get author name
          const author = article.author_name || 'Gate 7';
          
          // Create excerpt
          const excerpt = this.createExcerpt(article);

          return `
            <article class="blog-card-brick">
              <a href="/blog/article?id=${article.id}" class="card-link">
                ${imgSrc ? `
                  <div class="card-image">
                    <img src="${imgSrc}" alt="${title}" loading="lazy">
                  </div>
                ` : ''}
                <div class="card-content">
                  <div class="card-meta">
                    ${publishDate ? `<span class="card-date">${publishDate}</span>` : ''}
                    ${article.topic_name ? `<span class="card-category">${article.topic_name}</span>` : ''}
                    ${author ? `<span class="card-author">${author}</span>` : ''}
                  </div>
                  <h3 class="card-title">${title}</h3>
                  ${excerpt ? `<p class="card-excerpt">${excerpt}</p>` : ''}
                  <span class="read-more">${readMoreText} →</span>
                </div>
              </a>
            </article>
          `;
        }).join('')}
      </div>
    `;
  }

  createExcerpt(article) {
    const content = article.excerpt || article.content || '';
    
    if (!content) return '';
    
    const plainText = content.replace(/<[^>]*>/g, '');
    
    if (plainText.length <= CONFIG.site.excerptLength) {
      return plainText;
    }
    
    return plainText.substring(0, CONFIG.site.excerptLength).trim() + '...';
  }

  updateMetaTags() {
    const title = this.article.title || 'Article';
    const metaDesc = this.article.description || '';
    
    // Get featured image for OG tags
    const ogImage = this.article.thumbnail_base64 && this.article.thumbnail_base64.length > 0
      ? (this.article.thumbnail_base64.startsWith('data:') ? this.article.thumbnail_base64 : `data:image/jpeg;base64,${this.article.thumbnail_base64}`)
      : CONFIG.seo.defaultImage;

    // Update meta tags
    document.querySelector('meta[name="description"]')?.setAttribute('content', metaDesc);
    document.querySelector('meta[property="og:title"]')?.setAttribute('content', title);
    document.querySelector('meta[property="og:description"]')?.setAttribute('content', metaDesc);
    document.querySelector('meta[property="og:image"]')?.setAttribute('content', ogImage);
    document.querySelector('meta[property="og:url"]')?.setAttribute('content', window.location.href);
    document.querySelector('meta[name="twitter:title"]')?.setAttribute('content', title);
    document.querySelector('meta[name="twitter:description"]')?.setAttribute('content', metaDesc);
    document.querySelector('meta[name="twitter:image"]')?.setAttribute('content', ogImage);

    // Update canonical URL
    const canonical = document.querySelector('link[rel="canonical"]');
    if (canonical) {
      canonical.setAttribute('href', window.location.href);
    }
  }

  setupShareButtons() {
    const shareButtons = document.querySelectorAll('[data-share]');
    shareButtons.forEach(btn => {
      btn.addEventListener('click', (e) => {
        const platform = e.currentTarget.dataset.share;
        this.shareArticle(platform);
      });
    });
  }

  shareArticle(platform) {
    const url = encodeURIComponent(window.location.href);
    const title = encodeURIComponent(
      this.currentLanguage === 'en' ? this.article.title_en : this.article.title_vi
    );

    const shareUrls = {
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${url}`,
      twitter: `https://twitter.com/intent/tweet?url=${url}&text=${title}`,
      linkedin: `https://www.linkedin.com/shareArticle?mini=true&url=${url}&title=${title}`,
      copy: null
    };

    if (platform === 'copy') {
      navigator.clipboard.writeText(window.location.href).then(() => {
        alert(this.currentLanguage === 'en' ? 'Link copied!' : 'Đã sao chép liên kết!');
      });
    } else if (shareUrls[platform]) {
      window.open(shareUrls[platform], '_blank', 'width=600,height=400');
    }
  }

  showLoading(show) {
    const loader = document.getElementById('articleLoader');
    if (loader) {
      loader.style.display = show ? 'flex' : 'none';
    }
  }

  showError(message) {
    const container = document.getElementById('articleContent');
    if (container) {
      container.innerHTML = `
        <div class="error-message">
          <h2>${message}</h2>
          <a href="/blog" class="btn-primary">
            ${this.currentLanguage === 'en' ? 'Back to Blog' : 'Quay Lại Blog'}
          </a>
        </div>
      `;
    }
  }
}

// Initialize article viewer when DOM is ready
let articleViewer;
document.addEventListener('DOMContentLoaded', () => {
  articleViewer = new ArticleViewer();
});

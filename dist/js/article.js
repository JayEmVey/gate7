/**
 * Gate 7 Coffee Blog - Single Article Page
 * Handles individual article display with images and metadata
 */

class ArticleViewer {
  constructor() {
    this.currentLanguage = localStorage.getItem('language') || CONFIG.site.defaultLanguage;
    this.articleId = this.getArticleIdFromUrl();
    this.article = null;
    
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

    if (!supabase) {
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

      // Fetch article with images
      const { data: article, error } = await supabase
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
        .eq('id', this.articleId)
        .eq('status', 'published')
        .single();

      if (error) throw error;

      if (!article) {
        this.showError('Article not found');
        return;
      }

      this.article = article;
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

  renderArticle() {
    if (!this.article) return;

    const title = this.currentLanguage === 'en' ? this.article.title_en : this.article.title_vi;
    const content = this.currentLanguage === 'en' ? this.article.content_en : this.article.content_vi;
    const publishDate = new Date(this.article.published_at).toLocaleDateString(
      this.currentLanguage === 'en' ? 'en-US' : 'vi-VN',
      { year: 'numeric', month: 'long', day: 'numeric' }
    );

    // Update page title
    document.title = `${title} - Gate 7 Coffee Blog`;

    // Render article header
    const headerContainer = document.getElementById('articleHeader');
    if (headerContainer) {
      headerContainer.innerHTML = `
        <div class="article-breadcrumb">
          <a href="/blog">${this.currentLanguage === 'en' ? 'Blog' : 'Bài Viết'}</a>
          <span>→</span>
          <span>${title}</span>
        </div>
        <h1 class="article-title">${title}</h1>
        <div class="article-meta">
          <span class="article-date">${publishDate}</span>
          <span class="article-category">${this.article.category}</span>
          ${this.article.read_time ? `
            <span class="article-read-time">
              ${this.article.read_time} ${this.currentLanguage === 'en' ? 'min read' : 'phút đọc'}
            </span>
          ` : ''}
        </div>
      `;
    }

    // Render featured image
    const featuredImageContainer = document.getElementById('featuredImage');
    if (featuredImageContainer && this.article.article_images.length > 0) {
      const featuredImg = this.article.article_images.sort((a, b) => a.display_order - b.display_order)[0];
      featuredImageContainer.innerHTML = `
        <img 
          src="data:image/jpeg;base64,${featuredImg.image_data}" 
          alt="${this.currentLanguage === 'en' ? featuredImg.alt_text_en : featuredImg.alt_text_vi}"
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
    // Process content to insert images at markers
    let processedContent = content;
    
    // Sort images by display order
    const images = [...this.article.article_images].sort((a, b) => a.display_order - b.display_order);
    
    // Skip first image (it's the featured image)
    images.slice(1).forEach((img, index) => {
      const imgHtml = `
        <figure class="article-image">
          <img 
            src="data:image/jpeg;base64,${img.image_data}" 
            alt="${this.currentLanguage === 'en' ? img.alt_text_en : img.alt_text_vi}"
            loading="lazy"
          >
          ${img.alt_text_en || img.alt_text_vi ? `
            <figcaption>${this.currentLanguage === 'en' ? img.alt_text_en : img.alt_text_vi}</figcaption>
          ` : ''}
        </figure>
      `;
      
      // Replace image markers like {{image_1}}, {{image_2}}, etc.
      const marker = `{{image_${index + 1}}}`;
      processedContent = processedContent.replace(marker, imgHtml);
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
      const { data: related, error } = await supabase
        .from(CONFIG.tables.articles)
        .select(`
          id,
          title_en,
          title_vi,
          category,
          published_at,
          article_images (
            image_data,
            alt_text_en,
            alt_text_vi,
            display_order
          )
        `)
        .eq('status', 'published')
        .eq('category', this.article.category)
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

    container.innerHTML = `
      <h2 class="related-heading">${heading}</h2>
      <div class="related-grid">
        ${articles.map(article => {
          const title = this.currentLanguage === 'en' ? article.title_en : article.title_vi;
          const featuredImg = article.article_images.sort((a, b) => a.display_order - b.display_order)[0];
          const imgSrc = featuredImg 
            ? `data:image/jpeg;base64,${featuredImg.image_data}` 
            : '/images/gate7-default-blog.jpg';
          const imgAlt = featuredImg
            ? (this.currentLanguage === 'en' ? featuredImg.alt_text_en : featuredImg.alt_text_vi)
            : title;

          return `
            <article class="related-card">
              <a href="/blog/article.html?id=${article.id}">
                <img src="${imgSrc}" alt="${imgAlt}" loading="lazy">
                <h3>${title}</h3>
              </a>
            </article>
          `;
        }).join('')}
      </div>
    `;
  }

  updateMetaTags() {
    const title = this.currentLanguage === 'en' ? this.article.title_en : this.article.title_vi;
    const metaDesc = this.currentLanguage === 'en' ? this.article.meta_description_en : this.article.meta_description_vi;
    
    // Get featured image for OG tags
    const featuredImg = this.article.article_images.sort((a, b) => a.display_order - b.display_order)[0];
    const ogImage = featuredImg 
      ? `data:image/jpeg;base64,${featuredImg.image_data}` 
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

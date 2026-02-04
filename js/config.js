/**
 * Gate 7 Coffee Blog - Configuration
 * Supabase connection and site settings
 */

const CONFIG = {
  // Supabase Configuration
  supabase: {
    url: 'https://klrakmbgjnrlvzkisevh.supabase.co',
    anonKey: 'sb_publishable_c5nM1m_fHkh2OYfE1nPXcA_Cp5ID2Z_'
  },

  // Site Configuration
  site: {
    name: 'Gate 7 Coffee Roastery',
    url: 'https://gate7.vn',
    blogPath: '/blog-new',
    defaultLanguage: 'vi',
    articlesPerPage: 9,
    excerptLength: 150
  },

  // SEO Configuration
  seo: {
    defaultImage: '/images/gate7-og-image.jpg',
    twitterHandle: '@gate7coffee',
    siteName: 'Gate 7 Coffee Blog'
  },

  // Database Table Names
  tables: {
    articles: 'articles_full',  // Update with your actual table name
    images: 'article_images',
    categories: 'categories'
  }
};

// Initialize Supabase client when library loads
function initializeSupabase() {
  if (window.supabase && typeof window.supabase.createClient === 'function') {
    window.supabaseClient = window.supabase.createClient(
      CONFIG.supabase.url, 
      CONFIG.supabase.anonKey
    );
    console.log('Supabase client initialized');
  } else {
    console.warn('Supabase library not available yet, retrying...');
    setTimeout(initializeSupabase, 100);
  }
}

// Start initialization when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeSupabase);
} else {
  initializeSupabase();
}

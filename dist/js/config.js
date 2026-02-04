/**
 * Gate 7 Coffee Blog - Configuration
 * Supabase connection and site settings
 */

const CONFIG = {
  // Supabase Configuration
  supabase: {
    url: 'https://your-project.supabase.co',
    anonKey: 'your-anon-key-here'
  },

  // Site Configuration
  site: {
    name: 'Gate 7 Coffee Roastery',
    url: 'https://gate7.vn',
    blogPath: '/blog',
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
    articles: 'articles',
    images: 'article_images',
    categories: 'categories'
  }
};

// Initialize Supabase client
const supabase = window.supabase 
  ? window.supabase.createClient(CONFIG.supabase.url, CONFIG.supabase.anonKey)
  : null;

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { CONFIG, supabase };
}

/**
 * Gate 7 Coffee Blog - Configuration
 * Supabase connection and site settings
 * 
 * NOTE: Supabase credentials are injected at build time from environment variables
 * Never commit sensitive keys to git - use .env.local for local development
 */

// Get environment variables injected by Vite at build time
const getConfig = () => {
  // For development/direct script loading, fallback to window vars if available
  const supabaseUrl = globalThis.VITE_SUPABASE_URL || 'https://klrakmbgjnrlvzkisevh.supabase.co';
  const supabaseKey = globalThis.VITE_SUPABASE_ANON_KEY || 'sb_publishable_c5nM1m_fHkh2OYfE1nPXcA_Cp5ID2Z_';

  return {
    supabase: {
      url: supabaseUrl,
      anonKey: supabaseKey
    },
    site: {
      name: 'Gate 7 Coffee Roastery',
      url: 'https://gate7.vn',
      blogPath: '/blog',
      defaultLanguage: 'vi',
      articlesPerPage: 7,
      descLength: 500
    },
    seo: {
      defaultImage: '/images/logo-color-black-bg1.webp',
      twitterHandle: '@gate7coffee',
      siteName: 'Gate 7 Coffee Blog'
    },
    tables: {
      articles: 'articles_full',
      images: 'article_images',
      categories: 'categories'
    }
  };
};

const CONFIG = getConfig();

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

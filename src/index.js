export default {
  async fetch(request) {
    const url = new URL(request.url);
    const pathname = url.pathname;
    
    // Rewrite /en/* to / (serve index.html for language variant)
    // But preserve actual asset requests
    let rewritePath = pathname;
    if (pathname.startsWith('/en/')) {
      // Check if it's an asset request (has file extension)
      const isAsset = /\.[a-zA-Z0-9]+$/.test(pathname);
      if (!isAsset) {
        // It's a page request, serve index.html
        rewritePath = '/';
      } else {
        // It's an asset, strip /en prefix
        rewritePath = pathname.substring(3);
      }
    }
    
    // Create new request with rewritten path
    const newUrl = new URL(request.url);
    newUrl.pathname = rewritePath;
    const newRequest = new Request(newUrl, request);
    
    const response = await ASSETS.fetch(newRequest);
    
    // Clone response to modify headers
    const newResponse = new Response(response.body, response);
    
    // Set proper MIME type for CSS files
    if (rewritePath.endsWith('.css')) {
      newResponse.headers.set('Content-Type', 'text/css; charset=utf-8');
    }
    
    // Set proper MIME types for other assets
    if (rewritePath.endsWith('.js')) {
      newResponse.headers.set('Content-Type', 'application/javascript; charset=utf-8');
    }
    if (rewritePath.endsWith('.woff2')) {
      newResponse.headers.set('Content-Type', 'font/woff2');
    }
    if (rewritePath.endsWith('.woff')) {
      newResponse.headers.set('Content-Type', 'font/woff');
    }
    
    return newResponse;
  }
};

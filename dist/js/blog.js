// GitHub Gist Blog functionality
const GIST_USER = 'JayEmVey';
const GIST_API_URL = `https://api.github.com/users/${GIST_USER}/gists`;

// Fetch all gists from JayEmVey
async function fetchGists() {
    try {
        const response = await fetch(GIST_API_URL);
        if (!response.ok) throw new Error('Failed to fetch gists');
        
        const gists = await response.json();
        return gists.filter(gist => {
            // Only include gists that have markdown files
            return Object.values(gist.files).some(file => file.language === 'Markdown');
        });
    } catch (error) {
        console.error('Error fetching gists:', error);
        return [];
    }
}

// Render article grid
async function renderArticleGrid(gists) {
    const grid = document.getElementById('articleGrid');
    const loading = document.getElementById('loadingIndicator');
    
    if (gists.length === 0) {
        grid.innerHTML = '<p class="no-articles">No articles found</p>';
        loading.style.display = 'none';
        return;
    }
    
    // Sort gists by created_at date (newest first)
    gists.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    
    const articles = await Promise.all(gists.map(async (gist) => {
        const mdFile = Object.values(gist.files).find(file => file.language === 'Markdown');
        const title = mdFile?.filename?.replace('.md', '') || gist.description || 'Untitled';
        const author = gist.owner.login;
        const description = gist.description || mdFile?.filename || 'No description';
        const date = new Date(gist.created_at).toLocaleDateString();
        
        let thumbnailUrl = '';
        
        // Fetch raw content to extract thumbnail URL
        if (mdFile?.raw_url) {
            try {
                const contentResponse = await fetch(mdFile.raw_url);
                const content = await contentResponse.text();
                
                // Convert markdown to HTML
                const html = markdownToHtml(content);
                
                // Find first img tag and extract src
                const imgMatch = html.match(/<img[^>]+src=["']([^"']+)["']/);
                if (imgMatch) {
                    thumbnailUrl = imgMatch[1].trim();
                    console.log('Found thumbnail:', thumbnailUrl);
                } else {
                    console.warn('No image found in markdown:', mdFile.filename);
                }
            } catch (error) {
                console.error('Error fetching raw content for thumbnail:', error);
            }
        }
        
        return `
            <div class="article-card" onclick="navigateToArticle('${gist.id}', '${title.replace(/'/g, "\\'")}')">
                <div class="article-card-inner">
                    <h3 class="article-title">${title}</h3>
                    ${thumbnailUrl ? `<div class="article-image-wrapper"><img src="${thumbnailUrl}" alt="${title}" class="article-thumbnail"></div>` : ''}
                    <div class="article-content-wrapper">
                        <div class="article-meta-info">
                            <span class="article-source">${author}</span>
                            <span class="article-date">${date}</span>
                        </div>
                        <p class="article-desc">${description}</p>
                    </div>
                </div>
            </div>
        `;
    }));
    
    grid.innerHTML = articles.join('');
    loading.style.display = 'none';
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

// Find gist ID by slug
async function findGistBySlug(slug) {
    try {
        const gists = await fetchGists();
        for (const gist of gists) {
            const mdFile = Object.values(gist.files).find(file => file.language === 'Markdown');
            if (mdFile) {
                const title = mdFile.filename.replace('.md', '');
                const gistSlug = createSlug(title);
                if (gistSlug === slug) {
                    return gist.id;
                }
            }
        }
        return null;
    } catch (error) {
        console.error('Error finding gist by slug:', error);
        return null;
    }
}

// Navigate to article page
function navigateToArticle(gistId, title) {
    const slug = createSlug(title);
    // Store gist ID in sessionStorage for the article page to retrieve
    sessionStorage.setItem('gistId', gistId);
    // Navigate to article page with slug in URL for SEO
    window.location.href = `/blog/article/?slug=${slug}`;
}

// Load article content from Gist
async function loadArticleFromGist(gistId) {
    try {
        const response = await fetch(`https://api.github.com/gists/${gistId}`);
        if (!response.ok) throw new Error('Failed to fetch gist');
        
        const gist = await response.json();
        const mdFile = Object.values(gist.files).find(file => file.language === 'Markdown');
        
        if (!mdFile) throw new Error('No markdown file found');
        
        // Fetch the raw content
        const contentResponse = await fetch(mdFile.raw_url);
        const content = await contentResponse.text();
        
        const articleTitle = mdFile.filename.replace('.md', '');
        
        // Update article view (elements must exist on the page)
        const titleEl = document.getElementById('viewTitle');
        const dateEl = document.getElementById('viewDate');
        const contentEl = document.getElementById('articleContent');
        
        if (titleEl) titleEl.textContent = articleTitle;
        if (dateEl) dateEl.textContent = new Date(gist.created_at).toLocaleDateString();
        if (contentEl) contentEl.innerHTML = markdownToHtml(content);
        
        // Update page title
        document.title = articleTitle + ' - Gate 7 Coffee Roastery';
    } catch (error) {
        console.error('Error loading article:', error);
        const contentEl = document.getElementById('articleContent');
        if (contentEl) {
            contentEl.innerHTML = '<p>Error loading article. Please try again.</p>';
        }
    }
}

// Markdown to HTML converter using marked.js
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

// Initialize blog on page load
document.addEventListener('DOMContentLoaded', async function() {
    const gists = await fetchGists();
    renderArticleGrid(gists);
});

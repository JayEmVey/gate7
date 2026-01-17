// GitHub Gist Blog functionality
const GIST_USER = 'JayEmVey';
const GIST_API_URL = `https://api.github.com/users/${GIST_USER}/gists`;

// Markdown to HTML converter (basic implementation)
function markdownToHtml(markdown) {
    if (!markdown) return '';
    
    let html = markdown
        // Code blocks
        .replace(/```([\s\S]*?)```/g, '<pre><code>$1</code></pre>')
        // Inline code
        .replace(/`([^`]+)`/g, '<code>$1</code>')
        // Headers
        .replace(/^### (.*?)$/gm, '<h3>$1</h3>')
        .replace(/^## (.*?)$/gm, '<h2>$1</h2>')
        .replace(/^# (.*?)$/gm, '<h1>$1</h1>')
        // Bold
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        .replace(/__(.+?)__/g, '<strong>$1</strong>')
        // Italic
        .replace(/\*(.*?)\*/g, '<em>$1</em>')
        .replace(/_(.+?)_/g, '<em>$1</em>')
        // Links
        .replace(/\[(.*?)\]\((.*?)\)/g, '<a href="$2" target="_blank" rel="noopener">$1</a>')
        // Line breaks
        .replace(/\n\n/g, '</p><p>')
        .replace(/\n/g, '<br>')
        // Wrap in paragraph
        .replace(/^(.+)$/gm, (match) => {
            if (match.startsWith('<h') || match.startsWith('<pre') || match.startsWith('<ul') || match.startsWith('<ol')) {
                return match;
            }
            return `<p>${match}</p>`;
        });
    
    return html;
}

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
function renderArticleGrid(gists) {
    const grid = document.getElementById('articleGrid');
    const loading = document.getElementById('loadingIndicator');
    
    if (gists.length === 0) {
        grid.innerHTML = '<p class="no-articles">No articles found</p>';
        loading.style.display = 'none';
        return;
    }
    
    grid.innerHTML = gists.map(gist => {
        const mdFile = Object.values(gist.files).find(file => file.language === 'Markdown');
        const title = mdFile?.filename?.replace('.md', '') || gist.description || 'Untitled';
        const description = gist.description || mdFile?.filename || 'No description';
        const date = new Date(gist.created_at).toLocaleDateString();
        
        return `
            <div class="article-card" onclick="navigateToArticle('${gist.id}', '${title.replace(/'/g, "\\'")}')">
                <h3>${title}</h3>
                <p class="article-desc">${description}</p>
                <p class="article-date">${date}</p>
            </div>
        `;
    }).join('');
    
    loading.style.display = 'none';
}

// Create URL-friendly slug from title
function createSlug(title) {
    return title
        .toLowerCase()
        .trim()
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

// Markdown to HTML converter (basic implementation)
function markdownToHtml(markdown) {
    if (!markdown) return '';
    
    let html = markdown
        // Code blocks
        .replace(/```([\s\S]*?)```/g, '<pre><code>$1</code></pre>')
        // Inline code
        .replace(/`([^`]+)`/g, '<code>$1</code>')
        // Headers
        .replace(/^### (.*?)$/gm, '<h3>$1</h3>')
        .replace(/^## (.*?)$/gm, '<h2>$1</h2>')
        .replace(/^# (.*?)$/gm, '<h1>$1</h1>')
        // Bold
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        .replace(/__(.+?)__/g, '<strong>$1</strong>')
        // Italic
        .replace(/\*(.*?)\*/g, '<em>$1</em>')
        .replace(/_(.+?)_/g, '<em>$1</em>')
        // Links
        .replace(/\[(.*?)\]\((.*?)\)/g, '<a href="$2" target="_blank" rel="noopener">$1</a>')
        // Line breaks
        .replace(/\n\n/g, '</p><p>')
        .replace(/\n/g, '<br>')
        // Wrap in paragraph
        .replace(/^(.+)$/gm, (match) => {
            if (match.startsWith('<h') || match.startsWith('<pre') || match.startsWith('<ul') || match.startsWith('<ol')) {
                return match;
            }
            return `<p>${match}</p>`;
        });
    
    return html;
}

// Initialize blog on page load
document.addEventListener('DOMContentLoaded', async function() {
    const gists = await fetchGists();
    renderArticleGrid(gists);
});

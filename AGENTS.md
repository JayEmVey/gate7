# AGENTS.md - Development Guidelines

## Build & Deploy Commands

### Build Production Bundle
```bash
npm run build
```
Minifies HTML, CSS, JavaScript for self-hosted deployment. Output in `dist/` folder. All assets served locally from GitHub Pages.

### Test Production Build
```bash
npm run build
npm run test
```
Serves the minified production build from `/dist` folder locally at http://localhost:8080.
Test on multiple devices (mobile, tablet, desktop) before deploying.

### Deploy
```bash
npm run deploy
```
**Deployment pipeline that handles:**
1. Builds production bundle
2. Copies static assets (CNAME, robots.txt, sitemap.xml)
3. Creates Git commit
4. Pushes to GitHub main branch

Site live in ~2 minutes.

## Local Development

```bash
python -m http.server 8000
# Visit: http://localhost:8000
```

## Code Style

### HTML
- Semantic HTML5
- Proper meta tags and accessibility (bilingual: VI + EN)
- Alt text on all images
- Direct `src` attributes (no lazy loading data-src)

### CSS
- CSS custom properties for theming
- Mobile-first responsive design
- Color scheme: Dark backgrounds (#0B0C06) with golden accent (#C17817)

### JavaScript
- ES6+ vanilla JS (no frameworks)
- Event listeners and DOM manipulation
- Progressive enhancement
- No external dependencies or CDN resolvers

### Naming
- CSS classes: kebab-case (`animate-text-delay`)
- JS variables: camelCase
- Files: lowercase with hyphens (`style-gate7.css`)

### Assets
- All assets self-hosted (no CDN fallback)
- Local image paths: `/images/`, `/css/`, `/js/`
- GitHub Pages hosting with automatic HTTPS

## Project Structure

```
├── index.html                      # Home page
├── menu/index.html                 # Menu page
├── music/index.html                # Spotify manager
├── hiring/index.html               # Hiring page
├── css/                            # Stylesheets
│   ├── style-gate7.css             # Main stylesheet
│   ├── style-index.css             # Home page styles
│   ├── style-menu.css              # Menu page styles
│   └── style-music.css             # Music page styles
├── images/                         # Assets (28 files)
├── js/                             # JavaScript utilities
│   ├── scroll-animations.js        # Scroll effects
│   └── language-switcher.js        # Language toggle
├── build-simple.js                 # Build script (zero deps)
├── SEO-KEYWORDS.md                 # Keyword management
├── VI-Metadata.md                  # Vietnamese metadata reference
├── EN-Metadata.md                  # English metadata reference
├── package.json                    # npm config (simplified)
├── CNAME                           # Custom domain configuration
├── robots.txt                      # SEO crawler directives
├── sitemap.xml                     # SEO sitemap
└── README.md                       # Full documentation
```

## SEO Workflow

1. Update keywords in SEO-KEYWORDS.md
2. Update meta tags in HTML files
3. Verify metadata in VI-Metadata.md and EN-Metadata.md
4. Deploy: `npm run deploy`

See README.md for complete documentation.

## Deployment System

**GitHub Pages Configuration:**
- Source: GitHub Actions deployment
- Branch: main
- Domain: gate7.vn (CNAME configured)
- HTTPS: Enabled automatically
- Deployment: Auto on push

**Key Features:**
- Zero-dependency build (no npm packages required)
- HTML minification (28-30%)
- CSS minification (26%)
- Auto-deployment via GitHub Pages
- Complete production ready

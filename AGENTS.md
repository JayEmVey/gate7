# AGENTS.md - Development Guidelines

## Build & Deploy Commands

### Build (Default - Self-Hosted)
```bash
npm run build
```
Minifies HTML, CSS, JavaScript for self-hosted deployment (no external CDN). Output in `dist/` folder. Assets serve from local domain with CDN fallback support.

### Build with CDN Selection
```bash
npm run build                    # Self-Hosted (default, no CDN)
npm run build:cdn-github         # GitHub Raw (CDN fallback)
npm run build:cdn-jsdelivr       # jsDelivr CDN (CDN fallback)
npm run build:cdn-cloudflare     # Cloudflare CDN (legacy)
```
CDN is automatically injected into build. See `cdn-config.json` for current configuration.
**Fallback order:** Local (self-hosted) → GitHub → jsDelivr → Cloudflare

### Build with SEO Validation
```bash
npm run build:seo
```
Validates SEO keywords and generates `seo-build-report.json`.

### Test Production Build
```bash
npm run build
npm run test
```
Serves the minified production build from `/dist` folder locally at http://localhost:8080.
Test on multiple devices (mobile, tablet, desktop) before deploying.

### Deploy (Complete - Recommended)
```bash
npm run deploy
```
**Complete deployment pipeline that handles:**
1. Validates SEO keywords
2. Builds production bundle
3. Copies static assets (CNAME, robots.txt, sitemap.xml)
4. Creates Git commit with timestamp
5. Pushes to GitHub

Site live in ~2 minutes.

### Deploy with SEO Validation
```bash
npm run deploy:seo
```
Validates SEO before deploying (legacy, use `npm run deploy` for complete flow).

### Deploy with Protection
```bash
npm run deploy:protect
```
Builds with enhanced protection (legacy).

### Force Deploy (Rare)
```bash
npm run deploy:force
```
Force-push to git (only if git history is out of sync).

## Local Development

```bash
python -m http.server 8000
# Visit: http://localhost:8000
```

## Code Style

### HTML
- Semantic HTML5
- Proper meta tags and accessibility
- Alt text on all images

### CSS
- CSS custom properties for theming
- Mobile-first responsive design
- Color scheme: Dark backgrounds (#0B0C06) with golden accent (#C17817)

### JavaScript
- ES6+ vanilla JS (no frameworks)
- Event listeners and DOM manipulation
- Progressive enhancement

### Naming
- CSS classes: kebab-case (`animate-text-delay`)
- JS variables: camelCase
- Files: lowercase with hyphens (`style-gate7.css`)

## Project Structure

```
├── index.html                      # Home page
├── menu/index.html                 # Menu page
├── music/index.html                # Spotify manager
├── css/style-gate7.css             # Stylesheet
├── images/                         # Assets + responsive variants
├── js/                             # JavaScript utilities
│   ├── cdn-resolver.js             # CDN fallback resolver
│   ├── asset-loader.js             # Dynamic asset loading
│   ├── responsive-images.js        # Image optimization
│   ├── scroll-animations.js        # Scroll effects
│   └── language-switcher.js        # Language toggle
├── build-simple.js                 # Legacy build script
├── build-cdn.js                    # CDN-aware build system
├── cdn-config.json                 # CDN configuration reference
├── CDN-SWITCHING.md                # CDN system documentation
├── CDN-QUICK-START.md              # Quick reference guide
├── ASSET-LOADING.md                # Asset loading documentation
├── SEO-KEYWORDS.md                 # Keyword management
├── package.json                    # npm config
└── README.md                       # Full documentation
```

## SEO Workflow

1. Update keywords in SEO-KEYWORDS.md
2. Update meta tags in HTML files
3. Run validation: `npm run build:seo`
4. Review seo-build-report.json
5. Deploy: `npm run deploy:seo`

See README.md for complete documentation.

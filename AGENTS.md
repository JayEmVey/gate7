# AGENTS.md - Development Guidelines

## Build & Deploy Commands

### Build Production Bundle
```bash
npm run build
```
Minifies HTML, CSS, JavaScript for self-hosted deployment. Output in `dist/` folder. All assets served locally.

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
4. Pushes to GitHub

Site live in ~2 minutes.

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
├── images/                         # Assets
├── js/                             # JavaScript utilities
│   ├── scroll-animations.js        # Scroll effects
│   └── language-switcher.js        # Language toggle
├── build-simple.js                 # Build script
├── SEO-KEYWORDS.md                 # Keyword management
├── package.json                    # npm config
└── README.md                       # Full documentation
```

## SEO Workflow

1. Update keywords in SEO-KEYWORDS.md
2. Update meta tags in HTML files
3. Deploy: `npm run deploy`

See README.md for complete documentation.

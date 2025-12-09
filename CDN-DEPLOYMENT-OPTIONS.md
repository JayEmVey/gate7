# CDN Deployment Options

## Overview
The Gate 7 Coffee Roastery site supports multiple deployment strategies with automatic fallback:

- **Local (Self-Hosted)** - Default deployment option
- **GitHub Raw** - CDN fallback
- **jsDelivr** - CDN fallback
- **Cloudflare** - Legacy CDN fallback

## Build Commands

### Self-Hosted Deployment (Default)
```bash
npm run build
```
Minifies assets for self-hosted deployment. All resources load from local paths (`/css`, `/js`, `/images`). If any asset fails to load, automatically falls back to GitHub Raw.

**When to use:** Production deployment to your own server/domain.

### GitHub Raw CDN
```bash
npm run build:cdn-github
```
Builds with GitHub Raw as primary CDN (`https://raw.githubusercontent.com/JayEmVey/gate7/master`). Falls back to jsDelivr → Cloudflare.

**When to use:** When hosting from GitHub Pages or wanting GitHub as primary CDN.

### jsDelivr CDN
```bash
npm run build:cdn-jsdelivr
```
Builds with jsDelivr as primary CDN (`https://cdn.jsdelivr.net/gh/JayEmVey/gate7@latest`). Falls back to GitHub → Cloudflare.

**When to use:** When you want global CDN distribution with latest tags.

### Cloudflare CDN (Legacy)
```bash
npm run build:cdn-cloudflare
```
Builds with Cloudflare as primary CDN. Falls back to GitHub → jsDelivr.

**When to use:** Legacy deployments or Cloudflare Workers integration.

## Fallback Chain

The asset loader automatically tries each CDN in order:

1. **Local** (self-hosted) - `/css`, `/js`, `/images`
2. **GitHub** - `https://raw.githubusercontent.com/JayEmVey/gate7/master`
3. **jsDelivr** - `https://cdn.jsdelivr.net/gh/JayEmVey/gate7@latest`
4. **Cloudflare** - `https://cdn.jsdelivr.net/gh/JayEmVey/gate7@master/dist/`

Each failed CDN triggers a timeout (5 seconds), then tries the next option.

## Testing Builds Locally

```bash
# Build default (self-hosted)
npm run build

# Test production build
npm run test
```

Visit http://localhost:8080 to test the minified production build with local assets.

## Deployment

### Deploy Self-Hosted
```bash
npm run deploy
```
Complete deployment pipeline:
1. Validates SEO keywords
2. Builds production bundle (local assets)
3. Copies static assets
4. Creates Git commit
5. Pushes to GitHub

### Deploy with SEO Validation
```bash
npm run deploy:seo
```
Validates SEO before deploying (legacy, use `npm run deploy` for complete flow).

### Force Deploy
```bash
npm run deploy:force
```
Force-push to git (only if git history is out of sync).

## Configuration Files

### cdn-config.json
Tracks active CDN configuration for the current build:
```json
{
  "default": "local",
  "activeCdn": {
    "name": "Self-Hosted (Local)",
    "provider": "local",
    "baseUrl": ""
  },
  "fallbackOrder": ["local", "github", "jsdelivr", "cloudflare"]
}
```

### Runtime CDN Configuration
Each HTML file includes a CDN loader script that configures:
- Primary CDN for this build
- All available CDN URLs
- Fallback order
- Timeout settings (5 seconds)
- Retry attempts (2)

## Asset Loading Flow

1. **Initial Load** - Assets load from configured primary CDN
2. **Timeout** - If asset doesn't load in 5 seconds, try next CDN
3. **Error Fallback** - If CDN fails (404, network error), try next CDN
4. **Cache** - Successfully loaded URLs cached in localStorage
5. **Log** - Console logs show which CDN each asset loaded from

## Browser Support

- All modern browsers (Chrome, Firefox, Safari, Edge)
- IE11+ with fallback to local assets
- Mobile browsers (iOS Safari, Chrome Android, Samsung Internet)

## Performance Notes

- **Self-Hosted** - Fastest for same-domain requests, lowest latency
- **GitHub Raw** - Good fallback, consistent availability
- **jsDelivr** - Global CDN distribution, great for international users
- **Cloudflare** - Legacy option, most restricted

## Troubleshooting

If assets fail to load:
1. Check browser console for CDN loading logs
2. Verify `cdn-config.json` has correct fallback order
3. Test with `npm run build && npm run test`
4. Check local dist/ folder has all files copied
5. Verify CORS headers on any CDN origin

## Future Considerations

- Add AWS CloudFront as fallback option
- Implement geographic fallback selection
- Add CDN performance metrics dashboard
- Support custom domain CDN configuration

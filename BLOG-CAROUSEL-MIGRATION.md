# Blog Carousel Migration: Gists API → Supabase

## Changes Made

### 1. New File Created
**File**: `js/blogs-carousel-supabase.js`

Replaced GitHub Gists API polling with Supabase database connection for the home page blog carousel section.

### 2. Updated Files

#### `index.html`
- Added Supabase JS client library: `<script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>`
- Updated script loading to include:
  - `config.js` (Supabase configuration and initialization)
  - `blogs-carousel-supabase.js` (new carousel implementation)
- Removed: `blogs-carousel.js` (old Gists-based implementation)

### 3. Blog Card Structure

Each blog card now displays:
- **Thumbnail Image**: From `thumbnail_base64` field in Supabase
- **Author**: From `author_name` field
- **Publication Date**: Formatted based on locale (vi-VN or en-US)
- **Topic/Category**: From `topic_name` field
- **Estimated Reading Time**: Calculated from `word_count` field (200 words/minute average)
- **Article Title**: From `title` field
- **Excerpt**: From `excerpt` field (max 150 characters)

### 4. Implementation Details

**Data Source**: `articles_full` table in Supabase

**Query Logic**:
- Fetches articles filtered by current language (vi or en)
- Orders by `published_at` descending (newest first)
- Limits to 6 articles for the carousel
- Language normalization: `vn` (display) → `vi` (database query)

**Features Preserved**:
- Bilingual support (Vietnamese/English)
- Language switching with dynamic reload
- Responsive carousel (1 card on mobile, 3 cards on desktop)
- Click navigation to individual article page
- Loading indicator while fetching data

**Error Handling**:
- Waits up to 10 seconds for Supabase client initialization
- Displays user-friendly error message if data fetch fails
- Falls back to default image if thumbnail unavailable

### 5. Carousel Navigation

- **Desktop** (>768px): Shows prev/next buttons for 3-card carousel
- **Mobile/Tablet** (≤768px): Responsive grid layout, no buttons
- Auto-resets to first slide on window resize
- Updates button disabled state based on position

### 6. Language Support

Reading time format by language:
- **Vietnamese**: `"X phút đọc"` (e.g., "5 phút đọc")
- **English**: `"X min read"` (e.g., "5 min read")

Date formatting uses browser's locale settings for natural language display.

## Testing Checklist

- [ ] Blog carousel loads on homepage
- [ ] Correct number of articles display
- [ ] Images load properly with base64 data
- [ ] Reading time calculation is accurate
- [ ] Language switching reloads carousel data
- [ ] Topic/category names display correctly
- [ ] Carousel navigation works on desktop
- [ ] Responsive layout works on mobile
- [ ] Click navigation to article detail page works
- [ ] Error handling displays gracefully if Supabase is unavailable

## Database Requirements

Ensure `articles_full` table has these columns:
- `id`: Unique identifier
- `title`: Article title
- `slug`: URL-friendly slug
- `excerpt`: Short description (up to 150 chars)
- `content`: Full article content
- `author_name`: Author name
- `topic_name`: Category/topic name
- `language`: "vi" or "en"
- `published_at`: Publication date (timestamp)
- `word_count`: Estimated word count for reading time
- `thumbnail_base64`: Base64-encoded image (optional)

## Rollback (if needed)

To revert to Gists API version:
1. Change `blogs-carousel-supabase.js` back to `blogs-carousel.js` in index.html
2. Remove Supabase library link and config.js
3. Restore the old script reference
4. Rebuild: `npm run build`

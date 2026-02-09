# Blog System - Complete Documentation

## Overview

This is a comprehensive guide for the Gate7 blog system, which syncs GitHub Gists to a Supabase database for a Vietnamese/English coffee blog platform. The blog features bilingual support, article management, image storage, and carousel display.

---

## Table of Contents

1. [Core Article Management](#core-article-management)
2. [Carousel Implementation](#carousel-implementation)
3. [Language Support](#language-support)
4. [Database Schema](#database-schema)
5. [Setup & Configuration](#setup--configuration)
6. [Usage](#usage)
7. [Testing Guide](#testing-guide)
8. [Troubleshooting](#troubleshooting)
9. [Monitoring & Performance](#monitoring--performance)

---

## Core Article Management

### Requirements Overview

The blog system is built on these core requirements:

#### 1. Language Support
- **English (en)** and **Vietnamese (vi)** languages supported
- Language validation is enforced - gists with other languages are skipped
- Language code must be lowercase in filename
- Proper language normalization: `vn` (display) → `vi` (database)

#### 2. Topic-Based Organization
Articles are organized by topics:
- Coffee Culture
- Coffee Processing
- Sensory
- (Any other topics you define)

Topics are automatically created if they don't exist, using a URL-friendly slug.

#### 3. Filename Format (Gist Articles)
**Required Format:** `[Language][Author][Topic] Title.md`

**Examples:**
```
[En][Giang][Coffee Culture] Vietnamese Coffee Culture In a nutshell.md
[Vi][Giang][Coffee Processing] Quy trình chế biến cà phê Arabica.md
[En][John][Sensory] Understanding Coffee Tasting Notes.md
```

**Validation:**
- ✅ All three brackets must be present
- ✅ Language must be exactly 'en' or 'vi' (case insensitive)
- ✅ Author and Topic cannot be empty
- ✅ Title is extracted from the text after the brackets
- ❌ Gists not matching this format will be skipped with an error logged

#### 4. Image Storage
**All images are stored in base64 format:**
- Images are extracted from markdown using pattern: `![alt text](url)`
- Each image is downloaded and converted to base64
- Images are stored in the `article_images` table with:
  - `image_data`: base64 encoded string
  - `image_format`: jpg, png, webp, or gif
  - `position`: order in the article (1, 2, 3...)
  - `alt_text`: alternative text from markdown
  - `width`, `height`: optional dimensions

**Size Limits:**
- Maximum 10MB per image
- Images larger than 10MB are skipped with a warning

#### 5. Thumbnail Generation
**The article thumbnail is the first image:**
- Automatically extracted from the first image in the markdown content
- Stored in `gist_articles` table as:
  - `thumbnail_base64`: base64 encoded thumbnail
  - `thumbnail_format`: image format (jpg, png, etc.)
  - `featured_image_url`: original URL for reference
- If no images exist, thumbnail fields are set to `null`

### Sync Process Flow

1. **Fetch Gists**: Retrieves all gists from your GitHub account
2. **Filter Markdown**: Only processes `.md` and `.markdown` files
3. **Parse Filename**: Extracts language, author, topic, and title
4. **Validate**: Checks language is 'en' or 'vi', and all fields are present
5. **Fetch Content**: Downloads the raw markdown content
6. **Author/Topic Lookup**: Finds or creates author and topic records
7. **Extract Metadata**: Generates slug, excerpt, and tags
8. **Download Images**: Converts all images to base64
9. **Create Thumbnail**: Uses first image as thumbnail
10. **Upsert Article**: Saves/updates article in database
11. **Save Images**: Stores all images in article_images table

### What Gets Synced

- ✅ Articles with valid filename format
- ✅ All markdown images as base64
- ✅ First image as thumbnail
- ✅ Author and topic relationships
- ✅ Auto-generated slugs and excerpts
- ❌ Invalid filenames (skipped with error)
- ❌ Non-en/vi languages (skipped with error)
- ❌ Images over 10MB (skipped with warning)

---

## Database Schema

### Tables Used

#### `gist_articles`
Main article storage:
- `id`: Primary key
- `gist_id`: Unique GitHub Gist ID
- `language`: 'en' or 'vi'
- `author_id`: Foreign key to authors table
- `topic_id`: Foreign key to topics table
- `title`: Article title
- `slug`: URL-friendly slug
- `content`: Raw markdown content
- `content_html`: HTML version (currently same as content)
- `excerpt`: Auto-generated preview (~200 chars)
- `description`: Gist description or excerpt
- `thumbnail_base64`: First image as base64
- `thumbnail_format`: Thumbnail image format
- `featured_image_url`: Original URL of featured image
- `is_published`: Boolean (default: true)
- `published_at`: Publication timestamp
- `tags`: Array of tags
- `raw_url`, `gist_url`: GitHub URLs
- `gist_updated_at`: Last update from GitHub
- `synced_at`: Last sync timestamp

#### `articles_full` (View/Table)
Used for blog display:
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

#### `authors`
Author information:
- `id`: Primary key
- `name`: Author name (from filename)
- `created_at`: Timestamp

#### `topics`
Topic categories:
- `id`: Primary key
- `name`: Topic name (e.g., "Coffee Culture")
- `slug`: URL-friendly slug (e.g., "coffee-culture")
- `created_at`: Timestamp

#### `article_images`
All article images in base64:
- `id`: Primary key
- `article_id`: Foreign key to gist_articles
- `image_data`: Base64 encoded image
- `image_format`: Image format (jpg, png, webp, gif)
- `position`: Order in article (1, 2, 3...)
- `alt_text`: Alternative text
- `width`, `height`: Optional dimensions
- `created_at`: Timestamp

---

## Carousel Implementation

### Overview
The blog carousel on the homepage displays articles from Supabase in a responsive, bilingual carousel format.

**File**: `js/blogs-carousel-supabase.js`

Replaced GitHub Gists API polling with Supabase database connection for the home page blog carousel section.

### Blog Card Structure

Each blog card displays:
- **Thumbnail Image**: From `thumbnail_base64` field in Supabase
- **Author**: From `author_name` field
- **Publication Date**: Formatted based on locale (vi-VN or en-US)
- **Topic/Category**: From `topic_name` field
- **Estimated Reading Time**: Calculated from `word_count` field (200 words/minute average)
- **Article Title**: From `title` field
- **Excerpt**: From `excerpt` field (max 150 characters)

### Implementation Details

**Data Source**: `articles_full` table in Supabase

**Query Logic**:
- Fetches articles filtered by current language (vi or en)
- Orders by `published_at` descending (newest first)
- Limits to 6 articles for the carousel
- Language normalization: `vn` (display) → `vi` (database query)

**Features**:
- Bilingual support (Vietnamese/English)
- Language switching with dynamic reload
- Responsive carousel (1 card on mobile, 3 cards on desktop)
- Click navigation to individual article page
- Loading indicator while fetching data

**Error Handling**:
- Waits up to 10 seconds for Supabase client initialization
- Displays user-friendly error message if data fetch fails
- Falls back to default image if thumbnail unavailable

### Carousel Navigation

- **Desktop** (>768px): Shows prev/next buttons for 3-card carousel
- **Mobile/Tablet** (≤768px): Responsive grid layout, no buttons
- Auto-resets to first slide on window resize
- Updates button disabled state based on position

### Updated Files

#### `index.html`
- Added Supabase JS client library: `<script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>`
- Updated script loading to include:
  - `config.js` (Supabase configuration and initialization)
  - `blogs-carousel-supabase.js` (new carousel implementation)
- Removed: `blogs-carousel.js` (old Gists-based implementation)

---

## Language Support

### Overview
The blog system supports bilingual content (English/Vietnamese) with automatic language detection, switching, and content filtering.

**Files**: 
- `js/blog-new.js` (Main blog manager logic)
- `js/language-switcher.js` (Global language switching)
- `js/config.js` (Supabase configuration)

### Language-Specific Article Filtering

**Implementation**:
- Updated `BlogManager` constructor to properly read the selected language from localStorage (`selectedLanguage` set by `language-switcher.js`)
- Language normalization: converts `vn` to `vi` for Supabase database queries
- Articles now filter by the selected language: `currentLanguage` is either `'en'` or `'vi'`
- When language changes, the blog automatically reloads articles for that language

**How it works**:
1. User clicks language button (EN/VI) → `language-switcher.js` fires `languageChanged` event
2. `BlogManager` listens to `languageChanged` event
3. Blog reloads articles from Supabase filtered by the new language
4. Categories and articles re-render in the selected language

### Bilingual Search Support

- Search input has `data-placeholder-en` and `data-placeholder-vn` attributes
- New `updateSearchPlaceholder()` method dynamically updates the search placeholder text based on current language
- Placeholder updates when:
  - Page initializes
  - User switches language via language switcher button
- Search functionality works across both languages (searches article titles and content)

**Current placeholders**:
- EN: "Search articles..."
- VI: "Tìm kiếm bài viết..."

### Bilingual UI Elements

| Element | EN | VI |
|---------|----|----|
| Page Title | "Our Blogs" | "Bài viết" |
| All Categories Button | "All" | "Tất Cả" |
| No Articles Message | "No articles found." | "Không tìm thấy bài viết nào." |
| Read More Link | "Read More →" | "Đọc Thêm →" |
| Pagination Prev | "← Previous" | "← Trước" |
| Pagination Next | "Next →" | "Tiếp →" |
| Category Filter | Dynamic (all languages supported) | Dynamic (all languages supported) |
| Search Placeholder | Dynamically updated | Dynamically updated |
| Footer Elements | All with data attributes | All with data attributes |

### Language Synchronization

Blog system uses the same language detection mechanism as the main site:
- URL parameter: `?lang=en` or `?lang=vi` (internally uses `vn`)
- localStorage: `selectedLanguage` key
- Persists user preference across page navigation

### Language Flow

```
1. User clicks language button
   ↓
2. language-switcher.js updates localStorage & fires 'languageChanged' event
   ↓
3. BlogManager listens and reacts to language change
   ↓
4. loadArticles() queries Supabase with new language filter
   ↓
5. renderCategories() & renderArticles() display in new language
   ↓
6. updateSearchPlaceholder() updates search input text
```

### Language Codes

- **Internal representation**: `'en'` or `'vi'` (Supabase uses `vi`, not `vn`)
- **localStorage key**: `selectedLanguage` (values: `'en'` or `'vn'`)
- **URL parameter**: `lang=en` or `lang=vi`

### Database Integration

Supabase `articles_full` table expected to have:
- `language` column with values: `'en'` or `'vi'`
- Articles are filtered on load: `.eq('language', this.currentLanguage)`
- All language-specific content (title, content, excerpt) should be in the appropriate language record

---

## Setup & Configuration

### Environment Variables

Set these in Supabase Dashboard → Edge Functions → Secrets:

```bash
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJ... (your service role key)
GITHUB_USERNAME=your-github-username
GITHUB_TOKEN=ghp_... (your GitHub personal access token)
```

#### Getting GitHub Token:
1. Go to GitHub → Settings → Developer settings → Personal access tokens
2. Generate new token (classic)
3. Required scopes: `gist` (read access to gists)

### Row-Level Security (RLS) Policies

**Required SQL to set up RLS:**

```sql
-- Enable RLS
ALTER TABLE gist_articles ENABLE ROW LEVEL SECURITY;
ALTER TABLE article_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE authors ENABLE ROW LEVEL SECURITY;
ALTER TABLE topics ENABLE ROW LEVEL SECURITY;

-- Service role can do everything
CREATE POLICY "Service role full access" ON gist_articles
FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "Service role full access" ON article_images
FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "Service role full access" ON authors
FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "Service role full access" ON topics
FOR ALL TO service_role USING (true) WITH CHECK (true);

-- Public can read published articles
CREATE POLICY "Public read published" ON gist_articles
FOR SELECT TO anon, authenticated
USING (is_published = true);

CREATE POLICY "Public read images" ON article_images
FOR SELECT TO anon, authenticated USING (true);

CREATE POLICY "Public read authors" ON authors
FOR SELECT TO anon, authenticated USING (true);

CREATE POLICY "Public read topics" ON topics
FOR SELECT TO anon, authenticated USING (true);
```

---

## Usage

### Triggering Article Sync

**Via Supabase Dashboard:**
1. Go to Edge Functions → gist-fetch
2. Click "Invoke" button
3. View logs for results

**Via API:**
```bash
curl -X POST https://your-project.supabase.co/functions/v1/gist-fetch \
  -H "Authorization: Bearer YOUR_ANON_KEY"
```

**Via Schedule (cron):**
Set up in Supabase Dashboard → Database → Cron Jobs:
```sql
SELECT cron.schedule(
  'sync-gists-daily',
  '0 2 * * *', -- Run at 2 AM daily
  $$
  SELECT net.http_post(
    'https://your-project.supabase.co/functions/v1/gist-fetch',
    '{}',
    headers => '{"Authorization": "Bearer YOUR_ANON_KEY"}'::jsonb
  );
  $$
);
```

### Response Format

**Success:**
```json
{
  "success": true,
  "synced": 5,
  "skipped": 2,
  "total": 7,
  "errors": [
    {
      "filename": "[Fr][Jean][Café] Le café français.md",
      "error": "Invalid or missing language (got: fr, expected: 'en' or 'vi')"
    }
  ],
  "summary": {
    "githubUsername": "yourusername",
    "totalGistsFetched": 20,
    "markdownGistsFound": 7,
    "timestamp": "2024-02-04T12:34:56.789Z"
  }
}
```

**Error:**
```json
{
  "success": false,
  "error": "Missing GITHUB_TOKEN environment variable",
  "stack": "..."
}
```

---

## Testing Guide

### Quick Start

#### Test Language Filtering

1. **Open Blog Page**
   - Navigate to: `https://gate7.vn/blog` (default: Vietnamese)
   - Or: `https://gate7.vn/blog?lang=en` (English)

2. **Switch Language**
   - Click the **EN** or **VN** button in the header or footer
   - Articles should reload automatically in the selected language
   - Only articles with matching language should display

3. **Verify Search**
   - Search placeholder changes: "Search articles..." (EN) / "Tìm kiếm bài viết..." (VI)
   - Search works within the selected language's articles
   - Switch language and search again - results should change

#### Test UI Element Translations

| Element | English | Vietnamese | How to Test |
|---------|---------|------------|------------|
| Page Title | "Our Blogs" | "Bài viết" | Top of page |
| "All" Button | "All" | "Tất Cả" | Category filter section |
| No Results | "No articles found." | "Không tìm thấy bài viết nào." | Search for non-existent term |
| Read More | "Read More →" | "Đọc Thêm →" | On article cards |
| Previous Button | "← Previous" | "← Trước" | Pagination section |
| Next Button | "Next →" | "Tiếp →" | Pagination section |
| Search Placeholder | "Search articles..." | "Tìm kiếm bài viết..." | In search box |

### Detailed Testing Steps

#### Test 1: Language Switching Works
```
1. Open /blog (defaults to Vietnamese)
2. Verify articles display in Vietnamese
3. Click EN button
4. Verify:
   - URL changes to ?lang=en
   - Articles reload
   - Articles display in English only
   - Page title changes to "Our Blogs"
5. Click VN button
6. Verify articles reload in Vietnamese
```

#### Test 2: Search is Language-Specific
```
1. Set language to EN
2. Search for an English article title
3. Verify article appears
4. Clear search
5. Switch to VI
6. Search for the same term (won't be found in VI articles)
7. Verify no results appear
8. Search for a Vietnamese article title
9. Verify article appears
```

#### Test 3: Search Placeholder Updates
```
1. Open blog page (any language)
2. Observe search input placeholder text
3. Click language button to switch
4. Observe placeholder text changes immediately
5. Text should match current language
```

#### Test 4: Language Persistence
```
1. Select English (EN)
2. Refresh page
3. Verify page loads in English
4. Select Vietnamese (VN)
5. Refresh page
6. Verify page loads in Vietnamese
7. Verify localStorage has 'selectedLanguage' set correctly
```

#### Test 5: Category Filters Update
```
1. Set language to EN
2. Note category names in filter buttons
3. Switch to VI
4. Verify category names haven't changed
   (they show article topics, which are language-agnostic)
5. Categories should still filter correctly within selected language
```

#### Test 6: Pagination Works with Language
```
1. Set language to EN
2. If multiple pages exist, go to page 2
3. Verify articles are in English
4. Switch to VI
5. Verify articles reload in Vietnamese
6. Pagination buttons text should update to Vietnamese
```

#### Test 7: Blog Carousel
```
- [ ] Blog carousel loads on homepage
- [ ] Correct number of articles display (6)
- [ ] Images load properly with base64 data
- [ ] Reading time calculation is accurate
- [ ] Language switching reloads carousel data
- [ ] Topic/category names display correctly
- [ ] Carousel navigation works on desktop
- [ ] Responsive layout works on mobile
- [ ] Click navigation to article detail page works
- [ ] Error handling displays gracefully if Supabase is unavailable
```

### Developer Console Checks

Open Developer Tools (F12) and check the Console tab:

#### Expected Log Messages
```
BlogManager: Supabase client ready
BlogManager: Articles loaded for language: en (or vi)
Total articles loaded for language: en - X articles
```

#### No Errors Should Appear
- No JavaScript errors when switching languages
- No 404 errors for article images
- No Supabase connection errors

#### Check localStorage
```javascript
// In console, type:
localStorage.getItem('selectedLanguage')

// Should return: 'en' or 'vn'
```

### Browser Compatibility

Test in:
- Chrome/Edge (latest)
- Firefox (latest)
- Safari (iOS and macOS)
- Mobile browsers

### Performance Checks

- Article load time: < 2 seconds
- Language switch animation: smooth
- No page flickering when switching languages
- Images load properly in both languages

### Edge Cases to Test

1. **Manual URL Parameter**
   - Navigate to: `/blog?lang=en` directly
   - Should load in English

2. **Invalid Language Parameter**
   - Navigate to: `/blog?lang=fr`
   - Should default to Vietnamese

3. **Multiple Language Switches**
   - Click language button 5+ times rapidly
   - Should handle gracefully, no duplicate loads

4. **With No Articles in Language**
   - If a language has no articles in database
   - Should display "No articles found" message in correct language

5. **Search + Language Switch**
   - Search with active search term
   - Switch language
   - Search should clear and articles reload in new language

### Success Criteria

✅ All articles display in selected language only  
✅ Search placeholder text matches language  
✅ No articles message displays in correct language  
✅ Category filters work in selected language  
✅ Pagination text translates correctly  
✅ Language persists on page refresh  
✅ No JavaScript errors in console  
✅ Smooth animation when switching languages  
✅ Works on mobile and desktop  
✅ All UI elements have translations  

---

## Troubleshooting

### Common Issues

#### 1. RLS Policy Error
```
Error: new row violates row-level security policy
```
**Solution:** Run the RLS policies SQL in the [Setup & Configuration](#setup--configuration) section

#### 2. Invalid Language
```
Error: Invalid or missing language (got: fr, expected: 'en' or 'vi')
```
**Solution:** Rename gist to use [En] or [Vi]

#### 3. Missing Brackets
```
Warning: Filename does not match expected format
```
**Solution:** Ensure filename is: `[Language][Author][Topic] Title.md`

#### 4. Images Not Downloading
```
Warning: Google Photos images detected
```
**Solution:** Host images on public URLs (Imgur, Cloudinary, etc.)

#### 5. Author/Topic Not Created
```
Error: Failed to create/find author
```
**Solution:** Check RLS policies for authors/topics tables

#### 6. Articles not filtering by language
- Check Supabase database: `articles_full` table should have `language` column with values `'en'` or `'vi'`
- Check browser console for error messages
- Verify Supabase credentials in `js/config.js`

#### 7. Search placeholder not updating
- Check that `updateSearchPlaceholder()` is called after language change
- Verify `blogSearch` element has correct ID in HTML
- Clear browser cache and reload

#### 8. Language not persisting
- Check localStorage is enabled in browser
- Verify `language-switcher.js` is loading before `blog-new.js`
- Check browser console for any localStorage errors

#### 9. Articles showing wrong language
- Clear browser localStorage
- Check that Supabase query filter `.eq('language', this.currentLanguage)` is working
- Verify articles in database have correct language values

---

## Monitoring & Performance

### Check Sync Status

```sql
-- Recent syncs
SELECT title, synced_at, is_published 
FROM gist_articles 
ORDER BY synced_at DESC 
LIMIT 10;

-- Articles by language
SELECT language, COUNT(*) 
FROM gist_articles 
GROUP BY language;

-- Articles by topic
SELECT t.name, COUNT(*) as article_count
FROM topics t
LEFT JOIN gist_articles ga ON ga.topic_id = t.id
GROUP BY t.name
ORDER BY article_count DESC;

-- Authors and their article counts
SELECT a.name, COUNT(*) as article_count
FROM authors a
LEFT JOIN gist_articles ga ON ga.author_id = a.id
GROUP BY a.name
ORDER BY article_count DESC;
```

### Best Practices

#### Filename Guidelines
- Use consistent capitalization: `[En]` not `[EN]` or `[english]`
- Keep author names consistent across gists
- Use clear topic names: "Coffee Culture" not "Culture"
- Avoid special characters in titles

#### Content Guidelines
- Place important images first (for thumbnail)
- Use public image hosting services
- Keep images under 10MB
- Add alt text to images: `![Coffee beans](url)`
- Add tags in content: `Tags: arabica, processing, wet-method`

#### Performance Tips
- Limit image count per article (< 10 recommended)
- Use compressed images
- Consider image dimensions (width/height)
- Run sync during low-traffic hours

### Rollback (if needed)

To revert to Gists API version:
1. Change `blogs-carousel-supabase.js` back to `blogs-carousel.js` in index.html
2. Remove Supabase library link and config.js
3. Restore the old script reference
4. Rebuild: `npm run build`

---

## Future Enhancements

Potential improvements:
- Markdown to HTML conversion for `content_html`
- Image optimization/resizing for thumbnails
- Multiple thumbnail sizes (responsive)
- Auto-tagging using AI
- Duplicate slug detection
- Draft vs. published workflow
- Multi-language article linking
- Image CDN integration
- Webhook triggers from GitHub

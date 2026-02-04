# Gist Article Management - Documentation

## Overview
This Supabase Edge Function syncs GitHub Gists to your database for a Vietnamese/English coffee blog platform.

## Requirements Met ✓

### 1. Language Support
- **English (en)** and **Vietnamese (vi)** languages supported
- Language validation is enforced - gists with other languages are skipped
- Language code must be lowercase in filename

### 2. Topic-Based Organization
Articles are organized by topics:
- Coffee Culture
- Coffee Processing
- Sensory
- (Any other topics you define)

Topics are automatically created if they don't exist, using a URL-friendly slug.

### 3. Filename Format
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

### 4. Image Storage
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

### 5. Thumbnail Generation
**The article thumbnail is the first image:**
- Automatically extracted from the first image in the markdown content
- Stored in `gist_articles` table as:
  - `thumbnail_base64`: base64 encoded thumbnail
  - `thumbnail_format`: image format (jpg, png, etc.)
  - `featured_image_url`: original URL for reference
- If no images exist, thumbnail fields are set to `null`

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

## Environment Variables

Set these in Supabase Dashboard → Edge Functions → Secrets:

```bash
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJ... (your service role key)
GITHUB_USERNAME=your-github-username
GITHUB_TOKEN=ghp_... (your GitHub personal access token)
```

### Getting GitHub Token:
1. Go to GitHub → Settings → Developer settings → Personal access tokens
2. Generate new token (classic)
3. Required scopes: `gist` (read access to gists)

## Row-Level Security (RLS) Policies

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

## How It Works

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

## Usage

### Triggering the Function

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

## Response Format

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

## Troubleshooting

### Common Issues

**1. RLS Policy Error**
```
Error: new row violates row-level security policy
```
**Solution:** Run the RLS policies SQL above

**2. Invalid Language**
```
Error: Invalid or missing language (got: fr, expected: 'en' or 'vi')
```
**Solution:** Rename gist to use [En] or [Vi]

**3. Missing Brackets**
```
Warning: Filename does not match expected format
```
**Solution:** Ensure filename is: `[Language][Author][Topic] Title.md`

**4. Images Not Downloading**
```
Warning: Google Photos images detected
```
**Solution:** Host images on public URLs (Imgur, Cloudinary, etc.)

**5. Author/Topic Not Created**
```
Error: Failed to create/find author
```
**Solution:** Check RLS policies for authors/topics tables

## Best Practices

### Filename Guidelines
- Use consistent capitalization: `[En]` not `[EN]` or `[english]`
- Keep author names consistent across gists
- Use clear topic names: "Coffee Culture" not "Culture"
- Avoid special characters in titles

### Content Guidelines
- Place important images first (for thumbnail)
- Use public image hosting services
- Keep images under 10MB
- Add alt text to images: `![Coffee beans](url)`
- Add tags in content: `Tags: arabica, processing, wet-method`

### Performance Tips
- Limit image count per article (< 10 recommended)
- Use compressed images
- Consider image dimensions (width/height)
- Run sync during low-traffic hours

## Monitoring

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
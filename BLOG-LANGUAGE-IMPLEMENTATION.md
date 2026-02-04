# Blog Language Support Implementation

## Changes Made

### 1. Language-Specific Article Filtering ✓
- **File**: `js/blog-new.js`
- **Implementation**:
  - Updated `BlogManager` constructor to properly read the selected language from localStorage (`selectedLanguage` set by `language-switcher.js`)
  - Language normalization: converts `vn` to `vi` for Supabase database queries
  - Articles now filter by the selected language: `currentLanguage` is either `'en'` or `'vi'`
  - When language changes, the blog automatically reloads articles for that language

**How it works**:
- User clicks language button (EN/VI) → `language-switcher.js` fires `languageChanged` event
- `BlogManager` listens to `languageChanged` event
- Blog reloads articles from Supabase filtered by the new language
- Categories and articles re-render in the selected language

### 2. Bilingual Search Support ✓
- **File**: `js/blog-new.js`, `blog/index.html`
- **Implementation**:
  - Search input has `data-placeholder-en` and `data-placeholder-vn` attributes
  - New `updateSearchPlaceholder()` method dynamically updates the search placeholder text based on current language
  - Placeholder updates when:
    - Page initializes
    - User switches language via language switcher button
  - Search functionality works across both languages (searches article titles and content)

**Current placeholders**:
- EN: "Search articles..."
- VI: "Tìm kiếm bài viết..."

### 3. Bilingual UI Elements ✓
- **Files**: `blog/index.html`, `js/blog-new.js`

**Elements with translations**:

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

### 4. Language Synchronization ✓
- Blog system now uses the same language detection mechanism as the main site:
  - URL parameter: `?lang=en` or `?lang=vi` (internally uses `vn`)
  - localStorage: `selectedLanguage` key
  - Persists user preference across page navigation

## Technical Details

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
- Supabase `articles_full` table expected to have:
  - `language` column with values: `'en'` or `'vi'`
  - Articles are filtered on load: `.eq('language', this.currentLanguage)`
  - All language-specific content (title, content, excerpt) should be in the appropriate language record

## Testing Checklist

- [ ] Click language switcher (EN/VI) on blog page
- [ ] Verify articles switch to selected language
- [ ] Verify category buttons update text
- [ ] Verify search placeholder text changes
- [ ] Verify "No articles found" message matches language
- [ ] Verify pagination text (Previous/Next) matches language
- [ ] Search for articles in English - should find English articles only
- [ ] Switch to Vietnamese and search - should find Vietnamese articles only
- [ ] Verify article cards display correct language content (title, excerpt, date, category)
- [ ] Check browser console - no errors should appear during language switching
- [ ] Test on mobile and desktop
- [ ] Test language switching multiple times

## Files Modified
1. `js/blog-new.js` - Main blog manager logic
2. No changes to `blog/index.html` - already has all required data attributes

## Related Files (No changes needed)
- `js/language-switcher.js` - Already handles global language switching
- `js/config.js` - Already has Supabase configuration

# Language Code Standardization - VI vs VN

## Summary
Standardized all language recognition and processing to use **'vi'** (ISO 639-1 language code) consistently instead of mixing it with **'vn'** (country code).

## Key Changes

### 1. **language-switcher.js** (Core switcher)
- ✅ Default language changed: `'vn'` → `'vi'`
- ✅ Added `langMap` to handle button UI mapping: `{ 'vn': 'vi', 'en': 'en', 'vi': 'vi' }`
- ✅ Updated data attribute query: `[data-en][data-vn]` → `[data-en][data-vi]` (with fallback to data-vn)
- ✅ URLs now set to `'vi'` in lang parameter
- ✅ HTML lang attribute set correctly to `'vi'` (not `'vn'`)
- ✅ localStorage saves `'vi'` consistently

### 2. **HTML Files - Data Attributes**
Files updated to use `data-vi` instead of `data-vn`:
- ✅ `index.html` - All menu and footer text attributes
- ✅ `blog/index.html` - Blog section headings and text
- ✅ `blog/article/index.html` - Article page content

### 3. **JavaScript Blog Files**
Updated to use `'vi'` consistently:

#### blog.js
- ✅ `getCurrentLanguage()` default: `'vn'` → `'vi'`
- ✅ `extractLanguageFromFilename()` returns `'vi'` (not `'vn'`)
- ✅ `formatReadingTime()` checks `lang === 'vi'`

#### blogs-carousel.js
- ✅ `getCurrentLanguage()` default: `'vn'` → `'vi'`
- ✅ `extractLanguageFromFilename()` returns `'vi'` (not `'vn'`)
- ✅ `formatReadingTime()` checks `lang === 'vi'`
- ✅ `renderBlogs()` normalizes to `'vi'`

#### blogs-carousel-supabase.js
- ✅ `getCurrentLanguage()` default: `'vn'` → `'vi'`
- ✅ `formatReadingTime()` checks `lang === 'vi'`
- ✅ Supabase query logic: `getCurrentLanguage() === 'vi' ? 'vi' : 'en'`

#### blog-new.js
- ✅ Constructor default: `'vn'` → `'vi'`
- ✅ Language normalization: `vn` → `vi` for Supabase queries

## Standardization Rules

| Context | Standard | Notes |
|---------|----------|-------|
| **localStorage key** | `selectedLanguage` | Used by language-switcher.js |
| **localStorage value** | `'vi'` or `'en'` | Never `'vn'` |
| **URL parameter** | `?lang=vi` or `?lang=en` | Standard ISO 639-1 |
| **HTML lang attribute** | `lang="vi"` | Correct HTML standard |
| **Data attributes** | `data-vi=` and `data-en=` | For translation text |
| **Button UI** | `data-lang="vn"` | Display only, maps to `'vi'` internally |
| **Supabase queries** | `'vi'` | Database uses ISO language codes |

## Backward Compatibility
- ✅ Buttons still show "VN" visually (user-friendly)
- ✅ Legacy `data-vn` attributes supported as fallback
- ✅ `'vn'` from URL/localStorage automatically converts to `'vi'`
- ✅ No breaking changes for existing users

## Testing Checklist
- [ ] Click language switcher buttons (EN/VN)
- [ ] Verify URL changes to `?lang=vi` or `?lang=en`
- [ ] Verify localStorage has `selectedLanguage: 'vi'`
- [ ] Verify HTML lang attribute is `'vi'`
- [ ] Check that content translates correctly
- [ ] Test on fresh page load (no previous language saved)
- [ ] Test with URL parameter `?lang=vi` and `?lang=en`
- [ ] Verify blog articles load in correct language

## Files Modified
- `js/language-switcher.js`
- `js/blog.js`
- `js/blogs-carousel.js`
- `js/blogs-carousel-supabase.js`
- `js/blog-new.js`
- `index.html`
- `blog/index.html`
- `blog/article/index.html`

# Blog Language Support - Testing Guide

## Quick Start

### Test Language Filtering

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

### Test UI Element Translations

| Element | English | Vietnamese | How to Test |
|---------|---------|------------|------------|
| Page Title | "Our Blogs" | "Bài viết" | Top of page |
| "All" Button | "All" | "Tất Cả" | Category filter section |
| No Results | "No articles found." | "Không tìm thấy bài viết nào." | Search for non-existent term |
| Read More | "Read More →" | "Đọc Thêm →" | On article cards |
| Previous Button | "← Previous" | "← Trước" | Pagination section |
| Next Button | "Next →" | "Tiếp →" | Pagination section |
| Search Placeholder | "Search articles..." | "Tìm kiếm bài viết..." | In search box |

## Detailed Testing Steps

### Test 1: Language Switching Works
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

### Test 2: Search is Language-Specific
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

### Test 3: Search Placeholder Updates
```
1. Open blog page (any language)
2. Observe search input placeholder text
3. Click language button to switch
4. Observe placeholder text changes immediately
5. Text should match current language
```

### Test 4: Language Persistence
```
1. Select English (EN)
2. Refresh page
3. Verify page loads in English
4. Select Vietnamese (VN)
5. Refresh page
6. Verify page loads in Vietnamese
7. Verify localStorage has 'selectedLanguage' set correctly
```

### Test 5: Category Filters Update
```
1. Set language to EN
2. Note category names in filter buttons
3. Switch to VI
4. Verify category names haven't changed
   (they show article topics, which are language-agnostic)
5. Categories should still filter correctly within selected language
```

### Test 6: Pagination Works with Language
```
1. Set language to EN
2. If multiple pages exist, go to page 2
3. Verify articles are in English
4. Switch to VI
5. Verify articles reload in Vietnamese
6. Pagination buttons text should update to Vietnamese
```

## Developer Console Checks

Open Developer Tools (F12) and check the Console tab:

### Expected Log Messages
```
BlogManager: Supabase client ready
BlogManager: Articles loaded for language: en (or vi)
Total articles loaded for language: en - X articles
```

### No Errors Should Appear
- No JavaScript errors when switching languages
- No 404 errors for article images
- No Supabase connection errors

### Check localStorage
```javascript
// In console, type:
localStorage.getItem('selectedLanguage')

// Should return: 'en' or 'vn'
```

## Browser Compatibility

Test in:
- Chrome/Edge (latest)
- Firefox (latest)
- Safari (iOS and macOS)
- Mobile browsers

## Performance Checks

- Article load time: < 2 seconds
- Language switch animation: smooth
- No page flickering when switching languages
- Images load properly in both languages

## Edge Cases to Test

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

## Success Criteria

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

## Troubleshooting

### Articles not filtering by language
- Check Supabase database: `articles_full` table should have `language` column with values `'en'` or `'vi'`
- Check browser console for error messages
- Verify Supabase credentials in `js/config.js`

### Search placeholder not updating
- Check that `updateSearchPlaceholder()` is called after language change
- Verify `blogSearch` element has correct ID in HTML
- Clear browser cache and reload

### Language not persisting
- Check localStorage is enabled in browser
- Verify `language-switcher.js` is loading before `blog-new.js`
- Check browser console for any localStorage errors

### Articles showing wrong language
- Clear browser localStorage
- Check that Supabase query filter `.eq('language', this.currentLanguage)` is working
- Verify articles in database have correct language values

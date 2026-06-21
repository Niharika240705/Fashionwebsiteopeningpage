# Playwright Scraper Improvements - Myntra Focus

## Overview
The Playwright scraper has been refined for robust Myntra product scraping with comprehensive logging, debugging capabilities, and resilient selector fallbacks.

## Key Improvements

### 1. **Debug Mode Support**
Enable visual debugging by setting environment variable:
```bash
SCRAPER_DEBUG=true
```

When enabled:
- Browser runs in **non-headless mode** (visible browser window)
- **slowMo: 100ms** - slows down operations for easier observation
- Useful for debugging selector issues and seeing what the scraper sees

### 2. **Enhanced Logging**

#### Navigation Logs
```
📄 [timestamp] Starting scrape for: [URL]
📋 Base URL: [base]
🎯 Primary selector: [selector]
⏳ Navigating to page...
✅ Page loaded successfully (200) in [X]ms
📄 Final URL: [final URL]
```

#### Selector Search Logs
```
🔍 Searching for product cards with [N] selector(s)...
  [1/N] Trying selector: "[selector]"
  ✅ SUCCESS: Found [X] product cards using selector: "[selector]"
```

#### Product Extraction Logs
```
🔄 Processing [N] products...
  [1/N] Extracting product data...
    ✅ [1] "Product Name" | Brand: H&M | Price: ₹599 | Images: 2
    ⚠️  [2] SKIPPED: missing price (name: ✓, price: ₹0, images: 1)
```

#### Summary Logs
```
📊 SCRAPING SUMMARY
   ✅ Successfully extracted: [X] products
   ⚠️  Skipped: [Y] products
   📋 Skip reasons:
      - missing price: [count]
      - missing name: [count]
```

### 3. **Myntra-Specific Selector Fallbacks**

The scraper uses Myntra-optimized fallback selectors:

**Product Cards:**
1. `[data-product-id]` (Primary - Myntra standard)
2. `.product-base` (Myntra product base class)
3. `li[class*="product"]` (Generic list item)
4. `article[class*="product"]` (Article-based)
5. `[class*="ProductCard"]` (React component)

**Product Name:**
1. `.product-product` (Primary)
2. `.product-brand + .product-product` (Adjacent to brand)
3. `h3`, `h4` (Generic headings)
4. `[class*="product-name"]` (Generic name classes)

**Brand:**
1. `.product-brand` (Primary)
2. `[class*="brand"]` (Generic brand class)
3. Defaults to "H&M" for H&M products on Myntra

**Price:**
1. `.product-price` (Primary)
2. `.product-discountedPrice` (Discounted price)
3. `[class*="price"]` (Generic price classes)

**Images:**
Tries multiple attributes in order:
- `src`
- `data-src`
- `data-lazy-src`
- `data-original`
- `data-image`

### 4. **Debug Screenshots**

Screenshots are automatically saved when:
- No product cards found → `debug-screenshots/no-products-[timestamp].png`
- Page navigation fails → `debug-screenshots/error-navigation-[timestamp].png`
- Critical error occurs → `debug-screenshots/error-critical-[timestamp].png`

HTML is also saved when no products found → `debug-screenshots/no-products-[timestamp].html`

### 5. **Resilient Validation**

Products are accepted if they have:
- ✅ Valid name (non-empty)
- ✅ Valid price (> 0)

Products are skipped with detailed reason logging if missing:
- Name
- Price
- Images (warning only, product still saved)

### 6. **Network Idle Detection**

The scraper waits for:
1. Initial page load (`domcontentloaded`)
2. 3-second delay for dynamic content
3. Network idle state (up to 10s timeout)

This ensures Myntra's React components are fully rendered.

## Usage

### Standard Mode (Headless)
```bash
# Default - runs headless
npm run dev
```

### Debug Mode (Visible Browser)
```bash
# Enable debug mode
export SCRAPER_DEBUG=true
npm run dev

# Or in .env file:
SCRAPER_DEBUG=true
```

### Scraping Myntra H&M Products
```bash
curl -X POST http://localhost:5001/api/products/scrape \
  -H "Content-Type: application/json" \
  -d '{
    "type": "myntra",
    "url": "https://www.myntra.com/men-tshirts?f=Brand%3AH%26M"
  }'
```

## Logging Points for Diagnosis

### ✅ Success Indicators
- `✅ Page loaded successfully` - Navigation successful
- `✅ Found [X] product cards` - Selectors working
- `✅ [N] "Product Name"` - Product extracted successfully
- `✅ Successfully extracted: [X] products` - Scraping complete

### ⚠️ Warning Indicators
- `⚠️ Selector not found` - Fallback selector being used
- `⚠️ SKIPPED: missing [field]` - Product skipped due to missing data
- `⚠️ Network idle timeout` - Page may still be loading

### ❌ Error Indicators
- `❌ Failed to load page` - Navigation failed (check URL, network)
- `❌ No product cards found` - Selectors don't match page structure
- `❌ CRITICAL ERROR` - Unexpected error (check stack trace)

## Troubleshooting

### No Products Found
1. Check `debug-screenshots/no-products-[timestamp].png`
2. Review `debug-screenshots/no-products-[timestamp].html`
3. Verify URL is correct and accessible
4. Check if Myntra page structure has changed
5. Enable debug mode to see browser behavior

### Products Skipped
Check skip reasons in summary:
- `missing name` - Name selector needs update
- `missing price` - Price selector needs update
- `missing images` - Image extraction needs fix

### Slow Scraping
- Normal: 2-3 seconds per product (rate limiting)
- Debug mode adds 100ms delay per operation
- Network idle wait can add up to 10 seconds

## Expected Results

When scraping completes successfully:
- `/api/products/trending` should return products
- `/api/products?limit=10` should show scraped products
- Server logs show detailed extraction progress
- Products saved to MongoDB with processed images

## Architecture Notes

- **BaseScraper**: Common functionality (price normalization, category extraction)
- **PlaywrightScraper**: Browser-based scraping with fallbacks
- **ScraperFactory**: Creates site-specific scrapers
- **Myntra-specific**: Fallback selectors only apply when `baseUrl.includes('myntra.com')`

All improvements maintain:
- ✅ Asynchronous operation
- ✅ Rate limiting (2s delay)
- ✅ Error handling
- ✅ Existing architecture


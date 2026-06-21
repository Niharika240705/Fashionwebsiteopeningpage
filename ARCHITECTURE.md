# Fashion Aggregation Website - System Architecture

## Overview

This system aggregates trending fashion products from multiple e-commerce platforms (Myntra, H&M, Zara) and displays them on a unified platform. The system includes web scraping, AI-powered image processing, trend detection, and a RESTful API.

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                         FRONTEND (React)                        │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  TrendingProducts Component                              │  │
│  │  - Fetches products from API                             │  │
│  │  - Displays product cards                                │  │
│  │  - Redirects to original site on click                   │  │
│  └──────────────────────────────────────────────────────────┘  │
└──────────────────────────────┬──────────────────────────────────┘
                               │ HTTP/REST API
                               ▼
┌─────────────────────────────────────────────────────────────────┐
│                    BACKEND API (Express/Node.js)                 │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  Product Routes                                           │  │
│  │  - GET /api/products/trending                             │  │
│  │  - GET /api/products?category=&brand=                     │  │
│  │  - GET /api/products/:id                                  │  │
│  │  - POST /api/products/scrape                              │  │
│  └──────────────────────────────────────────────────────────┘  │
└──────────────────────────────┬──────────────────────────────────┘
                               │
        ┌──────────────────────┼──────────────────────┐
        │                      │                      │
        ▼                      ▼                      ▼
┌───────────────┐    ┌──────────────────┐    ┌──────────────────┐
│   Scraping    │    │  Image Processing│    │ Trend Detection  │
│   Service     │    │     Service      │    │     Service      │
│               │    │                  │    │                  │
│ - Playwright  │    │ - Person Detect  │    │ - Score Calc     │
│ - Cheerio     │    │ - BG Removal     │    │ - Category Trend │
│ - Rate Limit  │    │ - Clothing Isol  │    │ - Cross-site     │
└───────┬───────┘    └────────┬─────────┘    └────────┬─────────┘
        │                     │                       │
        └─────────────────────┼───────────────────────┘
                              │
                              ▼
                    ┌──────────────────┐
                    │   MongoDB        │
                    │   - Products     │
                    │   - Users        │
                    └──────────────────┘
                              │
                              ▼
                    ┌──────────────────┐
                    │ Cloud Storage     │
                    │ - Supabase/S3    │
                    │ - Processed Imgs │
                    └──────────────────┘
```

## Component Details

### 1. Data Source & Scraping Layer

**Location:** `server/src/services/scraper.service.ts`

**Components:**
- `BaseScraper`: Base class with common functionality
- `PlaywrightScraper`: Uses Playwright for dynamic content
- `StaticScraper`: Uses Cheerio for static HTML
- `ScraperFactory`: Creates scrapers for different sites

**Features:**
- Headless browser automation (Playwright)
- Static HTML parsing (Cheerio)
- Rate limiting (respects robots.txt)
- Product data extraction:
  - Name, brand, category
  - Price, discount, original price
  - Images, product URL
  - Metadata (color, size, material)

**Rate Limiting:**
- 2-3 seconds delay between requests
- Configurable per site
- Respects robots.txt

### 2. AI Image Processing Agent

**Location:** `server/src/services/image-processing.service.ts`

**Pipeline:**
1. **Person Detection**: Detects if image contains human model
   - Current: Heuristic-based (aspect ratio)
   - Production: YOLO/MediaPipe/TensorFlow.js
2. **Background Removal**: If model detected
   - Removes background and model
   - Isolates clothing item (flat-lay style)
   - Uses RemBG or cloud service
3. **Image Optimization**: If no model
   - Resizes and compresses
   - Maintains quality

**Storage:**
- Processed images stored in cloud (Supabase/S3)
- Original images preserved
- Fallback to original if processing fails

### 3. Trend Detection Agent

**Location:** `server/src/services/trend-detection.service.ts`

**Scoring Algorithm:**
- **Appearance Count** (25%): How often product seen
- **Discount Percentage** (20%): Discount appeal
- **Category Popularity** (20%): Category trend
- **Recency** (20%): How recently seen
- **Cross-Site Presence** (15%): Multi-site presence

**Trend Score Range:** 0-100 (higher = more trending)

**Features:**
- Automatic score calculation
- Category-based trending
- Periodic updates (every 6 hours)

### 4. Backend API

**Location:** `server/src/routes/product.routes.ts`

**Endpoints:**

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/products/trending` | Get trending products |
| GET | `/api/products` | Get products with filters |
| GET | `/api/products/:id` | Get single product |
| GET | `/api/products/categories/trending` | Get trending categories |
| POST | `/api/products/scrape` | Trigger scraping (admin) |

**Query Parameters:**
- `category`: Filter by category
- `brand`: Filter by brand
- `minPrice`/`maxPrice`: Price range
- `limit`: Results per page
- `page`: Page number
- `sortBy`: Sort field (trendScore, price, createdAt)
- `order`: Sort order (asc, desc)

### 5. Database Schema

**Location:** `server/src/models/Product.model.ts`

**Product Model:**
```typescript
{
  name: string;
  brand: string;
  category: string;
  price: number;
  originalPrice?: number;
  discount?: number;
  discountPercentage?: number;
  images: {
    original: string[];
    processed: string[];
  };
  productUrl: string;
  sourceWebsite: string;
  trendScore: number;
  appearanceCount: number;
  lastScraped: Date;
  metadata?: {
    color?: string;
    size?: string[];
    material?: string;
    description?: string;
  };
}
```

**Indexes:**
- `productUrl` (unique)
- `category`, `brand` (compound)
- `trendScore`, `createdAt` (compound)
- `sourceWebsite`, `lastScraped`

### 6. Scheduled Jobs

**Location:** `server/src/jobs/scraping.job.ts`

**Jobs:**
- **Daily Scraping** (2 AM): Scrapes products from configured sources
- **Trend Score Update** (Every 6 hours): Updates trend scores for all products

**Configuration:**
- Enable/disable via `ENABLE_SCHEDULED_SCRAPING` env var
- Configurable timezone
- Error handling and logging

### 7. Frontend Integration

**Location:** `src/components/TrendingProducts.tsx`

**Features:**
- Product grid display
- Loading states
- Error handling
- Product card with:
  - Image (processed)
  - Brand, name, price
  - Discount badge
  - Trend badge
  - Click to redirect to original site
- Legal disclaimer

## Data Flow

### Scraping Flow:
1. Scraper fetches listing page
2. Extracts product data
3. Images sent to processing service
4. Processed images uploaded to cloud
5. Product saved to database
6. Trend score calculated
7. Product available via API

### API Request Flow:
1. Frontend requests `/api/products/trending`
2. API queries database
3. Returns products with processed images
4. Frontend displays products
5. User clicks → redirects to original site

## Legal & Safety

### Implemented:
- ✅ No checkout on our site
- ✅ Clear disclaimer on products
- ✅ Redirects to original site
- ✅ Rate limiting on scraping
- ✅ Robots.txt compliance check

### Recommendations:
- Add terms of service page
- Implement proper attribution
- Monitor scraping frequency
- Respect site-specific rate limits
- Consider API partnerships

## Environment Variables

See `server/.env.example` for all required variables:

- **Server**: PORT, NODE_ENV, FRONTEND_URL
- **Database**: MONGODB_URI
- **Storage**: SUPABASE_URL/KEY or AWS credentials
- **Scraping**: Listing URLs for each source
- **Scheduling**: ENABLE_SCHEDULED_SCRAPING

## Production Considerations

### Image Processing:
- Replace heuristic person detection with ML model
- Use cloud AI services (AWS Rekognition, Google Vision)
- Implement proper background removal (RemBG API, ClipDrop)
- Add image caching

### Scraping:
- Implement proxy rotation
- Add retry logic with exponential backoff
- Monitor scraping success rates
- Consider official APIs if available

### Performance:
- Add Redis caching for trending products
- Implement CDN for images
- Database query optimization
- API response caching

### Security:
- Protect scraping endpoint with authentication
- Rate limit API endpoints
- Validate input parameters
- Sanitize user inputs

## File Structure

```
server/
├── src/
│   ├── models/
│   │   └── Product.model.ts
│   ├── services/
│   │   ├── scraper.service.ts
│   │   ├── image-processing.service.ts
│   │   ├── trend-detection.service.ts
│   │   └── scraping-orchestrator.service.ts
│   ├── routes/
│   │   └── product.routes.ts
│   ├── jobs/
│   │   └── scraping.job.ts
│   └── index.ts
└── package.json

src/
└── components/
    └── TrendingProducts.tsx
```

## Next Steps

1. **Enhanced AI**: Integrate YOLO/MediaPipe for person detection
2. **Better Background Removal**: Use RemBG API or ClipDrop
3. **More Sources**: Add more fashion e-commerce sites
4. **User Features**: Save favorites, filters, search
5. **Analytics**: Track popular products, user behavior
6. **API Partnerships**: Reach out to retailers for official APIs


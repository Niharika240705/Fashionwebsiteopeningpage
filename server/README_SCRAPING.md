# Fashion Aggregation Backend - Quick Reference

## API Endpoints

### Products

#### Get Trending Products
```
GET /api/products/trending?category=t-shirt&limit=20
```

Response:
```json
{
  "success": true,
  "count": 20,
  "products": [
    {
      "id": "...",
      "name": "Oversized T-Shirt",
      "brand": "H&M",
      "category": "t-shirt",
      "price": 599,
      "originalPrice": 999,
      "discountPercentage": 40,
      "images": ["https://..."],
      "productUrl": "https://...",
      "sourceWebsite": "https://www2.hm.com",
      "trendScore": 75,
      "disclaimer": "Products sourced from partner websites..."
    }
  ]
}
```

#### Get Products with Filters
```
GET /api/products?category=dress&brand=zara&minPrice=1000&maxPrice=5000&page=1&limit=20&sortBy=trendScore&order=desc
```

#### Get Single Product
```
GET /api/products/:id
```

#### Get Trending Categories
```
GET /api/products/categories/trending?limit=10
```

#### Trigger Scraping (Admin)
```
POST /api/products/scrape
Content-Type: application/json

{
  "type": "myntra",
  "url": "https://www.myntra.com/men-tshirts"
}
```

## Services

### ScraperService
- `PlaywrightScraper`: For dynamic JavaScript-rendered sites
- `StaticScraper`: For static HTML sites
- `ScraperFactory`: Creates scrapers for different sites

### ImageProcessingService
- `processImage()`: Process single image
- `processImages()`: Process multiple images
- Detects person, removes background, isolates clothing

### TrendDetectionService
- `calculateTrendScore()`: Calculate trend score for product
- `updateAllTrendScores()`: Update all products
- `getTrendingByCategory()`: Get trending products
- `getTrendingCategories()`: Get trending categories

### ScrapingOrchestratorService
- `scrapeAndProcess()`: Full pipeline (scrape → process → save)
- `batchScrape()`: Scrape from multiple sources

## Models

### Product
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

## Scheduled Jobs

- **Daily Scraping**: 2 AM (configurable)
- **Trend Score Update**: Every 6 hours

Enable with: `ENABLE_SCHEDULED_SCRAPING=true`

## File Structure

```
server/src/
├── models/
│   └── Product.model.ts          # Product database model
├── services/
│   ├── scraper.service.ts        # Web scraping logic
│   ├── image-processing.service.ts  # AI image processing
│   ├── trend-detection.service.ts   # Trend scoring
│   └── scraping-orchestrator.service.ts  # Pipeline orchestration
├── routes/
│   └── product.routes.ts         # Product API routes
├── jobs/
│   └── scraping.job.ts          # Scheduled jobs
└── index.ts                      # Server entry point
```

## Environment Variables

See `.env.example` for complete list.

**Required:**
- `MONGODB_URI`
- `SUPABASE_URL` or AWS credentials
- `SESSION_SECRET`

**Optional:**
- `ENABLE_SCHEDULED_SCRAPING`
- Site-specific listing URLs

## Development

```bash
# Install dependencies
npm install
npx playwright install chromium

# Run in development
npm run dev

# Build for production
npm run build
npm start

# Type check
npm run type-check
```

## Testing Scraping

```typescript
import { ScrapingOrchestratorService } from './services/scraping-orchestrator.service';

const orchestrator = new ScrapingOrchestratorService();

// Scrape and process
const products = await orchestrator.scrapeAndProcess(
  'myntra',
  'https://www.myntra.com/men-tshirts'
);

console.log(`Scraped ${products.length} products`);
```

## Notes

- Scraping respects rate limits (2-3s delay)
- Images are processed and stored in cloud
- Trend scores update automatically
- Products deduplicated by `productUrl`
- Legal disclaimer included in API responses


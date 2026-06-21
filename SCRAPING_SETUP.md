# Fashion Aggregation System - Setup Guide

## Prerequisites

- Node.js 18+ and npm
- MongoDB (local or cloud instance)
- Cloud storage account (Supabase or AWS S3)

## Installation

### 1. Install Backend Dependencies

```bash
cd server
npm install
```

**Note:** Playwright requires browser binaries. After installation, run:
```bash
npx playwright install chromium
```

### 2. Environment Configuration

Create a `.env` file in the `server/` directory:

```env
# Server Configuration
PORT=5000
NODE_ENV=development
FRONTEND_URL=http://localhost:5173

# MongoDB
MONGODB_URI=mongodb://localhost:27017/fashion-website

# Session Secret
SESSION_SECRET=your-secret-key-change-in-production

# Scraping Configuration
ENABLE_SCHEDULED_SCRAPING=false
MYNTRA_LISTING_URL=https://www.myntra.com/men-tshirts
HM_LISTING_URL=https://www2.hm.com/en_in/men/shop-by-product/t-shirts.html
ZARA_LISTING_URL=https://www.zara.com/in/en/man/tshirts-c358009.html

# Cloud Storage - Supabase (Option 1)
SUPABASE_URL=your-supabase-url
SUPABASE_ANON_KEY=your-supabase-anon-key
SUPABASE_BUCKET=processed-images



### 3. Set Up Cloud Storage

#### Option A: Supabase (Recommended for quick setup)

1. Create account at [supabase.com](https://supabase.com)
2. Create a new project
3. Go to Storage → Create bucket: `processed-images`
4. Set bucket to public
5. Copy project URL and anon key to `.env`

`

### 4. Start MongoDB

**Local:**
```bash
mongod
```

**Or use MongoDB Atlas (cloud):**
- Create cluster at [mongodb.com/cloud/atlas](https://www.mongodb.com/cloud/atlas)
- Copy connection string to `MONGODB_URI`

### 5. Start Backend Server

```bash
cd server
npm run dev
```

## Usage

### Manual Scraping

Trigger scraping via API:

```bash
curl -X POST http://localhost:5000/api/products/scrape \
  -H "Content-Type: application/json" \
  -d '{
    "type": "myntra",
    "url": "https://www.myntra.com/men-tshirts"
  }'
```

### View Trending Products

```bash
# Get all trending products
curl http://localhost:5000/api/products/trending

# Get trending products by category
curl http://localhost:5000/api/products/trending?category=t-shirt&limit=10
```

### Filter Products

```bash
# By category and brand
curl "http://localhost:5000/api/products?category=dress&brand=zara"

# By price range
curl "http://localhost:5000/api/products?minPrice=1000&maxPrice=5000"
```

### Frontend Integration

Add the `TrendingProducts` component to your React app:

```tsx
import { TrendingProducts } from './components/TrendingProducts';

function App() {
  return (
    <div>
      <TrendingProducts category="t-shirt" limit={20} />
    </div>
  );
}
```

Set the API URL in your frontend `.env`:
```env
VITE_API_URL=http://localhost:5000
```

## Scheduled Scraping

Enable automatic daily scraping:

1. Set `ENABLE_SCHEDULED_SCRAPING=true` in `.env`
2. Restart server
3. Scraping runs daily at 2 AM (configurable in `jobs/scraping.job.ts`)

## Customizing Scrapers

### Adding a New Site

1. Update `ScraperFactory` in `scraper.service.ts`:

```typescript
static createNewSiteScraper(): PlaywrightScraper {
  return new PlaywrightScraper({
    baseUrl: 'https://newsite.com',
    selectors: {
      productCard: '.product-item',
      name: '.product-name',
      brand: '.product-brand',
      price: '.price',
      image: 'img',
      productLink: 'a',
    },
    rateLimitDelay: 2000,
    maxProducts: 50,
  });
}
```

2. Add to scraping config in `scraping.job.ts`

## Troubleshooting

### Playwright Issues
- Ensure Chromium is installed: `npx playwright install chromium`
- Check browser permissions
- Try running with `headless: false` for debugging

### Image Processing Issues
- Verify cloud storage credentials
- Check network connectivity
- Review storage bucket permissions

### Scraping Fails
- Check if site structure changed (selectors may need update)
- Verify rate limiting isn't too aggressive
- Check robots.txt compliance
- Some sites may block automated access

### Database Connection
- Verify MongoDB is running
- Check connection string format
- Ensure network access (for cloud MongoDB)

## Production Deployment

### Security
- Change `SESSION_SECRET` to strong random value
- Use environment variables (never commit `.env`)
- Enable HTTPS
- Add authentication to scraping endpoint
- Implement proper rate limiting

### Performance
- Use Redis for caching
- Set up CDN for images
- Optimize database queries
- Enable compression middleware

### Monitoring
- Set up error tracking (Sentry, etc.)
- Monitor scraping success rates
- Track API response times
- Set up alerts for failures

## Legal Considerations

⚠️ **Important:**
- Respect website terms of service
- Don't scrape too aggressively
- Consider reaching out for API partnerships
- Add proper disclaimers
- Don't copy product descriptions verbatim
- Clear attribution to source sites

## Next Steps

1. **Enhanced AI**: Integrate proper ML models for person detection
2. **Better Background Removal**: Use RemBG API or ClipDrop
3. **More Sources**: Add additional fashion retailers
4. **User Features**: Favorites, search, filters
5. **Analytics**: Track popular products and trends


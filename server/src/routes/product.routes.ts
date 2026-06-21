import express, { Request, Response } from 'express';
import { Product, IProduct } from '../models/Product.model';
import { TrendDetectionService } from '../services/trend-detection.service';
import { ScrapingOrchestratorService } from '../services/scraping-orchestrator.service';

const router = express.Router();
const trendDetectionService = new TrendDetectionService();
const scrapingOrchestrator = new ScrapingOrchestratorService();

/**
 * GET /api/products/trending
 * Get trending products
 * Query params:
 *   - category: Filter by category (optional)
 *   - limit: Number of results (default: 20)
 */
router.get('/trending', async (req: Request, res: Response) => {
  try {
    const category = req.query.category as string | undefined;
    const limit = parseInt(req.query.limit as string) || 20;

    const products = await trendDetectionService.getTrendingByCategory(category, limit);

    res.json({
      success: true,
      count: products.length,
      products: products.map((product) => formatProductResponse(product)),
    });
  } catch (error: any) {
    console.error('Error fetching trending products:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch trending products',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
});

/**
 * GET /api/products
 * Get products with filters
 * Query params:
 *   - category: Filter by category (optional)
 *   - brand: Filter by brand (optional)
 *   - minPrice: Minimum price (optional)
 *   - maxPrice: Maximum price (optional)
 *   - limit: Number of results (default: 20)
 *   - page: Page number (default: 1)
 *   - sortBy: Sort field (trendScore, price, createdAt) (default: trendScore)
 *   - order: Sort order (asc, desc) (default: desc)
 */
router.get('/', async (req: Request, res: Response) => {
  try {
    const {
      category,
      brand,
      minPrice,
      maxPrice,
      limit = '20',
      page = '1',
      sortBy = 'trendScore',
      order = 'desc',
    } = req.query;

    // Build query
    const query: any = {};

    if (category) {
      query.category = { $regex: new RegExp(category as string, 'i') };
    }

    if (brand) {
      query.brand = { $regex: new RegExp(brand as string, 'i') };
    }

    if (minPrice || maxPrice) {
      query.price = {};
      if (minPrice) {
        query.price.$gte = parseFloat(minPrice as string);
      }
      if (maxPrice) {
        query.price.$lte = parseFloat(maxPrice as string);
      }
    }

    // Build sort
    const sort: any = {};
    const sortField = sortBy as string;
    const sortOrder = order === 'asc' ? 1 : -1;
    sort[sortField] = sortOrder;

    // Pagination
    const limitNum = parseInt(limit as string);
    const pageNum = parseInt(page as string);
    const skip = (pageNum - 1) * limitNum;

    // Execute query
    const [products, total] = await Promise.all([
      Product.find(query).sort(sort).skip(skip).limit(limitNum).lean(),
      Product.countDocuments(query),
    ]);

    res.json({
      success: true,
      count: products.length,
      total,
      page: pageNum,
      totalPages: Math.ceil(total / limitNum),
      products: products.map((product) => formatProductResponse(product)),
    });
  } catch (error: any) {
    console.error('Error fetching products:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch products',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
});

/**
 * GET /api/products/:id
 * Get a single product by ID
 */
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const product = await Product.findById(req.params.id).lean();

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found',
      });
    }

    res.json({
      success: true,
      product: formatProductResponse(product),
    });
  } catch (error: any) {
    console.error('Error fetching product:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch product',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
});

/**
 * GET /api/products/categories/trending
 * Get trending categories
 */
router.get('/categories/trending', async (req: Request, res: Response) => {
  try {
    const limit = parseInt(req.query.limit as string) || 10;
    const categories = await trendDetectionService.getTrendingCategories(limit);

    res.json({
      success: true,
      categories,
    });
  } catch (error: any) {
    console.error('Error fetching trending categories:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch trending categories',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
});

/**
 * POST /api/products/scrape
 * Trigger scraping for a specific source
 * Body: { type: 'myntra' | 'hm' | 'zara', url: string }
 * 
 * NOTE: In production, this should be protected with authentication
 * and rate limiting to prevent abuse
 */
router.post('/scrape', async (req: Request, res: Response) => {
  try {
    const { type, url } = req.body;

    if (!type || !url) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: type and url',
      });
    }

    if (!['myntra', 'hm', 'zara'].includes(type)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid scraper type. Must be: myntra, hm, or zara',
      });
    }

    // Start scraping in background (don't wait for completion)
    scrapingOrchestrator
      .scrapeAndProcess(type as 'myntra' | 'hm' | 'zara', url)
      .catch((error) => {
        console.error('Background scraping error:', error);
      });

    res.json({
      success: true,
      message: 'Scraping started in background',
    });
  } catch (error: any) {
    console.error('Error starting scrape:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to start scraping',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
});

/**
 * Format product response (exclude internal fields, use processed images)
 */
function formatProductResponse(product: IProduct | any) {
  return {
    id: product._id,
    name: product.name,
    brand: product.brand,
    category: product.category,
    price: product.price,
    originalPrice: product.originalPrice,
    discount: product.discount,
    discountPercentage: product.discountPercentage,
    // Use processed images if available, fallback to original
    images: product.images?.processed?.length > 0 
      ? product.images.processed 
      : product.images?.original || [],
    productUrl: product.productUrl,
    sourceWebsite: product.sourceWebsite,
    trendScore: product.trendScore,
    metadata: product.metadata,
    // Legal disclaimer
    disclaimer: 'Products sourced from partner websites. Click to view on original site.',
  };
}

export default router;


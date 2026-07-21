import express, { Request, Response } from 'express';
import rateLimit from 'express-rate-limit';
import { Product, IProduct } from '../models/Product.model';
import { Offer } from '../models/Offer.model';
import { Source } from '../models/Source.model';
import { TrendDetectionService } from '../services/trend-detection.service';
import { authenticateToken, requireAdmin, AuthRequest } from '../middleware/auth.middleware';
import { IngestionOrchestratorService } from '../services/ingestion/ingestion-orchestrator.service';
import {
  getCategoriesForAudience,
  labelForCategory,
  normalizeAudience,
} from '../services/ingestion/taxonomy.service';
import {
  isPythonCatalogEnabled,
  parsePythonProductId,
  pythonCatalogService,
} from '../services/python-catalog.service';

const router = express.Router();
const trendDetectionService = new TrendDetectionService();
const ingestionOrchestrator = new IngestionOrchestratorService();

const productLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
});

router.use(productLimiter);

const SORT_ALLOWLIST: Record<string, Record<string, 1 | -1>> = {
  relevance: { trendScore: -1, createdAt: -1 },
  trending: { trendScore: -1, createdAt: -1 },
  price_asc: { price: 1 },
  price_desc: { price: -1 },
  newest: { createdAt: -1 },
  discount: { discountPercentage: -1 },
};

function parseList(value: unknown): string[] | undefined {
  if (!value) return undefined;
  if (Array.isArray(value)) return value.map(String);
  return String(value)
    .split(',')
    .map((v) => v.trim())
    .filter(Boolean);
}

function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * GET /api/products/trending
 */
router.get('/trending', async (req: Request, res: Response) => {
  try {
    const category = req.query.category as string | undefined;
    const audience = (req.query.audience as string) || 'women';
    const limit = Math.min(parseInt(req.query.limit as string) || 20, 100);

    if (isPythonCatalogEnabled()) {
      const products = await pythonCatalogService.getTrendingProducts({ category, audience, limit });
      return res.json({
        success: true,
        count: products.length,
        products,
      });
    }

    const products = await trendDetectionService.getTrendingByCategory(category, limit, audience);

    res.json({
      success: true,
      count: products.length,
      products: await Promise.all(products.map((product) => formatProductResponse(product))),
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
 * GET /api/products/categories
 */
router.get('/categories', async (req: Request, res: Response) => {
  const audience = normalizeAudience(req.query.audience as string);
  res.json({
    success: true,
    audience,
    categories: getCategoriesForAudience(audience).map((category) => ({
      slug: category,
      label: labelForCategory(category),
    })),
  });
});

/**
 * GET /api/products/categories/trending
 */
router.get('/categories/trending', async (req: Request, res: Response) => {
  try {
    const limit = Math.min(parseInt(req.query.limit as string) || 10, 50);
    const categories = await trendDetectionService.getTrendingCategories(limit);
    res.json({ success: true, categories });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch trending categories',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
});

/**
 * GET /api/products
 */
router.get('/', async (req: Request, res: Response) => {
  try {
    const {
      q,
      category,
      subcategory,
      audience = 'women',
      minPrice,
      maxPrice,
      inStock,
      sort = 'trending',
      limit = '20',
      page = '1',
    } = req.query;

    const brands = parseList(req.query.brand);
    const retailers = parseList(req.query.retailer);
    const colors = parseList(req.query.color);
    const sizes = parseList(req.query.size);

    if (isPythonCatalogEnabled()) {
      const result = await pythonCatalogService.listProducts({
        q: q ? String(q).trim() : undefined,
        category: category ? String(category) : undefined,
        subcategory: subcategory ? String(subcategory) : undefined,
        audience: String(audience),
        brand: brands,
        retailer: retailers,
        color: colors,
        size: sizes,
        minPrice: minPrice ? parseFloat(String(minPrice)) : undefined,
        maxPrice: maxPrice ? parseFloat(String(maxPrice)) : undefined,
        inStock: inStock === 'true',
        sort: String(sort),
        page: Math.max(parseInt(String(page)) || 1, 1),
        limit: Math.min(Math.max(parseInt(String(limit)) || 20, 1), 100),
      });

      return res.json({
        success: true,
        count: result.products.length,
        total: result.total,
        page: result.page,
        totalPages: Math.ceil(result.total / result.pageSize),
        sort: result.sort,
        products: result.products,
        facets: result.facets,
      });
    }

    const query: Record<string, any> = {
      audience,
    };

    if (category) query.category = String(category);
    if (subcategory) query.subcategory = String(subcategory);
    if (brands?.length) query.brand = { $in: brands.map((b) => new RegExp(`^${escapeRegex(b)}$`, 'i')) };
    if (retailers?.length) query.retailerId = { $in: retailers };
    if (colors?.length) query['metadata.color'] = { $in: colors.map((c) => new RegExp(escapeRegex(c), 'i')) };
    if (sizes?.length) query['metadata.size'] = { $in: sizes };
    if (inStock === 'true') query.availability = 'in_stock';

    if (minPrice || maxPrice) {
      query.price = {};
      if (minPrice) query.price.$gte = parseFloat(String(minPrice));
      if (maxPrice) query.price.$lte = parseFloat(String(maxPrice));
    }

    if (q && String(q).trim()) {
      query.$text = { $search: String(q).trim() };
    }

    const sortKey = SORT_ALLOWLIST[String(sort)] ? String(sort) : 'trending';
    const sortSpec = SORT_ALLOWLIST[sortKey];

    const limitNum = Math.min(Math.max(parseInt(String(limit)) || 20, 1), 100);
    const pageNum = Math.max(parseInt(String(page)) || 1, 1);
    const skip = (pageNum - 1) * limitNum;

    const [products, total, brandFacet, retailerFacet, categoryFacet, colorFacet] = await Promise.all([
      Product.find(query).sort(sortSpec).skip(skip).limit(limitNum).lean(),
      Product.countDocuments(query),
      Product.aggregate([{ $match: query }, { $group: { _id: '$brand', count: { $sum: 1 } } }, { $sort: { count: -1 } }, { $limit: 30 }]),
      Product.aggregate([{ $match: query }, { $group: { _id: '$retailerId', count: { $sum: 1 } } }, { $sort: { count: -1 } }, { $limit: 30 }]),
      Product.aggregate([{ $match: query }, { $group: { _id: '$category', count: { $sum: 1 } } }, { $sort: { count: -1 } }, { $limit: 30 }]),
      Product.aggregate([
        { $match: { ...query, 'metadata.color': { $exists: true, $ne: null } } },
        { $group: { _id: '$metadata.color', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 30 },
      ]),
    ]);

    res.json({
      success: true,
      count: products.length,
      total,
      page: pageNum,
      totalPages: Math.ceil(total / limitNum),
      sort: sortKey,
      products: await Promise.all(products.map((product) => formatProductResponse(product))),
      facets: {
        brands: brandFacet.map((f) => ({ value: f._id, count: f.count })),
        retailers: retailerFacet.map((f) => ({ value: f._id, count: f.count })),
        categories: categoryFacet.map((f) => ({ value: f._id, count: f.count })),
        colors: colorFacet.map((f) => ({ value: f._id, count: f.count })),
      },
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
 */
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const pythonId = isPythonCatalogEnabled() ? parsePythonProductId(req.params.id) : null;
    if (pythonId !== null) {
      const product = await pythonCatalogService.getProduct(pythonId);
      if (!product) {
        return res.status(404).json({ success: false, message: 'Product not found' });
      }
      return res.json({ success: true, product });
    }

    const product = await Product.findById(req.params.id).lean();
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    res.json({
      success: true,
      product: await formatProductResponse(product),
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch product',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
});

/**
 * POST /api/products/ingest/:sourceId  (admin only; replaces public scrape)
 */
router.post(
  '/ingest/:sourceId',
  authenticateToken,
  requireAdmin,
  async (req: AuthRequest, res: Response) => {
    try {
      const { sourceId } = req.params;
      const source = await Source.findOne({ sourceId, enabled: true });
      if (!source) {
        return res.status(400).json({ success: false, message: 'Source not enabled' });
      }

      ingestionOrchestrator
        .ingestSource(sourceId, {
          limit: req.body?.limit,
          processImages: Boolean(req.body?.processImages),
        })
        .catch((error) => console.error('Background ingestion error:', error));

      res.json({ success: true, message: 'Ingestion started in background' });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: 'Failed to start ingestion',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined,
      });
    }
  }
);

export async function formatProductResponse(product: IProduct | any) {
  const approved =
    product.images?.approved?.length > 0
      ? product.images.approved
      : product.images?.processed?.length > 0
        ? product.images.processed
        : product.images?.original?.length > 0
          ? product.images.original
          : [];

  const offer = await Offer.findOne({
    productId: product._id,
    status: 'active',
  })
    .sort({ price: 1 })
    .lean();

  const source = offer
    ? await Source.findOne({ sourceId: offer.sourceId }).lean()
    : product.retailerId
      ? await Source.findOne({ sourceId: product.retailerId }).lean()
      : null;

  return {
    id: product._id,
    name: product.name,
    brand: product.brand,
    designerId: product.designerId,
    category: product.category,
    subcategory: product.subcategory,
    audience: product.audience || 'women',
    price: offer?.price ?? product.price,
    originalPrice: offer?.originalPrice ?? product.originalPrice,
    discountPercentage: offer?.discountPercentage ?? product.discountPercentage,
    currency: offer?.currency || product.currency || 'INR',
    images: approved,
    availability: offer?.availability || product.availability || 'unknown',
    productUrl: product.productUrl,
    canonicalUrl: product.canonicalUrl,
    sourceWebsite: product.sourceWebsite,
    retailerId: product.retailerId || offer?.sourceId,
    sellerName: offer?.sellerName || source?.name || product.sourceWebsite,
    offerId: offer?._id,
    redirectPath: offer?._id ? `/api/r/${offer._id}` : null,
    attributionText: source?.attributionText || `Sold by ${product.sourceWebsite}`,
    disclosureText:
      source?.disclosureText ||
      'We may earn a commission when you buy through links on our site.',
    trendScore: product.trendScore,
    metadata: product.metadata,
    lastVerifiedAt: offer?.lastVerifiedAt || product.lastVerifiedAt,
    disclaimer: 'Products sourced from partner websites. Click to view on original site. Price and availability may change.',
  };
}

export default router;

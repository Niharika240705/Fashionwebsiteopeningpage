import express, { Request, Response } from 'express';
import rateLimit from 'express-rate-limit';
import { Designer } from '../models/Designer.model';
import { Product } from '../models/Product.model';
import { formatProductResponse } from './product.routes';
import { normalizeAudience } from '../services/ingestion/taxonomy.service';

const router = express.Router();

const designerLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
});

router.use(designerLimiter);

const SORT_ALLOWLIST: Record<string, Record<string, 1 | -1>> = {
  relevance: { trendScore: -1, createdAt: -1 },
  trending: { trendScore: -1, createdAt: -1 },
  price_asc: { price: 1 },
  price_desc: { price: -1 },
  newest: { createdAt: -1 },
  discount: { discountPercentage: -1 },
};

function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function parseList(value: unknown): string[] | undefined {
  if (!value) return undefined;
  if (Array.isArray(value)) return value.map(String);
  return String(value)
    .split(',')
    .map((v) => v.trim())
    .filter(Boolean);
}

function formatDesignerResponse(designer: any) {
  return {
    id: designer._id,
    name: designer.name,
    slug: designer.slug,
    logoUrl: designer.logoUrl,
    coverImageUrl: designer.coverImageUrl,
    shortDescription: designer.shortDescription,
    specializations: designer.specializations || [],
    websiteUrl: designer.websiteUrl,
    featured: designer.featured,
    sortOrder: designer.sortOrder,
    metadata: designer.metadata,
  };
}

/**
 * GET /api/designers
 * Filters: specialization, q (name/description search), featured
 */
router.get('/', async (req: Request, res: Response) => {
  try {
    const { specialization, q, featured } = req.query;

    const query: Record<string, any> = { active: true };
    if (specialization) {
      const specs = parseList(specialization) || [];
      if (specs.length) {
        query.specializations = { $in: specs.map((s) => new RegExp(`^${escapeRegex(s)}$`, 'i')) };
      }
    }
    if (featured === 'true') query.featured = true;
    if (q && String(q).trim()) {
      query.name = new RegExp(escapeRegex(String(q).trim()), 'i');
    }

    const designers = await Designer.find(query)
      .sort({ featured: -1, sortOrder: 1, name: 1 })
      .lean();

    res.json({
      success: true,
      count: designers.length,
      designers: designers.map(formatDesignerResponse),
    });
  } catch (error: any) {
    console.error('Error fetching designers:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch designers',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
});

/**
 * GET /api/designers/:slug
 */
router.get('/:slug', async (req: Request, res: Response) => {
  try {
    const designer = await Designer.findOne({ slug: req.params.slug.toLowerCase(), active: true }).lean();
    if (!designer) {
      return res.status(404).json({ success: false, message: 'Designer not found' });
    }

    const productCount = await Product.countDocuments({ designerId: designer._id });

    res.json({
      success: true,
      designer: { ...formatDesignerResponse(designer), productCount },
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch designer',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
});

/**
 * GET /api/designers/:slug/products
 * Supports category, gender (audience), minPrice, maxPrice, color, occasion,
 * availability, sort, page.
 */
router.get('/:slug/products', async (req: Request, res: Response) => {
  try {
    const designer = await Designer.findOne({ slug: req.params.slug.toLowerCase(), active: true }).lean();
    if (!designer) {
      return res.status(404).json({ success: false, message: 'Designer not found' });
    }

    const {
      category,
      gender,
      audience,
      minPrice,
      maxPrice,
      color,
      occasion,
      availability,
      sort = 'newest',
      limit = '24',
      page = '1',
    } = req.query;

    const query: Record<string, any> = { designerId: designer._id };

    const genderValue = gender || audience;
    if (genderValue) query.audience = normalizeAudience(String(genderValue));

    const categories = parseList(category);
    if (categories?.length) query.category = { $in: categories.map((c) => c.toLowerCase()) };

    const colors = parseList(color);
    if (colors?.length) {
      query['metadata.color'] = { $in: colors.map((c) => new RegExp(escapeRegex(c), 'i')) };
    }

    const occasions = parseList(occasion);
    if (occasions?.length) {
      query['metadata.occasion'] = { $in: occasions.map((o) => new RegExp(`^${escapeRegex(o)}$`, 'i')) };
    }

    if (availability === 'in_stock') query.availability = 'in_stock';

    if (minPrice || maxPrice) {
      query.price = {};
      if (minPrice) query.price.$gte = parseFloat(String(minPrice));
      if (maxPrice) query.price.$lte = parseFloat(String(maxPrice));
    }

    const sortKey = SORT_ALLOWLIST[String(sort)] ? String(sort) : 'newest';
    const sortSpec = SORT_ALLOWLIST[sortKey];

    const limitNum = Math.min(Math.max(parseInt(String(limit)) || 24, 1), 100);
    const pageNum = Math.max(parseInt(String(page)) || 1, 1);
    const skip = (pageNum - 1) * limitNum;

    const [products, total, categoryFacet, occasionFacet, colorFacet] = await Promise.all([
      Product.find(query).sort(sortSpec).skip(skip).limit(limitNum).lean(),
      Product.countDocuments(query),
      Product.aggregate([
        { $match: { designerId: designer._id } },
        { $group: { _id: '$category', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
      ]),
      Product.aggregate([
        { $match: { designerId: designer._id, 'metadata.occasion': { $exists: true, $ne: null } } },
        { $group: { _id: '$metadata.occasion', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
      ]),
      Product.aggregate([
        { $match: { designerId: designer._id, 'metadata.color': { $exists: true, $ne: null } } },
        { $group: { _id: '$metadata.color', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
      ]),
    ]);

    res.json({
      success: true,
      designer: formatDesignerResponse(designer),
      count: products.length,
      total,
      page: pageNum,
      totalPages: Math.ceil(total / limitNum),
      sort: sortKey,
      products: await Promise.all(products.map((product) => formatProductResponse(product))),
      facets: {
        categories: categoryFacet.map((f) => ({ value: f._id, count: f.count })),
        occasions: occasionFacet.map((f) => ({ value: f._id, count: f.count })),
        colors: colorFacet.map((f) => ({ value: f._id, count: f.count })),
      },
    });
  } catch (error: any) {
    console.error('Error fetching designer products:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch designer products',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
});

export default router;

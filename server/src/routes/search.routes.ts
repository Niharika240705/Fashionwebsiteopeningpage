import express, { Request, Response } from 'express';
import rateLimit from 'express-rate-limit';
import { Designer } from '../models/Designer.model';
import { Product } from '../models/Product.model';
import { formatProductResponse } from './product.routes';
import { normalizeAudience } from '../services/ingestion/taxonomy.service';

const router = express.Router();

const searchLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
});

router.use(searchLimiter);

function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * GET /api/search?q=
 * Aggregator: when the query matches a designer name, surfaces designer
 * directory cards alongside matching products (used by the header search
 * overlay + SearchPage designer strip).
 */
router.get('/', async (req: Request, res: Response) => {
  try {
    const q = String(req.query.q || '').trim();
    const audience = req.query.audience ? normalizeAudience(String(req.query.audience)) : undefined;
    const limit = Math.min(Math.max(parseInt(String(req.query.limit || '12')) || 12, 1), 40);

    if (!q) {
      return res.json({ success: true, q: '', designers: [], products: [], total: 0 });
    }

    const nameRegex = new RegExp(escapeRegex(q), 'i');

    const designerQuery: Record<string, any> = {
      active: true,
      $or: [{ name: nameRegex }, { specializations: nameRegex }],
    };

    const productQuery: Record<string, any> = { $text: { $search: q } };
    if (audience) productQuery.audience = audience;

    const [designers, products, total] = await Promise.all([
      Designer.find(designerQuery)
        .sort({ featured: -1, sortOrder: 1 })
        .limit(8)
        .lean(),
      Product.find(productQuery)
        .sort({ trendScore: -1, createdAt: -1 })
        .limit(limit)
        .lean()
        .catch(() =>
          // Text index miss (e.g. multi-word query with punctuation) — fall back to a
          // simple name/brand regex so search never returns a hard error.
          Product.find({
            ...(audience ? { audience } : {}),
            $or: [{ name: nameRegex }, { brand: nameRegex }],
          })
            .sort({ trendScore: -1 })
            .limit(limit)
            .lean()
        ),
      Product.countDocuments(productQuery).catch(() => 0),
    ]);

    res.json({
      success: true,
      q,
      designers: designers.map((designer) => ({
        id: designer._id,
        name: designer.name,
        slug: designer.slug,
        logoUrl: designer.logoUrl,
        coverImageUrl: designer.coverImageUrl,
        shortDescription: designer.shortDescription,
        specializations: designer.specializations || [],
        featured: designer.featured,
      })),
      products: await Promise.all(products.map((product) => formatProductResponse(product))),
      total,
    });
  } catch (error: any) {
    console.error('Error searching:', error);
    res.status(500).json({
      success: false,
      message: 'Search failed',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
});

export default router;

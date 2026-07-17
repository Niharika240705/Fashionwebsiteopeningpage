import express, { Response } from 'express';
import { Source } from '../models/Source.model';
import { Offer } from '../models/Offer.model';
import { Product } from '../models/Product.model';
import { IngestionRun } from '../models/IngestionRun.model';
import { ClickEvent } from '../models/ClickEvent.model';
import { ImageAsset } from '../models/ImageAsset.model';
import { authenticateToken, requireAdmin, AuthRequest } from '../middleware/auth.middleware';

const router = express.Router();

router.use(authenticateToken, requireAdmin);

/**
 * GET /api/monitoring/catalog
 * Lightweight catalog QA snapshot for the women's MVP (admin only).
 */
router.get('/catalog', async (_req: AuthRequest, res: Response) => {
  try {
    const [
      sources,
      productCount,
      activeOffers,
      staleOffers,
      approvedImages,
      pendingImages,
      rejectedImages,
      recentRuns,
      clickCount,
    ] = await Promise.all([
      Source.find().select('sourceId name enabled mode lastSyncedAt allowsScraping').lean(),
      Product.countDocuments({ audience: 'women' }),
      Offer.countDocuments({ status: 'active' }),
      Offer.countDocuments({ status: 'stale' }),
      ImageAsset.countDocuments({ processingStatus: 'approved' }),
      ImageAsset.countDocuments({ processingStatus: 'pending' }),
      ImageAsset.countDocuments({ processingStatus: 'rejected' }),
      IngestionRun.find().sort({ startedAt: -1 }).limit(10).lean(),
      ClickEvent.countDocuments(),
    ]);

    res.json({
      success: true,
      snapshot: {
        sources,
        productsWomen: productCount,
        activeOffers,
        staleOffers,
        images: {
          approved: approvedImages,
          pending: pendingImages,
          rejected: rejectedImages,
        },
        recentRuns,
        affiliateClicks: clickCount,
      },
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message:
        process.env.NODE_ENV === 'production'
          ? 'Failed to load catalog monitoring snapshot'
          : error.message || 'Failed to load catalog monitoring snapshot',
    });
  }
});

export default router;

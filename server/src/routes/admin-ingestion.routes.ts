import express, { Request, Response, NextFunction } from 'express';
import rateLimit from 'express-rate-limit';
import { authenticateToken, requireAdmin, AuthRequest } from '../middleware/auth.middleware';
import { IngestionOrchestratorService } from '../services/ingestion/ingestion-orchestrator.service';
import { IngestionRun } from '../models/IngestionRun.model';
import { Source } from '../models/Source.model';
import { getSourceAdapter } from '../sources/registry';

const router = express.Router();
const orchestrator = new IngestionOrchestratorService();

const ingestLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: { message: 'Too many ingestion requests' },
});

function cronOrAdmin(req: Request, res: Response, next: NextFunction) {
  const cronToken = process.env.CRON_ADMIN_TOKEN;
  const header = req.header('x-cron-token');
  if (cronToken && header && header === cronToken) {
    return next();
  }
  return authenticateToken(req as AuthRequest, res, () => requireAdmin(req as AuthRequest, res, next));
}

router.get('/sources', authenticateToken, requireAdmin, async (_req: AuthRequest, res: Response) => {
  const sources = await Source.find().sort({ sourceId: 1 }).lean();
  res.json({ success: true, sources });
});

router.get('/runs', authenticateToken, requireAdmin, async (req: AuthRequest, res: Response) => {
  const sourceId = typeof req.query.sourceId === 'string' ? req.query.sourceId : undefined;
  const query = sourceId ? { sourceId } : {};
  const runs = await IngestionRun.find(query).sort({ startedAt: -1 }).limit(50).lean();
  res.json({ success: true, runs });
});

router.post('/ingest/:sourceId', cronOrAdmin, ingestLimiter, async (req: Request, res: Response) => {
  try {
    const { sourceId } = req.params;
    if (!getSourceAdapter(sourceId)) {
      return res.status(400).json({ success: false, message: 'Unknown source adapter' });
    }

    const limit = req.body?.limit ? Number(req.body.limit) : undefined;
    const processImages = Boolean(req.body?.processImages);
    const audience = typeof req.body?.audience === 'string' ? req.body.audience : undefined;
    const category = typeof req.body?.category === 'string' ? req.body.category : undefined;

    orchestrator
      .ingestSource(sourceId, { limit, processImages, audience, category })
      .catch((error) => console.error('Ingestion error:', error));

    res.json({
      success: true,
      message: `Ingestion started for ${sourceId}`,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to start ingestion',
    });
  }
});

router.post('/ingest-retailers', cronOrAdmin, ingestLimiter, async (req: Request, res: Response) => {
  try {
    const limit = req.body?.limit ? Number(req.body.limit) : 100;
    const processImages = Boolean(req.body?.processImages);
    const defaultSource = process.env.CRON_INGEST_SOURCE || 'demo-affiliate';
    const sources = Array.isArray(req.body?.sources) ? req.body.sources : [defaultSource];

    orchestrator
      .ingestEnabledRetailers({ limit, processImages, sources })
      .catch((error) => console.error('Retailer ingestion error:', error));

    res.json({
      success: true,
      message: `Catalog ingestion started (${sources.join(', ')})`,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to start retailer ingestion',
    });
  }
});

router.post('/seed-sources', authenticateToken, requireAdmin, async (_req: AuthRequest, res: Response) => {
  await orchestrator.ensureSeedSources();
  res.json({ success: true, message: 'Sources seeded' });
});

export default router;

import express, { Response } from 'express';
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

router.use(authenticateToken, requireAdmin, ingestLimiter);

router.get('/sources', async (_req: AuthRequest, res: Response) => {
  const sources = await Source.find().sort({ sourceId: 1 }).lean();
  res.json({ success: true, sources });
});

router.get('/runs', async (req: AuthRequest, res: Response) => {
  const sourceId = typeof req.query.sourceId === 'string' ? req.query.sourceId : undefined;
  const query = sourceId ? { sourceId } : {};
  const runs = await IngestionRun.find(query).sort({ startedAt: -1 }).limit(50).lean();
  res.json({ success: true, runs });
});

router.post('/ingest/:sourceId', async (req: AuthRequest, res: Response) => {
  try {
    const { sourceId } = req.params;
    if (!getSourceAdapter(sourceId)) {
      return res.status(400).json({ success: false, message: 'Unknown source adapter' });
    }

    const limit = req.body?.limit ? Number(req.body.limit) : undefined;
    const processImages = Boolean(req.body?.processImages);

    // Run in background for longer jobs
    orchestrator
      .ingestSource(sourceId, { limit, processImages })
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

router.post('/seed-sources', async (_req: AuthRequest, res: Response) => {
  await orchestrator.ensureSeedSources();
  res.json({ success: true, message: 'Sources seeded' });
});

export default router;

import express, { Response } from 'express';
import rateLimit from 'express-rate-limit';
import { authenticateToken, AuthRequest } from '../middleware/auth.middleware';
import { runVirtualTryOn, validateTryOnRequest } from '../services/try-on.service';

const router = express.Router();

// Generative try-on calls are expensive (provider cost + latency), so this is rate limited
// tighter than the general API limiter.
const tryOnLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 15,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Too many try-on requests. Please wait a few minutes and try again.' },
});

router.use(authenticateToken);
router.use(tryOnLimiter);

/**
 * POST /api/try-on
 * Body: { productId?, garmentImageUrl, humanImageBase64|humanImageUrl, category?, sizeHint? }
 *
 * Never logs full image payloads — only ids/metadata — to avoid leaking user photos into logs.
 */
router.post('/', async (req: AuthRequest, res: Response) => {
  const validation = validateTryOnRequest(req.body);
  if (!validation.valid) {
    return res.status(400).json({
      success: false,
      message: 'Invalid try-on request',
      errors: validation.errors,
    });
  }

  const { data } = validation;
  console.log(
    `[try-on] user=${req.userId} productId=${data.productId || 'n/a'} category=${data.category || 'n/a'} sizeHint=${data.sizeHint || 'n/a'}`
  );

  try {
    const result = await runVirtualTryOn(data);
    return res.json({
      success: true,
      mode: result.mode,
      provider: result.provider,
      resultImageUrl: result.resultImageUrl,
      category: result.category,
      sizeHint: result.sizeHint,
      message: result.message,
    });
  } catch (error: any) {
    const status = typeof error?.status === 'number' ? error.status : 500;
    console.error(`[try-on] generation failed (status ${status}):`, error?.message || 'unknown error');
    return res.status(status).json({
      success: false,
      message: error?.message || 'Try-on generation failed. Please try again.',
    });
  }
});

export default router;

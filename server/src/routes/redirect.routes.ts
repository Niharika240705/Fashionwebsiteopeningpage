import express, { Request, Response } from 'express';
import { createTrackedRedirect } from '../services/click-tracking.service';
import { optionalAuth, AuthRequest } from '../middleware/auth.middleware';

const router = express.Router();

/**
 * GET /api/r/:offerId
 * Validate offer, record click, 302 to affiliate destination.
 */
router.get('/:offerId', optionalAuth, async (req: AuthRequest, res: Response) => {
  try {
    const { clickId, redirectUrl } = await createTrackedRedirect({
      offerId: req.params.offerId,
      placement: typeof req.query.placement === 'string' ? req.query.placement : undefined,
      sessionId: typeof req.query.sid === 'string' ? req.query.sid : undefined,
      userId: req.userId,
    });

    res.setHeader('X-Click-Id', clickId);
    return res.redirect(302, redirectUrl);
  } catch (error: any) {
    const status = error.status || 500;
    return res.status(status).json({
      success: false,
      message: error.message || 'Redirect failed',
    });
  }
});

export default router;

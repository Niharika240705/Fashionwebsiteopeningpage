import express, { Response } from 'express';
import rateLimit from 'express-rate-limit';
import { optionalAuth, AuthRequest } from '../middleware/auth.middleware';
import { getAssistantResponse, AssistantHistoryTurn } from '../services/assistant.service';

const router = express.Router();

// Assistant calls can hit an LLM provider, so this is rate limited tighter
// than the general API limiter (and separate from /api/try-on's limiter).
const assistantLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 40,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Too many assistant requests. Please wait a few minutes and try again.' },
});

router.use(assistantLimiter);

function sanitizeHistory(input: unknown): AssistantHistoryTurn[] {
  if (!Array.isArray(input)) return [];
  return input
    .filter(
      (turn): turn is { role: string; content: string } =>
        Boolean(turn) && (turn.role === 'user' || turn.role === 'assistant') && typeof turn.content === 'string'
    )
    .slice(-6)
    .map((turn) => ({
      role: turn.role as 'user' | 'assistant',
      content: String(turn.content).slice(0, 1000),
    }));
}

/**
 * POST /api/assistant/chat
 * Body: { message: string, history?: Array<{ role: 'user'|'assistant', content: string }> }
 *
 * Works with or without OPENAI_API_KEY — see assistant.service.ts. Never
 * returns a raw error message to the client; always a friendly fallback.
 */
router.post('/chat', optionalAuth, async (req: AuthRequest, res: Response) => {
  const { message, history } = req.body || {};

  if (typeof message !== 'string' || !message.trim()) {
    return res.status(400).json({ success: false, message: 'A message is required.' });
  }
  if (message.length > 500) {
    return res.status(400).json({ success: false, message: 'Message is too long (max 500 characters).' });
  }

  try {
    const result = await getAssistantResponse(message.trim(), sanitizeHistory(history));
    res.json({ success: true, ...result });
  } catch (error: any) {
    console.error('[assistant] chat failed:', error?.message || error);
    res.json({
      success: true,
      reply: "I didn't quite catch that — could you rephrase, or try asking about dresses, try-on, or budget options?",
    });
  }
});

export default router;

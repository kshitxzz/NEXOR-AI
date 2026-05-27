import { Router } from 'express';
import { generateWithGemini } from '../services/gemini.js';
import { requireAuth } from '../middleware/auth.js';
import { checkUsageLimit } from '../middleware/usageLimit.js';
import { recordUsage } from '../db/supabaseDb.js';
import { VALID_TOOL_IDS } from '../prompts/templates.js';
import { isProActive } from '../utils/plan.js';

const router = Router();
const FREE_LIMIT = parseInt(process.env.FREE_DAILY_LIMIT || '5', 10);

const AI_ERROR_MESSAGES = {
  AI_NOT_CONFIGURED:
    'The AI service has not been configured yet. Please contact support.',
  AI_KEY_INVALID:
    'The AI service credentials are invalid. Please contact support.',
  AI_RATE_LIMITED:
    'The AI is receiving too many requests right now. Please wait a minute and try again.',
  AI_UNAVAILABLE:
    'Sorry for the inconvenience, but the AI is not working at this time. Please try again shortly.',
};

router.post('/', requireAuth, checkUsageLimit, async (req, res) => {
  try {
    const { toolId, input } = req.body;

    if (!toolId || !VALID_TOOL_IDS.includes(toolId)) {
      return res.status(400).json({
        error: 'Invalid toolId',
        message: 'The selected tool is not valid.',
      });
    }

    const output = await generateWithGemini(toolId, input);
    await recordUsage(req.userId, toolId);

    const dailyUsed = (req.dailyUsage ?? 0) + 1;
    const isPro = isProActive(req.user);

    res.json({
      success: true,
      output,
      toolId,
      usage: {
        plan: isPro ? 'pro' : 'free',
        dailyLimit: isPro ? null : FREE_LIMIT,
        dailyUsed: isPro ? null : dailyUsed,
        remaining: isPro ? null : Math.max(0, FREE_LIMIT - dailyUsed),
      },
    });
  } catch (err) {
    const code = err.message;
    const userMessage =
      AI_ERROR_MESSAGES[code] ||
      'Sorry for the inconvenience, but the AI is not working at this time. Please try again shortly.';

    console.error('[generate] Error:', err.message);

    res.status(500).json({
      error: 'Generation failed',
      message: userMessage,
    });
  }
});

export default router;
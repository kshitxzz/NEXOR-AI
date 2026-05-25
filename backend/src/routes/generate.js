import { Router } from 'express';
import { generateWithGemini } from '../services/gemini.js';
import { requireAuth } from '../middleware/auth.js';
import { checkUsageLimit } from '../middleware/usageLimit.js';
import { recordUsage } from '../db/supabaseDb.js';
import { VALID_TOOL_IDS } from '../prompts/templates.js';

const router = Router();
const FREE_LIMIT = parseInt(process.env.FREE_DAILY_LIMIT || '5', 10);

router.post('/', requireAuth, checkUsageLimit, async (req, res) => {
  try {
    const { toolId, input } = req.body;

    if (!toolId || !VALID_TOOL_IDS.includes(toolId)) {
      return res.status(400).json({
        error: 'Invalid toolId',
        validTools: VALID_TOOL_IDS,
      });
    }

    const output = await generateWithGemini(toolId, input);
    await recordUsage(req.userId, toolId);

    const dailyUsed = (req.dailyUsage ?? 0) + 1;
    const isPro =
      req.user.plan === 'pro' &&
      (!req.user.plan_expires_at || new Date(req.user.plan_expires_at) > new Date());

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
    console.error('Generate error:', err.message);
    res.status(500).json({
      error: 'Generation failed',
      message: err.message || 'Unable to generate response. Please try again.',
    });
  }
});

export default router;

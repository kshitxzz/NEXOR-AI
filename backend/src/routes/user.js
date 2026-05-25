import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import { getDailyUsageCount } from '../db/supabaseDb.js';

const router = Router();
const FREE_LIMIT = parseInt(process.env.FREE_DAILY_LIMIT || '5', 10);

router.get('/plan', requireAuth, async (req, res) => {
  try {
    const user = req.user;
    const dailyUsed = await getDailyUsageCount(req.userId);
    const isPro = user.plan === 'pro';
    let proActive = isPro;
    if (isPro && user.plan_expires_at) {
      proActive = new Date(user.plan_expires_at) > new Date();
    }

    res.json({
      plan: proActive ? 'pro' : 'free',
      planExpiresAt: user.plan_expires_at,
      email: user.email,
      dailyLimit: proActive ? null : FREE_LIMIT,
      dailyUsed,
      remaining: proActive ? null : Math.max(0, FREE_LIMIT - dailyUsed),
    });
  } catch (err) {
    console.error('Plan error:', err.message);
    res.status(500).json({ error: 'Failed to fetch plan' });
  }
});

export default router;

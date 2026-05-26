import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import { getDailyUsageCount } from '../db/supabaseDb.js';
import { isProActive, isSubscriptionLapsed } from '../utils/plan.js';

const router = Router();
const FREE_LIMIT = parseInt(process.env.FREE_DAILY_LIMIT || '5', 10);

router.get('/plan', requireAuth, async (req, res) => {
  try {
    const user = req.user;
    const dailyUsed = await getDailyUsageCount(req.userId);
    const proActive = isProActive(user);
    const lapsed = isSubscriptionLapsed(user);

    res.json({
      plan: proActive ? 'pro' : 'free',
      planExpiresAt: user.plan_expires_at,
      subscriptionLapsed: lapsed,
      email: user.email,
      dailyLimit: proActive ? null : lapsed ? 0 : FREE_LIMIT,
      dailyUsed: proActive ? 0 : dailyUsed,
      remaining: proActive ? null : lapsed ? 0 : Math.max(0, FREE_LIMIT - dailyUsed),
    });
  } catch (err) {
    console.error('Plan error:', err.message);
    res.status(500).json({ error: 'Failed to fetch plan' });
  }
});

export default router;

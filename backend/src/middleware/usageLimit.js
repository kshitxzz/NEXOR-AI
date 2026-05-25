import { getDailyUsageCount } from '../db/supabaseDb.js';

const FREE_LIMIT = parseInt(process.env.FREE_DAILY_LIMIT || '5', 10);

export async function checkUsageLimit(req, res, next) {
  const user = req.user;
  const userId = req.userId;

  if (!userId || !user) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  if (user.plan === 'pro') {
    const expires = user.plan_expires_at ? new Date(user.plan_expires_at) : null;
    if (!expires || expires > new Date()) {
      return next();
    }
  }

  try {
    const count = await getDailyUsageCount(userId);
    if (count >= FREE_LIMIT) {
      return res.status(429).json({
        error: 'Daily limit reached',
        message: `Free plan allows ${FREE_LIMIT} generations per day. Upgrade to Pro for unlimited access.`,
        limit: FREE_LIMIT,
        used: count,
        upgrade: true,
      });
    }

    req.dailyUsage = count;
    next();
  } catch (err) {
    console.error('Usage limit error:', err.message);
    res.status(500).json({ error: 'Failed to check usage limit' });
  }
}

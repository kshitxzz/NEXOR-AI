import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import {
  getDailyUsageCount,
  updateProfile,
  getLastPaidOrder,
  deleteUserAccount,
} from '../db/supabaseDb.js';
import { isProActive, isSubscriptionLapsed } from '../utils/plan.js';
import { parseUserAgent, maskIp } from '../utils/userAgent.js';

const router = Router();
const FREE_LIMIT = parseInt(process.env.FREE_DAILY_LIMIT || '5', 10);

function buildPlanPayload(user, dailyUsed) {
  const proActive = isProActive(user);
  const lapsed = isSubscriptionLapsed(user);

  let status = 'free';
  if (proActive) status = 'active';
  else if (lapsed) status = 'expired';

  return {
    plan: proActive ? 'pro' : 'free',
    planExpiresAt: user.plan_expires_at,
    subscriptionLapsed: lapsed,
    status,
    email: user.email,
    dailyLimit: proActive ? null : lapsed ? 0 : FREE_LIMIT,
    dailyUsed: proActive ? 0 : dailyUsed,
    remaining: proActive ? null : lapsed ? 0 : Math.max(0, FREE_LIMIT - dailyUsed),
  };
}

router.get('/plan', requireAuth, async (req, res) => {
  try {
    const dailyUsed = await getDailyUsageCount(req.userId);
    res.json(buildPlanPayload(req.user, dailyUsed));
  } catch (err) {
    console.error('Plan error:', err.message);
    res.status(500).json({ error: 'Failed to fetch plan' });
  }
});

router.get('/profile', requireAuth, async (req, res) => {
  try {
    const user = req.user;
    res.json({
      id: user.id,
      email: user.email || req.authUser.email,
      fullName: user.full_name || '',
      displayName: user.display_name || '',
      avatarUrl: user.avatar_url || '',
      createdAt: user.created_at,
    });
  } catch (err) {
    console.error('Profile error:', err.message);
    res.status(500).json({ error: 'Failed to fetch profile' });
  }
});

router.patch('/profile', requireAuth, async (req, res) => {
  try {
    const { fullName, displayName, avatarUrl } = req.body;
    const updates = {};

    if (fullName !== undefined) {
      updates.full_name = typeof fullName === 'string' ? fullName.trim().slice(0, 120) : '';
    }
    if (displayName !== undefined) {
      updates.display_name = typeof displayName === 'string' ? displayName.trim().slice(0, 60) : '';
    }
    if (avatarUrl !== undefined) {
      const url = typeof avatarUrl === 'string' ? avatarUrl.trim().slice(0, 500) : '';
      if (url && !/^https?:\/\//i.test(url)) {
        return res.status(400).json({ error: 'Avatar URL must start with http:// or https://' });
      }
      updates.avatar_url = url;
    }

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ error: 'No valid fields to update' });
    }

    const profile = await updateProfile(req.userId, updates);
    res.json({
      success: true,
      fullName: profile.full_name || '',
      displayName: profile.display_name || '',
      avatarUrl: profile.avatar_url || '',
    });
  } catch (err) {
    console.error('Update profile error:', err.message);
    res.status(500).json({ error: 'Failed to update profile' });
  }
});

router.get('/billing', requireAuth, async (req, res) => {
  try {
    const user = req.user;
    const dailyUsed = await getDailyUsageCount(req.userId);
    const planInfo = buildPlanPayload(user, dailyUsed);
    const lastOrder = await getLastPaidOrder(req.userId);

    const proActive = planInfo.plan === 'pro';
    let planStartedAt = null;
    if (lastOrder?.created_at && proActive) {
      planStartedAt = lastOrder.created_at;
    } else if (proActive && user.plan_expires_at && lastOrder?.plan_type) {
      const expires = new Date(user.plan_expires_at).getTime();
      const days = lastOrder.plan_type === 'pro_monthly' ? 30 : 365;
      planStartedAt = new Date(expires - days * 24 * 60 * 60 * 1000).toISOString();
    }

    res.json({
      ...planInfo,
      planType: lastOrder?.plan_type || null,
      planLabel:
        lastOrder?.plan_type === 'pro_monthly'
          ? 'Pro Monthly'
          : lastOrder?.plan_type === 'pro_yearly'
            ? 'Pro Annual'
            : proActive
              ? 'Pro'
              : planInfo.subscriptionLapsed
                ? 'Pro (expired)'
                : 'Free',
      planStartedAt,
      memberSince: user.created_at,
    });
  } catch (err) {
    console.error('Billing error:', err.message);
    res.status(500).json({ error: 'Failed to fetch billing' });
  }
});

router.get('/sessions', requireAuth, async (req, res) => {
  try {
    const ua = req.headers['user-agent'] || '';
    const forwarded = req.headers['x-forwarded-for'];
    const ip = (typeof forwarded === 'string' ? forwarded.split(',')[0] : null) || req.ip;

    res.json({
      sessions: [
        {
          id: 'current',
          current: true,
          device: parseUserAgent(ua),
          ip: maskIp(ip),
          lastActive: new Date().toISOString(),
          signedInAt: req.authUser.last_sign_in_at || req.authUser.created_at,
        },
      ],
    });
  } catch (err) {
    console.error('Sessions error:', err.message);
    res.status(500).json({ error: 'Failed to fetch sessions' });
  }
});

router.delete('/account', requireAuth, async (req, res) => {
  try {
    const { confirm } = req.body;
    if (confirm !== 'DELETE') {
      return res.status(400).json({
        error: 'Confirmation required',
        message: 'Type DELETE to confirm account deletion.',
      });
    }

    await deleteUserAccount(req.userId);
    res.json({ success: true, message: 'Account deleted successfully' });
  } catch (err) {
    console.error('Delete account error:', err.message);
    res.status(500).json({ error: 'Failed to delete account', message: err.message });
  }
});

export default router;

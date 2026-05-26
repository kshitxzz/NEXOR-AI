const MS_PER_DAY = 24 * 60 * 60 * 1000;

/** Pro is active only while plan is pro and expiry (if set) is in the future. */
export function isProActive(profile) {
  if (!profile || profile.plan !== 'pro') return false;
  if (!profile.plan_expires_at) return true;
  return new Date(profile.plan_expires_at) > new Date();
}

/** Former Pro whose paid period ended — must renew (not the same as never-subscribed free). */
export function isSubscriptionLapsed(profile) {
  if (!profile || profile.plan !== 'free') return false;
  if (!profile.plan_expires_at) return false;
  return new Date(profile.plan_expires_at) <= new Date();
}

export function computePlanExpiresAt(planType, currentExpiresAt = null) {
  const now = Date.now();
  const baseMs =
    currentExpiresAt && new Date(currentExpiresAt).getTime() > now
      ? new Date(currentExpiresAt).getTime()
      : now;

  const days = planType === 'pro_monthly' ? 30 : 365;
  return new Date(baseMs + days * MS_PER_DAY).toISOString();
}

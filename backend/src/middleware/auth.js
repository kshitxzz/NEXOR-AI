import { isSupabaseConfigured, verifyAccessToken } from '../services/supabase.js';
import { getOrCreateProfile } from '../db/supabaseDb.js';

export async function requireAuth(req, res, next) {
  if (!isSupabaseConfigured()) {
    return res.status(503).json({
      error: 'Authentication unavailable',
      message: 'Supabase is not configured on the server.',
    });
  }

  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) {
    return res.status(401).json({
      error: 'Unauthorized',
      message: 'Please log in to continue.',
    });
  }

  const token = header.slice(7).trim();
  const user = await verifyAccessToken(token);

  if (!user) {
    return res.status(401).json({
      error: 'Unauthorized',
      message: 'Session expired. Please log in again.',
    });
  }

  try {
    const profile = await getOrCreateProfile(user.id, user.email);
    req.authUser = user;
    req.userId = user.id;
    req.user = profile;
    next();
  } catch (err) {
    console.error('Profile error:', err.message);
    res.status(500).json({ error: 'Failed to load user profile' });
  }
}

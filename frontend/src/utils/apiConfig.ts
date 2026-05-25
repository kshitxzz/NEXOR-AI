/** Production Render API — used if VITE_API_URL was not set at Vercel build time */
const PRODUCTION_API_DEFAULT = 'https://nexorai-lpnx.onrender.com';

export function getApiBaseUrl(): string {
  const fromEnv = (import.meta.env.VITE_API_URL || '').trim().replace(/\/$/, '');
  if (fromEnv) return fromEnv;
  if (import.meta.env.PROD) return PRODUCTION_API_DEFAULT;
  return '';
}

/** In dev, Vite proxies `/api`. In production, VITE_API_URL must point to your backend. */
export function isApiConfigured(): boolean {
  return Boolean(getApiBaseUrl()) || !import.meta.env.PROD;
}

export function resolveApiUrl(path: string): string {
  const base = getApiBaseUrl();
  return base ? `${base}${path}` : path;
}

export const API_NOT_CONFIGURED_MSG =
  'Backend API is not connected. In Vercel add VITE_API_URL=https://nexorai-lpnx.onrender.com then click Deployments → Redeploy (required after env changes).';

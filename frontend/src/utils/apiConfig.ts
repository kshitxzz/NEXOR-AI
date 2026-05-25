export function getApiBaseUrl(): string {
  return (import.meta.env.VITE_API_URL || '').trim().replace(/\/$/, '');
}

/** In dev, Vite proxies `/api`. In production, VITE_API_URL must point to your backend. */
export function isApiConfigured(): boolean {
  if (getApiBaseUrl()) return true;
  return !import.meta.env.PROD;
}

export function resolveApiUrl(path: string): string {
  const base = getApiBaseUrl();
  return base ? `${base}${path}` : path;
}

export const API_NOT_CONFIGURED_MSG =
  'Backend API is not connected. Add VITE_API_URL in Vercel (your Render/Railway API URL) and redeploy.';

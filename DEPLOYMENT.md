# NexorAI Deployment Checklist

## Google sign-in error? (Not a backend issue)

Errors like:
- `{"error":"requested path is invalid"}`
- `site url is improperly formatted`

mean **Supabase URL Configuration is wrong**. Fix this first:

### Supabase → Authentication → URL Configuration

| Field | Correct value |
|-------|----------------|
| **Site URL** | `https://nexorai-app.vercel.app` |
| **Redirect URLs** | `https://nexorai-app.vercel.app/auth/callback` |

**Wrong (causes your error):**
- `nexorai-app.vercel.app` (missing `https://`)
- `https://nexorai-app.vercel.app/` (avoid trailing slash on Site URL if issues persist)

Also add for local dev:
- `http://localhost:5173/auth/callback`

Click **Save**, wait 1 minute, try Google sign-in again.

---

## Vercel (frontend)

| Variable | Value |
|----------|--------|
| `VITE_SUPABASE_URL` | `https://iikukfpxtrrvnqotraqq.supabase.co` |
| `VITE_SUPABASE_ANON_KEY` | your anon key |
| `VITE_SITE_URL` | `https://nexorai-app.vercel.app` |
| `VITE_API_URL` | `https://nexorai-lpnx.onrender.com` |

Redeploy after changing env vars.

---

## Render (backend)

Your API: `https://nexorai-lpnx.onrender.com/api/health` should return `{"status":"ok",...}`

| Variable | Value |
|----------|--------|
| `NODE_ENV` | `production` |
| `FRONTEND_URL` | `https://nexorai-app.vercel.app` |
| `BACKEND_URL` | `https://nexorai-lpnx.onrender.com` |
| `GEMINI_API_KEY` | your key |
| `SUPABASE_URL` | your Supabase URL |
| `SUPABASE_SERVICE_ROLE_KEY` | service role key |
| Cashfree vars | sandbox or production keys |

**Start command:** `npm start`  
**Root directory:** `backend`

---

## Verify everything

1. Backend: open `https://nexorai-lpnx.onrender.com/api/health`
2. Frontend: open `https://nexorai-app.vercel.app`
3. Google login: should return to `/auth/callback` on Vercel, not `supabase.co/nexorai-app.vercel.app`

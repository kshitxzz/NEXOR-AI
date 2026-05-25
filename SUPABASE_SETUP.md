# Supabase Setup for NexorAI

## 1. Create a Supabase project

1. Go to [https://supabase.com](https://supabase.com) and create a project.
2. Wait for the database to finish provisioning.

## 2. Run the database schema

1. Open **SQL Editor** in your Supabase dashboard.
2. Copy the contents of `supabase/schema.sql` and run it.
3. This creates `profiles`, `usage_logs`, `orders`, and auto-creates a profile on signup.

## 3. Configure Auth

### Email login
1. Go to **Authentication → Providers → Email**.
2. Enable Email provider.
3. For development, you can disable **Confirm email** under Email settings (optional).

### Google login
1. Go to **Authentication → Providers → Google**.
2. Enable the Google provider.
3. In [Google Cloud Console](https://console.cloud.google.com/), create OAuth 2.0 credentials:
   - Application type: **Web application**
   - **Authorized JavaScript origins:** `http://localhost:5173` (add your production URL later)
   - **Authorized redirect URIs:** copy the **Callback URL** shown in Supabase (looks like `https://xxxxx.supabase.co/auth/v1/callback`)
4. Paste the Google **Client ID** and **Client Secret** into Supabase Google provider settings and save.

### Redirect URLs (required for Google)

Go to **Authentication → URL Configuration**.

**Important:** Every URL must start with `https://` (or `http://` for local dev).  
If you enter `nexorai-app.vercel.app` without `https://`, Google login will fail with `{"error":"requested path is invalid"}` and redirect to `supabase.co/nexorai-app.vercel.app`.

**Local development:**
- **Site URL:** `http://localhost:5173`
- **Redirect URLs:** `http://localhost:5173/auth/callback`

**Production (Vercel):**
- **Site URL:** `https://nexorai-app.vercel.app` (your real Vercel URL)
- **Redirect URLs:** add these exactly:
  - `https://nexorai-app.vercel.app/auth/callback`
  - `https://nexorai-app.vercel.app/**` (optional wildcard)

In **Vercel → Environment Variables**, also set:
- `VITE_SITE_URL` = `https://nexorai-app.vercel.app` (same as Site URL, no trailing slash)

## 4. Get API keys

From **Project Settings → API**:

| Key | Where to use |
|-----|----------------|
| Project URL | `SUPABASE_URL` (backend) + `VITE_SUPABASE_URL` (frontend) |
| `anon` `public` | `VITE_SUPABASE_ANON_KEY` (frontend only) |
| `service_role` `secret` | `SUPABASE_SERVICE_ROLE_KEY` (backend only — never expose in frontend) |

## 5. Environment variables

**backend/.env**
```env
SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...
```

**frontend/.env**
```env
VITE_SUPABASE_URL=https://xxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGc...
```

## 6. Restart servers

```powershell
cd backend
npm run dev

cd frontend
npm run dev
```

## How it works

- Users **sign up / log in** with email + password or **Google** (Supabase Auth).
- Each user gets a unique UUID tied to their account.
- **Plans**, **usage**, and **orders** are stored in Supabase per user ID.
- Premium payments upgrade only the logged-in user's profile — no mixing between users.

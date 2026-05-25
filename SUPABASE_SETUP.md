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
Go to **Authentication → URL Configuration** and set:
- **Site URL:** `http://localhost:5173`
- **Redirect URLs:** add `http://localhost:5173/auth/callback`

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

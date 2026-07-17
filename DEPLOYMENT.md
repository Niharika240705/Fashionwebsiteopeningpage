# Production Deployment

Stack: **Vercel** (frontend) + **Render** (backend) + **MongoDB Atlas** + **Supabase Storage**.

Repository: `https://github.com/Niharika240705/Fashionwebsiteopeningpage.git`

## 1. MongoDB Atlas

1. Create a free/shared cluster.
2. Create a database user and allow your Render outbound IPs (or `0.0.0.0/0` for MVP).
3. Copy the connection string into Render as `MONGODB_URI`.

## 2. Supabase Storage

1. Create a project and a public bucket named `processed-images` (or set `SUPABASE_BUCKET`).
2. Use the **service role** key on Render only (`SUPABASE_SERVICE_ROLE_KEY`).
3. Keep the anon key out of the backend upload path.
4. Set `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` on Render.

## 3. Render backend

Option A — Blueprint:

```bash
# From the Render dashboard: New > Blueprint > connect this repo
# Uses render.yaml
```

Option B — Manual web service:

- Root directory: `server`
- Build: `npm ci && npm run build`
- Start: `npm start`
- Health check: `/api/health`
- Node: 20+

Required env vars:

| Key | Notes |
|-----|-------|
| `NODE_ENV` | `production` |
| `MONGODB_URI` | Atlas URI |
| `JWT_SECRET` | 32+ random chars |
| `REFRESH_TOKEN_SECRET` | 32+ random chars |
| `SESSION_SECRET` | 32+ random chars |
| `FRONTEND_URL` | Primary Vercel URL |
| `FRONTEND_URLS` | Optional comma-separated preview URLs |
| `BACKEND_URL` | Public Render URL |
| `ADMIN_EMAILS` | Comma-separated emails promoted to admin |
| `SUPABASE_URL` / `SUPABASE_SERVICE_ROLE_KEY` | Image uploads |
| `AUTO_INGEST_DEMO` | `false` in production |
| `ENABLE_SCHEDULED_SCRAPING` | Prefer `false`; use Render Cron |
| `ENABLE_MYNTRA_SCRAPE` | Keep `false` until permitted + worker |

Optional Google OAuth:

- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`
- `GOOGLE_CALLBACK_URL=https://<render-host>/api/auth/google/callback`
- Register that callback in Google Cloud Console.

After deploy, open `https://<render-host>/api/health` — expect `{ "status": "ok", "mongo": true }`.

Seed demo catalog (admin cookie/session or temporary script):

```bash
# From a trusted machine with production MONGODB_URI
cd server
AUTO_INGEST_DEMO=false npm run ingest:demo
```

Or call `POST /api/admin/ingestion/ingest/demo-affiliate` while logged in as an admin email.

## 4. Vercel frontend

1. Import the GitHub repo into Vercel.
2. Framework: Vite
3. Install: `npm ci`
4. Build: `npm run build`
5. Output: `dist`
6. `vercel.json` already rewrites SPA routes to `/index.html`.

Environment variables:

| Key | Value |
|-----|-------|
| `VITE_API_URL` | `https://<render-host>/api` |
| `VITE_SITE_URL` | `https://<your-vercel-domain>` |

Redeploy after setting env vars (Vite bakes them at build time).

## 5. Connect frontend ↔ backend

1. Set Render `FRONTEND_URL` / `FRONTEND_URLS` to your Vercel domain(s).
2. Auth uses httpOnly cookies with `SameSite=None; Secure` in production, so HTTPS on both sides is required.
3. Browser calls use `credentials: 'include'`.

## 6. Admin access

Set `ADMIN_EMAILS=you@example.com` on Render. That email is promoted to `role=admin` on next login/register. Use it for:

- `GET /api/monitoring/catalog`
- `POST /api/admin/ingestion/*`

## 7. Cron sync

`render.yaml` defines an 8-hour cron job. Prefer a secured admin token flow or disable cron until you wire `CRON_ADMIN_TOKEN`. Keep `ENABLE_SCHEDULED_SCRAPING=false` on the web dyno for multi-instance safety.

## 8. Post-deploy checklist

- [ ] `/api/health` returns mongo ready
- [ ] Frontend loads home + `/women/dresses`
- [ ] Register/login sets cookies (Application → Cookies)
- [ ] Google OAuth (if enabled) returns to `/?auth=success` without tokens in the URL
- [ ] Product CTA opens tracked `/api/r/:offerId` redirect
- [ ] `/privacy` and `/terms` render
- [ ] Monitoring endpoint requires admin auth
- [ ] Update `robots.txt` / `sitemap.xml` / OG URLs to your real custom domain when ready

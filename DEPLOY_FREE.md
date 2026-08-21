# Free Deploy — Vercel (Frontend) + Render (Backend) + Neon (DB)

## 1. Database — Neon (free 0.5GB)

1. Go https://neon.tech → Create Project `straycare` (Postgres 16)
2. Copy `DATABASE_URL` (pooled): `postgresql://user:pass@ep-xxx.neon.tech/neondb?sslmode=require`
3. Locally run migrations once:
   ```
   cd straycare-backend
   DATABASE_URL="<neon-url>" npx prisma migrate deploy
   ```
   Or let Render run it on boot (Dockerfile already does `prisma migrate deploy`).

## 2. Backend — Render Free (Docker)

1. Push this repo to GitHub
2. Render → New → Web Service → Connect repo → `Docker` runtime
   - Dockerfile: `straycare-backend/Dockerfile`
   - Context: `straycare-backend`
   - Plan: Free
   - Health check: `/`
3. Env vars in Render Dashboard:
   ```
   NODE_ENV=production
   PORT=10000
   DATABASE_URL=<neon-url>
   FIREBASE_PROJECT_ID=straycare-dev
   FIREBASE_SERVICE_ACCOUNT_JSON=<paste full content of firebase-service-account.json minified>
   # OR FIREBASE_SERVICE_ACCOUNT_BASE64=<base64 of json>
   CORS_ORIGINS=https://<your-vercel-url>.vercel.app,http://localhost:5173
   ```
   Get `FIREBASE_SERVICE_ACCOUNT_JSON`: `cat straycare-backend/firebase-service-account.json | jq -c .`
   (or `cat file | base64 -w 0` for BASE64 variant — avoids JSON escaping issues)

4. Deploy → note URL: `https://straycare-backend.onrender.com`
   - Test: `curl https://xxx.onrender.com/`

> Free tier sleeps after 15m idle → first request ~30s cold start. Add UptimeRobot ping every 10m to keep warm.

## 3. Frontend — Vercel Hobby (free)

1. Vercel → Add New Project → Import GitHub repo
   - Framework: Vite
   - Root Directory: `.` (repo root, `straycare-web/`)
   - Build: `npm run build`  Output: `dist`
2. Env vars in Vercel:
   ```
   VITE_API_URL=https://straycare-backend.onrender.com
   VITE_FIREBASE_API_KEY=AIzaSyCsViNjgPJyMZ5C64nN7CSggy65CaZFq8A
   VITE_FIREBASE_AUTH_DOMAIN=straycare-dev.firebaseapp.com
   VITE_FIREBASE_PROJECT_ID=straycare-dev
   VITE_FIREBASE_STORAGE_BUCKET=straycare-dev.firebasestorage.app
   VITE_FIREBASE_MESSAGING_SENDER_ID=167700736671
   VITE_FIREBASE_APP_ID=1:167700736671:web:673db620ad99e9802390aa
   ```
3. Deploy → done at `https://straycare-web.vercel.app`

`vercel.json` already handles SPA fallback (`/index.html`).

## 4. Post-deploy

- Update `CORS_ORIGINS` on Render to exact Vercel URL and redeploy.
- In Firebase Console → Auth → Authorized domains → add `straycare-web.vercel.app` + `xxx.onrender.com`
- Verify: Login → Create post → Check Neon data.

## Files changed for free deploy

- `straycare-backend/src/firebase/firebase.service.ts` → accepts `FIREBASE_SERVICE_ACCOUNT_JSON` / `_BASE64` (no file needed)
- `straycare-backend/Dockerfile` → runs `prisma migrate deploy` on boot
- `render.yaml` → Blueprint for Render
- `vercel.json` → SPA rewrite

## Alternative free DBs
- Supabase (500MB), Railway (trial $5), Aiven free.

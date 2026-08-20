# StrayCare - Demo Laptop Setup Guide (Docker)

This guide gets the full StrayCare stack (PostgreSQL + API + web app) running on
any laptop in one command. No Node.js, no PostgreSQL, no manual config.

## What you need

- **Docker Desktop** — https://www.docker.com/products/docker-desktop/
  - Windows: enable the bundled **WSL 2** backend during install.
  - macOS: plain Docker Desktop is enough.
- **Git** — https://git-scm.com/downloads
- ~10 GB free disk space (first build downloads images + npm packages).
- The two secrets (see step 3) — ask the project lead to share them.

First build takes 5–15 minutes; every later start is under a minute.

---

## 1. Install prerequisites

Install Docker Desktop, start it, and wait until the whale icon shows
"Engine running". Install Git if not present.

## 2. Get the code

```bash
git clone https://github.com/SDP-3-Group-4/straycare-web.git
cd straycare-web
```

## 3. Add the two secret files

Both are kept out of Git on purpose. Ask the project lead for them and drop
them into these locations:

| File | Where it goes | What it is |
|---|---|---|
| `straycare-backend/.env` | copy from `straycare-backend/.env.example`, then paste in the values | Backend env vars (Firebase project, NIM config) |
| `straycare-backend/firebase-service-account.json` | same folder | Firebase Admin SDK private key (JSON) |

```bash
# Windows
copy straycare-backend\.env.example straycare-backend\.env
# then open straycare-backend\.env and fill replace-me values, and place firebase-service-account.json
```

If the app will use the AI Vet, `NIM_API_KEY` needs the real key — otherwise a
placeholder is fine (AI features stay off).

## 4. Build and start the stack

```bash
docker compose up -d --build
```

Wait for the health checks (first run only, ~1 minute):

```bash
docker compose ps
```

All three services should show `healthy`/`Up`.

## 5. Initialize the database (first run only)

```bash
docker compose run --rm backend npx prisma db push
```

## 6. Open the app

- Web app: **http://localhost:8080**
- API: http://localhost:3000

Register with any email. **You must click the verification link in the email
Firebase sends before you can use the app** (accounts are verification-gated).

---

## Day-to-day

```bash
docker compose up -d        # start (after a reboot)
docker compose down         # stop (keeps your data)
docker compose down -v      # stop AND wipe the database (fresh start)
docker compose ps           # status
docker compose logs -f backend   # backend logs
```

## Port conflicts?

If something else already uses ports 3000 or 8080, re-map them:

```bash
# edit docker-compose.yml and change e.g. the frontend line from
#   "8080:80"   to   "8081:80"
# then rebuild nothing - just:  docker compose up -d
```

## Troubleshooting

| Symptom | Fix |
|---|---|
| `env_file ... not found` | Run step 3 — `straycare-backend/.env` is missing |
| Backend crashes with `service-account.json` errors | `firebase-service-account.json` not in `straycare-backend/` |
| Backend crashes with `relation "public.User" does not exist` | Run step 5 (`prisma db push`) |
| `Error response from daemon` / WSL errors | Restart Docker Desktop (or `wsl --shutdown` on Windows) |
| Nothing loads on :8080 | `docker compose up -d` again — frontend waits for a healthy backend |

## How it maps

```
Browser -> http://localhost:8080 (nginx in a container)
               |   calls http://localhost:3000 (NestJS API in a container)
               v
          PostgreSQL 15 (inside Docker, private network)
Real auth via Firebase (straycare-dev project) - no local auth setup needed.
```
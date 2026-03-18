# UPath Deployment Guide

Deploys the full stack (React frontend, ASP.NET Core API, PostgreSQL) to a single Linux server using Docker Compose, with Nginx as a reverse proxy and Let's Encrypt for HTTPS.

**Production URL:** https://upath.tannernielson.com
**Server IP:** 5.78.107.18

---

## Architecture

```
Internet
   │
   ▼
Nginx (ports 80/443)  ← reverse proxy + SSL termination
   ├─ /api/*  →  ASP.NET Core backend (internal port 4000)
   └─ /*      →  Nginx serving React SPA (internal port 80)
                     │
                     └─ PostgreSQL (internal port 5432, never exposed)
```

All services run in Docker containers on the `internal` bridge network. Only Nginx is exposed to the internet.

---

## Prerequisites

On the server (`5.78.107.18`):

- Docker Engine 24+
- Docker Compose v2 (`docker compose` not `docker-compose`)
- Ports 80 and 443 open in the firewall

```bash
# Install Docker on Ubuntu/Debian
curl -fsSL https://get.docker.com | sh
sudo usermod -aG docker $USER
newgrp docker
```

### DNS

Add an **A record** in your DNS provider for `tannernielson.com`:

| Type | Name    | Value        |
|------|---------|--------------|
| A    | upath   | 5.78.107.18  |

Wait for DNS propagation (usually a few minutes) before requesting the SSL certificate.

---

## First-Time Deployment

### 1. Push code to GitHub and clone on the server

```bash
# On the server
git clone https://github.com/ryanabaldwin/UPath.git
cd UPath
```

### 2. Create the `.env` file

```bash
cp .env.example .env
nano .env   # or vim .env
```

Fill in:
```
DB_USER=upath
DB_PASSWORD=<a strong random password>
VITE_API_BASE_URL=https://upath.tannernielson.com
```

### 3. Edit the SSL bootstrap script

Open `init-letsencrypt.sh` and change the `EMAIL` variable to your real email address (required for Let's Encrypt cert expiry notifications):

```bash
EMAIL="your-email@example.com"
```

### 4. Make the script executable and run it

```bash
chmod +x init-letsencrypt.sh
./init-letsencrypt.sh
```

This script:
1. Downloads recommended TLS parameters from Let's Encrypt
2. Creates a temporary self-signed cert so Nginx can start
3. Starts Nginx
4. Requests a real certificate via the ACME HTTP-01 challenge
5. Reloads Nginx with the real cert

> **Tip:** To test without hitting Let's Encrypt rate limits, set `STAGING=1` in `init-letsencrypt.sh` first, verify it works, then set it back to `0` and re-run.

### 5. Start the full stack

```bash
docker compose up -d --build
```

This builds and starts:
- `db` — PostgreSQL (initializes schema + seed data on first run)
- `backend` — ASP.NET Core API
- `frontend` — React SPA built by Vite, served by Nginx
- `nginx` — reverse proxy
- `certbot` — watches for cert renewals every 12 hours

### 6. Verify

```bash
# All containers running?
docker compose ps

# API health check
curl https://upath.tannernielson.com/api/health

# View backend logs
docker compose logs backend

# View nginx logs
docker compose logs nginx
```

---

## Updating the App

```bash
# On the server
cd UPath
git pull
docker compose up -d --build
```

Only the changed images are rebuilt. The database volume is preserved.

---

## Database

The database is initialized automatically on the first `docker compose up` from `backend/db/docker-init/01-init.sql`. This file contains the full schema, all migrations, and seed data in a single idempotent script.

**The data persists** in the `postgres_data` Docker volume across restarts and redeployments.

To connect to the database manually:

```bash
docker compose exec db psql -U upath -d upath_db
```

To reset the database completely (⚠️ deletes all data):

```bash
docker compose down -v   # -v removes volumes
docker compose up -d --build
```

---

## SSL / Certificates

Certificates are stored in `nginx/certbot/conf/` on the server (not committed to git).

The `certbot` container automatically renews certs every 12 hours when they are within 30 days of expiry. Nginx reloads automatically pick up renewed certs on the next check.

To manually force renewal:

```bash
docker compose run --rm certbot renew --force-renewal
docker compose exec nginx nginx -s reload
```

---

## Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `DB_USER` | No | `upath` | PostgreSQL username |
| `DB_PASSWORD` | **Yes** | — | PostgreSQL password |
| `VITE_API_BASE_URL` | No | `https://upath.tannernielson.com` | API base URL baked into the frontend build |

---

## Logs and Troubleshooting

```bash
# Stream all logs
docker compose logs -f

# Individual service
docker compose logs -f backend
docker compose logs -f nginx
docker compose logs -f db

# Restart a single service
docker compose restart backend

# Rebuild a single service
docker compose up -d --build backend
```

### Common issues

**Nginx 502 Bad Gateway**
The backend or frontend container isn't healthy yet. Check `docker compose ps` and `docker compose logs backend`.

**Database connection refused**
The backend starts before PostgreSQL is ready. Docker Compose's `healthcheck` on the `db` service prevents this, but if it happens: `docker compose restart backend`.

**SSL certificate not found**
Run `./init-letsencrypt.sh` again. Make sure DNS for `upath.tannernielson.com` resolves to `5.78.107.18` before running it.

**Frontend shows blank page / 404 on refresh**
The SPA nginx config (`frontend/nginx.conf`) serves `index.html` for all routes. If this stops working, rebuild the frontend image: `docker compose up -d --build frontend`.

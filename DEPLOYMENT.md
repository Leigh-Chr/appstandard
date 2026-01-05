# Deployment Guide - AppStandard

This guide describes the steps to deploy all AppStandard products in production.

## Architecture Overview

AppStandard is a multi-product monorepo containing:
- **AppStandard Landing** - Main landing page (appstandard.io)
- **AppStandard Calendar** - ICS calendar management (production-ready)
- **AppStandard Tasks** - Todo/task management (in development)
- **AppStandard Contacts** - vCard contact management (in development)

### Domain Structure

| App | Frontend URL | API URL | Internal Ports |
|-----|--------------|---------|----------------|
| Landing | appstandard.io | - | 3010 → 8080 |
| Calendar | calendar.appstandard.io | api.appstandard.io | 3001 → 8080, 3000 |
| Tasks | tasks.appstandard.io | api-tasks.appstandard.io | 3004 → 8080, 3002 |
| Contacts | contacts.appstandard.io | api-contacts.appstandard.io | 3005 → 8080, 3003 |

### Infrastructure

| Component | Container Name | Image | Port |
|-----------|----------------|-------|------|
| PostgreSQL | appstandard-db | postgres:16-alpine | 5432 |
| Redis | appstandard-redis | redis:7-alpine | 6379 |
| Landing | appstandard-landing | nginx-unprivileged | 3010 |
| Calendar Backend | appstandard-calendar-server | bun:alpine | 3000 |
| Calendar Frontend | appstandard-calendar-web | nginx-unprivileged | 3001 |
| Tasks Backend | appstandard-tasks-server | bun:alpine | 3002 |
| Tasks Frontend | appstandard-tasks-web | nginx-unprivileged | 3004 |
| Contacts Backend | appstandard-contacts-server | bun:alpine | 3003 |
| Contacts Frontend | appstandard-contacts-web | nginx-unprivileged | 3005 |

## Prerequisites

- Docker and Docker Compose
- Domain name configured (appstandard.io with subdomains)
- SSL/TLS certificate (Let's Encrypt recommended)
- Nginx or Caddy for reverse proxy

## Quick Start

### 1. Configure Environment Variables

```bash
# Copy example configuration
cp deploy/.env.example .env

# Edit with your values
nano .env
```

### 2. Build and Deploy All Services

```bash
# Build and start everything
DOCKER_BUILDKIT=1 docker compose up -d --build

# Verify all services are healthy
docker compose ps
```

### 3. Configure Reverse Proxy (Nginx)

See the [Nginx Configuration](#nginx-reverse-proxy) section below.

## Environment Variables

### Full Configuration (`.env`)

```env
# ===================================
# Database (PostgreSQL)
# ===================================
POSTGRES_USER=appstandard
POSTGRES_PASSWORD=your-secure-password-here
POSTGRES_DB=appstandard
POSTGRES_PORT=5432

# ===================================
# Redis (Rate Limiting)
# ===================================
REDIS_PASSWORD=your-redis-password-here
REDIS_PORT=6379

# ===================================
# Authentication (shared across all apps)
# ===================================
# Generate: openssl rand -base64 32
BETTER_AUTH_SECRET=your-32-char-minimum-secret-here

# ===================================
# Email Configuration
# ===================================
RESEND_API_KEY=re_xxxxxxxxxxxxx
EMAIL_FROM=AppStandard <noreply@appstandard.io>

# ===================================
# Sentry (Error Tracking - optional)
# ===================================
SENTRY_DSN=
VITE_SENTRY_DSN=

# ===================================
# Landing Page (appstandard.io)
# ===================================
LANDING_PORT=3010

# ===================================
# Calendar (calendar.appstandard.io)
# ===================================
CALENDAR_API_URL=https://api.appstandard.io
CALENDAR_CORS_ORIGIN=https://calendar.appstandard.io
CALENDAR_SERVER_PORT=3000
CALENDAR_WEB_PORT=3001

# ===================================
# Tasks (tasks.appstandard.io)
# ===================================
TASKS_API_URL=https://api-tasks.appstandard.io
TASKS_CORS_ORIGIN=https://tasks.appstandard.io
TASKS_SERVER_PORT=3002
TASKS_WEB_PORT=3004

# ===================================
# Contacts (contacts.appstandard.io)
# ===================================
CONTACTS_API_URL=https://api-contacts.appstandard.io
CONTACTS_CORS_ORIGIN=https://contacts.appstandard.io
CONTACTS_SERVER_PORT=3003
CONTACTS_WEB_PORT=3005

# ===================================
# Environment
# ===================================
NODE_ENV=production
```

### Docker Secrets Support

AppStandard supports Docker secrets for sensitive configuration:

```yaml
services:
  calendar-server:
    secrets:
      - better_auth_secret
      - resend_api_key
secrets:
  better_auth_secret:
    file: ./secrets/better_auth_secret.txt
  resend_api_key:
    file: ./secrets/resend_api_key.txt
```

## Docker Compose Services

### Deploy All Apps
```bash
docker compose up -d --build
```

### Deploy Specific Apps

```bash
# Only Calendar
docker compose up -d db redis calendar-server calendar-web

# Only Landing + Calendar
docker compose up -d landing db redis calendar-server calendar-web

# All apps
docker compose up -d --build
```

### Useful Commands

```bash
# View logs
docker compose logs -f                    # All services
docker compose logs -f calendar-server    # Specific service

# Restart service
docker compose restart calendar-server

# Rebuild specific service
docker compose up -d --build calendar-web

# Database backup
docker compose exec db pg_dump -U appstandard appstandard > backup_$(date +%Y%m%d).sql

# Database restore
docker compose exec -T db psql -U appstandard appstandard < backup.sql

# Shell access
docker compose exec calendar-server sh
docker compose exec db psql -U appstandard -d appstandard
```

## Nginx Reverse Proxy

### Full Configuration

```nginx
# ===================================
# Upstream definitions
# ===================================
upstream landing {
    server 127.0.0.1:3010;
}

upstream calendar_web {
    server 127.0.0.1:3001;
}

upstream calendar_api {
    server 127.0.0.1:3000;
}

upstream tasks_web {
    server 127.0.0.1:3004;
}

upstream tasks_api {
    server 127.0.0.1:3002;
}

upstream contacts_web {
    server 127.0.0.1:3005;
}

upstream contacts_api {
    server 127.0.0.1:3003;
}

# ===================================
# Landing Page - appstandard.io
# ===================================
server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name appstandard.io www.appstandard.io;

    ssl_certificate /etc/letsencrypt/live/appstandard.io/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/appstandard.io/privkey.pem;
    include /etc/letsencrypt/options-ssl-nginx.conf;
    ssl_dhparam /etc/letsencrypt/ssl-dhparams.pem;

    location / {
        proxy_pass http://landing;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}

# ===================================
# Calendar Frontend - calendar.appstandard.io
# ===================================
server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name calendar.appstandard.io;

    ssl_certificate /etc/letsencrypt/live/appstandard.io/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/appstandard.io/privkey.pem;
    include /etc/letsencrypt/options-ssl-nginx.conf;
    ssl_dhparam /etc/letsencrypt/ssl-dhparams.pem;

    location / {
        proxy_pass http://calendar_web;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}

# ===================================
# Calendar API - api.appstandard.io
# ===================================
server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name api.appstandard.io;

    ssl_certificate /etc/letsencrypt/live/appstandard.io/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/appstandard.io/privkey.pem;
    include /etc/letsencrypt/options-ssl-nginx.conf;
    ssl_dhparam /etc/letsencrypt/ssl-dhparams.pem;

    location / {
        proxy_pass http://calendar_api;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_cache_bypass $http_upgrade;
    }
}

# ===================================
# Tasks Frontend - tasks.appstandard.io
# ===================================
server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name tasks.appstandard.io;

    ssl_certificate /etc/letsencrypt/live/appstandard.io/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/appstandard.io/privkey.pem;
    include /etc/letsencrypt/options-ssl-nginx.conf;
    ssl_dhparam /etc/letsencrypt/ssl-dhparams.pem;

    location / {
        proxy_pass http://tasks_web;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}

# ===================================
# Tasks API - api-tasks.appstandard.io
# ===================================
server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name api-tasks.appstandard.io;

    ssl_certificate /etc/letsencrypt/live/appstandard.io/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/appstandard.io/privkey.pem;
    include /etc/letsencrypt/options-ssl-nginx.conf;
    ssl_dhparam /etc/letsencrypt/ssl-dhparams.pem;

    location / {
        proxy_pass http://tasks_api;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_cache_bypass $http_upgrade;
    }
}

# ===================================
# Contacts Frontend - contacts.appstandard.io
# ===================================
server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name contacts.appstandard.io;

    ssl_certificate /etc/letsencrypt/live/appstandard.io/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/appstandard.io/privkey.pem;
    include /etc/letsencrypt/options-ssl-nginx.conf;
    ssl_dhparam /etc/letsencrypt/ssl-dhparams.pem;

    location / {
        proxy_pass http://contacts_web;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}

# ===================================
# Contacts API - api-contacts.appstandard.io
# ===================================
server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name api-contacts.appstandard.io;

    ssl_certificate /etc/letsencrypt/live/appstandard.io/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/appstandard.io/privkey.pem;
    include /etc/letsencrypt/options-ssl-nginx.conf;
    ssl_dhparam /etc/letsencrypt/ssl-dhparams.pem;

    location / {
        proxy_pass http://contacts_api;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_cache_bypass $http_upgrade;
    }
}

# ===================================
# HTTP to HTTPS redirect
# ===================================
server {
    listen 80;
    listen [::]:80;
    server_name appstandard.io www.appstandard.io
                calendar.appstandard.io api.appstandard.io
                tasks.appstandard.io api-tasks.appstandard.io
                contacts.appstandard.io api-contacts.appstandard.io;

    location /.well-known/acme-challenge/ {
        root /var/www/certbot;
    }

    location / {
        return 301 https://$host$request_uri;
    }
}
```

## SSL Certificate Setup

### Initial Setup with Let's Encrypt

```bash
# Install certbot
apt install certbot python3-certbot-nginx

# Get wildcard certificate for all subdomains
certbot certonly --nginx \
  -d appstandard.io \
  -d www.appstandard.io \
  -d calendar.appstandard.io \
  -d api.appstandard.io \
  -d tasks.appstandard.io \
  -d api-tasks.appstandard.io \
  -d contacts.appstandard.io \
  -d api-contacts.appstandard.io
```

### Auto-renewal

```bash
# Test renewal
certbot renew --dry-run

# Renewal is automatic via systemd timer
systemctl status certbot.timer
```

## DNS Configuration

Configure these DNS records for appstandard.io:

| Type | Name | Value |
|------|------|-------|
| A | @ | YOUR_VPS_IP |
| A | www | YOUR_VPS_IP |
| A | calendar | YOUR_VPS_IP |
| A | api | YOUR_VPS_IP |
| A | tasks | YOUR_VPS_IP |
| A | api-tasks | YOUR_VPS_IP |
| A | contacts | YOUR_VPS_IP |
| A | api-contacts | YOUR_VPS_IP |

## Updating Production

```bash
# 1. SSH to VPS
ssh root@YOUR_VPS_IP

# 2. Navigate to project
cd /root/appstandard

# 3. Backup database
docker compose exec db pg_dump -U appstandard appstandard > backup_$(date +%Y%m%d_%H%M%S).sql

# 4. Pull latest code
git pull origin master

# 5. Rebuild and restart
DOCKER_BUILDKIT=1 docker compose up -d --build

# 6. Verify health
docker compose ps
curl https://api.appstandard.io/health
```

## Troubleshooting

### Bun Lockfile Frozen Error

If Docker build fails with:
```
error: lockfile had changes, but lockfile is frozen
```

**Solution**: Ensure all Dockerfiles include every workspace `package.json`:
- All `packages/*`
- All `packages/appstandard-contacts/*`
- All `packages/appstandard-tasks/*`
- All `apps/*`

### CSP Errors in Browser Console

Check that nginx.conf and index.html have matching CSP headers with the correct API domain.

### Service Health Check Failing

```bash
# Check service logs
docker compose logs calendar-server

# Verify database connection
docker compose exec calendar-server curl localhost:3000/health
```

## Security

### Active Protections

- Rate limiting (Redis-backed, with in-memory fallback)
- SSRF protection for external imports
- Content Security Policy (CSP) headers
- HTTP security headers (HSTS, X-Frame-Options, etc.)
- Input validation with Zod
- High entropy anonymous IDs (192 bits)
- Docker security: no-new-privileges, read-only filesystems

### Secret Rotation

| Secret | Frequency | Method |
|--------|-----------|--------|
| `BETTER_AUTH_SECRET` | 6 months | `openssl rand -base64 32` |
| `POSTGRES_PASSWORD` | 6 months | Update `.env` and redeploy |
| `REDIS_PASSWORD` | 6 months | Update `.env` and redeploy |

## Monitoring

### Health Endpoints

| App | Endpoint |
|-----|----------|
| Calendar API | `https://api.appstandard.io/health` |
| Tasks API | `https://api-tasks.appstandard.io/health` |
| Contacts API | `https://api-contacts.appstandard.io/health` |
| Landing | `https://appstandard.io/nginx-health` |

### Sentry Integration

Configure `SENTRY_DSN` and `VITE_SENTRY_DSN` for error tracking.

## See Also

- [README.md](README.md) - Overview and quick start
- [ARCHITECTURE.md](ARCHITECTURE.md) - Package architecture
- [CONTRIBUTING.md](CONTRIBUTING.md) - Contribution guide
- [SECURITY.md](SECURITY.md) - Security policy

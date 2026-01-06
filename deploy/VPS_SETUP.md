# VPS Setup for appstandard.io

Quick setup guide for deploying AppStandard to your VPS (185.158.132.190).

## Prerequisites: System Configuration

### 1.1 Configure Swap (Required - 4GB minimum)

Without swap, Docker builds will crash the server when memory is exhausted.

```bash
# Create 4GB swap file
fallocate -l 4G /swapfile
chmod 600 /swapfile
mkswap /swapfile
swapon /swapfile

# Make persistent
echo '/swapfile none swap sw 0 0' >> /etc/fstab

# Set swappiness to 10 (prefer RAM, use swap only when needed)
echo 'vm.swappiness=10' >> /etc/sysctl.conf
sysctl -p

# Verify
free -h
```

### 1.2 Configure Docker BuildKit (Recommended)

Limit build parallelism to prevent memory exhaustion:

```bash
# Docker daemon config
mkdir -p /etc/docker
cat > /etc/docker/daemon.json << 'EOF'
{
  "features": { "buildkit": true },
  "builder": { "gc": { "enabled": true, "defaultKeepStorage": "10GB" } },
  "max-concurrent-downloads": 3,
  "max-concurrent-uploads": 3
}
EOF

# BuildKit parallelism limit
mkdir -p ~/.docker/buildx
cat > ~/.docker/buildx/buildkitd.default.toml << 'EOF'
[worker.oci]
  max-parallelism = 2
EOF

systemctl restart docker
```

## 1. DNS Configuration (at your registrar)

Add these A records pointing to `185.158.132.190`:

```
@              → 185.158.132.190
www            → 185.158.132.190
calendar       → 185.158.132.190
api            → 185.158.132.190
tasks          → 185.158.132.190
api-tasks      → 185.158.132.190
contacts       → 185.158.132.190
api-contacts   → 185.158.132.190
```

## 2. SSH to VPS and Update Code

```bash
ssh root@185.158.132.190
cd /root/appstandard  # or wherever your project is

# Backup database first
docker compose exec db pg_dump -U appstandard appstandard > backup_$(date +%Y%m%d_%H%M%S).sql

# Pull latest code
git pull origin master
```

## 3. Update Environment Variables

Edit `.env` file:

```bash
nano .env
```

Add/update these variables:

```env
# Landing
LANDING_PORT=3010

# Calendar
CALENDAR_API_URL=https://api.appstandard.io
CALENDAR_CORS_ORIGIN=https://calendar.appstandard.io
CALENDAR_SERVER_PORT=3000
CALENDAR_WEB_PORT=3001

# Tasks
TASKS_API_URL=https://api-tasks.appstandard.io
TASKS_CORS_ORIGIN=https://tasks.appstandard.io
TASKS_SERVER_PORT=3002
TASKS_WEB_PORT=3004

# Contacts
CONTACTS_API_URL=https://api-contacts.appstandard.io
CONTACTS_CORS_ORIGIN=https://contacts.appstandard.io
CONTACTS_SERVER_PORT=3003
CONTACTS_WEB_PORT=3005
```

## 4. Get SSL Certificates

```bash
# Stop nginx temporarily if running
systemctl stop nginx

# Get certificates for all domains
certbot certonly --standalone \
  -d appstandard.io \
  -d www.appstandard.io \
  -d calendar.appstandard.io \
  -d api.appstandard.io \
  -d tasks.appstandard.io \
  -d api-tasks.appstandard.io \
  -d contacts.appstandard.io \
  -d api-contacts.appstandard.io
```

## 5. Configure Nginx

Create `/etc/nginx/sites-available/appstandard.io`:

```bash
nano /etc/nginx/sites-available/appstandard.io
```

Copy the nginx configuration from `DEPLOYMENT.md`.

Enable and restart:

```bash
ln -sf /etc/nginx/sites-available/appstandard.io /etc/nginx/sites-enabled/
nginx -t
systemctl start nginx
```

## 6. Deploy Containers

```bash
# Method 1: Sequential build (RECOMMENDED - memory safe)
# Build and start services one by one to avoid memory exhaustion
docker compose up -d db redis
sleep 10
docker compose up -d --build calendar-server
docker compose up -d --build tasks-server
docker compose up -d --build contacts-server
docker compose up -d --build landing
docker compose up -d --build calendar-web
docker compose up -d --build tasks-web
docker compose up -d --build contacts-web

# Method 2: Parallel build (requires 16GB+ RAM or swap configured)
# DOCKER_BUILDKIT=1 docker compose up -d --build

# Verify all containers are healthy
docker compose ps
```

> **Important**: The `deploy.resources.limits` in docker-compose.yml only work with Docker Swarm.
> For regular docker compose, memory limits are not enforced. Always ensure swap is configured.

## 7. Verify Deployment

```bash
# Check health endpoints
curl https://api.appstandard.io/health
curl https://appstandard.io/nginx-health

# Check logs
docker compose logs -f
```

## Quick Commands

```bash
# Rebuild single service
docker compose up -d --build calendar-web

# View logs
docker compose logs -f calendar-server

# Restart service
docker compose restart calendar-server

# Database backup
docker compose exec db pg_dump -U appstandard appstandard > backup.sql
```

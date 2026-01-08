# VPS Deployment Guide - AppStandard

> 📌 **First-time installation guide**: This document is for initial setup of a new VPS server.
> For daily production management, see [DEPLOYMENT.md](./DEPLOYMENT.md).

Complete step-by-step guide to deploy AppStandard on a VPS with Docker Compose.

**Estimated time**: 2-3 hours (first time)

---

## Step 1: Purchase and Prepare the VPS

### 1.1 Choose a VPS Provider

**Recommendations**:
- **Hetzner**: ~€4-5/month (2 vCPU, 4GB RAM) - Excellent value for money
- **DigitalOcean**: ~$6/month (1 vCPU, 1GB RAM) - Very popular
- **OVH**: ~€3-5/month - Budget-friendly
- **Scaleway**: ~€3-5/month - European

**Minimum specifications**:
- 2 vCPU
- 2 GB RAM (4 GB recommended)
- 20 GB SSD
- Ubuntu 22.04 LTS or Debian 12

### 1.2 Create the VPS

1. Create an account with the provider
2. Create an Ubuntu 22.04 LTS VPS
3. Note the public IP address
4. Note the root/SSH credentials

### 1.3 Configure Swap (Required - 4GB minimum)

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

### 1.4 Connect to the VPS

```bash
# From your local machine
ssh root@YOUR_VPS_IP

# Or if you created a user
ssh user@YOUR_VPS_IP
```

---

## Step 2: Initial Server Configuration

### 2.1 Update the System

```bash
# Update package list
apt update && apt upgrade -y

# Install basic tools
apt install -y curl wget git ufw
```

### 2.2 Create a Non-Root User (Recommended)

```bash
# Create a new user
adduser appstandard
usermod -aG sudo appstandard

# Connect with this new user
su - appstandard
```

### 2.3 Configure Firewall

```bash
# Allow SSH (IMPORTANT: do this before enabling the firewall)
ufw allow 22/tcp

# Allow HTTP and HTTPS
ufw allow 80/tcp
ufw allow 443/tcp

# Enable firewall
ufw enable

# Check status
ufw status
```

### 2.4 Install Docker

```bash
# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Add your user to the docker group
sudo usermod -aG docker $USER

# Restart session (or disconnect/reconnect)
newgrp docker

# Verify installation
docker --version
```

### 2.5 Install Docker Compose

```bash
# Install Docker Compose Plugin
sudo apt install -y docker-compose-plugin

# Verify installation
docker compose version
```

---

## Step 3: Prepare the Application

### 3.1 Transfer the Project to the VPS

**Option A: Clone from Git (if the repository is public or if you have SSH configured)**

```bash
cd ~
git clone https://github.com/YOUR_USERNAME/appstandard.git
cd appstandard
```

**Option B: Transfer with rsync (recommended if the repository is private)**

From your local machine:

```bash
cd /path/to/appstandard
rsync -avz \
  --exclude 'node_modules' \
  --exclude '.git' \
  --exclude '**/dist' \
  --exclude '**/*.db' \
  --exclude '.turbo' \
  --exclude 'turbod' \
  ./ root@YOUR_VPS_IP:~/appstandard/
```

Then on the VPS:

```bash
cd ~/appstandard
```

### 3.2 Configure Environment

```bash
# Copy the template
cp docker.env.example .env

# Edit the file
nano .env
```

> 📖 **Detailed configuration**: See [DEPLOYMENT.md](./DEPLOYMENT.md#environment-variables) for the complete list of environment variables.

**Essential variables to configure**:

```env
# Database
POSTGRES_PASSWORD=YOUR_SECURE_PASSWORD_HERE

# Backend
CORS_ORIGIN=https://calendar.appstandard.io
BETTER_AUTH_SECRET=YOUR_32_CHARACTER_SECRET_HERE
BETTER_AUTH_URL=https://api.appstandard.io

# Frontend
VITE_SERVER_URL=https://api.appstandard.io

# Email (optional but recommended)
RESEND_API_KEY=re_xxxxxxxxxxxxx
EMAIL_FROM=noreply@appstandard.io
```

### 3.3 Generate Secrets

```bash
cd ~/appstandard

# Generate BETTER_AUTH_SECRET
SECRET=$(openssl rand -base64 32)
sed -i "s|BETTER_AUTH_SECRET=.*|BETTER_AUTH_SECRET=$SECRET|" .env

# Generate POSTGRES_PASSWORD
DB_PASS=$(openssl rand -base64 16 | tr -d '=+/')
sed -i "s|POSTGRES_PASSWORD=.*|POSTGRES_PASSWORD=$DB_PASS|" .env

# Secure the file
chmod 600 .env
```

---

## Step 4: Start Services

> 📖 **Complete details**: See [DEPLOYMENT.md](./DEPLOYMENT.md#docker-compose-services) for the complete Docker deployment guide.

### 4.1 Start and Initialize

```bash
# Start PostgreSQL and Redis
docker compose up -d db redis

# Wait for PostgreSQL to be ready (check with: docker compose ps db)
# Then initialize the schema
docker compose run --rm -w /app/packages/db server sh -c 'bunx prisma db push'

# Start all services
DOCKER_BUILDKIT=1 docker compose up -d --build

# Verify everything works
docker compose ps
curl http://localhost:3000/health
```

---

## Step 5: Nginx and SSL Configuration

> 📖 **Detailed configuration**: See [DEPLOYMENT.md](./DEPLOYMENT.md#nginx-reverse-proxy) for complete Nginx configuration examples.

### 5.1 Install Nginx and Certbot

```bash
sudo apt install -y nginx certbot python3-certbot-nginx
```

### 5.2 Basic Configuration

Create `/etc/nginx/sites-available/appstandard`:

```nginx
server {
    listen 80;
    listen [::]:80;
    server_name calendar.appstandard.io;

    location / {
        proxy_pass http://localhost:3001;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

Enable and test:

```bash
sudo ln -s /etc/nginx/sites-available/appstandard /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t
sudo systemctl restart nginx
```

### 5.3 DNS Configuration

Add DNS records at your registrar:

```
Type    Name    Value              TTL
A       @       YOUR_VPS_IP        3600
A       www     YOUR_VPS_IP        3600
A       api     YOUR_VPS_IP        3600
```

### 5.4 Obtain SSL Certificates

```bash
# For all domains (recommended - single SAN certificate)
sudo certbot --nginx \
  -d appstandard.io \
  -d www.appstandard.io \
  -d calendar.appstandard.io \
  -d api.appstandard.io \
  -d tasks.appstandard.io \
  -d api-tasks.appstandard.io \
  -d contacts.appstandard.io \
  -d api-contacts.appstandard.io

# Verify automatic renewal
sudo certbot renew --dry-run
```

### 5.5 Update Environment Variables

```bash
cd ~/appstandard
nano .env
```

Update with your production URLs:

```env
CORS_ORIGIN=https://calendar.appstandard.io
BETTER_AUTH_URL=https://api.appstandard.io
VITE_SERVER_URL=https://api.appstandard.io
```

Restart services:

```bash
docker compose down
DOCKER_BUILDKIT=1 docker compose up -d --build
```

---

## Step 6: Final Verifications

```bash
# Check services
docker compose ps

# Test endpoints
curl https://api.appstandard.io/health
curl -I https://appstandard.io

# Check database
docker compose exec db psql -U appstandard -d appstandard -c "\dt"
```

**Test the application**:
1. Open https://appstandard.io in a browser
2. Check that there are no errors in the console (F12)
3. Test account creation

---

> 💡 **Next steps**:
> - **Docker commands**: See [DEPLOYMENT.md](./DEPLOYMENT.md) for detailed Docker commands
> - **Troubleshooting**: See [DEPLOYMENT.md](./DEPLOYMENT.md#troubleshooting) for troubleshooting

---

## Final Checklist

### Infrastructure
- [ ] VPS purchased and configured
- [ ] Non-root user created
- [ ] Firewall configured (ports 22, 80, 443)
- [ ] Docker installed
- [ ] Docker Compose installed

### Application
- [ ] Repository cloned on VPS
- [ ] `.env` file created and configured
- [ ] `POSTGRES_PASSWORD` changed (strong password)
- [ ] `BETTER_AUTH_SECRET` generated (32+ characters)
- [ ] Email variables configured (Resend or SMTP)
- [ ] Docker services started
- [ ] Database schema initialized (`db:push`)

### Web Infrastructure
- [ ] Nginx installed and configured
- [ ] DNS configured (A records for appstandard.io and all subdomains)
- [ ] SSL certificates obtained with Certbot
- [ ] Nginx restarts correctly

### Configuration
- [ ] `CORS_ORIGIN` = `https://calendar.appstandard.io`
- [ ] `BETTER_AUTH_URL` = `https://api.appstandard.io`
- [ ] `VITE_SERVER_URL` = `https://api.appstandard.io`
- [ ] Services redeployed after variable changes

### Verifications
- [ ] Landing accessible: `https://appstandard.io`
- [ ] Calendar accessible: `https://calendar.appstandard.io`
- [ ] Calendar API accessible: `https://api.appstandard.io/health`
- [ ] Tasks accessible: `https://tasks.appstandard.io`
- [ ] Tasks API accessible: `https://api-tasks.appstandard.io/health`
- [ ] Contacts accessible: `https://contacts.appstandard.io`
- [ ] Contacts API accessible: `https://api-contacts.appstandard.io/health`
- [ ] Database functional
- [ ] Logs without critical errors
- [ ] Authentication tested (account creation)

### Next Steps
- [ ] Production documentation reviewed: [DEPLOYMENT.md](./DEPLOYMENT.md)

---

## Summary

Your application is now deployed in production! 🎉

### Next steps

See [DEPLOYMENT.md](./DEPLOYMENT.md) for Docker commands and production management.

### Simple update

```bash
cd ~/appstandard
git pull origin master
docker compose up -d --build
```

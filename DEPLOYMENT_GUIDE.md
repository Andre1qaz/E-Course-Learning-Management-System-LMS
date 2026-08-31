# Panduan Deployment Produksi - E-Course LMS

## Table of Contents

1. [Overview](#overview)
2. [Prerequisites](#prerequisites)
3. [Environment Configuration](#environment-configuration)
4. [Infrastructure Deployment](#infrastructure-deployment)
5. [Backend Deployment](#backend-deployment)
6. [Frontend Deployment](#frontend-deployment)
7. [Database Migration & Seeding](#database-migration--seeding)
8. [Security Hardening](#security-hardening)
9. [Monitoring & Logging](#monitoring--logging)
10. [CI/CD Pipeline](#cicd-pipeline)
11. [Backup & Disaster Recovery](#backup--disaster-recovery)
12. [Scaling Strategy](#scaling-strategy)
13. [Troubleshooting](#troubleshooting)

---

## Overview

E-Course LMS adalah aplikasi full-stack yang terdiri dari:
- **Frontend**: Next.js 16 (App Router) + TypeScript + Tailwind CSS
- **Backend**: NestJS 11 + TypeScript + Prisma ORM
- **Database**: PostgreSQL 16
- **Cache**: Redis 7
- **Storage**: MinIO (S3-compatible)
- **Queue**: BullMQ (Redis-based)

### Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                     Load Balancer (Nginx)                    │
└──────────────────────┬──────────────────────────────────────┘
                       │
        ┌──────────────┴──────────────┐
        │                             │
┌───────▼────────┐          ┌────────▼────────┐
│   Frontend     │          │    Backend      │
│   (Next.js)    │◄─────────│   (NestJS)      │
│   Port: 3000   │  API     │   Port: 3001    │
└────────────────┘          └────────┬────────┘
                                     │
                    ┌────────────────┼────────────────┐
                    │                │                │
             ┌──────▼──────┐  ┌─────▼─────┐  ┌─────▼─────┐
             │ PostgreSQL  │  │   Redis   │  │   MinIO   │
             │   Port:5432 │  │  Port:6379│  │9000/9001  │
             └─────────────┘  └───────────┘  └───────────┘
```

---

## Prerequisites

### Software Requirements

- **Node.js**: v20+ (LTS recommended)
- **npm**: v10+ or **yarn** v1.22+ or **pnpm** v8+
- **Docker**: v24+ & Docker Compose v2+
- **Git**: v2.30+
- **PostgreSQL Client**: psql v16+ (for direct database access)
- **Nginx**: v1.24+ (for reverse proxy & load balancing)

### Hardware Requirements (Minimum)

- **CPU**: 2 cores
- **RAM**: 4 GB
- **Storage**: 20 GB SSD
- **Network**: 100 Mbps

### Hardware Requirements (Recommended for Production)

- **CPU**: 4+ cores
- **RAM**: 8+ GB
- **Storage**: 50+ GB SSD
- **Network**: 1 Gbps

### Cloud Provider Options

- **AWS**: EC2 + RDS PostgreSQL + ElastiCache Redis + S3/MinIO
- **Google Cloud**: Compute Engine + Cloud SQL + Memorystore + Cloud Storage
- **Azure**: Virtual Machines + Azure Database + Redis Cache + Blob Storage
- **DigitalOcean**: Droplets + Managed Databases + Managed Redis + Spaces
- **Vultr**: Cloud Servers + Managed Databases + Managed Redis + Object Storage

---

## Environment Configuration

### Production Environment Variables

#### Root `.env` (Infrastructure)

```env
# Database
DATABASE_URL="postgresql://ecourse:STRONG_PASSWORD@postgres:5432/ecourse_db?schema=public"

# Redis
REDIS_HOST=redis
REDIS_PORT=6379
REDIS_PASSWORD=STRONG_REDIS_PASSWORD

# MinIO (S3-compatible)
MINIO_ENDPOINT=minio
MINIO_PORT=9000
MINIO_ACCESS_KEY=STRONG_ACCESS_KEY
MINIO_SECRET_KEY=VERY_STRONG_SECRET_KEY_MIN_32_CHARS
MINIO_BUCKET_PUBLIC=ecourse-public
MINIO_BUCKET_PRIVATE=ecourse-private
MINIO_USE_SSL=true

# Backend
BACKEND_PORT=3001
JWT_SECRET=GENERATE_STRONG_RANDOM_SECRET_MIN_32_CHARS
JWT_EXPIRES_IN=7d
FRONTEND_URL=https://your-domain.com
NODE_ENV=production

# Frontend
NEXT_PUBLIC_API_URL=https://your-domain.com/api
NEXTAUTH_URL=https://your-domain.com
NEXTAUTH_SECRET=GENERATE_DIFFERENT_STRONG_SECRET_MIN_32_CHARS
```

#### Backend `.env` (backend/.env)

```env
DATABASE_URL="postgresql://ecourse:STRONG_PASSWORD@postgres:5432/ecourse_db?schema=public"
REDIS_HOST=redis
REDIS_PORT=6379
REDIS_PASSWORD=STRONG_REDIS_PASSWORD

MINIO_ENDPOINT=minio
MINIO_PORT=9000
MINIO_ACCESS_KEY=STRONG_ACCESS_KEY
MINIO_SECRET_KEY=VERY_STRONG_SECRET_KEY_MIN_32_CHARS
MINIO_BUCKET_PUBLIC=ecourse-public
MINIO_BUCKET_PRIVATE=ecourse-private
MINIO_USE_SSL=true

PORT=3001
JWT_SECRET=GENERATE_STRONG_RANDOM_SECRET_MIN_32_CHARS
JWT_EXPIRES_IN=7d
FRONTEND_URL=https://your-domain.com
NODE_ENV=production
```

#### Frontend `.env.local` (frontend/.env.local)

```env
NEXT_PUBLIC_API_URL=https://your-domain.com/api
NEXTAUTH_URL=https://your-domain.com
NEXTAUTH_SECRET=GENERATE_DIFFERENT_STRONG_SECRET_MIN_32_CHARS
NODE_ENV=production
```

### Generating Secure Secrets

```bash
# Generate JWT Secret
openssl rand -base64 32

# Generate NextAuth Secret
openssl rand -base64 32

# Generate MinIO Secret Key
openssl rand -base64 32

# Generate Redis Password
openssl rand -base64 24

# Generate Database Password
openssl rand -base64 24
```

---

## Infrastructure Deployment

### Option 1: Docker Compose (Single Server)

#### Production Docker Compose

Create `docker-compose.prod.yml`:

```yaml
services:
  postgres:
    image: postgres:16-alpine
    container_name: ecourse-postgres
    restart: unless-stopped
    environment:
      POSTGRES_USER: ecourse
      POSTGRES_PASSWORD: ${DB_PASSWORD}
      POSTGRES_DB: ecourse_db
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U ecourse -d ecourse_db"]
      interval: 10s
      timeout: 5s
      retries: 5
    networks:
      - ecourse-network

  redis:
    image: redis:7-alpine
    container_name: ecourse-redis
    restart: unless-stopped
    command: redis-server --requirepass ${REDIS_PASSWORD}
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data
    healthcheck:
      test: ["CMD", "redis-cli", "--raw", "incr", "ping"]
      interval: 10s
      timeout: 5s
      retries: 5
    networks:
      - ecourse-network

  minio:
    image: minio/minio:latest
    container_name: ecourse-minio
    restart: unless-stopped
    command: server /data --console-address ":9001" --address ":9000"
    environment:
      MINIO_ROOT_USER: ${MINIO_ACCESS_KEY}
      MINIO_ROOT_PASSWORD: ${MINIO_SECRET_KEY}
    ports:
      - "9000:9000"
      - "9001:9001"
    volumes:
      - minio_data:/data
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:9000/minio/health/live"]
      interval: 10s
      timeout: 5s
      retries: 5
    networks:
      - ecourse-network

  minio-init:
    image: minio/mc:latest
    container_name: ecourse-minio-init
    depends_on:
      minio:
        condition: service_healthy
    entrypoint: ["/bin/sh", "-c"]
    command:
      - >
        mc alias set local http://minio:9000 ${MINIO_ACCESS_KEY} ${MINIO_SECRET_KEY};
        mc mb local/ecourse-public --ignore-existing;
        mc mb local/ecourse-private --ignore-existing;
        mc anonymous set download local/ecourse-public;
        mc policy set download local/ecourse-public;
        exit 0;
    networks:
      - ecourse-network

volumes:
  postgres_data:
    driver: local
  redis_data:
    driver: local
  minio_data:
    driver: local

networks:
  ecourse-network:
    driver: bridge
```

#### Deploy Infrastructure

```bash
# Load environment variables
export $(cat .env | xargs)

# Start infrastructure
docker compose -f docker-compose.prod.yml up -d

# Verify services
docker compose -f docker-compose.prod.yml ps
```

### Option 2: Cloud Services (AWS Example)

#### PostgreSQL (RDS)

```bash
# Using AWS CLI
aws rds create-db-instance \
  --db-instance-identifier ecourse-db \
  --db-instance-class db.t3.medium \
  --engine postgres \
  --engine-version 16.1 \
  --allocated-storage 20 \
  --master-username ecourse \
  --master-user-password STRONG_PASSWORD \
  --vpc-security-group-ids sg-xxxxx \
  --db-subnet-group-name ecourse-subnet-group
```

#### Redis (ElastiCache)

```bash
aws elasticache create-replication-group \
  --replication-group-id ecourse-redis \
  --replication-group-description "E-Course Redis" \
  --cache-node-type cache.t3.medium \
  --engine redis \
  --engine-version 7.0 \
  --num-cache-clusters 1 \
  --automatic-failover-enabled \
  --security-group-ids sg-xxxxx
```

#### S3 Storage (Alternative to MinIO)

```bash
aws s3api create-bucket \
  --bucket ecourse-public \
  --region us-east-1

aws s3api create-bucket \
  --bucket ecourse-private \
  --region us-east-1

aws s3api put-bucket-cors \
  --bucket ecourse-public \
  --cors-configuration file://cors-config.json
```

---

## Backend Deployment

### Build for Production

```bash
cd backend

# Install dependencies
npm ci --production=false

# Generate Prisma client
npm run prisma:generate

# Build application
npm run build

# Verify build
ls -la dist/
```

### Production Dockerfile

Create `backend/Dockerfile.prod`:

```dockerfile
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY prisma ./prisma/

# Install dependencies
RUN npm ci

# Generate Prisma client
RUN npx prisma generate

# Copy source code
COPY . .

# Build application
RUN npm run build

# Production stage
FROM node:20-alpine AS production

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install production dependencies only
RUN npm ci --omit=dev

# Copy built application
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/prisma ./prisma

# Generate Prisma client in production
RUN npx prisma generate

# Expose port
EXPOSE 3001

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3001/api/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Start application
CMD ["node", "dist/main.js"]
```

### Build & Push Docker Image

```bash
cd backend

# Build image
docker build -f Dockerfile.prod -t ecourse-backend:latest .

# Tag for registry
docker tag ecourse-backend:latest your-registry/ecourse-backend:latest

# Push to registry
docker push your-registry/ecourse-backend:latest
```

### Run Backend Container

```bash
docker run -d \
  --name ecourse-backend \
  --network ecourse-network \
  -p 3001:3001 \
  --env-file .env \
  --restart unless-stopped \
  your-registry/ecourse-backend:latest
```

### PM2 Deployment (Alternative)

```bash
cd backend

# Install PM2 globally
npm install -g pm2

# Build application
npm run build

# Start with PM2
pm2 start dist/main.js --name ecourse-backend

# Configure PM2 for auto-restart
pm2 startup
pm2 save

# Monitor
pm2 monit
```

### Nginx Configuration for Backend

Create `/etc/nginx/sites-available/ecourse-backend`:

```nginx
upstream backend {
    server localhost:3001;
    keepalive 64;
}

server {
    listen 80;
    server_name api.your-domain.com;

    # Redirect to HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name api.your-domain.com;

    # SSL certificates
    ssl_certificate /etc/letsencrypt/live/api.your-domain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/api.your-domain.com/privkey.pem;

    # SSL configuration
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;

    # Backend proxy
    location /api {
        proxy_pass http://backend;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        
        # Timeouts
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }

    # Swagger docs (restrict in production)
    location /api/docs {
        proxy_pass http://backend;
        allow 1.2.3.4; # Your office IP
        deny all;
    }
}
```

---

## Frontend Deployment

### Build for Production

```bash
cd frontend

# Install dependencies
npm ci

# Build application
npm run build

# Verify build
ls -la .next/
```

### Production Dockerfile

Create `frontend/Dockerfile.prod`:

```dockerfile
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy source code
COPY . .

# Build application
RUN npm run build

# Production stage
FROM node:20-alpine AS production

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install production dependencies only
RUN npm ci --omit=dev

# Copy built application
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/next.config.ts ./

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Start application
CMD ["npm", "start"]
```

### Build & Push Docker Image

```bash
cd frontend

# Build image
docker build -f Dockerfile.prod -t ecourse-frontend:latest .

# Tag for registry
docker tag ecourse-frontend:latest your-registry/ecourse-frontend:latest

# Push to registry
docker push your-registry/ecourse-frontend:latest
```

### Run Frontend Container

```bash
docker run -d \
  --name ecourse-frontend \
  --network ecourse-network \
  -p 3000:3000 \
  --env-file .env.local \
  --restart unless-stopped \
  your-registry/ecourse-frontend:latest
```

### Vercel Deployment (Recommended for Next.js)

```bash
# Install Vercel CLI
npm install -g vercel

# Login to Vercel
vercel login

# Deploy
cd frontend
vercel --prod

# Set environment variables in Vercel dashboard
# NEXT_PUBLIC_API_URL=https://your-domain.com/api
# NEXTAUTH_URL=https://your-domain.com
# NEXTAUTH_SECRET=your-secret
```

### Nginx Configuration for Frontend

Create `/etc/nginx/sites-available/ecourse-frontend`:

```nginx
upstream frontend {
    server localhost:3000;
    keepalive 64;
}

server {
    listen 80;
    server_name your-domain.com www.your-domain.com;

    # Redirect to HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name your-domain.com www.your-domain.com;

    # SSL certificates
    ssl_certificate /etc/letsencrypt/live/your-domain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/your-domain.com/privkey.pem;

    # SSL configuration
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;

    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/xml text/javascript application/x-javascript application/xml+rss application/json;

    # Frontend proxy
    location / {
        proxy_pass http://frontend;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        
        # Timeouts
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }

    # Static files caching
    location /_next/static {
        proxy_pass http://frontend;
        proxy_cache_valid 200 365d;
        add_header Cache-Control "public, immutable";
    }

    # API proxy to backend
    location /api {
        proxy_pass http://backend;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

---

## Database Migration & Seeding

### Production Migration

```bash
cd backend

# Set NODE_ENV to production
export NODE_ENV=production

# Run migrations
npx prisma migrate deploy

# Generate Prisma client
npx prisma generate
```

### Production Seeding (Optional)

```bash
# For production, you may want to seed only initial data
# Modify prisma/seed.ts to exclude demo data

npx prisma db seed
```

### Database Backup

```bash
# Backup database
docker exec ecourse-postgres pg_dump -U ecourse ecourse_db > backup_$(date +%Y%m%d_%H%M%S).sql

# Restore database
cat backup_20240131_120000.sql | docker exec -i ecourse-postgres psql -U ecourse ecourse_db
```

### Automated Backup Script

Create `backup-db.sh`:

```bash
#!/bin/bash

# Configuration
DB_CONTAINER="ecourse-postgres"
DB_USER="ecourse"
DB_NAME="ecourse_db"
BACKUP_DIR="/backups/postgres"
RETENTION_DAYS=30

# Create backup directory
mkdir -p $BACKUP_DIR

# Backup filename with timestamp
BACKUP_FILE="$BACKUP_DIR/ecourse_db_$(date +%Y%m%d_%H%M%S).sql"

# Perform backup
docker exec -e PGPASSWORD=$DB_PASSWORD $DB_CONTAINER pg_dump -U $DB_USER $DB_NAME > $BACKUP_FILE

# Compress backup
gzip $BACKUP_FILE

# Remove old backups (older than RETENTION_DAYS)
find $BACKUP_DIR -name "ecourse_db_*.sql.gz" -mtime +$RETENTION_DAYS -delete

echo "Backup completed: $BACKUP_FILE.gz"
```

Add to crontab for daily backups:

```bash
# Run daily at 2 AM
0 2 * * * /path/to/backup-db.sh >> /var/log/db-backup.log 2>&1
```

---

## Security Hardening

### SSL/TLS Configuration

```bash
# Install Certbot
sudo apt update
sudo apt install certbot python3-certbot-nginx

# Obtain SSL certificate
sudo certbot --nginx -d your-domain.com -d www.your-domain.com

# Auto-renewal (already configured by Certbot)
sudo certbot renew --dry-run
```

### Firewall Configuration

```bash
# UFW (Ubuntu/Debian)
sudo ufw allow 22/tcp    # SSH
sudo ufw allow 80/tcp    # HTTP
sudo ufw allow 443/tcp   # HTTPS
sudo ufw enable

# Or iptables rules
sudo iptables -A INPUT -p tcp --dport 22 -j ACCEPT
sudo iptables -A INPUT -p tcp --dport 80 -j ACCEPT
sudo iptables -A INPUT -p tcp --dport 443 -j ACCEPT
sudo iptables -A INPUT -j DROP
```

### Security Headers

Add to Nginx configuration:

```nginx
# Security headers
add_header X-Frame-Options "SAMEORIGIN" always;
add_header X-Content-Type-Options "nosniff" always;
add_header X-XSS-Protection "1; mode=block" always;
add_header Referrer-Policy "strict-origin-when-cross-origin" always;
add_header Permissions-Policy "geolocation=(), microphone=(), camera=()" always;
add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;

# Remove server version
server_tokens off;
```

### Rate Limiting

Add to Nginx configuration:

```nginx
# Rate limiting zone
limit_req_zone $binary_remote_addr zone=api_limit:10m rate=10r/s;
limit_req_zone $binary_remote_addr zone=auth_limit:10m rate=5r/m;

# Apply to API endpoints
location /api/auth {
    limit_req zone=auth_limit burst=5 nodelay;
    proxy_pass http://backend;
}

location /api {
    limit_req zone=api_limit burst=20 nodelay;
    proxy_pass http://backend;
}
```

### Database Security

```sql
-- Create read-only user for reporting
CREATE USER ecourse_readonly WITH PASSWORD 'strong_password';
GRANT CONNECT ON DATABASE ecourse_db TO ecourse_readonly;
GRANT USAGE ON SCHEMA public TO ecourse_readonly;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO ecourse_readonly;

-- Revoke unnecessary permissions
REVOKE CREATE ON SCHEMA public FROM public;
```

### Environment Variable Security

```bash
# Set proper permissions
chmod 600 .env
chmod 600 backend/.env
chmod 600 frontend/.env.local

# Never commit .env files
echo ".env" >> .gitignore
echo "backend/.env" >> .gitignore
echo "frontend/.env.local" >> .gitignore
```

---

## Monitoring & Logging

### Application Monitoring (Sentry)

```bash
# Install Sentry SDK
cd backend
npm install @sentry/node @sentry/tracing

# Configure in main.ts
import * as Sentry from "@sentry/node";
import { ProfilingIntegration } from "@sentry/profiling-node";

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  integrations: [
    new ProfilingIntegration(),
  ],
  traces样本Rate: 1.0,
  profiles样本Rate: 1.0,
});
```

### Log Management

Create `backend/src/common/logger/logger.ts`:

```typescript
import { Injectable, LoggerService } from '@nestjs/common';
import * as winston from 'winston';

@Injectable()
export class AppLogger implements LoggerService {
  private logger: winston.Logger;

  constructor() {
    this.logger = winston.createLogger({
      level: process.env.LOG_LEVEL || 'info',
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.errors({ stack: true }),
        winston.format.json(),
      ),
      transports: [
        new winston.transports.Console(),
        new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
        new winston.transports.File({ filename: 'logs/combined.log' }),
      ],
    });
  }

  log(message: string, context?: string) {
    this.logger.info(message, { context });
  }

  error(message: string, trace?: string, context?: string) {
    this.logger.error(message, { trace, context });
  }

  warn(message: string, context?: string) {
    this.logger.warn(message, { context });
  }

  debug(message: string, context?: string) {
    this.logger.debug(message, { context });
  }

  verbose(message: string, context?: string) {
    this.logger.verbose(message, { context });
  }
}
```

### Health Check Endpoints

Add to `backend/src/app.controller.ts`:

```typescript
@Get('health')
healthCheck() {
  return {
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV,
  };
}

@Get('health/db')
async databaseHealth() {
  try {
    await this.prisma.$queryRaw`SELECT 1`;
    return { status: 'ok', database: 'connected' };
  } catch (error) {
    return { status: 'error', database: 'disconnected' };
  }
}
```

### Uptime Monitoring

Use services like:
- **UptimeRobot** (free)
- **Pingdom** (paid)
- **StatusCake** (free tier available)
- **Better Uptime** (free)

Monitor endpoints:
- `https://your-domain.com` (frontend)
- `https://api.your-domain.com/api/health` (backend)
- `https://api.your-domain.com/api/health/db` (database)

---

## CI/CD Pipeline

### GitHub Actions Example

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy to Production

on:
  push:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'

      - name: Install dependencies (Backend)
        run: |
          cd backend
          npm ci

      - name: Install dependencies (Frontend)
        run: |
          cd frontend
          npm ci

      - name: Run tests (Backend)
        run: |
          cd backend
          npm run test

      - name: Run tests (Frontend)
        run: |
          cd frontend
          npm run test

  build-and-deploy:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'

      - name: Build Backend
        run: |
          cd backend
          npm ci
          npm run prisma:generate
          npm run build

      - name: Build Frontend
        run: |
          cd frontend
          npm ci
          npm run build

      - name: Deploy to Server
        uses: appleboy/ssh-action@master
        with:
          host: ${{ secrets.SERVER_HOST }}
          username: ${{ secrets.SERVER_USER }}
          key: ${{ secrets.SSH_PRIVATE_KEY }}
          script: |
            cd /var/www/ecourse-lms
            git pull origin main
            docker compose -f docker-compose.prod.yml up -d --build
            docker image prune -f
```

### GitLab CI Example

Create `.gitlab-ci.yml`:

```yaml
stages:
  - test
  - build
  - deploy

test:
  stage: test
  script:
    - cd backend && npm ci && npm run test
    - cd frontend && npm ci && npm run test

build:
  stage: build
  script:
    - cd backend && npm ci && npm run build
    - cd frontend && npm ci && npm run build
  artifacts:
    paths:
      - backend/dist
      - frontend/.next

deploy:
  stage: deploy
  only:
    - main
  script:
    - ssh $SERVER_USER@$SERVER_HOST "cd /var/www/ecourse-lms && git pull && docker compose up -d --build"
```

---

## Backup & Disaster Recovery

### Backup Strategy

#### Database Backups

```bash
# Daily backups
0 2 * * * /path/to/backup-db.sh

# Weekly full backup
0 3 * * 0 /path/to/backup-db-full.sh
```

#### File Storage Backups (MinIO)

```bash
# Backup MinIO data
docker exec ecourse-minio mc mirror /data /backup/minio/$(date +%Y%m%d)

# Sync to remote storage (optional)
docker exec ecourse-minio mc mirror /data s3/backup-bucket/ecourse/
```

#### Application Code Backups

```bash
# Git repository is your backup
# Ensure regular pushes to remote
git push origin main
```

### Disaster Recovery Plan

#### Scenario 1: Database Corruption

```bash
# Stop application
docker compose stop backend frontend

# Restore from latest backup
cat backup_20240131_120000.sql | docker exec -i ecourse-postgres psql -U ecourse ecourse_db

# Restart application
docker compose start backend frontend
```

#### Scenario 2: Server Failure

1. **Provision new server**
2. **Install Docker & dependencies**
3. **Clone repository**
4. **Restore database from backup**
5. **Restore MinIO data from backup**
6. **Update DNS to point to new server**
7. **Verify all services**

#### Scenario 3: Data Loss

```bash
# Point-in-time recovery (if WAL archiving enabled)
# Configure PostgreSQL for PITI in postgresql.conf:
wal_level = replica
archive_mode = on
archive_command = 'cp %p /var/lib/postgresql/archive/%f'
```

---

## Scaling Strategy

### Horizontal Scaling

#### Load Balancer Configuration

```nginx
upstream backend {
    least_conn;
    server backend1:3001 weight=3;
    server backend2:3001 weight=3;
    server backend3:3001 weight=2;
    keepalive 32;
}

upstream frontend {
    least_conn;
    server frontend1:3000;
    server frontend2:3000;
    keepalive 32;
}
```

#### Database Scaling

- **Read Replicas**: Offload read queries to replicas
- **Connection Pooling**: Use PgBouncer
- **Partitioning**: Partition large tables by date
- **Indexing**: Add indexes for frequently queried columns

#### Redis Scaling

- **Redis Cluster**: For horizontal scaling
- **Sentinel**: For high availability
- **Persistence**: Enable RDB + AOF

### Vertical Scaling

- Increase CPU cores
- Add more RAM
- Use faster SSD storage
- Optimize application code

### Caching Strategy

```typescript
// Redis caching example
import { Injectable } from '@nestjs/common';
import { Redis } from 'ioredis';

@Injectable()
export class CacheService {
  constructor(private redis: Redis) {}

  async get(key: string) {
    const cached = await this.redis.get(key);
    if (cached) return JSON.parse(cached);
    return null;
  }

  async set(key: string, value: any, ttl: number = 3600) {
    await this.redis.setex(key, ttl, JSON.stringify(value));
  }

  async invalidate(pattern: string) {
    const keys = await this.redis.keys(pattern);
    if (keys.length > 0) {
      await this.redis.del(...keys);
    }
  }
}
```

---

## Troubleshooting

### Common Issues

#### Backend Won't Start

```bash
# Check logs
docker logs ecourse-backend

# Check database connection
docker exec ecourse-backend npm run prisma:db:push

# Check environment variables
docker exec ecourse-backend env
```

#### Frontend Build Errors

```bash
# Clear Next.js cache
rm -rf .next
rm -rf node_modules
npm install
npm run build
```

#### Database Connection Issues

```bash
# Check PostgreSQL status
docker ps | grep postgres

# Test connection
docker exec -it ecourse-postgres psql -U ecourse -d ecourse_db

# Check logs
docker logs ecourse-postgres
```

#### Redis Connection Issues

```bash
# Check Redis status
docker ps | grep redis

# Test connection
docker exec -it ecourse-redis redis-cli -a STRONG_PASSWORD ping

# Check logs
docker logs ecourse-redis
```

#### MinIO Connection Issues

```bash
# Check MinIO status
docker ps | grep minio

# Test connection
curl http://localhost:9000/minio/health/live

# Check logs
docker logs ecourse-minio
```

### Performance Issues

```bash
# Check resource usage
docker stats

# Check database performance
docker exec ecourse-postgres psql -U ecourse -d ecourse_db -c "SELECT * FROM pg_stat_activity;"

# Check Redis performance
docker exec ecourse-redis redis-cli -a STRONG_PASSWORD INFO stats
```

### Log Analysis

```bash
# View backend logs
docker logs -f ecourse-backend

# View frontend logs
docker logs -f ecourse-frontend

# View all logs
docker compose logs -f

# Search for errors
docker compose logs | grep -i error
```

---

## Deployment Checklist

### Pre-Deployment

- [ ] All environment variables configured
- [ ] SSL certificates obtained
- [ ] Database backup created
- [ ] Firewall rules configured
- [ ] DNS records updated
- [ ] Monitoring tools configured
- [ ] Backup strategy implemented
- [ ] Security headers configured
- [ ] Rate limiting configured
- [ ] CORS configured properly

### Post-Deployment

- [ ] Frontend accessible at domain
- [ ] Backend API accessible
- [ ] Database connection working
- [ ] Redis connection working
- [ ] MinIO connection working
- [ ] Authentication working
- [ ] File uploads working
- [ ] Email notifications working
- [ ] Health checks passing
- [ ] Monitoring data flowing
- [ ] Backup jobs running
- [ ] SSL certificate valid

### Ongoing Maintenance

- [ ] Weekly dependency updates
- [ ] Monthly security patches
- [ ] Quarterly backup verification
- [ ] Annual security audit
- [ ] Performance optimization review
- [ ] Cost optimization review

---

## Support & Resources

### Documentation

- Project README: `/README.md`
- Project Documentation: `/DOKUMENTASI_PROYEK.md`
- User Manual: `/User_Manual.md`

### Useful Links

- NestJS Documentation: https://docs.nestjs.com
- Next.js Documentation: https://nextjs.org/docs
- Prisma Documentation: https://www.prisma.io/docs
- Docker Documentation: https://docs.docker.com
- PostgreSQL Documentation: https://www.postgresql.org/docs

### Emergency Contacts

- System Administrator: [admin@your-domain.com]
- DevOps Team: [devops@your-domain.com]
- Security Team: [security@your-domain.com]

---

## Appendix

### Quick Commands Reference

```bash
# Start all services
docker compose -f docker-compose.prod.yml up -d

# Stop all services
docker compose -f docker-compose.prod.yml down

# View logs
docker compose -f docker-compose.prod.yml logs -f

# Restart specific service
docker compose -f docker-compose.prod.yml restart backend

# Update application
git pull origin main
docker compose -f docker-compose.prod.yml up -d --build

# Database backup
docker exec ecourse-postgres pg_dump -U ecourse ecourse_db > backup.sql

# Database restore
cat backup.sql | docker exec -i ecourse-postgres psql -U ecourse ecourse_db

# Check service status
docker compose -f docker-compose.prod.yml ps
```

### Port Reference

| Service | Port | Protocol |
|--------|------|----------|
| Frontend | 3000 | HTTP |
| Backend | 3001 | HTTP |
| PostgreSQL | 5432 | TCP |
| Redis | 6379 | TCP |
| MinIO API | 9000 | HTTP |
| MinIO Console | 9001 | HTTP |

### Directory Structure

```
/var/www/ecourse-lms/
├── backend/
│   ├── dist/
│   ├── node_modules/
│   ├── prisma/
│   └── src/
├── frontend/
│   ├── .next/
│   ├── node_modules/
│   ├── public/
│   └── src/
├── docker-compose.prod.yml
├── .env
└── backups/
    ├── postgres/
    └── minio/
```

---

**Document Version**: 1.0  
**Last Updated**: 2024-01-31  
**Maintained By**: DevOps Team

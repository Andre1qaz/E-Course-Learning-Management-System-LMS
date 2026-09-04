# Deployment Configuration Guide

## Overview
This project uses a modern microservices architecture with frontend (Next.js) deployed on Vercel and backend (NestJS) deployed on Render. The deployment configuration requires careful environment variable management and service integration.

## Key Deployment Fixes Applied

### 1. Redis Configuration (Upstash)
**Issue**: Backend configured for local Redis (localhost:6379) which doesn't work in cloud environment.

**Solution**: 
- Updated `backend/.env.example` to include Upstash Redis configuration
- Modified `backend/src/app.module.ts` BullModule configuration to support both local Redis and Upstash Redis
- Added proper connection options for Upstash REST API

**Environment Variables**:
```bash
# For Production (Upstash Redis)
UPSTASH_REDIS_REST_URL=your-upstash-redis-rest-url
UPSTASH_REDIS_REST_TOKEN=your-upstash-redis-rest-token

# For Development (Local Redis)
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=
```

### 2. NextAuth URL Configuration
**Issue**: NEXTAUTH_URL placeholder value causing authentication failures in production.

**Solution**:
- Updated `frontend/next.config.ts` to automatically set NEXTAUTH_URL from environment variables
- Added fallback logic for Vercel deployment (VERCEL_URL)
- Removed hardcoded placeholder values

**Environment Variables**:
```bash
# For Vercel deployment (automatically set)
NEXTAUTH_URL=https://your-project.vercel.app

# For local development
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-super-secret-nextauth-key-min-32-chars
```

### 3. Storage Configuration (Dual Support)
**Issue**: Need to support both MinIO (development) and Cloudflare R2 (production).

**Solution**:
- Enhanced `backend/src/storage/storage.service.ts` with automatic detection logic
- System checks for R2 credentials first, falls back to MinIO if not available
- Updated error messages to indicate which storage system is being used
- Added comprehensive documentation in `backend/.env.example`

**Environment Variables**:
```bash
# For Production (Cloudflare R2)
R2_ACCOUNT_ID=your-account-id
R2_ACCESS_KEY_ID=your-access-key-id
R2_SECRET_ACCESS_KEY=your-secret-access-key
R2_ENDPOINT=https://your-account-id.r2.cloudflarestorage.com
R2_BUCKET_PUBLIC=ecourse-public
R2_BUCKET_PRIVATE=ecourse-private

# For Development (MinIO)
MINIO_ENDPOINT=localhost
MINIO_PORT=9000
MINIO_ACCESS_KEY=minioadmin
MINIO_SECRET_KEY=minioadmin123
MINIO_BUCKET_PUBLIC=ecourse-public
MINIO_BUCKET_PRIVATE=ecourse-private
MINIO_USE_SSL=false
```

### 4. Prisma Schema Mapping
**Status**: Verified that schema mapping is consistent. The Prisma schema uses `@@map` directives to handle both snake_case (model names) and PascalCase (database table names). The User model correctly maps to "User" table, while other models use snake_case like "courses", "enrollments", etc.

## Verification Steps

### Before Deployment
1. **Environment Variables**: Ensure all required environment variables are set in both Vercel and Render dashboards
2. **Database**: Verify Supabase database connection and schema
3. **Storage**: Ensure MinIO is running locally or R2 is configured for production
4. **Redis**: Verify Upstash Redis connection or local Redis instance

### After Deployment
1. **Frontend Health Check**: Access Vercel deployment URL
2. **Backend Health Check**: Access Render backend URL with `/api/docs` for Swagger documentation
3. **Authentication Test**: Test login with valid credentials
4. **Database Connection**: Verify backend can connect to Supabase
5. **Storage Test**: Test file upload functionality
6. **Redis Test**: Verify queue functionality if applicable

## Common Issues and Solutions

### "Email atau password salah" Error
**Root Causes**:
1. NEXTAUTH_URL not properly configured
2. Password hash mismatch
3. Database schema incomplete

**Solutions**:
1. Set correct NEXTAUTH_URL in Vercel environment variables
2. Ensure password hash uses bcrypt with rounds=12
3. Verify database has complete schema (run Prisma migrations)

### Redis Connection Failures
**Symptoms**: Queue operations fail, connection timeouts

**Solutions**:
1. For production: Use Upstash Redis with REST API
2. For development: Ensure local Redis is running on localhost:6379
3. Check firewall/network settings

### Storage Upload Failures
**Symptoms**: File upload fails with signed URL errors

**Solutions**:
1. Verify storage credentials are correct
2. Check bucket names match configuration
3. Ensure MinIO or R2 service is accessible
4. Verify network connectivity

## Platform-Specific Notes

### Vercel (Frontend)
- Automatically sets `VERCEL_URL` environment variable
- Build command: `npm run build`
- Output directory: `.next`
- Environment variables set in Vercel dashboard

### Render (Backend)
- Build command: `npm run build`
- Start command: `npm run start`
- Environment variables set in Render dashboard
- Health check endpoint: `/` or `/api/health`

### Supabase (Database)
- Connection string format: `postgresql://user:password@host:port/database?schema=public`
- Ensure Prisma migrations are applied
- Verify table permissions and roles

## Development vs Production Workflow

### Local Development
```bash
# Frontend
cd frontend
npm run dev  # Runs on http://localhost:3000

# Backend
cd backend
npm run start:dev  # Runs on http://localhost:3001
```

### Production Deployment
```bash
# Frontend (Vercel)
- Push to main branch triggers automatic deployment
- Environment variables configured in Vercel dashboard

# Backend (Render)
- Push to main branch triggers automatic deployment
- Environment variables configured in Render dashboard
```

## Security Considerations
1. Never commit environment variables to git
2. Use strong secrets for JWT and NextAuth
3. Rotate credentials regularly
4. Enable SSL/TLS for all connections
5. Use environment-specific configurations

## Monitoring and Logging
- Backend: Check Render logs for runtime errors
- Frontend: Check Vercel deployment logs
- Database: Monitor Supabase dashboard for connection issues
- Storage: Monitor R2/MinIO logs for upload failures

## Additional Resources
- [Vercel Documentation](https://vercel.com/docs)
- [Render Documentation](https://render.com/docs)
- [Supabase Documentation](https://supabase.com/docs)
- [Upstash Redis Documentation](https://upstash.com/docs)
- [Cloudflare R2 Documentation](https://developers.cloudflare.com/r2/)
# Cloudflare R2 Integration Notes

## Overview
The storage service has been updated to support both Cloudflare R2 (production) and MinIO (development) configurations.

## Environment Variables

### Production (Cloudflare R2)
```env
# Cloudflare R2 Configuration
R2_ACCOUNT_ID=your-account-id
R2_ACCESS_KEY_ID=your-access-key-id
R2_SECRET_ACCESS_KEY=your-secret-access-key
R2_ENDPOINT=https://your-account-id.r2.cloudflarestorage.com
R2_BUCKET_PUBLIC=ecourse-public
R2_BUCKET_PRIVATE=ecourse-private
```

### Development (MinIO)
```env
# MinIO Configuration (for local development)
MINIO_ENDPOINT=localhost
MINIO_PORT=9000
MINIO_ACCESS_KEY=minioadmin
MINIO_SECRET_KEY=minioadmin123
MINIO_BUCKET_PUBLIC=ecourse-public
MINIO_BUCKET_PRIVATE=ecourse-private
MINIO_USE_SSL=false
```

## How It Works

The storage service automatically detects which configuration to use:
- If `R2_ENDPOINT` is present, it uses Cloudflare R2
- Otherwise, it falls back to MinIO configuration

## File Access URLs

### R2 (Production)
Files are accessible via: `https://[ACCOUNT-ID].r2.cloudflarestorage.com/[BUCKET]/[KEY]`

### MinIO (Development)
Files are accessible via: `http://localhost:9000/[BUCKET]/[KEY]`

## Current Configuration

Your project is currently configured with:
- **Production**: Cloudflare R2 with your provided credentials
- **Development**: MinIO (default settings)

## Setup Required

Before deploying to production:
1. Ensure R2 buckets exist: `ecourse-public` and `ecourse-private`
2. Verify R2 credentials are correct in `.env.production` and `.env.render`
3. Update bucket names if different from defaults

## Testing

To test R2 integration locally, use the values from your own R2 dashboard (see `backend/.env.example`). Do NOT commit real credentials:

```bash
# Set R2 environment variables locally (replace with YOUR credentials from R2 dashboard)
export R2_ENDPOINT="https://<YOUR_ACCOUNT_ID>.r2.cloudflarestorage.com"
export R2_ACCESS_KEY_ID="<YOUR_ACCESS_KEY_ID>"
export R2_SECRET_ACCESS_KEY="<YOUR_SECRET_ACCESS_KEY>"
export R2_ACCOUNT_ID="<YOUR_ACCOUNT_ID>"
export R2_BUCKET_PUBLIC="ecourse-public"
export R2_BUCKET_PRIVATE="ecourse-private"

# Run the application
npm run start:dev
```

> **SECURITY NOTICE**: Real R2 credentials that were previously committed in this file (lines 63-66) must be considered **compromised**. Rotate them immediately in the Cloudflare R2 dashboard and check git history for the commit that included them.

## Benefits of R2

- **Free tier**: 10GB storage, unlimited egress
- **S3-compatible**: Works with existing AWS SDK code
- **Global CDN**: Fast access worldwide
- **No vendor lock-in**: Easy to migrate to other S3-compatible services

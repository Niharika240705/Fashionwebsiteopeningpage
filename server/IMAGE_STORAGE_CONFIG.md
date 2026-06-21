# Image Storage Configuration

## Environment Variables

The following environment variables are used for image storage. Add them to your `server/.env` file:

### Supabase Storage (Currently Used)

```env
SUPABASE_URL=your-supabase-url
SUPABASE_ANON_KEY=your-supabase-anon-key
SUPABASE_BUCKET=processed-images
```

### AWS S3 Storage (Alternative)

```env
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your-access-key
AWS_SECRET_ACCESS_KEY=your-secret-key
AWS_S3_BUCKET=fashion-processed-images
```

## Where These Variables Are Used

### 1. `server/src/services/image-processing.service.ts`

**SupabaseStorageService** (lines 209-218):
- Reads `SUPABASE_URL` → `process.env.SUPABASE_URL`
- Reads `SUPABASE_ANON_KEY` → `process.env.SUPABASE_ANON_KEY`
- Reads `SUPABASE_BUCKET` → `process.env.SUPABASE_BUCKET` (default: 'processed-images')

**S3StorageService** (lines 261-275):
- Reads `AWS_REGION` → `process.env.AWS_REGION` (default: 'us-east-1')
- Reads `AWS_ACCESS_KEY_ID` → `process.env.AWS_ACCESS_KEY_ID`
- Reads `AWS_SECRET_ACCESS_KEY` → `process.env.AWS_SECRET_ACCESS_KEY`
- Reads `AWS_S3_BUCKET` → `process.env.AWS_S3_BUCKET` (default: 'fashion-processed-images')

### 2. `server/src/services/scraping-orchestrator.service.ts`

**ScrapingOrchestratorService** (line 15):
- Instantiates `SupabaseStorageService()` which reads the env variables
- Passes it to `ImageProcessingService` for processing scraped images

### 3. `server/src/index.ts`

**Main Server File** (line 15):
- Calls `dotenv.config()` to load all environment variables from `.env` file
- This ensures all `process.env.*` variables are available throughout the application

## How It Works

1. **Environment Loading**: `dotenv.config()` in `index.ts` loads variables from `.env`
2. **Storage Service**: `SupabaseStorageService` reads env vars in constructor
3. **Image Processing**: When scraping, images are processed and uploaded to Supabase
4. **Product Storage**: Processed image URLs are saved to MongoDB with products

## Configuration Status

The services now log their configuration status:
- ✅ **Configured**: Shows bucket name and confirms storage is ready
- ⚠️ **Not Configured**: Warns that placeholder URLs will be used

## Setup Instructions

1. **Add to `.env` file** (in `server/` directory):
   ```env
   SUPABASE_URL=https://your-project.supabase.co
   SUPABASE_ANON_KEY=your-anon-key-here
   SUPABASE_BUCKET=processed-images
   ```

2. **Restart the server** to load new environment variables

3. **Verify configuration**: Check server logs for:
   ```
   ✅ Supabase storage configured (bucket: processed-images)
   ```

## Notes

- If Supabase variables are not set, images will use placeholder URLs
- The system gracefully handles missing configuration
- You can switch to AWS S3 by changing `SupabaseStorageService` to `S3StorageService` in `scraping-orchestrator.service.ts`


# Fashion Website Backend

Production-ready backend server for the fashion website with authentication.

## Features

- ✅ Email/Password authentication
- ✅ Google OAuth integration
- ✅ Apple Sign In (structure ready)
- ✅ JWT token-based authentication
- ✅ MongoDB database
- ✅ Secure password hashing
- ✅ Session management
- ✅ Rate limiting
- ✅ CORS configuration
- ✅ Security headers (Helmet)

## Setup

### 1. Install Dependencies

```bash
cd server
npm install
```

### 2. Configure Environment Variables

Copy `.env.example` to `.env` and fill in your values:

```bash
cp .env.example .env
```

Update the following in `.env`:

```env
# Server
PORT=5000
NODE_ENV=development

# Database (MongoDB)
MONGODB_URI=mongodb://localhost:27017/fashion-website
# For production: mongodb+srv://username:password@cluster.mongodb.net/fashion-website

# JWT Secrets (CHANGE THESE!)
JWT_SECRET=your-super-secret-jwt-key-min-32-characters
REFRESH_TOKEN_SECRET=your-super-secret-refresh-key-min-32-characters

# Session Secret (CHANGE THIS!)
SESSION_SECRET=your-super-secret-session-key-min-32-characters

# Frontend URL
FRONTEND_URL=http://localhost:3000

# Google OAuth
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
```

### 3. Set Up Google OAuth

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing
3. Enable Google+ API
4. Go to "Credentials" → "Create Credentials" → "OAuth client ID"
5. Add authorized redirect URI: `http://localhost:5000/api/auth/google/callback`
6. Copy Client ID and Client Secret to `.env`

### 4. Set Up MongoDB

**Option A: Local MongoDB**
```bash
# Install MongoDB locally or use Docker
docker run -d -p 27017:27017 --name mongodb mongo
```

**Option B: MongoDB Atlas (Cloud)**
1. Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Create a free cluster
3. Get connection string
4. Update `MONGODB_URI` in `.env`

### 5. Run the Server

**Development:**
```bash
npm run dev
```

**Production:**
```bash
npm run build
npm start
```

## API Endpoints

### Authentication

- `POST /api/auth/register` - Register with email/password
- `POST /api/auth/login` - Login with email/password
- `GET /api/auth/google` - Initiate Google OAuth
- `GET /api/auth/google/callback` - Google OAuth callback
- `POST /api/auth/apple` - Apple Sign In (needs implementation)
- `POST /api/auth/refresh` - Refresh access token
- `GET /api/auth/me` - Get current user (requires auth)
- `POST /api/auth/logout` - Logout

### User

- `GET /api/user/profile` - Get user profile (requires auth)
- `PUT /api/user/profile` - Update user profile (requires auth)

### Virtual Try-On

- `POST /api/try-on` - Photorealistic AI virtual try-on (requires auth, rate limited)

See [Virtual Try-On setup](#virtual-try-on-setup) below for provider configuration.

## Request/Response Examples

### Register
```bash
POST /api/auth/register
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123",
  "name": "John Doe"
}
```

### Login
```bash
POST /api/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123"
}
```

### Get Current User
```bash
GET /api/auth/me
Authorization: Bearer <access_token>
```

## Virtual Try-On Setup

`POST /api/try-on` powers the photorealistic virtual try-on studio (`VirtualTryOnModal`). It
forwards a full-body photo + garment image to a generative AI provider server-side, so provider
API keys never reach the browser.

**Request body:**

```json
{
  "productId": "abc123",
  "garmentImageUrl": "https://cdn.example.com/garment.jpg",
  "humanImageBase64": "data:image/jpeg;base64,...",
  "category": "dresses",
  "sizeHint": "M"
}
```

`humanImageUrl` may be used instead of `humanImageBase64`. `category` is mapped internally to
the provider's `upper_body` / `lower_body` / `dresses` flag.

**Configure a provider (pick one):**

1. **Replicate (recommended)** — [cuuupid/idm-vton](https://replicate.com/cuuupid/idm-vton)
   - Create an API token at [replicate.com/account/api-tokens](https://replicate.com/account/api-tokens)
   - Set `REPLICATE_API_TOKEN` in `server/.env`
   - Optionally pin `REPLICATE_VTON_MODEL_VERSION` to a specific model version id if the default
     becomes stale (Replicate versions are content-addressed and change when the model owner
     publishes updates)
2. **fal.ai** — [fal-ai/idm-vton](https://fal.ai/models/fal-ai/idm-vton)
   - Create a key at [fal.ai/dashboard/keys](https://fal.ai/dashboard/keys)
   - Set `FAL_KEY` in `server/.env` (and `TRY_ON_PROVIDER=fal` if `REPLICATE_API_TOKEN` is also set)

**Local UI testing without a key:** set `TRY_ON_MOCK=true` in `server/.env`. This returns a
simple local image composite labeled **"Demo mode"** in both the API response (`mode: "demo"`)
and the frontend UI — it is never presented as a photorealistic AI result. Never enable
`TRY_ON_MOCK` in production.

**Honesty note on live camera vs. photorealistic result:** the in-modal camera view uses
MediaPipe Pose Landmarker + Selfie Segmentation, running entirely in the browser, to draw a live
skeleton/highlight overlay and tell the user when their full body is framed. That is real-time
guidance only. The actual garment render is a single generative AI call made after the user taps
"Capture" or uploads a photo — there is no live/streaming garment draping, because no production
video-VTON API was available to wire in. This is stated in the modal's UI copy as well.

## Security Features

- Password hashing with bcrypt
- JWT token authentication
- Rate limiting (100 requests per 15 minutes)
- CORS protection
- Helmet security headers
- Input validation
- SQL injection protection (MongoDB)

## Production Deployment

### Environment Variables for Production

```env
NODE_ENV=production
PORT=5000
MONGODB_URI=mongodb+srv://...
JWT_SECRET=<strong-random-secret-32+chars>
REFRESH_TOKEN_SECRET=<strong-random-secret-32+chars>
SESSION_SECRET=<strong-random-secret-32+chars>
FRONTEND_URL=https://yourdomain.com
GOOGLE_CLIENT_ID=<your-google-client-id>
GOOGLE_CLIENT_SECRET=<your-google-client-secret>
```

### Deployment Options

1. **Heroku**
   ```bash
   heroku create your-app-name
   heroku config:set NODE_ENV=production
   heroku config:set MONGODB_URI=...
   git push heroku main
   ```

2. **Railway**
   - Connect GitHub repo
   - Set environment variables
   - Deploy automatically

3. **AWS/DigitalOcean**
   - Use PM2 for process management
   - Set up reverse proxy (Nginx)
   - Configure SSL

## Security Checklist

- [ ] Strong JWT secrets (32+ characters, random)
- [ ] HTTPS enabled
- [ ] CORS configured correctly
- [ ] Rate limiting enabled
- [ ] Input validation on all endpoints
- [ ] Error messages don't leak sensitive info
- [ ] MongoDB connection string secured
- [ ] Environment variables not in code
- [ ] Regular dependency updates

## Troubleshooting

### MongoDB Connection Error
- Check MongoDB is running
- Verify connection string
- Check network/firewall settings

### Google OAuth Not Working
- Verify redirect URI matches exactly
- Check Client ID and Secret
- Ensure Google+ API is enabled

### JWT Token Issues
- Verify JWT_SECRET is set
- Check token expiration
- Ensure Authorization header format: `Bearer <token>`

## License

[Your License]


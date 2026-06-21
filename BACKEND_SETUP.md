# Backend Setup Guide

Complete guide to set up and run the production-ready backend server.

## Quick Start

1. **Navigate to server directory:**
   ```bash
   cd server
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Set up environment variables:**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

4. **Start the server:**
   ```bash
   npm run dev  # Development
   # or
   npm run build && npm start  # Production
   ```

## Frontend Configuration

Update your frontend `.env` file:

```env
VITE_API_URL=http://localhost:5000/api
```

Or for production:
```env
VITE_API_URL=https://your-backend-domain.com/api
```

## Complete Setup Steps

### 1. MongoDB Setup

**Local MongoDB:**
```bash
# Using Docker
docker run -d -p 27017:27017 --name mongodb mongo

# Or install MongoDB locally
# macOS: brew install mongodb-community
# Ubuntu: sudo apt-get install mongodb
```

**MongoDB Atlas (Cloud - Recommended for Production):**
1. Go to https://www.mongodb.com/cloud/atlas
2. Create free account
3. Create a cluster
4. Get connection string
5. Update `MONGODB_URI` in `.env`

### 2. Google OAuth Setup

1. Go to https://console.cloud.google.com/
2. Create new project
3. Enable Google+ API
4. Create OAuth 2.0 credentials
5. Add authorized redirect URI:
   - Development: `http://localhost:5000/api/auth/google/callback`
   - Production: `https://your-backend-domain.com/api/auth/google/callback`
6. Copy Client ID and Secret to `.env`

### 3. Generate Secure Secrets

For production, generate strong secrets:

```bash
# Generate JWT secret (32+ characters)
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Generate session secret
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Add these to your `.env` file.

## Testing the Backend

### Test Registration
```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123",
    "name": "Test User"
  }'
```

### Test Login
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123"
  }'
```

### Test Protected Route
```bash
curl -X GET http://localhost:5000/api/auth/me \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

## Troubleshooting

### Port Already in Use
Change `PORT` in `.env` or kill the process:
```bash
# Find process
lsof -i :5000
# Kill process
kill -9 <PID>
```

### MongoDB Connection Failed
- Check MongoDB is running
- Verify connection string
- Check firewall/network settings

### Google OAuth Redirect Mismatch
- Ensure redirect URI matches exactly (including http/https)
- Check for trailing slashes
- Verify callback URL in Google Console

## Production Deployment

See `server/README.md` for detailed production deployment instructions.


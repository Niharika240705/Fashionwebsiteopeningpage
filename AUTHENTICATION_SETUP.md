# Authentication System - Complete Setup

## Overview

Your fashion website now has a complete authentication system with:
- ✅ Email/Password login
- ✅ Google OAuth
- ✅ Apple Sign In (structure ready)
- ✅ Protected links (login required to visit designer websites)
- ✅ JWT token-based authentication
- ✅ Session management

## Architecture

### Backend (`/server`)
- Express.js server with TypeScript
- MongoDB database
- JWT authentication
- OAuth integration (Google, Apple)
- Secure password hashing

### Frontend (`/src`)
- React authentication context
- Login modal component
- Protected link functionality
- Automatic token refresh

## How It Works

### 1. User Clicks Login Button
- Located in Header (user icon)
- Opens LoginModal with three options:
  - Email/Password
  - Google OAuth
  - Apple Sign In

### 2. User Clicks External Link
- When user clicks any hyperlink to designer website:
  - If **not logged in**: Login modal appears
  - If **logged in**: Link opens normally

### 3. Authentication Flow

**Email/Password:**
1. User enters email/password (password must be 8+ characters)
2. Backend validates and creates JWT access + refresh tokens
3. Tokens are set as `httpOnly` cookies (`accessToken`, `refreshToken`) — never touched by JS
4. Frontend calls `GET /api/auth/me` (`credentials: 'include'`) to hydrate user state

**Google OAuth:**
1. User clicks "Continue with Google" (button auto-disables if not configured — see below)
2. Redirected to Google login (`GET /api/auth/google`)
3. Google redirects back to `GET /api/auth/google/callback` with an auth code
4. Backend exchanges the code for profile info via Passport
5. Creates/updates user in MongoDB, matched by email
6. Sets the same `httpOnly` auth cookies as email/password login
7. Redirects to `FRONTEND_URL/?auth=success`; the frontend detects this query param, calls
   `refreshSession()`, and closes the login modal

## Google OAuth — Google Cloud Console Setup

Google sign-in is fully wired end-to-end in the code. It only needs real credentials to turn on.
While `GOOGLE_CLIENT_ID`/`GOOGLE_CLIENT_SECRET` are unset (or left as the `.env.example`
placeholders), the backend disables the Google routes and `GET /api/auth/providers` reports
`google: false`, so the frontend automatically shows the button as "not configured" instead of
erroring out.

To enable it for local dev:

1. Go to the [Google Cloud Console](https://console.cloud.google.com/apis/credentials).
2. Create (or select) a project.
3. **APIs & Services → OAuth consent screen**: configure it (External is fine for testing) and
   add your Google account as a test user if the app is still in "Testing" mode.
4. **APIs & Services → Credentials → Create Credentials → OAuth client ID**.
   - Application type: **Web application**
   - **Authorized JavaScript origins**: `http://localhost:3000`
   - **Authorized redirect URIs**: `http://localhost:5001/api/auth/google/callback`
5. Copy the generated **Client ID** and **Client Secret**.
6. In `server/.env`, set:
   ```env
   GOOGLE_CLIENT_ID=<your client id>.apps.googleusercontent.com
   GOOGLE_CLIENT_SECRET=<your client secret>
   GOOGLE_CALLBACK_URL=http://localhost:5001/api/auth/google/callback
   FRONTEND_URL=http://localhost:3000
   ```
7. Restart the backend (`npm run dev` in `server/`). You should see the "⚠️ Google OAuth not
   configured" log disappear on boot.
8. Reload the frontend — the "Continue with Google" button will become active automatically
   (it checks `GET /api/auth/providers` on load).

For a deployed environment, repeat with the production frontend/backend URLs (e.g.
`https://yourdomain.com` and `https://api.yourdomain.com/api/auth/google/callback`), and set
`FRONTEND_URL`/`GOOGLE_CALLBACK_URL` accordingly in that environment's `.env`.

**Never commit real Google credentials.** `server/.env` is already gitignored — only
`server/.env.example` (with blank/placeholder values) should be committed.

## Setup Instructions

### Step 1: Backend Setup

```bash
cd server
npm install
cp .env.example .env
# Edit .env with your configuration
npm run dev
```

See `server/README.md` for detailed backend setup.

### Step 2: Frontend Setup

Add to your frontend `.env` (matches `server/.env`'s `PORT=5001`):
```env
VITE_API_URL=http://localhost:5001/api
```

### Step 3: Test the System

1. **Start backend:**
   ```bash
   cd server
   npm run dev
   ```

2. **Start frontend:**
   ```bash
   npm run dev
   ```

3. **Test login:**
   - Click user icon in header
   - Try email/password registration
   - Try Google OAuth

4. **Test protected links:**
   - Click on any designer outfit
   - Click "Visit Official Website" without logging in
   - Login modal should appear
   - After login, link should work

## Key Files

### Backend
- `server/src/index.ts` - Main server file
- `server/src/routes/auth.routes.ts` - Authentication routes
- `server/src/models/User.model.ts` - User database model
- `server/src/config/passport.config.ts` - OAuth configuration

### Frontend
- `src/contexts/AuthContext.tsx` - Authentication state management
- `src/components/LoginModal.tsx` - Login UI component
- `src/components/ProtectedLink.tsx` - Protected link wrapper
- `src/components/DesignerModal.tsx` - Updated to require auth

## Security Features

- ✅ Password hashing (bcrypt)
- ✅ JWT token authentication
- ✅ Secure session management
- ✅ CORS protection
- ✅ Rate limiting
- ✅ Input validation
- ✅ Secure cookie settings

## Production Checklist

- [ ] Set strong JWT secrets (32+ characters)
- [ ] Configure MongoDB Atlas (cloud database)
- [ ] Set up Google OAuth credentials
- [ ] Update CORS to allow only your domain
- [ ] Enable HTTPS
- [ ] Set secure cookie flags
- [ ] Configure environment variables
- [ ] Test all authentication flows
- [ ] Set up error monitoring

## Troubleshooting

### Login Modal Not Appearing
- Check browser console for errors
- Verify backend is running
- Check API URL in frontend `.env`

### Google OAuth Not Working
- Verify redirect URI matches exactly
- Check Google Client ID/Secret
- Ensure Google+ API is enabled

### Protected Links Not Working
- Check user is authenticated (check AuthContext)
- Verify tokens are stored in localStorage
- Check network tab for API calls

## Next Steps

1. **Complete Apple Sign In:**
   - Implement Apple token verification
   - Add Apple credentials to `.env`

2. **Add User Profile:**
   - Profile page
   - Edit profile functionality
   - Avatar upload

3. **Remember Me:**
   - Extend token expiration
   - Add "Remember me" checkbox

4. **Password Reset:**
   - Forgot password flow
   - Email verification

## Support

For issues, check:
- `server/README.md` - Backend documentation
- `BACKEND_SETUP.md` - Setup guide
- Browser console for frontend errors
- Server logs for backend errors


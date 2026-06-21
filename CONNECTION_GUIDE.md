# Frontend-Backend Connection Guide

## ✅ Connection Status

Your frontend and backend are now connected!

### Configuration

**Frontend** (`.env`):
```env
VITE_API_URL=http://localhost:5001/api
```

**Backend** (`server/.env`):
```env
PORT=5001
FRONTEND_URL=http://localhost:3000
```

## How to Run Both Servers

### Terminal 1 - Backend Server
```bash
cd server
npm run dev
```

You should see:
```
⚠️  Google OAuth not configured...
✅ Connected to MongoDB
🚀 Server running on port 5001
```

### Terminal 2 - Frontend Server
```bash
npm run dev
```

You should see:
```
VITE v6.x.x  ready in xxx ms

➜  Local:   http://localhost:3000/
```

## Testing the Connection

### 1. Test Backend Health
```bash
curl http://localhost:5001/api/health
```

Should return:
```json
{"status":"ok","timestamp":"..."}
```

### 2. Test from Frontend

Open your browser console (F12) and you should see:
```
✅ Backend connected successfully
```

### 3. Test Registration

1. Click the user icon in the header
2. Click "Sign up" in the login modal
3. Enter:
   - Name: Test User
   - Email: test@example.com
   - Password: test123
4. Click "Create Account"

You should be logged in and see your user info.

### 4. Test Login

1. Click user icon → Logout
2. Click user icon again → Login
3. Enter your credentials
4. You should be logged in

### 5. Test Protected Links

1. Without logging in, click on any designer outfit
2. Click "Visit Official Website"
3. Login modal should appear
4. After logging in, the link should work

## API Endpoints Available

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login
- `GET /api/auth/google` - Google OAuth
- `GET /api/auth/me` - Get current user (requires auth)
- `POST /api/auth/logout` - Logout

### User
- `GET /api/user/profile` - Get user profile (requires auth)
- `PUT /api/user/profile` - Update profile (requires auth)

## Troubleshooting

### CORS Errors
If you see CORS errors:
1. Check `FRONTEND_URL` in `server/.env` matches your frontend URL
2. Restart the backend server

### Connection Refused
- Make sure backend is running on port 5001
- Check `VITE_API_URL` in frontend `.env`

### 401 Unauthorized
- Token might be expired
- Try logging in again
- Check browser localStorage for `accessToken`

### MongoDB Connection Error
- Make sure MongoDB is running
- Check `MONGODB_URI` in `server/.env`

## Development Workflow

1. **Start MongoDB** (if using local):
   ```bash
   # Using Docker
   docker start mongodb
   
   # Or check if running
   mongosh mongodb://localhost:27017
   ```

2. **Start Backend**:
   ```bash
   cd server
   npm run dev
   ```

3. **Start Frontend**:
   ```bash
   npm run dev
   ```

4. **Open Browser**:
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:5001/api

## Next Steps

- ✅ Backend and frontend are connected
- ✅ Authentication is working
- ✅ Protected links require login
- ⏳ Add more features (user profile, saved items sync, etc.)


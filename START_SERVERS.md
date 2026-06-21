# How to Start Frontend and Backend

## Quick Start (Two Terminal Windows)

### Terminal 1 - Backend Server
```bash
cd /Users/niharikasingh/Documents/FashionInsta/Fashionwebsiteopeningpage/server
npm run dev
```

### Terminal 2 - Frontend Server
```bash
cd /Users/niharikasingh/Documents/FashionInsta/Fashionwebsiteopeningpage
npm run dev
```

---

## Detailed Steps

### Step 1: Start Backend

Open Terminal 1:
```bash
cd /Users/niharikasingh/Documents/FashionInsta/Fashionwebsiteopeningpage/server
npm install  # Only needed first time
npm run dev
```

**Expected Output:**
```
⚠️  Google OAuth not configured. Set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET in .env to enable.
✅ Connected to MongoDB
🚀 Server running on port 5001
📝 Environment: development
```

**Backend URL:** http://localhost:5001

### Step 2: Start Frontend

Open Terminal 2 (new terminal window):
```bash
cd /Users/niharikasingh/Documents/FashionInsta/Fashionwebsiteopeningpage
npm install  # Only needed first time
npm run dev
```

**Expected Output:**
```
VITE v6.x.x  ready in xxx ms

➜  Local:   http://localhost:3000/
➜  Network: use --host to expose
```

**Frontend URL:** http://localhost:3000

---

## Verify Both Are Running

### Check Backend:
```bash
curl http://localhost:5001/api/health
```

Should return:
```json
{"status":"ok","timestamp":"..."}
```

### Check Frontend:
Open browser: http://localhost:3000

You should see your fashion website!

---

## Using a Single Terminal (Background Process)

If you want to run both in one terminal:

```bash
# Start backend in background
cd /Users/niharikasingh/Documents/FashionInsta/Fashionwebsiteopeningpage/server
npm run dev &

# Start frontend
cd /Users/niharikasingh/Documents/FashionInsta/Fashionwebsiteopeningpage
npm run dev
```

To stop background processes:
```bash
pkill -f "tsx watch"
pkill -f "vite"
```

---

## Troubleshooting

### Port Already in Use

**Backend (5001):**
```bash
lsof -ti:5001 | xargs kill -9
```

**Frontend (3000):**
```bash
lsof -ti:3000 | xargs kill -9
```

### MongoDB Not Running

```bash
# Check if MongoDB is running
mongosh mongodb://localhost:27017

# If not running, start it:
# Using Docker:
docker start mongodb

# Or install and start MongoDB locally
```

### Dependencies Not Installed

```bash
# Backend
cd server
npm install

# Frontend
cd ..
npm install
```

---

## Production Build

### Build Frontend:
```bash
npm run build
npm run preview  # Preview production build
```

### Build Backend:
```bash
cd server
npm run build
npm start  # Run production build
```

---

## Quick Reference

| Service | Port | Command | URL |
|---------|------|---------|-----|
| Backend | 5001 | `cd server && npm run dev` | http://localhost:5001 |
| Frontend | 3000 | `npm run dev` | http://localhost:3000 |
| MongoDB | 27017 | `mongosh mongodb://localhost:27017` | - |


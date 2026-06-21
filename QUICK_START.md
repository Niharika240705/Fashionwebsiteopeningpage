# Quick Start Guide

## 🚀 Start Both Servers

### Step 1: Kill Any Running Processes
```bash
# Kill backend
lsof -ti:5001 | xargs kill -9 2>/dev/null

# Kill frontend
lsof -ti:3000 | xargs kill -9 2>/dev/null
lsof -ti:3001 | xargs kill -9 2>/dev/null

# Or kill all at once
pkill -f "tsx watch"
pkill -f "vite"
```

### Step 2: Start Backend (Terminal 1)
```bash
cd /Users/niharikasingh/Documents/FashionInsta/Fashionwebsiteopeningpage/server
npm run dev
```

**Wait for:**
```
✅ Connected to MongoDB
🚀 Server running on port 5001
```

### Step 3: Start Frontend (Terminal 2 - New Window)
```bash
cd /Users/niharikasingh/Documents/FashionInsta/Fashionwebsiteopeningpage
npm run dev
```

**Wait for:**
```
➜  Local:   http://localhost:3000/
```

---

## ✅ Verify Connection

1. **Open browser:** http://localhost:3000
2. **Open console (F12):** Should see `✅ Backend connected successfully`
3. **Test login:** Click user icon → Register/Login

---

## 🔧 If Ports Are Busy

### Free Port 5001 (Backend):
```bash
lsof -ti:5001 | xargs kill -9
```

### Free Port 3000 (Frontend):
```bash
lsof -ti:3000 | xargs kill -9
```

### Free Both:
```bash
pkill -f "tsx watch" && pkill -f "vite"
```

---

## 📝 Current Configuration

- **Backend:** http://localhost:5001
- **Frontend:** http://localhost:3000 (or 3001 if 3000 is busy)
- **API URL:** http://localhost:5001/api

---

## 🆘 Troubleshooting

**Backend won't start:**
- Check MongoDB is running: `mongosh mongodb://localhost:27017`
- Kill process on port 5001: `lsof -ti:5001 | xargs kill -9`

**Frontend won't start:**
- Kill process on port 3000: `lsof -ti:3000 | xargs kill -9`
- Or use port 3001 (Vite will auto-switch)

**Connection errors:**
- Make sure backend is running first
- Check `.env` files have correct URLs
- Restart both servers


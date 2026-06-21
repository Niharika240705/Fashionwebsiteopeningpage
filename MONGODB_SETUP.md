# MongoDB Setup Guide

## MongoDB URI Format

### Local MongoDB (Default)
```
mongodb://localhost:27017/fashion-website
```

**Breakdown:**
- `mongodb://` - Protocol
- `localhost:27017` - Host and port (default MongoDB port)
- `fashion-website` - Database name

### MongoDB Atlas (Cloud - Recommended for Production)

```
mongodb+srv://username:password@cluster-name.mongodb.net/fashion-website?retryWrites=true&w=majority
```

**Breakdown:**
- `mongodb+srv://` - Protocol for MongoDB Atlas
- `username:password` - Your MongoDB Atlas credentials
- `cluster-name.mongodb.net` - Your cluster address
- `fashion-website` - Database name
- `?retryWrites=true&w=majority` - Connection options

## Setup Options

### Option 1: Local MongoDB (Development)

**Install MongoDB:**

**macOS:**
```bash
brew tap mongodb/brew
brew install mongodb-community
brew services start mongodb-community
```

**Ubuntu/Debian:**
```bash
sudo apt-get install -y mongodb
sudo systemctl start mongodb
```

**Windows:**
Download from [MongoDB Download Center](https://www.mongodb.com/try/download/community)

**Using Docker (Easiest):**
```bash
docker run -d -p 27017:27017 --name mongodb mongo
```

**Verify MongoDB is running:**
```bash
mongosh mongodb://localhost:27017
# Or
mongo mongodb://localhost:27017
```

**Your .env file:**
```env
MONGODB_URI=mongodb://localhost:27017/fashion-website
```

### Option 2: MongoDB Atlas (Cloud - Production)

1. **Create Account:**
   - Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
   - Sign up for free account

2. **Create Cluster:**
   - Click "Build a Database"
   - Choose FREE tier (M0)
   - Select region closest to you
   - Click "Create"

3. **Create Database User:**
   - Go to "Database Access"
   - Click "Add New Database User"
   - Choose "Password" authentication
   - Create username and password (save these!)
   - Set privileges to "Read and write to any database"

4. **Whitelist IP Address:**
   - Go to "Network Access"
   - Click "Add IP Address"
   - For development: Click "Allow Access from Anywhere" (0.0.0.0/0)
   - For production: Add your server IP only

5. **Get Connection String:**
   - Go to "Database" → "Connect"
   - Choose "Connect your application"
   - Copy the connection string
   - Replace `<password>` with your database user password
   - Replace `<dbname>` with `fashion-website`

**Example:**
```
mongodb+srv://myuser:mypassword@cluster0.xxxxx.mongodb.net/fashion-website?retryWrites=true&w=majority
```

**Your .env file:**
```env
MONGODB_URI=mongodb+srv://myuser:mypassword@cluster0.xxxxx.mongodb.net/fashion-website?retryWrites=true&w=majority
```

## Testing Connection

### Test from Terminal:
```bash
# Local MongoDB
mongosh mongodb://localhost:27017/fashion-website

# MongoDB Atlas
mongosh "mongodb+srv://username:password@cluster.mongodb.net/fashion-website"
```

### Test from Backend:
```bash
cd server
npm run dev
```

You should see:
```
✅ Connected to MongoDB
🚀 Server running on port 5000
```

## Common Issues

### Connection Refused
- **Problem:** MongoDB not running
- **Solution:** Start MongoDB service
  ```bash
  # macOS
  brew services start mongodb-community
  
  # Docker
  docker start mongodb
  ```

### Authentication Failed
- **Problem:** Wrong username/password
- **Solution:** Check credentials in MongoDB Atlas

### Network Access Denied
- **Problem:** IP not whitelisted
- **Solution:** Add your IP to MongoDB Atlas Network Access

### Connection Timeout
- **Problem:** Firewall blocking port 27017
- **Solution:** Allow port 27017 or use MongoDB Atlas

## Production Recommendations

1. **Use MongoDB Atlas** (not local MongoDB)
2. **Whitelist only your server IP** (not 0.0.0.0/0)
3. **Use strong database passwords**
4. **Enable MongoDB Atlas monitoring**
5. **Set up automated backups**

## Current Configuration

Your `.env` file in `server/.env` should have:

```env
MONGODB_URI=mongodb://localhost:27017/fashion-website
```

This works for local development. For production, switch to MongoDB Atlas.


# Backend Startup Checklist ✅

Use this checklist to ensure your backend starts successfully.

## Pre-Start Checklist

### 1. Dependencies Installed

```bash
[ ] npm install
```

### 2. Environment Configuration

```bash
[ ] .env file exists (copied from .env.example)
[ ] DATABASE_URL is set
[ ] JWT_ACCESS_SECRET is set
[ ] REDIS_HOST is configured (default: localhost)
[ ] REDIS_PORT is configured (default: 6379)
```

### 3. External Services Running

**MongoDB**

```bash
[ ] MongoDB service is running
[ ] Can connect to DATABASE_URL
```

Test: Try connecting with MongoDB Compass or mongosh

**Redis**

```bash
[ ] Redis server is running
[ ] redis-cli ping responds with PONG
```

Test:

```bash
redis-cli ping
# Should return: PONG
```

### 4. Database Seeding

```bash
[ ] Symbols seeded: npm run seed:symbols
```

This should add 242 trading pairs to your database.

## Startup Procedure

### Step 1: Start External Services

```bash
# Start Redis (choose your OS)
## Windows (WSL)
wsl
sudo service redis-server start

## macOS
brew services start redis

## Linux
sudo systemctl start redis

# Verify MongoDB is running
mongosh # or mongo
```

### Step 2: Start Backend Server

```bash
npm run dev
```

### Step 3: Verify Startup

You should see these logs in order:

```
✅ MongoDB connected
✅ Redis client connected
✅ Redis subscriber connected
✅ Socket.IO server initialized
📊 Loaded 242 symbols for tracking
🔌 Connecting to Binance WebSocket...
✅ Connected to Binance WebSocket (242 symbols)
🚀 Server running on port 5000
📊 WebSocket server ready for frontend connections
💾 Saved price data for 242 symbols
```

## Post-Start Verification

### Test 1: Server Health

```bash
curl http://localhost:5000/
```

Expected: "Binance Statistic Backend Server Running on port 5000"

### Test 2: System Status

```bash
curl http://localhost:5000/api/v1/system/status
```

Expected: JSON with all services showing as "connected"

### Test 3: Get Symbols

```bash
curl http://localhost:5000/api/v1/symbols/list
```

Expected: Array of 242 symbol names

### Test 4: WebSocket Connection

Open browser console and run:

```javascript
const socket = io("http://localhost:5000");
socket.on("connect", () => console.log("✅ Connected!"));
socket.emit("subscribe", { symbol: "BTCUSDT" });
socket.on("price_update", (data) => console.log("💰 Price:", data));
```

## Common Issues & Solutions

### ❌ Issue: Redis connection error

```
❌ Redis client error: Error: connect ECONNREFUSED 127.0.0.1:6379
```

**Solution:**

```bash
# Check if Redis is running
redis-cli ping

# If not, start it
sudo service redis-server start  # Linux/WSL
brew services start redis         # macOS
```

---

### ❌ Issue: MongoDB connection error

```
❌ Server startup error: MongooseServerSelectionError
```

**Solution:**

1. Verify MongoDB is running
2. Check DATABASE_URL in .env
3. Test connection: `mongosh <your_database_url>`

---

### ❌ Issue: No symbols found

```
⚠️ No symbols found in database. Please add symbols first.
```

**Solution:**

```bash
npm run seed:symbols
```

---

### ❌ Issue: Port 5000 already in use

```
Error: listen EADDRINUSE: address already in use :::5000
```

**Solution:**

```bash
# Option 1: Change port in .env
PORT=5001

# Option 2: Kill process using port 5000 (Windows)
netstat -ano | findstr :5000
taskkill /PID <PID> /F

# Option 2: Kill process using port 5000 (Linux/macOS)
lsof -ti:5000 | xargs kill -9
```

---

### ❌ Issue: Binance WebSocket not connecting

```
❌ Error connecting to Binance WebSocket
```

**Solution:**

1. Check internet connection
2. Verify no firewall blocking WebSocket
3. Server will auto-retry (max 10 attempts)

---

## Success Indicators

When everything is working correctly:

✅ **Console Logs**

- All services connected
- WebSocket connected to Binance
- Regular "Saved price data" messages every 5 seconds

✅ **Redis**

```bash
redis-cli keys price:*
# Should show keys like: price:BTCUSDT, price:ETHUSDT, etc.
```

✅ **MongoDB**
Check collections:

- `symbols` - Should have 242 documents
- `pricedatas` - Should start accumulating data

✅ **System Status Endpoint**

```bash
curl http://localhost:5000/api/v1/system/status | json_pp
```

All services should show "connected": true

✅ **Data Flow**

```bash
# Watch Redis for real-time updates
redis-cli
> SUBSCRIBE price:updates:BTCUSDT
```

## Production Checklist

Before deploying to production:

```bash
[ ] Environment variables secured
[ ] Database backups configured
[ ] Redis persistence enabled
[ ] Error monitoring setup (e.g., Sentry)
[ ] Logging configured
[ ] Rate limiting implemented
[ ] CORS properly configured
[ ] SSL/TLS certificates installed
[ ] Health check endpoints tested
[ ] Load balancer configured
[ ] Auto-restart on crash (PM2)
```

## Quick Commands Reference

```bash
# Start development server
npm run dev

# Seed database
npm run seed:symbols

# Check Redis
redis-cli ping

# Check MongoDB
mongosh

# View logs in real-time
# (Already visible with npm run dev)

# Test API endpoint
curl http://localhost:5000/api/v1/system/status

# Build for production
npm run build

# Start production server
npm run start:prod
```

## Monitoring Commands

### Watch Redis Keys

```bash
redis-cli
> keys price:*
> get price:BTCUSDT
```

### Monitor WebSocket Connections

Check console for:

```
🔌 Client connected: <socket-id>
📊 Client <socket-id> subscribed to BTCUSDT
```

### Database Stats

```bash
mongosh
> use binance_statistics
> db.symbols.countDocuments()      // Should be 242
> db.pricedatas.countDocuments()   // Growing number
> db.pricedatas.find().sort({timestamp: -1}).limit(5)  // Latest prices
```

## Ready to Go! 🚀

When all checkboxes are ticked and all tests pass:

- ✅ Your backend is running
- ✅ Data is flowing from Binance
- ✅ WebSocket server is ready
- ✅ Frontend can connect

**Next Step:** Start building your frontend!

---

Need help? Check:

- SETUP_GUIDE.md
- BACKEND_README.md
- API_DOCUMENTATION.md
- PROJECT_SUMMARY.md

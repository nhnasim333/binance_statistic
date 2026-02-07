# Quick Setup Guide - Binance Statistics Backend

## Prerequisites Checklist

- [ ] Node.js (v16+)
- [ ] MongoDB running
- [ ] Redis installed and running
- [ ] Binance API credentials (optional for now)

## Step-by-Step Setup

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Environment

Copy and edit the environment file:

```bash
cp .env.example .env
```

Minimal required configuration in `.env`:

```env
NODE_ENV=development
PORT=5000
DATABASE_URL=mongodb://localhost:27017/binance_statistics

BCRYPT_SALT_ROUNDS=10
JWT_ACCESS_SECRET=your_secret_key_here_change_this
JWT_ACCESS_EXPIRES_IN=7d

# Redis (default local setup)
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=

# Binance credentials (can be empty, we use public WebSocket)
BINANCE_API_KEY=
BINANCE_SECRET_KEY=
```

### 3. Start Redis

**Windows (WSL):**

```bash
wsl
sudo service redis-server start
# Verify: redis-cli ping
```

**macOS:**

```bash
brew services start redis
# Verify: redis-cli ping
```

**Linux:**

```bash
sudo systemctl start redis
# Verify: redis-cli ping
```

### 4. Seed Trading Symbols

This adds 242 USDT trading pairs to your database:

```bash
npm run seed:symbols
```

### 5. Start the Server

```bash
npm run dev
```

## What Happens on Startup

1. ✅ Connects to MongoDB
2. ✅ Seeds super admin user (if needed)
3. ✅ Initializes Socket.IO server on port 5000
4. ✅ Connects to Binance WebSocket (fetches real-time prices for 242 symbols)
5. ✅ Starts broadcasting price updates every 1 second

## Testing the Setup

### Test 1: Check Server Health

```bash
curl http://localhost:5000/
```

Should return: `Binance Statistic Backend Server Running on port 5000`

### Test 2: Get All Symbols

```bash
curl http://localhost:5000/api/v1/symbols/list
```

### Test 3: WebSocket Connection (Browser Console)

```javascript
const socket = io("http://localhost:5000");

socket.on("connect", () => {
  console.log("Connected!");

  // Subscribe to Bitcoin
  socket.emit("subscribe", { symbol: "BTCUSDT" });
});

socket.on("price_update", (data) => {
  console.log("Price update:", data);
});

socket.on("subscription_confirmed", (data) => {
  console.log("Subscribed to:", data.symbol);
});
```

## Verify Everything is Working

In your server console, you should see:

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
💾 Saved price data for 242 symbols (every 5 seconds)
```

## Common Issues

### Issue: Redis connection error

**Solution:**

```bash
# Check if Redis is running
redis-cli ping

# If not, start it (Linux/macOS)
sudo service redis-server start
# or
brew services start redis
```

### Issue: MongoDB connection error

**Solution:**

- Make sure MongoDB is running
- Check DATABASE_URL in .env file
- Default: `mongodb://localhost:27017/binance_statistics`

### Issue: No symbols in database

**Solution:**

```bash
npm run seed:symbols
```

### Issue: Port 5000 already in use

**Solution:**
Change PORT in .env file:

```env
PORT=5001
```

## Next Steps

Once the backend is running:

1. **Create a user account:**

```bash
curl -X POST http://localhost:5000/api/v1/users/register \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"password123","name":"Test User"}'
```

2. **Frontend integration:** Use the Socket.IO client to connect and subscribe to symbols
3. **Monitor logs:** Watch the console for real-time updates and errors
4. **Check data:** Query the API endpoints or check MongoDB to see stored price data

## Development Tips

- **Hot reload:** The server auto-restarts on file changes
- **Logs:** Watch console for WebSocket status and data flow
- **Redis data:** Use `redis-cli` to inspect cached data
  ```bash
  redis-cli
  > keys price:*
  > get price:BTCUSDT
  ```
- **MongoDB data:** Use MongoDB Compass or CLI to view stored prices

## Ready for Frontend!

Your backend is now:

- ✅ Fetching real-time data from Binance
- ✅ Caching data in Redis
- ✅ Storing data in MongoDB
- ✅ Broadcasting updates via WebSocket
- ✅ Ready to serve your frontend application

Connect your frontend to: `http://localhost:5000`

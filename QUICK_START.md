# Quick Start Guide

## Backend Setup Steps

### 1. Navigate to Backend Folder

```bash
cd binance_backend
```

### 2. Seed the Database with 242 Symbols

```bash
npm run seed:symbols
```

This will populate the MongoDB with all 242 cryptocurrency symbols from your `symbol.ts` file.

### 3. Start the Backend Server

```bash
npm run dev
```

### Expected Output:

```
✅ Redis client connected
✅ Redis subscriber connected
✅ MongoDB connected
✅ Socket.IO server initialized
🚀 Server running on port 5000
📊 WebSocket server ready for frontend connections
📊 Loaded 242 symbols for tracking
🔌 Connecting to Binance WebSocket...
📊 Creating 5 WebSocket connections for 242 symbols
✅ Connection 1 established (60 symbols)
✅ Connection 2 established (60 symbols)
✅ Connection 3 established (60 symbols)
✅ Connection 4 established (60 symbols)
✅ Connection 5 established (2 symbols)
💾 Saved price data for 242 symbols
🧹 Next cleanup scheduled at [TIME] (in X minutes)
```

## API Endpoints Now Available

### Symbols

- `GET /api/v1/symbols/active` - Get all active symbol names (242 tokens) ✅ FIXED
- `GET /api/v1/symbols/list` - Same as above
- `GET /api/v1/symbols` - Get all symbol objects
- `GET /api/v1/symbols/:id` - Get symbol by ID

### Price Data

- `GET /api/v1/price-data/recent?symbol=BTCUSDT&intervalHour=1&limit=100` - Recent price data ✅ NEW
- `GET /api/v1/price-data/current/:symbol` - Current price ✅ NEW
- `GET /api/v1/price-data/stats/24h` - 24h statistics ✅ NEW
- `GET /api/v1/price-data/aggregated?symbol=BTCUSDT&intervalHour=1` - Aggregated OHLC data

### System

- `GET /api/v1/system/status` - System status

### WebSocket Events (port 5000)

**Client → Server:**

- `subscribe` - Subscribe to symbol updates
  ```js
  socket.emit("subscribe", { symbols: ["BTCUSDT", "ETHUSDT"] });
  ```
- `unsubscribe` - Unsubscribe from symbols
- `get_historical` - Get historical data

**Server → Client:**

- `price_update` - Real-time price updates (every 1 second)
- `initial_data` - Initial data on subscription
- `interval_update` - 4-hour interval updates
- `subscribed` - Subscription confirmation
- `unsubscribed` - Unsubscription confirmation

## Frontend is Already Running

Frontend: http://localhost:5173

## Troubleshooting

### MongoDB Connection Timeout

- Make sure MongoDB Atlas is accessible
- Check your internet connection
- Verify DATABASE_URL in `.env`

### Redis Connection Failed

- Memurai should be running on Windows
- Check Task Manager for "Memurai" process
- Restart Memurai if needed

### No Symbols Found

- Run `npm run seed:symbols` first

### WebSocket Not Connecting

- Make sure backend is running on port 5000
- Check CORS settings
- Verify frontend is using correct URL (http://localhost:5000)

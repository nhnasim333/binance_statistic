# Binance Statistics Backend

A real-time cryptocurrency price tracking system that fetches data from Binance WebSocket API for 242 USDT trading pairs and serves it to frontend clients via Socket.IO.

## Features

- ✅ **Real-time Price Tracking**: WebSocket connection to Binance for 242 USDT trading pairs
- ✅ **Redis Caching**: Efficient data caching for real-time price access
- ✅ **Socket.IO Server**: Push real-time updates to frontend clients
- ✅ **MongoDB Storage**: Persistent storage with 4-hour interval aggregation
- ✅ **REST API**: RESTful endpoints for historical data and symbol management
- ✅ **User Authentication**: JWT-based authentication system
- ✅ **4-Hour Intervals**: Data aggregation at hours [1, 5, 9, 13, 17, 21]

## Tech Stack

- **Node.js** with **TypeScript**
- **Express.js** - REST API framework
- **Socket.IO** - Real-time WebSocket communication with frontend
- **WebSocket (ws)** - Connection to Binance API
- **MongoDB** with **Mongoose** - Data persistence
- **Redis** with **ioredis** - Real-time data caching
- **JWT** - Authentication
- **Zod** - Schema validation

## Architecture

```
┌─────────────┐
│   Binance   │
│  WebSocket  │
│     API     │
└──────┬──────┘
       │ Real-time price data
       ▼
┌─────────────┐      ┌─────────────┐
│   Binance   │─────▶│    Redis    │
│   Service   │      │   Cache     │
└──────┬──────┘      └─────────────┘
       │                     │
       │ Every 5 sec         │ Real-time
       ▼                     ▼
┌─────────────┐      ┌─────────────┐
│   MongoDB   │      │  Socket.IO  │
│  Database   │      │   Server    │
└─────────────┘      └──────┬──────┘
                            │
                            ▼
                     ┌─────────────┐
                     │  Frontend   │
                     │   Clients   │
                     └─────────────┘
```

## Installation

1. **Clone the repository**

```bash
cd binance_backend
```

2. **Install dependencies**

```bash
npm install
```

3. **Setup environment variables**

```bash
cp .env.example .env
```

Edit `.env` file with your configurations:

```env
NODE_ENV=development
PORT=5000
DATABASE_URL=mongodb://localhost:27017/binance_statistics

BCRYPT_SALT_ROUNDS=10
JWT_ACCESS_SECRET=your_jwt_secret_here
JWT_ACCESS_EXPIRES_IN=7d

BINANCE_API_KEY=your_binance_api_key
BINANCE_SECRET_KEY=your_binance_secret_key

REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=
```

4. **Install and start Redis**

**Windows:**

```bash
# Using WSL
wsl
sudo apt-get install redis-server
sudo service redis-server start
```

**macOS:**

```bash
brew install redis
brew services start redis
```

**Linux:**

```bash
sudo apt-get install redis-server
sudo systemctl start redis
```

5. **Seed symbols to database**

```bash
npm run seed:symbols
```

## Usage

### Development Mode

```bash
npm run dev
```

### Production Mode

```bash
npm run build
npm run start:prod
```

## API Endpoints

### Authentication

- `POST /api/v1/users/register` - Register new user
- `POST /api/v1/users/login` - User login

### Symbols

- `GET /api/v1/symbols` - Get all active symbols
- `GET /api/v1/symbols/list` - Get symbols list only
- `GET /api/v1/symbols/:id` - Get symbol by ID
- `POST /api/v1/symbols` - Create new symbol (Admin only)
- `POST /api/v1/symbols/bulk` - Bulk create symbols (Admin only)
- `PATCH /api/v1/symbols/:id` - Update symbol (Admin only)
- `DELETE /api/v1/symbols/:id` - Delete symbol (Admin only)

### Price Data

- `GET /api/v1/price-data/:symbol` - Get price data for symbol
  - Query params: `startTime`, `endTime`
- `GET /api/v1/price-data/:symbol/latest` - Get latest price
- `GET /api/v1/price-data/:symbol/intervals` - Get recent intervals
  - Query params: `intervals` (default: 6)
- `GET /api/v1/price-data/:symbol/aggregated` - Get aggregated interval data
  - Query params: `intervalStartTime`, `intervalHour`

## WebSocket Events (Socket.IO)

### Client → Server

**Subscribe to symbol**

```javascript
socket.emit("subscribe", { symbol: "BTCUSDT" });
```

**Unsubscribe from symbol**

```javascript
socket.emit("unsubscribe", { symbol: "BTCUSDT" });
```

**Get all symbols**

```javascript
socket.emit("get_all_symbols");
```

**Get multiple prices**

```javascript
socket.emit("get_multiple_prices", {
  symbols: ["BTCUSDT", "ETHUSDT", "BNBUSDT"],
});
```

**Get interval data**

```javascript
socket.emit("get_interval_data", {
  symbol: "BTCUSDT",
  intervalStartTime: "2024-02-06T09:00:00Z",
  intervalHour: 9,
});
```

**Get recent intervals**

```javascript
socket.emit("get_recent_intervals", {
  symbol: "BTCUSDT",
  count: 6,
});
```

### Server → Client

**Price update (every 1 second)**

```javascript
socket.on("price_update", (data) => {
  // { symbol: 'BTCUSDT', price: 43250.50, timestamp: 1707220800000 }
});
```

**Historical data**

```javascript
socket.on("historical_data", (data) => {
  // { symbol: 'BTCUSDT', data: [...] }
});
```

**Interval data**

```javascript
socket.on("interval_data", (data) => {
  // { symbol: 'BTCUSDT', intervals: [...] }
});
```

**Subscription confirmed**

```javascript
socket.on("subscription_confirmed", (data) => {
  // { symbol: 'BTCUSDT' }
});
```

**All symbols**

```javascript
socket.on("all_symbols", (data) => {
  // { symbols: ['BTCUSDT', 'ETHUSDT', ...] }
});
```

**Multiple prices**

```javascript
socket.on("multiple_prices", (data) => {
  // { prices: [{symbol, price, timestamp}, ...] }
});
```

## Data Flow

### Real-time Price Updates

1. **Binance WebSocket** sends ticker updates every second for all 242 symbols
2. **Binance Service** processes the data and:
   - Stores in **Redis** for instant access
   - Buffers data for batch database saves
3. Every **5 seconds**, buffered data is saved to **MongoDB**
4. **Socket.IO Server** broadcasts updates to subscribed frontend clients every **1 second**

### 4-Hour Interval System

The system uses 4-hour intervals starting at specific hours:

- **01:00** - Interval 1
- **05:00** - Interval 5
- **09:00** - Interval 9
- **13:00** - Interval 13
- **17:00** - Interval 17
- **21:00** - Interval 21

Each price point is tagged with its interval for aggregation and chart display.

## Data Optimization

### Redis Caching Strategy

- **Real-time prices**: 1-hour TTL
- **Time-series data**: Last 4 hours kept in sorted sets
- **Interval data**: 24-hour TTL

### Database Strategy

- **Batch writes**: Every 5 seconds to reduce DB load
- **Indexed queries**: Optimized indexes on symbol, timestamp, and interval
- **Data retention**: Configurable (default 30 days)

### Frontend Data Delivery

- **Subscribed symbols**: Push updates every 1 second
- **Historical data**: Sent on initial subscription (last 4 hours)
- **Interval data**: Aggregated OHLC data for charting

## Project Structure

```
binance_backend/
├── src/
│   ├── app/
│   │   ├── config/           # Configuration
│   │   ├── DB/               # Database seeding
│   │   ├── errors/           # Error handlers
│   │   ├── middlewares/      # Express middlewares
│   │   ├── modules/
│   │   │   ├── User/         # User authentication
│   │   │   ├── Symbol/       # Symbol management
│   │   │   └── PriceData/    # Price data handling
│   │   ├── routes/           # API routes
│   │   ├── services/
│   │   │   ├── redis.service.ts       # Redis operations
│   │   │   ├── binance.service.ts     # Binance WebSocket
│   │   │   └── websocket.service.ts   # Socket.IO server
│   │   └── utils/            # Utility functions
│   ├── scripts/              # Utility scripts
│   ├── app.ts               # Express app
│   └── server.ts            # Server entry point
├── package.json
├── tsconfig.json
└── .env
```

## Environment Variables

| Variable              | Description               | Required | Default     |
| --------------------- | ------------------------- | -------- | ----------- |
| NODE_ENV              | Environment mode          | Yes      | development |
| PORT                  | Server port               | Yes      | 5000        |
| DATABASE_URL          | MongoDB connection string | Yes      | -           |
| BCRYPT_SALT_ROUNDS    | Password hashing rounds   | Yes      | 10          |
| JWT_ACCESS_SECRET     | JWT signing secret        | Yes      | -           |
| JWT_ACCESS_EXPIRES_IN | JWT expiration time       | Yes      | 7d          |
| BINANCE_API_KEY       | Binance API key           | No       | -           |
| BINANCE_SECRET_KEY    | Binance secret key        | No       | -           |
| REDIS_HOST            | Redis host                | Yes      | localhost   |
| REDIS_PORT            | Redis port                | Yes      | 6379        |
| REDIS_PASSWORD        | Redis password            | No       | -           |

## Frontend Integration Example

```javascript
import { io } from "socket.io-client";

// Connect to backend
const socket = io("http://localhost:5000");

// Subscribe to Bitcoin price
socket.emit("subscribe", { symbol: "BTCUSDT" });

// Listen for price updates
socket.on("price_update", (data) => {
  console.log(`${data.symbol}: $${data.price}`);
  // Update your chart here
});

// Get historical data for chart
socket.on("historical_data", (data) => {
  console.log(`Historical data for ${data.symbol}:`, data.data);
  // Initialize chart with historical data
});

// Unsubscribe when component unmounts
socket.emit("unsubscribe", { symbol: "BTCUSDT" });
```

## Performance Considerations

- **242 symbols** × **1 update/second** = **242 updates/second** from Binance
- **Redis** handles real-time caching with O(1) lookups
- **Batch writes** to MongoDB every 5 seconds reduce DB load
- **Socket.IO** efficiently broadcasts to only subscribed clients
- **Time-series data** in Redis kept for last 4 hours only

## Monitoring

The system logs important events:

- ✅ Successful connections
- 🔌 WebSocket status changes
- 💾 Database write operations
- ❌ Errors and reconnection attempts
- 📊 Active subscriptions and clients

## Troubleshooting

### Redis Connection Error

```bash
# Check if Redis is running
redis-cli ping
# Should respond: PONG
```

### MongoDB Connection Error

- Verify `DATABASE_URL` in `.env`
- Check MongoDB service is running

### Binance WebSocket Disconnects

- The service auto-reconnects with exponential backoff
- Max 10 reconnection attempts

### No symbols in database

```bash
npm run seed:symbols
```

## License

ISC

## Support

For issues and questions, please create an issue in the repository.

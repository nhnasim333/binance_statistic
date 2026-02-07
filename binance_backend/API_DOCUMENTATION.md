# Binance Statistics API Documentation

## Base URL

```
http://localhost:5000/api/v1
```

## WebSocket URL

```
ws://localhost:5000
```

---

## REST API Endpoints

### System Endpoints

#### Get System Status

```http
GET /api/v1/system/status
```

**Response:**

```json
{
  "success": true,
  "message": "System status retrieved successfully",
  "statusCode": 200,
  "data": {
    "server": "running",
    "timestamp": "2024-02-06T10:30:00.000Z",
    "services": {
      "binanceWebSocket": {
        "connected": true,
        "status": "connected"
      },
      "redis": {
        "connected": true,
        "status": "connected"
      },
      "socketIO": {
        "activeSubscriptions": 5,
        "connectedClients": 3
      }
    }
  }
}
```

#### Health Check

```http
GET /api/v1/system/health
```

**Response:**

```json
{
  "status": "healthy",
  "timestamp": "2024-02-06T10:30:00.000Z"
}
```

---

### Authentication Endpoints

#### Register User

```http
POST /api/v1/users/register
Content-Type: application/json
```

**Request Body:**

```json
{
  "email": "user@example.com",
  "password": "securePassword123",
  "name": "John Doe"
}
```

**Response:**

```json
{
  "success": true,
  "message": "User registered successfully",
  "statusCode": 201,
  "data": {
    "_id": "65c123...",
    "email": "user@example.com",
    "name": "John Doe",
    "role": "user"
  }
}
```

#### Login User

```http
POST /api/v1/users/login
Content-Type: application/json
```

**Request Body:**

```json
{
  "email": "user@example.com",
  "password": "securePassword123"
}
```

**Response:**

```json
{
  "success": true,
  "message": "Login successful",
  "statusCode": 200,
  "data": {
    "user": {
      "_id": "65c123...",
      "email": "user@example.com",
      "name": "John Doe",
      "role": "user"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

---

### Symbol Endpoints

#### Get All Symbols

```http
GET /api/v1/symbols
```

**Response:**

```json
{
  "success": true,
  "message": "Symbols retrieved successfully",
  "statusCode": 200,
  "data": [
    {
      "_id": "65c123...",
      "symbol": "BTCUSDT",
      "baseAsset": "BTC",
      "quoteAsset": "USDT",
      "isActive": true,
      "createdAt": "2024-02-06T10:00:00.000Z",
      "updatedAt": "2024-02-06T10:00:00.000Z"
    },
    ...
  ]
}
```

#### Get Symbols List (Symbol names only)

```http
GET /api/v1/symbols/list
```

**Response:**

```json
{
  "success": true,
  "message": "Symbols list retrieved successfully",
  "statusCode": 200,
  "data": ["BTCUSDT", "ETHUSDT", "BNBUSDT", ...]
}
```

#### Get Symbol by ID

```http
GET /api/v1/symbols/:id
```

**Response:**

```json
{
  "success": true,
  "message": "Symbol retrieved successfully",
  "statusCode": 200,
  "data": {
    "_id": "65c123...",
    "symbol": "BTCUSDT",
    "baseAsset": "BTC",
    "quoteAsset": "USDT",
    "isActive": true
  }
}
```

#### Create Symbol (Admin/SuperAdmin only)

```http
POST /api/v1/symbols
Authorization: Bearer <token>
Content-Type: application/json
```

**Request Body:**

```json
{
  "symbol": "BTCUSDT",
  "baseAsset": "BTC",
  "quoteAsset": "USDT",
  "isActive": true
}
```

#### Bulk Create Symbols (Admin/SuperAdmin only)

```http
POST /api/v1/symbols/bulk
Authorization: Bearer <token>
Content-Type: application/json
```

**Request Body:**

```json
{
  "symbols": [
    {
      "symbol": "BTCUSDT",
      "baseAsset": "BTC",
      "quoteAsset": "USDT"
    },
    ...
  ]
}
```

#### Update Symbol (Admin/SuperAdmin only)

```http
PATCH /api/v1/symbols/:id
Authorization: Bearer <token>
Content-Type: application/json
```

**Request Body:**

```json
{
  "isActive": false
}
```

#### Delete Symbol (Admin/SuperAdmin only)

```http
DELETE /api/v1/symbols/:id
Authorization: Bearer <token>
```

---

### Price Data Endpoints

#### Get Price Data for Symbol

```http
GET /api/v1/price-data/:symbol
```

**Query Parameters:**

- `startTime` (optional): ISO date string
- `endTime` (optional): ISO date string

**Example:**

```http
GET /api/v1/price-data/BTCUSDT?startTime=2024-02-06T09:00:00Z&endTime=2024-02-06T13:00:00Z
```

**Response:**

```json
{
  "success": true,
  "message": "Price data retrieved successfully",
  "statusCode": 200,
  "data": [
    {
      "_id": "65c123...",
      "symbol": "BTCUSDT",
      "price": 43250.50,
      "timestamp": "2024-02-06T09:00:00.000Z",
      "intervalHour": 9,
      "intervalStartTime": "2024-02-06T09:00:00.000Z",
      "volume": 150.5,
      "createdAt": "2024-02-06T09:00:01.000Z"
    },
    ...
  ]
}
```

#### Get Latest Price for Symbol

```http
GET /api/v1/price-data/:symbol/latest
```

**Response:**

```json
{
  "success": true,
  "message": "Latest price retrieved successfully",
  "statusCode": 200,
  "data": {
    "symbol": "BTCUSDT",
    "price": 43250.5,
    "timestamp": "2024-02-06T13:45:30.000Z",
    "intervalHour": 13
  }
}
```

#### Get Recent Intervals for Symbol

```http
GET /api/v1/price-data/:symbol/intervals
```

**Query Parameters:**

- `intervals` (optional, default: 6): Number of intervals to retrieve

**Example:**

```http
GET /api/v1/price-data/BTCUSDT/intervals?intervals=6
```

**Response:**

```json
{
  "success": true,
  "message": "Recent intervals data retrieved successfully",
  "statusCode": 200,
  "data": [
    {
      "symbol": "BTCUSDT",
      "intervalStartTime": "2024-02-06T09:00:00.000Z",
      "intervalHour": 9,
      "open": 43100.00,
      "close": 43250.50,
      "high": 43300.00,
      "low": 43050.00,
      "volume": 1250.5,
      "count": 720
    },
    ...
  ]
}
```

#### Get Aggregated Interval Data

```http
GET /api/v1/price-data/:symbol/aggregated
```

**Query Parameters:**

- `intervalStartTime` (required): ISO date string
- `intervalHour` (required): 1, 5, 9, 13, 17, or 21

**Example:**

```http
GET /api/v1/price-data/BTCUSDT/aggregated?intervalStartTime=2024-02-06T09:00:00Z&intervalHour=9
```

**Response:**

```json
{
  "success": true,
  "message": "Aggregated price data retrieved successfully",
  "statusCode": 200,
  "data": {
    "symbol": "BTCUSDT",
    "intervalStartTime": "2024-02-06T09:00:00.000Z",
    "intervalHour": 9,
    "open": 43100.0,
    "close": 43250.5,
    "high": 43300.0,
    "low": 43050.0,
    "avgPrice": 43175.25,
    "count": 720,
    "firstTimestamp": "2024-02-06T09:00:05.000Z",
    "lastTimestamp": "2024-02-06T12:59:55.000Z"
  }
}
```

---

## WebSocket API (Socket.IO)

### Connection

```javascript
import { io } from "socket.io-client";

const socket = io("http://localhost:5000");

socket.on("connect", () => {
  console.log("Connected to server");
});
```

### Client → Server Events

#### Subscribe to Symbol

```javascript
socket.emit("subscribe", { symbol: "BTCUSDT" });
```

**Server Response:**

```javascript
socket.on("subscription_confirmed", (data) => {
  // { symbol: 'BTCUSDT' }
});

socket.on("price_update", (data) => {
  // { symbol: 'BTCUSDT', price: 43250.50, timestamp: 1707220800000 }
});

socket.on("historical_data", (data) => {
  // { symbol: 'BTCUSDT', data: [...] }
});

socket.on("interval_data", (data) => {
  // { symbol: 'BTCUSDT', intervals: [...] }
});
```

#### Unsubscribe from Symbol

```javascript
socket.emit("unsubscribe", { symbol: "BTCUSDT" });
```

**Server Response:**

```javascript
socket.on("unsubscription_confirmed", (data) => {
  // { symbol: 'BTCUSDT' }
});
```

#### Get All Symbols

```javascript
socket.emit("get_all_symbols");
```

**Server Response:**

```javascript
socket.on("all_symbols", (data) => {
  // { symbols: ['BTCUSDT', 'ETHUSDT', ...] }
});
```

#### Get Multiple Prices

```javascript
socket.emit("get_multiple_prices", {
  symbols: ["BTCUSDT", "ETHUSDT", "BNBUSDT"],
});
```

**Server Response:**

```javascript
socket.on("multiple_prices", (data) => {
  // {
  //   prices: [
  //     { symbol: 'BTCUSDT', price: 43250.50, timestamp: 1707220800000 },
  //     { symbol: 'ETHUSDT', price: 2450.75, timestamp: 1707220800000 },
  //     ...
  //   ]
  // }
});
```

#### Get Interval Data

```javascript
socket.emit("get_interval_data", {
  symbol: "BTCUSDT",
  intervalStartTime: "2024-02-06T09:00:00Z",
  intervalHour: 9,
});
```

**Server Response:**

```javascript
socket.on("interval_data_response", (data) => {
  // {
  //   symbol: 'BTCUSDT',
  //   data: {
  //     open: 43100.00,
  //     close: 43250.50,
  //     high: 43300.00,
  //     low: 43050.00,
  //     ...
  //   }
  // }
});
```

#### Get Recent Intervals

```javascript
socket.emit("get_recent_intervals", {
  symbol: "BTCUSDT",
  count: 6,
});
```

**Server Response:**

```javascript
socket.on("recent_intervals", (data) => {
  // {
  //   symbol: 'BTCUSDT',
  //   intervals: [...]
  // }
});
```

### Server → Client Events

#### Price Update (Automatic, every 1 second)

```javascript
socket.on("price_update", (data) => {
  console.log(data);
  // {
  //   symbol: 'BTCUSDT',
  //   price: 43250.50,
  //   timestamp: 1707220800000
  // }
});
```

#### Historical Data (On subscription)

```javascript
socket.on("historical_data", (data) => {
  console.log(data);
  // {
  //   symbol: 'BTCUSDT',
  //   data: [
  //     { price: 43100.00, timestamp: 1707220740000 },
  //     { price: 43150.25, timestamp: 1707220745000 },
  //     ...
  //   ]
  // }
});
```

#### Interval Data (On subscription)

```javascript
socket.on("interval_data", (data) => {
  console.log(data);
  // {
  //   symbol: 'BTCUSDT',
  //   intervals: [
  //     {
  //       intervalStartTime: '2024-02-06T09:00:00.000Z',
  //       intervalHour: 9,
  //       open: 43100.00,
  //       close: 43250.50,
  //       high: 43300.00,
  //       low: 43050.00,
  //       ...
  //     },
  //     ...
  //   ]
  // }
});
```

#### Error Handling

```javascript
socket.on("error", (data) => {
  console.error(data.message);
});
```

---

## Data Structures

### Interval Hours

The system uses 4-hour intervals starting at:

- **01:00** (1 AM)
- **05:00** (5 AM)
- **09:00** (9 AM)
- **13:00** (1 PM)
- **17:00** (5 PM)
- **21:00** (9 PM)

Each interval is 4 hours long. For example:

- Interval 9: 09:00:00 to 12:59:59
- Interval 13: 13:00:00 to 16:59:59

### Price Data Object

```typescript
{
  symbol: string;           // e.g., "BTCUSDT"
  price: number;            // Current price
  timestamp: Date;          // When this price was recorded
  intervalHour: number;     // 1, 5, 9, 13, 17, or 21
  intervalStartTime: Date;  // Start of the 4-hour interval
  volume?: number;          // Trading volume
  high?: number;            // High price in interval
  low?: number;             // Low price in interval
  open?: number;            // Opening price
  close?: number;           // Closing price
}
```

### Aggregated Interval Data

```typescript
{
  symbol: string;
  intervalStartTime: Date;
  intervalHour: number;
  open: number; // First price in interval
  close: number; // Last price in interval
  high: number; // Highest price in interval
  low: number; // Lowest price in interval
  avgPrice: number; // Average price
  volume: number; // Total volume
  count: number; // Number of data points
  firstTimestamp: Date;
  lastTimestamp: Date;
}
```

---

## Error Responses

All errors follow this format:

```json
{
  "success": false,
  "message": "Error description",
  "statusCode": 400,
  "errorMessages": [
    {
      "path": "fieldName",
      "message": "Specific error message"
    }
  ]
}
```

### Common HTTP Status Codes

- `200` - Success
- `201` - Created
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `500` - Internal Server Error

---

## Rate Limiting & Performance

- **REST API**: No rate limiting currently
- **WebSocket**:
  - Price updates: Every 1 second
  - Connection limit: No limit currently
  - Max subscriptions per client: Unlimited

---

## Example Frontend Integration

### Complete React Example

```jsx
import { useEffect, useState } from "react";
import { io } from "socket.io-client";

function PriceTracker() {
  const [socket, setSocket] = useState(null);
  const [price, setPrice] = useState(null);
  const [symbol, setSymbol] = useState("BTCUSDT");

  useEffect(() => {
    // Connect to server
    const newSocket = io("http://localhost:5000");
    setSocket(newSocket);

    // Setup event listeners
    newSocket.on("connect", () => {
      console.log("Connected!");
      newSocket.emit("subscribe", { symbol });
    });

    newSocket.on("price_update", (data) => {
      setPrice(data);
    });

    newSocket.on("subscription_confirmed", (data) => {
      console.log("Subscribed to:", data.symbol);
    });

    // Cleanup
    return () => {
      newSocket.emit("unsubscribe", { symbol });
      newSocket.disconnect();
    };
  }, [symbol]);

  return (
    <div>
      <h1>{symbol}</h1>
      {price && (
        <div>
          <h2>${price.price.toLocaleString()}</h2>
          <small>{new Date(price.timestamp).toLocaleString()}</small>
        </div>
      )}
    </div>
  );
}
```

---

## Support & Contributing

For issues, questions, or contributions, please refer to the main repository.

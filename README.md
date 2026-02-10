# Binance Statistics

A real-time cryptocurrency price tracking and analytics platform that handles millions of data points from Binance WebSocket streams.

🔗 **Live Demo:** [https://binance-statistics.vercel.app/](https://binance-statistics.vercel.app/)

## 📋 Overview

This project is designed to efficiently handle and process millions of real-time cryptocurrency price data points from Binance. It provides a dashboard for monitoring live price changes, historical data visualization, and user authentication.

### Future Plans

- 🤖 Automated trading bot with customizable buy/sell conditions
- 📊 Advanced analytics and price prediction algorithms
- 🔔 Price alerts and notifications
- 📈 Portfolio tracking and management

## 🛠️ Tech Stack

### Backend

- **Node.js** & **Express** - Server framework
- **TypeScript** - Type safety
- **MongoDB** - Database for storing price history
- **Redis** - Caching and real-time data management
- **Socket.IO** - Real-time bidirectional communication
- **WebSocket** - Binance API connection
- **JWT** - Authentication
- **Zod** - Validation

### Frontend

- **React** - UI framework
- **Vite** - Build tool
- **Redux Toolkit** - State management
- **Tailwind CSS** - Styling
- **Shadcn UI** - Component library
- **Recharts** & **Lightweight Charts** - Data visualization
- **Socket.IO Client** - Real-time updates
- **React Router** - Navigation

## 📦 Project Structure

```
├── binance_backend/     # Node.js backend server
│   └── src/
│       ├── app/
│       │   ├── modules/     # Feature modules (User, Symbol, PriceData)
│       │   ├── services/    # Core services (Binance, WebSocket, Redis)
│       │   ├── middlewares/ # Auth, validation, error handling
│       │   └── routes/      # API routes
│       └── server.ts
│
└── binance_frontend/    # React frontend application
    └── src/
        ├── components/  # UI components
        ├── pages/       # Page components
        ├── redux/       # State management
        └── services/    # WebSocket service
```

## 🚀 Getting Started

### Prerequisites

- Node.js (v16 or higher)
- MongoDB
- Redis (optional, for caching)
- npm or yarn

### Backend Setup

1. Navigate to backend directory:

```bash
cd binance_backend
```

2. Install dependencies:

```bash
npm install
```

3. Create `.env` file:

```env
NODE_ENV=development
PORT=5000
DATABASE_URL=your_mongodb_connection_string
FRONTEND_URL=http://localhost:5173
JWT_SECRET=your_jwt_secret
REDIS_URL=your_redis_url (optional)
```

4. Seed symbols (optional):

```bash
npm run seed:symbols
```

5. Start development server:

```bash
npm run dev
```

### Frontend Setup

1. Navigate to frontend directory:

```bash
cd binance_frontend
```

2. Install dependencies:

```bash
npm install
```

3. Create `.env` file:

```env
VITE_API_URL=http://localhost:5000/api/v1
VITE_SOCKET_URL=http://localhost:5000
```

4. Start development server:

```bash
npm run dev
```

The frontend will be available at `http://localhost:5173`

## 🔧 Available Scripts

### Backend

- `npm run dev` - Start development server with hot reload
- `npm run build` - Build TypeScript to JavaScript
- `npm start` - Start production server
- `npm run seed:symbols` - Seed cryptocurrency symbols to database
- `npm run lint` - Run ESLint
- `npm run prettier` - Format code

### Frontend

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

## 🌟 Key Features

- ✅ Real-time cryptocurrency price tracking via Binance WebSocket
- ✅ Efficient handling of millions of data points
- ✅ User authentication and authorization
- ✅ Interactive price charts and visualizations
- ✅ Live price updates using Socket.IO
- ✅ Redis caching for improved performance
- ✅ Responsive dashboard design
- ✅ Error handling and validation

## 📊 How It Works

1. **Data Collection**: Backend connects to Binance WebSocket API and subscribes to multiple cryptocurrency pairs
2. **Data Processing**: Incoming price data is buffered, validated, and stored in MongoDB
3. **Caching**: Redis caches frequently accessed data for faster retrieval
4. **Real-time Updates**: Socket.IO broadcasts price updates to connected clients
5. **Visualization**: Frontend displays live charts and price information

## 🤝 Contributing

Contributions are welcome! Feel free to open issues or submit pull requests.

## 👤 Author

Your Trading Assistant

---

**Note**: This project is for educational purposes. Always do your own research before making any trading decisions.

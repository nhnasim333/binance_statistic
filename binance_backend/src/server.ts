import app from "./app";
import mongoose from "mongoose";
import config from "./app/config/index";
import seedSuperAdmin from "./app/DB";
import { createServer } from "http";
import { webSocketServerService } from "./app/services/websocket.service";
import { binanceWebSocketService } from "./app/services/binance.service";
import { redisService } from "./app/services/redis.service";

// Create HTTP server
const httpServer = createServer(app);

async function main() {
  try {
    // Connect to MongoDB
    await mongoose.connect(config.database_url as string);
    // eslint-disable-next-line no-console
    console.log("✅ MongoDB connected");

    // Seed super admin
    await seedSuperAdmin();

    // Initialize Socket.IO server
    webSocketServerService.initialize(httpServer);

    // Connect to Binance WebSocket (after a short delay to ensure DB is ready)
    setTimeout(async () => {
      await binanceWebSocketService.connect();
    }, 2000);

    // Start HTTP server
    httpServer.listen(config.port, () => {
      // eslint-disable-next-line no-console
      console.log(`🚀 Server running on port ${config.port}`);
      // eslint-disable-next-line no-console
      console.log(`📊 WebSocket server ready for frontend connections`);
    });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error("❌ Server startup error:", error);
    process.exit(1);
  }
}

// Graceful shutdown
process.on("SIGTERM", async () => {
  // eslint-disable-next-line no-console
  console.log("⚠️ SIGTERM signal received: closing HTTP server");
  
  binanceWebSocketService.disconnect();
  webSocketServerService.shutdown();
  await redisService.disconnect();
  
  httpServer.close(() => {
    // eslint-disable-next-line no-console
    console.log("✅ HTTP server closed");
    mongoose.connection.close().then(() => {
      // eslint-disable-next-line no-console
      console.log("✅ MongoDB connection closed");
      process.exit(0);
    });
  });
});

process.on("SIGINT", async () => {
  // eslint-disable-next-line no-console
  console.log("⚠️ SIGINT signal received: closing HTTP server");
  
  binanceWebSocketService.disconnect();
  webSocketServerService.shutdown();
  await redisService.disconnect();
  
  httpServer.close(() => {
    // eslint-disable-next-line no-console
    console.log("✅ HTTP server closed");
    mongoose.connection.close().then(() => {
      // eslint-disable-next-line no-console
      console.log("✅ MongoDB connection closed");
      process.exit(0);
    });
  });
});

main();

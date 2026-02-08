import { Server as HTTPServer } from "http";
import { Server as SocketIOServer, Socket } from "socket.io";
import { redisService } from "./redis.service";
import { PriceDataService } from "../modules/PriceData/priceData.service";

/* eslint-disable no-console */

// interface ClientSubscription {
//   socketId: string;
//   symbols: Set<string>;
// }

class WebSocketService {
  private io: SocketIOServer | null = null;
  private subscriptions: Map<string, Set<string>> = new Map(); // socketId -> Set of symbols
  private broadcastInterval: ReturnType<typeof setInterval> | null = null;

  // Initialize Socket.IO server
  initialize(httpServer: HTTPServer) {
    this.io = new SocketIOServer(httpServer, {
      cors: {
        origin: "*", // Update this in production to your frontend URL
        methods: ["GET", "POST"],
      },
      transports: ["websocket", "polling"],
    });

    this.setupEventHandlers();
    this.startBroadcast();

    console.log("✅ Socket.IO server initialized");
  }

  // Setup event handlers for client connections
  private setupEventHandlers() {
    if (!this.io) return;

    this.io.on("connection", (socket: Socket) => {
      console.log(`🔗 Client connected: ${socket.id}`);

      // Initialize subscription set for this client
      this.subscriptions.set(socket.id, new Set());

      // Handle subscribe event
      socket.on("subscribe", async (data: { symbols: string[] }) => {
        try {
          const { symbols } = data;
          const clientSubscriptions = this.subscriptions.get(socket.id);

          if (!clientSubscriptions) return;

          // Add symbols to client's subscription
          symbols.forEach((symbol) => {
            clientSubscriptions.add(symbol.toUpperCase());
          });

          console.log(
            `📊 Client ${socket.id} subscribed to ${symbols.length} symbols`
          );

          // Send initial data for subscribed symbols
          await this.sendInitialData(socket, symbols);

          // Acknowledge subscription
          socket.emit("subscribed", {
            symbols,
            timestamp: Date.now(),
          });
        } catch (error) {
          console.error("❌ Error handling subscribe:", error);
          socket.emit("error", { message: "Subscription failed" });
        }
      });

      // Handle unsubscribe event
      socket.on("unsubscribe", (data: { symbols: string[] }) => {
        try {
          const { symbols } = data;
          const clientSubscriptions = this.subscriptions.get(socket.id);

          if (!clientSubscriptions) return;

          // Remove symbols from client's subscription
          symbols.forEach((symbol) => {
            clientSubscriptions.delete(symbol.toUpperCase());
          });

          console.log(
            `📊 Client ${socket.id} unsubscribed from ${symbols.length} symbols`
          );

          // Acknowledge unsubscription
          socket.emit("unsubscribed", {
            symbols,
            timestamp: Date.now(),
          });
        } catch (error) {
          console.error("❌ Error handling unsubscribe:", error);
        }
      });

      // Handle get historical data request
      socket.on(
  "get_historical",
  async (data: { symbol: string; intervalHour?: number }) => {
    try {
      const { symbol } = data;
      const upperSymbol = symbol.toUpperCase();
      
      // Get current interval information
      const now = new Date();
      const currentIntervalHour = PriceDataService.getIntervalHour(now);
      const currentIntervalStart = PriceDataService.getIntervalStartTime(now);
      
      console.log(`📊 Fetching historical data for ${upperSymbol}, interval: ${currentIntervalHour}:00 UTC`);
      
      // Get all data from current interval start to now
      let historicalData = await PriceDataService.getPriceDataBySymbol(
        upperSymbol,
        currentIntervalStart,
        now
      );
      
      console.log(`📊 Found ${historicalData?.length || 0} data points for ${upperSymbol} in current interval`);
      
      // If no data in current interval, try to get recent data (last hour)
      if (!historicalData || historicalData.length === 0) {
        console.log(`⚠️ No interval data for ${upperSymbol}, fetching last hour data...`);
        const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
        historicalData = await PriceDataService.getPriceDataBySymbol(
          upperSymbol,
          oneHourAgo,
          now
        );
      }

      socket.emit("historical_data", {
        symbol: upperSymbol,
        intervalHour: currentIntervalHour,
        intervalStartTime: currentIntervalStart,
        data: historicalData || [],
        timestamp: Date.now(),
      });
      
      console.log(`✅ Sent ${historicalData?.length || 0} data points for ${upperSymbol}`);
    } catch (error) {
      console.error("❌ Error fetching historical data:", error);
      socket.emit("error", { message: "Failed to fetch historical data" });
    }
  }
);

      // Handle disconnect
      socket.on("disconnect", () => {
        console.log(`🔌 Client disconnected: ${socket.id}`);
        this.subscriptions.delete(socket.id);
      });
    });
  }

  // Send initial data when client subscribes
  private async sendInitialData(socket: Socket, symbols: string[]) {
    try {
      const initialData = await Promise.all(
        symbols.map(async (symbol) => {
          const upperSymbol = symbol.toUpperCase();
          
          // Get current price from Redis
          const currentPrice = await redisService.getRealtimePrice(upperSymbol);
          
          // Get recent time-series data
          const timeSeries = await redisService.getTimeSeriesData(
            upperSymbol,
            60
          );

          // Get interval data for all 4-hour intervals
          const intervals = [1, 5, 9, 13, 17, 21];
          const intervalData = await Promise.all(
            intervals.map(async (hour) => {
              const data = await PriceDataService.getRecentIntervals(
                upperSymbol,
                hour
              );
              return { intervalHour: hour, data };
            })
          );

          return {
            symbol: upperSymbol,
            currentPrice,
            timeSeries,
            intervals: intervalData,
          };
        })
      );

      socket.emit("initial_data", {
        data: initialData,
        timestamp: Date.now(),
      });
    } catch (error) {
      console.error("❌ Error sending initial data:", error);
    }
  }

  // Broadcast price updates every 1 second to all subscribed clients
  private startBroadcast() {
    if (this.broadcastInterval) {
      clearInterval(this.broadcastInterval);
    }

    this.broadcastInterval = setInterval(async () => {
      await this.broadcastPriceUpdates();
    }, 1000); // Broadcast every 1 second
  }

  // Broadcast price updates to subscribed clients
  private async broadcastPriceUpdates() {
    if (!this.io || this.subscriptions.size === 0) return;

    try {
      // Collect all unique symbols that clients are subscribed to
      const allSubscribedSymbols = new Set<string>();
      this.subscriptions.forEach((symbols) => {
        symbols.forEach((symbol) => allSubscribedSymbols.add(symbol));
      });

      if (allSubscribedSymbols.size === 0) return;

      // Get latest prices from Redis for all subscribed symbols
      const priceUpdates = await Promise.all(
        Array.from(allSubscribedSymbols).map(async (symbol) => {
          const priceData = await redisService.getRealtimePrice(symbol);
          return { 
            symbol, 
            price: priceData?.price, 
            priceChangePercent: priceData?.priceChangePercent || 0,
            timestamp: Date.now() 
          };
        })
      );

      // Broadcast to each client only the symbols they're subscribed to
      this.subscriptions.forEach((subscribedSymbols, socketId) => {
        const socket = this.io?.sockets.sockets.get(socketId);
        if (!socket) return;

        const clientUpdates = priceUpdates.filter((update) =>
          subscribedSymbols.has(update.symbol)
        );

        if (clientUpdates.length > 0) {
          socket.emit("price_update", {
            updates: clientUpdates,
            timestamp: Date.now(),
          });
        }
      });
    } catch (error) {
      console.error("❌ Error broadcasting price updates:", error);
    }
  }

  // Broadcast interval update when new 4-hour interval data is available
  async broadcastIntervalUpdate(symbol: string, intervalHour: number) {
    if (!this.io) return;

    try {
      const data = await PriceDataService.getRecentIntervals(
        symbol,
        1
      );

      // Broadcast to all clients subscribed to this symbol
      this.subscriptions.forEach((subscribedSymbols, socketId) => {
        if (!subscribedSymbols.has(symbol)) return;

        const socket = this.io?.sockets.sockets.get(socketId);
        if (!socket) return;

        socket.emit("interval_update", {
          symbol,
          intervalHour,
          data,
          timestamp: Date.now(),
        });
      });
    } catch (error) {
      console.error("❌ Error broadcasting interval update:", error);
    }
  }

  // Get total connected clients
  getConnectedClients(): number {
    return this.io?.sockets.sockets.size || 0;
  }

    // Get active subscriptions count
    getActiveSubscriptionsCount(): number {
    let count = 0;
    this.subscriptions.forEach((symbols) => {
        count += symbols.size;
    });
    return count;
    }

    // Get connected clients count
    getConnectedClientsCount(): number {
    return this.getConnectedClients();
    }

  // Get subscription statistics
  getSubscriptionStats() {
    const stats = {
      totalClients: this.getConnectedClients(),
      totalSubscriptions: 0,
      symbolSubscriptionCounts: new Map<string, number>(),
    };

    this.subscriptions.forEach((symbols) => {
      stats.totalSubscriptions += symbols.size;
      symbols.forEach((symbol) => {
        const count = stats.symbolSubscriptionCounts.get(symbol) || 0;
        stats.symbolSubscriptionCounts.set(symbol, count + 1);
      });
    });

    return stats;
  }

  // Shutdown gracefully
  shutdown() {
    if (this.broadcastInterval) {
      clearInterval(this.broadcastInterval);
      this.broadcastInterval = null;
    }

    if (this.io) {
      this.io.close();
      this.io = null;
    }

    this.subscriptions.clear();
    console.log("🔌 WebSocket service shut down");
  }
}

// Export singleton instance
export const webSocketServerService = new WebSocketService();

import WebSocket from "ws";
import { redisService } from "./redis.service";
import { PriceDataService } from "../modules/PriceData/priceData.service";
import { SymbolService } from "../modules/Symbol/symbol.service";

/* eslint-disable no-console */

interface BinanceTicker {
  e: string; // Event type
  E: number; // Event time
  s: string; // Symbol
  p: string; // Price change
  P: string; // Price change percent
  w: string; // Weighted average price
  c: string; // Last price
  Q: string; // Last quantity
  o: string; // Open price
  h: string; // High price
  l: string; // Low price
  v: string; // Total traded base asset volume
  q: string; // Total traded quote asset volume
}

interface WebSocketConnection {
  ws: WebSocket;
  symbols: string[];
  reconnectAttempts: number;
}

class BinanceWebSocketService {
  private connections: WebSocketConnection[] = [];
  private symbols: string[] = [];
  private maxReconnectAttempts = 10;
  private reconnectDelay = 5000;
  private saveToDbInterval: ReturnType<typeof setInterval> | null = null;
  private cleanupInterval: ReturnType<typeof setTimeout> | null = null;
  private priceBuffer: Map<string, any[]> = new Map();
  private readonly SYMBOLS_PER_CONNECTION = 60; // 60 symbols per WebSocket connection
  private isInitialized = false;

  constructor() {
    // Don't initialize symbols in constructor - wait for connect() to be called
  }

  // Initialize symbols from database
  private async initializeSymbols() {
    try {
      const symbolsList = await SymbolService.getAllSymbolsList();
      this.symbols = symbolsList.map((s) => s.toLowerCase());
      
      if (this.symbols.length > 0) {
        console.log(`📊 Loaded ${this.symbols.length} symbols for tracking`);
        await redisService.setActiveSymbols(this.symbols);
      } else {
        console.warn("⚠️ No symbols found in database. Please add symbols first.");
      }
    } catch (error) {
      console.error("❌ Error loading symbols:", error);
    }
  }

  // Connect to Binance WebSocket
  async connect() {
    // Initialize symbols first if not already done
    if (!this.isInitialized) {
      await this.initializeSymbols();
      this.isInitialized = true;
    }

    if (this.symbols.length === 0) {
      console.warn("⚠️ No symbols to track. Retrying in 10 seconds...");
      setTimeout(() => this.connect(), 10000);
      return;
    }

    try {
      // Split symbols into chunks for multiple WebSocket connections
      const symbolChunks = this.chunkArray(this.symbols, this.SYMBOLS_PER_CONNECTION);
      
      console.log(`🔌 Connecting to Binance WebSocket...`);
      console.log(`📊 Creating ${symbolChunks.length} WebSocket connections for ${this.symbols.length} symbols`);
      
      // Create a WebSocket connection for each chunk
      symbolChunks.forEach((chunk, index) => {
        this.createConnection(chunk, index);
      });

      // Start periodic save to database
      this.startPeriodicSave();
      
      // Start automatic cleanup scheduler
      this.scheduleNextCleanup();
    } catch (error) {
      console.error("❌ Error connecting to Binance WebSocket:", error);
    }
  }

  // Create a single WebSocket connection for a chunk of symbols
  private createConnection(symbols: string[], connectionIndex: number) {
    try {
      const streams = symbols.map((symbol) => `${symbol}@ticker`).join("/");
      const wsUrl = `wss://stream.binance.com:9443/stream?streams=${streams}`;

      const ws = new WebSocket(wsUrl);
      const connection: WebSocketConnection = {
        ws,
        symbols,
        reconnectAttempts: 0,
      };

      ws.on("open", () => {
        console.log(`✅ Connection ${connectionIndex + 1} established (${symbols.length} symbols)`);
      });

      ws.on("message", (data: WebSocket.Data) => {
        this.handleMessage(data);
      });

      ws.on("error", (error) => {
        console.error(`❌ Connection ${connectionIndex + 1} error:`, error.message);
      });

      ws.on("close", () => {
        console.log(`🔌 Connection ${connectionIndex + 1} closed`);
        this.handleReconnect(connection, connectionIndex);
      });

      ws.on("ping", () => {
        ws.pong();
      });

      this.connections.push(connection);
    } catch (error) {
      console.error(`❌ Error creating connection ${connectionIndex + 1}:`, error);
    }
  }

  // Utility to split array into chunks
  private chunkArray<T>(array: T[], chunkSize: number): T[][] {
    const chunks: T[][] = [];
    for (let i = 0; i < array.length; i += chunkSize) {
      chunks.push(array.slice(i, i + chunkSize));
    }
    return chunks;
  }

  // Handle incoming messages
  private handleMessage(data: WebSocket.Data) {
    try {
      const message = JSON.parse(data.toString());
      
      // Binance stream format: { stream: "btcusdt@ticker", data: {...} }
      if (message.stream && message.data) {
        const tickerData: BinanceTicker = message.data;
        this.processTickerData(tickerData);
      }
    } catch (error) {
      console.error("❌ Error parsing WebSocket message:", error);
    }
  }

  // Process ticker data
  private async processTickerData(ticker: BinanceTicker) {
    try {
      const symbol = ticker.s;
      const price = parseFloat(ticker.c);
      const timestamp = Date.now();
      const volume = parseFloat(ticker.v);
      const high = parseFloat(ticker.h);
      const low = parseFloat(ticker.l);
      const open = parseFloat(ticker.o);

      // Store in Redis for real-time access
      await redisService.setRealtimePrice(symbol, price, timestamp);
      await redisService.addPriceToTimeSeries(symbol, price, timestamp);

      // Buffer data for batch save to database
      if (!this.priceBuffer.has(symbol)) {
        this.priceBuffer.set(symbol, []);
      }

      this.priceBuffer.get(symbol)!.push({
        symbol,
        price,
        timestamp: new Date(timestamp),
        volume,
        high,
        low,
        open,
      });

    } catch (error) {
      console.error(`❌ Error processing ticker data for ${ticker.s}:`, error);
    }
  }

  // Start periodic save to database (every 5 seconds to reduce DB load)
  private startPeriodicSave() {
    if (this.saveToDbInterval) {
      clearInterval(this.saveToDbInterval);
    }

    this.saveToDbInterval = setInterval(async () => {
      await this.savePriceDataToDb();
    }, 5000); // Save every 5 seconds
  }

  // Schedule cleanup at the start of next 4-hour interval
  private scheduleNextCleanup() {
    if (this.cleanupInterval) {
      clearTimeout(this.cleanupInterval);
    }

    const nextIntervalTime = PriceDataService.getNextIntervalTime();
    const now = new Date();
    const msUntilNextInterval = nextIntervalTime.getTime() - now.getTime();

    console.log(
      `🧹 Next cleanup scheduled at ${nextIntervalTime.toLocaleString()} (in ${Math.round(msUntilNextInterval / 1000 / 60)} minutes)`
    );

    this.cleanupInterval = setTimeout(async () => {
      await this.performCleanup();
      // Schedule next cleanup
      this.scheduleNextCleanup();
    }, msUntilNextInterval);
  }

  // Perform cleanup of old price data
  private async performCleanup() {
    try {
      console.log("🧹 Starting automatic cleanup of previous interval data...");
      await PriceDataService.cleanupPreviousIntervalData();
    } catch (error) {
      console.error("❌ Error during cleanup:", error);
    }
  }

  // Save buffered price data to database
  private async savePriceDataToDb() {
    if (this.priceBuffer.size === 0) return;

    try {
      const savePromises: Promise<any>[] = [];

      // Process each symbol's buffered data
      for (const [symbol, prices] of this.priceBuffer.entries()) {
        if (prices.length === 0) continue;

        // Take average of buffered prices for this interval
        const avgPrice =
          prices.reduce((sum, p) => sum + p.price, 0) / prices.length;
        const lastPrice = prices[prices.length - 1];

        savePromises.push(
          PriceDataService.savePriceData({
            symbol,
            price: avgPrice,
            timestamp: lastPrice.timestamp,
            volume: prices.reduce((sum, p) => sum + (p.volume || 0), 0),
          })
        );
      }

      // Save all in parallel
      await Promise.allSettled(savePromises);

      // Clear buffer
      this.priceBuffer.clear();

      console.log(`💾 Saved price data for ${savePromises.length} symbols`);
    } catch (error) {
      console.error("❌ Error saving price data to database:", error);
    }
  }

  // Handle reconnection for a specific connection
  private handleReconnect(connection: WebSocketConnection, connectionIndex: number) {
    if (connection.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error(`❌ Connection ${connectionIndex + 1} max reconnection attempts reached.`);
      return;
    }

    connection.reconnectAttempts++;
    const delay = this.reconnectDelay * connection.reconnectAttempts;

    console.log(
      `🔄 Reconnecting connection ${connectionIndex + 1} in ${delay / 1000}s (attempt ${connection.reconnectAttempts}/${this.maxReconnectAttempts})...`
    );

    setTimeout(() => {
      // Remove old connection
      const index = this.connections.findIndex(c => c === connection);
      if (index !== -1) {
        this.connections.splice(index, 1);
      }
      // Create new connection
      this.createConnection(connection.symbols, connectionIndex);
    }, delay);
  }

  // Disconnect from WebSocket
  disconnect() {
    if (this.saveToDbInterval) {
      clearInterval(this.saveToDbInterval);
      this.saveToDbInterval = null;
    }

    if (this.cleanupInterval) {
      clearTimeout(this.cleanupInterval);
      this.cleanupInterval = null;
    }

    this.connections.forEach((connection, index) => {
      if (connection.ws) {
        connection.ws.close();
        console.log(`🔌 Disconnected connection ${index + 1}`);
      }
    });

    this.connections = [];
    console.log("🔌 Disconnected from all Binance WebSocket connections");
  }

  // Get connection status
  getConnectionStatus(): boolean {
    return this.connections.length > 0 && this.connections.every(c => c.ws.readyState === WebSocket.OPEN);
  }

  // Reload symbols (useful when new symbols are added)
  async reloadSymbols() {
    console.log("🔄 Reloading symbols...");
    this.isInitialized = false;
    await this.initializeSymbols();
    this.isInitialized = true;
    
    // Reconnect with new symbols
    this.disconnect();
    setTimeout(() => this.connect(), 1000);
  }

  // Get current price from Redis
  async getCurrentPrice(symbol: string) {
    return await redisService.getRealtimePrice(symbol.toUpperCase());
  }

  // Get time-series data from Redis
  async getTimeSeriesData(symbol: string, limit: number = 100) {
    return await redisService.getTimeSeriesData(symbol.toUpperCase(), limit);
  }
}

// Export singleton instance
export const binanceWebSocketService = new BinanceWebSocketService();

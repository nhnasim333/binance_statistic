/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable no-unused-vars */
import Redis from "ioredis";
import config from "../config";

/* eslint-disable no-console */

class RedisService {
  private client: Redis;
  private subscriber: Redis;
  private isConnected: boolean = false;

  constructor() {
    // Redis client configuration
    interface RedisConfig {
        host: string;
        port: number;
        password?: string;
        retryStrategy: (times: number) => number | null;
        lazyConnect: boolean;
    }

    const redisConfig: RedisConfig = {
        host: config.redis_host || "localhost",
        port: Number(config.redis_port) || 6379,
        lazyConnect: true,
        retryStrategy: (times: number): number | null => {
            if (times > 3) {
                console.warn("⚠️ Redis not available - continuing without cache");
                return null;
            }
            const delay = Math.min(times * 50, 2000);
            return delay;
        },
    };

    // Only add password if it exists
    if (config.redis_password) {
      redisConfig.password = config.redis_password;
    }

    // Create Redis client
    this.client = new Redis(redisConfig);

    // Subscriber config (without retryStrategy)
    const subscriberConfig: any = {
      host: config.redis_host || "localhost",
      port: Number(config.redis_port) || 6379,
      lazyConnect: true,
    };

    if (config.redis_password) {
      subscriberConfig.password = config.redis_password;
    }

    // Create separate subscriber client
    this.subscriber = new Redis(subscriberConfig);

    // Try to connect gracefully
    this.client.connect().catch(() => {
      console.warn("⚠️ Redis client not available - running without cache");
      this.isConnected = false;
    });

    this.subscriber.connect().catch(() => {
      console.warn("⚠️ Redis subscriber not available");
    });

    this.client.on("connect", () => {
      console.log("✅ Redis client connected");
      this.isConnected = true;
    });

    this.client.on("error", (err) => {
      console.error("❌ Redis client error:", err);
      this.isConnected = false;
    });

    this.subscriber.on("connect", () => {
      console.log("✅ Redis subscriber connected");
    });

    this.subscriber.on("error", (err) => {
      console.error("❌ Redis subscriber error:", err);
    });
  }

  // Check if connected
  isClientConnected(): boolean {
    return this.isConnected;
  }

  // Store real-time price data (expires after 1 hour)
  async setRealtimePrice(
    symbol: string,
    price: number,
    timestamp: number,
    priceChangePercent?: number
  ): Promise<void> {
    const key = `price:${symbol}`;
    const data = JSON.stringify({ symbol, price, timestamp, priceChangePercent });
    await this.client.setex(key, 3600, data); // Expires in 1 hour
  }

  // Get real-time price data
  async getRealtimePrice(symbol: string): Promise<any | null> {
    const key = `price:${symbol}`;
    const data = await this.client.get(key);
    return data ? JSON.parse(data) : null;
  }

  // Store price in a sorted set for time-series data (last 4 hours)
  async addPriceToTimeSeries(
    symbol: string,
    price: number,
    timestamp: number
  ): Promise<void> {
    const key = `timeseries:${symbol}`;
    const score = timestamp; // Use timestamp as score for sorting
    const value = JSON.stringify({ price, timestamp });

    // Add to sorted set
    await this.client.zadd(key, score, value);

    // Keep only last 4 hours of data (14400 seconds)
    const fourHoursAgo = Date.now() - 4 * 60 * 60 * 1000;
    await this.client.zremrangebyscore(key, 0, fourHoursAgo);

    // Set expiration to 5 hours
    await this.client.expire(key, 18000);
  }

  // Get time-series data for a symbol (last N entries)
  async getTimeSeriesData(
    symbol: string,
    limit: number = 100
  ): Promise<any[]> {
    const key = `timeseries:${symbol}`;
    const data = await this.client.zrevrange(key, 0, limit - 1);
    return data.map((item) => JSON.parse(item));
  }

  // Get time-series data within a time range
  async getTimeSeriesDataByRange(
    symbol: string,
    startTime: number,
    endTime: number
  ): Promise<any[]> {
    const key = `timeseries:${symbol}`;
    const data = await this.client.zrangebyscore(
      key,
      startTime,
      endTime
    );
    return data.map((item) => JSON.parse(item));
  }

  // Store all active symbols list
  async setActiveSymbols(symbols: string[]): Promise<void> {
    const key = "active:symbols";
    await this.client.setex(key, 3600, JSON.stringify(symbols));
  }

  // Get all active symbols
  async getActiveSymbols(): Promise<string[] | null> {
    const key = "active:symbols";
    const data = await this.client.get(key);
    return data ? JSON.parse(data) : null;
  }

  // Publish price update to subscribers
  async publishPriceUpdate(symbol: string, priceData: any): Promise<void> {
    const channel = `price:updates:${symbol}`;
    await this.client.publish(channel, JSON.stringify(priceData));
  }

  // Subscribe to price updates for a symbol
  subscribeToPriceUpdates(
    symbol: string,
    callback: (_message: string) => void
  ): void {
    const channel = `price:updates:${symbol}`;
    this.subscriber.subscribe(channel);
    this.subscriber.on("message", (ch, message) => {
      if (ch === channel) {
        callback(message);
      }
    });
  }

  // Unsubscribe from price updates
  unsubscribeFromPriceUpdates(symbol: string): void {
    const channel = `price:updates:${symbol}`;
    this.subscriber.unsubscribe(channel);
  }

  // Get multiple real-time prices
  async getMultipleRealtimePrices(symbols: string[]): Promise<any[]> {
    const keys = symbols.map((symbol) => `price:${symbol}`);
    const data = await this.client.mget(...keys);
    return data
      .map((item, _index) => {
        if (item) {
          return JSON.parse(item);
        }
        return null;
      })
      .filter((item) => item !== null);
  }

  // Store interval aggregated data
  async setIntervalData(
    symbol: string,
    intervalStartTime: number,
    intervalHour: number,
    data: any
  ): Promise<void> {
    const key = `interval:${symbol}:${intervalStartTime}:${intervalHour}`;
    await this.client.setex(key, 86400, JSON.stringify(data)); // Expires in 24 hours
  }

  // Get interval aggregated data
  async getIntervalData(
    symbol: string,
    intervalStartTime: number,
    intervalHour: number
  ): Promise<any | null> {
    const key = `interval:${symbol}:${intervalStartTime}:${intervalHour}`;
    const data = await this.client.get(key);
    return data ? JSON.parse(data) : null;
  }

  // Clear all data for a symbol
  async clearSymbolData(symbol: string): Promise<void> {
    const keys = await this.client.keys(`*:${symbol}*`);
    if (keys.length > 0) {
      await this.client.del(...keys);
    }
  }

  // Close connections
  async disconnect(): Promise<void> {
    await this.client.quit();
    await this.subscriber.quit();
    this.isConnected = false;
  }

  // Get client for direct access
  getClient(): Redis {
    return this.client;
  }

  // Get subscriber for direct access
  getSubscriber(): Redis {
    return this.subscriber;
  }
}

// Export singleton instance
export const redisService = new RedisService();

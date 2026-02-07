import { io } from "socket.io-client";

class WebSocketService {
  constructor() {
    this.socket = null;
    this.subscriptions = new Set();
    this.listeners = new Map(); // Event listeners
  }

  // Connect to WebSocket server
  connect() {
    if (this.socket?.connected) return;

    this.socket = io("http://localhost:5000", {
      transports: ["websocket", "polling"],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 10,
    });

    this.socket.on("connect", () => {
      console.log("✅ WebSocket connected:", this.socket.id);
      
      // Resubscribe to all symbols after reconnection
      if (this.subscriptions.size > 0) {
        this.socket.emit("subscribe", {
          symbols: Array.from(this.subscriptions),
        });
      }
    });

    this.socket.on("disconnect", () => {
      console.log("🔌 WebSocket disconnected");
    });

    this.socket.on("error", (error) => {
      console.error("❌ WebSocket error:", error);
    });

    // Handle price updates
    this.socket.on("price_update", (data) => {
      this.notifyListeners("price_update", data);
    });

    // Handle initial data
    this.socket.on("initial_data", (data) => {
      this.notifyListeners("initial_data", data);
    });

    // Handle interval updates
    this.socket.on("interval_update", (data) => {
      this.notifyListeners("interval_update", data);
    });

    // Handle historical data
    this.socket.on("historical_data", (data) => {
      this.notifyListeners("historical_data", data);
    });

    // Handle subscription confirmation
    this.socket.on("subscribed", (data) => {
      console.log("📊 Subscribed to:", data.symbols);
    });

    this.socket.on("unsubscribed", (data) => {
      console.log("📊 Unsubscribed from:", data.symbols);
    });
  }

  // Subscribe to symbols
  subscribe(symbols) {
    if (!this.socket) {
      console.warn("WebSocket not connected yet");
      return;
    }

    const symbolArray = Array.isArray(symbols) ? symbols : [symbols];
    symbolArray.forEach((symbol) => this.subscriptions.add(symbol));

    this.socket.emit("subscribe", { symbols: symbolArray });
  }

  // Unsubscribe from symbols
  unsubscribe(symbols) {
    if (!this.socket) return;

    const symbolArray = Array.isArray(symbols) ? symbols : [symbols];
    symbolArray.forEach((symbol) => this.subscriptions.delete(symbol));

    this.socket.emit("unsubscribe", { symbols: symbolArray });
  }

  // Get historical data for a symbol
  getHistoricalData(symbol, intervalHour) {
    if (!this.socket) return;

    this.socket.emit("get_historical", { symbol, intervalHour });
  }

  // Add event listener
  on(event, callback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event).push(callback);

    // Return unsubscribe function
    return () => this.off(event, callback);
  }

  // Remove event listener
  off(event, callback) {
    if (!this.listeners.has(event)) return;

    const eventListeners = this.listeners.get(event);
    const index = eventListeners.indexOf(callback);
    if (index > -1) {
      eventListeners.splice(index, 1);
    }
  }

  // Notify all listeners for an event
  notifyListeners(event, data) {
    if (!this.listeners.has(event)) return;

    this.listeners.get(event).forEach((callback) => {
      try {
        callback(data);
      } catch (error) {
        console.error(`Error in ${event} listener:`, error);
      }
    });
  }

  // Disconnect from WebSocket
  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
    this.subscriptions.clear();
    this.listeners.clear();
  }

  // Check connection status
  isConnected() {
    return this.socket?.connected || false;
  }
}

// Export singleton instance
export const wsService = new WebSocketService();

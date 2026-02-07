import express from "express";
import { binanceWebSocketService } from "../services/binance.service";
import { webSocketServerService } from "../services/websocket.service";
import { redisService } from "../services/redis.service";
import catchAsync from "../utils/catchAsync";
import sendResponse from "../utils/sendResponse";
import httpStatus from "http-status";

const router = express.Router();

// System status endpoint
router.get(
  "/status",
  catchAsync(async (req, res) => {
    const status = {
      server: "running",
      timestamp: new Date().toISOString(),
      services: {
        binanceWebSocket: {
          connected: binanceWebSocketService.getConnectionStatus(),
          status: binanceWebSocketService.getConnectionStatus()
            ? "connected"
            : "disconnected",
        },
        redis: {
          connected: redisService.isClientConnected(),
          status: redisService.isClientConnected()
            ? "connected"
            : "disconnected",
        },
        socketIO: {
          activeSubscriptions: webSocketServerService.getActiveSubscriptionsCount(),
          connectedClients: webSocketServerService.getConnectedClientsCount(),
        },
      },
    };

    sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: "System status retrieved successfully",
      data: status,
    });
  })
);

// Health check endpoint
router.get("/health", (req, res) => {
  res.status(200).json({
    status: "healthy",
    timestamp: new Date().toISOString(),
  });
});

export const SystemRoutes = router;

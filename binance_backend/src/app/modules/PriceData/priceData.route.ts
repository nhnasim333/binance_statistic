import express from "express";
import { PriceDataController } from "./priceData.controller";

const router = express.Router();

// Query-based endpoints (must come before param routes)
router.get("/recent", PriceDataController.getRecentPriceData);

router.get("/aggregated", PriceDataController.getRecentPriceData);

router.get("/stats/24h", PriceDataController.get24hStats);

// Param-based endpoints
router.get("/current/:symbol", PriceDataController.getCurrentPrice);

router.get("/:symbol", PriceDataController.getPriceDataBySymbol);

router.get("/:symbol/latest", PriceDataController.getLatestPrice);

router.get("/:symbol/intervals", PriceDataController.getRecentIntervals);

router.get("/:symbol/aggregated", PriceDataController.getAggregatedData);

export const PriceDataRoutes = router;

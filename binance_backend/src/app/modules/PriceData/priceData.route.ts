import express from "express";
import { PriceDataController } from "./priceData.controller";

const router = express.Router();

router.get("/:symbol", PriceDataController.getPriceDataBySymbol);

router.get("/:symbol/latest", PriceDataController.getLatestPrice);

router.get("/:symbol/intervals", PriceDataController.getRecentIntervals);

router.get("/:symbol/aggregated", PriceDataController.getAggregatedData);

export const PriceDataRoutes = router;

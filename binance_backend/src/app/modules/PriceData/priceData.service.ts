import { TPriceData } from "./priceData.interface";
import { PriceData } from "./priceData.model";

// Calculate which 4-hour interval a timestamp belongs to (UTC)
const getIntervalHour = (date: Date): number => {
  const hours = [1, 5, 9, 13, 17, 21];
  const hour = date.getUTCHours();

  // Find the interval this hour belongs to
  for (let i = hours.length - 1; i >= 0; i--) {
    if (hour >= hours[i]) {
      return hours[i];
    }
  }
  // If before 1 AM UTC, belongs to previous day's 21 interval
  return 21;
};

// Get the start time of the current interval (UTC)
const getIntervalStartTime = (date: Date): Date => {
  const intervalHour = getIntervalHour(date);
  const startTime = new Date(date);
  
  if (intervalHour === 21 && date.getUTCHours() < 1) {
    // Previous day's 21:00 UTC interval
    startTime.setUTCDate(startTime.getUTCDate() - 1);
  }
  
  startTime.setUTCHours(intervalHour, 0, 0, 0);
  return startTime;
};

const savePriceData = async (payload: {
  symbol: string;
  price: number;
  timestamp: Date;
  volume?: number;
}) => {
  const intervalHour = getIntervalHour(payload.timestamp);
  const intervalStartTime = getIntervalStartTime(payload.timestamp);

  const priceData: TPriceData = {
    symbol: payload.symbol,
    price: payload.price,
    timestamp: payload.timestamp,
    intervalHour,
    intervalStartTime,
    volume: payload.volume,
  };

  const result = await PriceData.create(priceData);
  return result;
};

const getPriceDataBySymbol = async (
  symbol: string,
  startTime?: Date,
  endTime?: Date
) => {
  const query: any = { symbol: symbol.toUpperCase() };

  if (startTime || endTime) {
    query.timestamp = {};
    if (startTime) query.timestamp.$gte = startTime;
    if (endTime) query.timestamp.$lte = endTime;
  }

  const result = await PriceData.find(query).sort({ timestamp: 1 });
  return result;
};

const getPriceDataByInterval = async (
  symbol: string,
  intervalStartTime: Date,
  intervalHour: number
) => {
  const result = await PriceData.find({
    symbol: symbol.toUpperCase(),
    intervalStartTime,
    intervalHour,
  }).sort({ timestamp: 1 });
  return result;
};

const getLatestPriceForSymbol = async (symbol: string) => {
  const result = await PriceData.findOne({ symbol: symbol.toUpperCase() })
    .sort({ timestamp: -1 })
    .limit(1);
  return result;
};

const getAggregatedPriceData = async (
  symbol: string,
  intervalStartTime: Date,
  intervalHour: number
) => {
  const result = await PriceData.aggregate([
    {
      $match: {
        symbol: symbol.toUpperCase(),
        intervalStartTime,
        intervalHour,
      },
    },
    {
      $group: {
        _id: {
          symbol: "$symbol",
          intervalStartTime: "$intervalStartTime",
          intervalHour: "$intervalHour",
        },
        open: { $first: "$price" },
        close: { $last: "$price" },
        high: { $max: "$price" },
        low: { $min: "$price" },
        avgPrice: { $avg: "$price" },
        count: { $sum: 1 },
        firstTimestamp: { $first: "$timestamp" },
        lastTimestamp: { $last: "$timestamp" },
      },
    },
  ]);

  return result[0] || null;
};

// Get price data for the last N intervals
const getRecentIntervals = async (symbol: string, intervalCount: number = 6) => {
  const result = await PriceData.aggregate([
    {
      $match: { symbol: symbol.toUpperCase() },
    },
    {
      $group: {
        _id: {
          intervalStartTime: "$intervalStartTime",
          intervalHour: "$intervalHour",
        },
        symbol: { $first: "$symbol" },
        open: { $first: "$price" },
        close: { $last: "$price" },
        high: { $max: "$price" },
        low: { $min: "$price" },
        volume: { $sum: "$volume" },
        intervalStartTime: { $first: "$intervalStartTime" },
        intervalHour: { $first: "$intervalHour" },
        count: { $sum: 1 },
      },
    },
    {
      $sort: { intervalStartTime: -1 },
    },
    {
      $limit: intervalCount,
    },
  ]);

  return result.reverse(); // Return in chronological order
};

const deleteOldPriceData = async (daysToKeep: number = 30) => {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

  const result = await PriceData.deleteMany({
    timestamp: { $lt: cutoffDate },
  });

  return result;
};

// Delete detailed price data from previous 4-hour intervals
// Keep only the current interval's detailed data
const cleanupPreviousIntervalData = async () => {
  const now = new Date();
  const currentIntervalStart = getIntervalStartTime(now);

  // Delete all price data before the current interval start time
  const result = await PriceData.deleteMany({
    timestamp: { $lt: currentIntervalStart },
  });

  console.log(
    `🧹 Cleaned up ${result.deletedCount} price records from previous intervals`
  );

  return result;
};

// Get the next 4-hour interval time (UTC)
const getNextIntervalTime = (): Date => {
  const now = new Date();
  const hours = [1, 5, 9, 13, 17, 21];
  const currentHour = now.getUTCHours();

  // Find next interval hour
  let nextHour = hours.find((h) => h > currentHour);

  const nextInterval = new Date(now);

  if (nextHour !== undefined) {
    // Next interval is today (UTC)
    nextInterval.setUTCHours(nextHour, 0, 0, 0);
  } else {
    // Next interval is tomorrow at 1 AM UTC
    nextInterval.setUTCDate(nextInterval.getUTCDate() + 1);
    nextInterval.setUTCHours(1, 0, 0, 0);
  }

  return nextInterval;
};

export const PriceDataService = {
  savePriceData,
  getPriceDataBySymbol,
  getPriceDataByInterval,
  getLatestPriceForSymbol,
  getAggregatedPriceData,
  getRecentIntervals,
  deleteOldPriceData,
  cleanupPreviousIntervalData,
  getIntervalHour,
  getIntervalStartTime,
  getNextIntervalTime,
};

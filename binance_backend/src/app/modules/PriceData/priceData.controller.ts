import httpStatus from "http-status";
import catchAsync from "../../utils/catchAsync";
import sendResponse from "../../utils/sendResponse";
import { PriceDataService } from "./priceData.service";

const getPriceDataBySymbol = catchAsync(async (req, res) => {
  const { symbol } = req.params;
  const { startTime, endTime } = req.query;

  const result = await PriceDataService.getPriceDataBySymbol(
    symbol,
    startTime ? new Date(startTime as string) : undefined,
    endTime ? new Date(endTime as string) : undefined
  );

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Price data retrieved successfully",
    data: result,
  });
});

const getLatestPrice = catchAsync(async (req, res) => {
  const { symbol } = req.params;
  const result = await PriceDataService.getLatestPriceForSymbol(symbol);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Latest price retrieved successfully",
    data: result,
  });
});

const getRecentIntervals = catchAsync(async (req, res) => {
  const { symbol } = req.params;
  const intervalCount = req.query.intervals
    ? parseInt(req.query.intervals as string)
    : 6;

  const result = await PriceDataService.getRecentIntervals(
    symbol,
    intervalCount
  );

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Recent intervals data retrieved successfully",
    data: result,
  });
});

const getAggregatedData = catchAsync(async (req, res) => {
  const { symbol } = req.params;
  const { intervalStartTime, intervalHour } = req.query;

  if (!intervalStartTime || !intervalHour) {
    return sendResponse(res, {
      statusCode: httpStatus.BAD_REQUEST,
      success: false,
      message: "intervalStartTime and intervalHour are required",
      data: null,
    });
  }

  const result = await PriceDataService.getAggregatedPriceData(
    symbol,
    new Date(intervalStartTime as string),
    parseInt(intervalHour as string)
  );

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Aggregated price data retrieved successfully",
    data: result,
  });
});

export const PriceDataController = {
  getPriceDataBySymbol,
  getLatestPrice,
  getRecentIntervals,
  getAggregatedData,
};

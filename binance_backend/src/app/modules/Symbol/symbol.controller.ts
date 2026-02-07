import httpStatus from "http-status";
import catchAsync from "../../utils/catchAsync";
import sendResponse from "../../utils/sendResponse";
import { SymbolService } from "./symbol.service";

const createSymbol = catchAsync(async (req, res) => {
  const result = await SymbolService.createSymbol(req.body);

  sendResponse(res, {
    statusCode: httpStatus.CREATED,
    success: true,
    message: "Symbol created successfully",
    data: result,
  });
});

const getAllSymbols = catchAsync(async (req, res) => {
  const result = await SymbolService.getAllSymbols();

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Symbols retrieved successfully",
    data: result,
  });
});

const getAllSymbolsList = catchAsync(async (req, res) => {
  const result = await SymbolService.getAllSymbolsList();

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Symbols list retrieved successfully",
    data: result,
  });
});

const getSymbolById = catchAsync(async (req, res) => {
  const result = await SymbolService.getSymbolById(req.params.id);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Symbol retrieved successfully",
    data: result,
  });
});

const updateSymbol = catchAsync(async (req, res) => {
  const result = await SymbolService.updateSymbol(req.params.id, req.body);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Symbol updated successfully",
    data: result,
  });
});

const deleteSymbol = catchAsync(async (req, res) => {
  const result = await SymbolService.deleteSymbol(req.params.id);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Symbol deleted successfully",
    data: result,
  });
});

const bulkCreateSymbols = catchAsync(async (req, res) => {
  const result = await SymbolService.bulkCreateSymbols(req.body.symbols);

  sendResponse(res, {
    statusCode: httpStatus.CREATED,
    success: true,
    message: "Symbols created successfully",
    data: result,
  });
});

export const SymbolController = {
  createSymbol,
  getAllSymbols,
  getAllSymbolsList,
  getSymbolById,
  updateSymbol,
  deleteSymbol,
  bulkCreateSymbols,
};

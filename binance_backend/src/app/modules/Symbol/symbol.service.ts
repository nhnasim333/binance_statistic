import { TSymbol } from "./symbol.interface";
import { Symbol } from "./symbol.model";

const createSymbol = async (payload: TSymbol) => {
  const result = await Symbol.create(payload);
  return result;
};

const getAllSymbols = async () => {
  const result = await Symbol.find({ isActive: true }).sort({ symbol: 1 });
  return result;
};

const getAllSymbolsList = async () => {
  const result = await Symbol.find({ isActive: true }).select("symbol");
  return result.map((s) => s.symbol);
};

const getSymbolById = async (id: string) => {
  const result = await Symbol.findById(id);
  return result;
};

const updateSymbol = async (id: string, payload: Partial<TSymbol>) => {
  const result = await Symbol.findByIdAndUpdate(id, payload, {
    new: true,
    runValidators: true,
  });
  return result;
};

const deleteSymbol = async (id: string) => {
  const result = await Symbol.findByIdAndUpdate(
    id,
    { isActive: false },
    { new: true }
  );
  return result;
};

const bulkCreateSymbols = async (symbols: TSymbol[]) => {
  const result = await Symbol.insertMany(symbols, { ordered: false });
  return result;
};

export const SymbolService = {
  createSymbol,
  getAllSymbols,
  getAllSymbolsList,
  getSymbolById,
  updateSymbol,
  deleteSymbol,
  bulkCreateSymbols,
};

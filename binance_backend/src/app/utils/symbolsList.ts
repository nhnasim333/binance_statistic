import { symbols } from "../../symbol";

// Transform the existing symbols list to USDT trading pairs
export const BINANCE_USDT_SYMBOLS = symbols.map((s) => ({
  symbol: `${s.symbol}USDT`,
  baseAsset: s.symbol,
  quoteAsset: "USDT",
}));

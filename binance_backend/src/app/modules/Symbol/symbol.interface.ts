export interface TSymbol {
  symbol: string; // e.g., "BTCUSDT"
  baseAsset: string; // e.g., "BTC"
  quoteAsset: string; // e.g., "USDT"
  isActive: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

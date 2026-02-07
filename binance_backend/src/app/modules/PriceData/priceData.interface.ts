export interface TPriceData {
  symbol: string;
  price: number;
  timestamp: Date;
  intervalHour: number; // 1, 5, 9, 13, 17, 21
  intervalStartTime: Date;
  volume?: number;
  high?: number;
  low?: number;
  open?: number;
  close?: number;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface TRealtimePrice {
  symbol: string;
  price: number;
  timestamp: number;
}

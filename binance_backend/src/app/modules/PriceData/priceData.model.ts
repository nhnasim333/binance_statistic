import { Schema, model } from "mongoose";
import { TPriceData } from "./priceData.interface";

const priceDataSchema = new Schema<TPriceData>(
  {
    symbol: {
      type: String,
      required: true,
      uppercase: true,
    },
    price: {
      type: Number,
      required: true,
    },
    timestamp: {
      type: Date,
      required: true,
    },
    intervalHour: {
      type: Number,
      required: true,
      enum: [1, 5, 9, 13, 17, 21],
    },
    intervalStartTime: {
      type: Date,
      required: true,
    },
    volume: {
      type: Number,
    },
    high: {
      type: Number,
    },
    low: {
      type: Number,
    },
    open: {
      type: Number,
    },
    close: {
      type: Number,
    },
  },
  {
    timestamps: true,
  }
);

// Compound index for efficient querying
priceDataSchema.index({ symbol: 1, intervalStartTime: 1, timestamp: 1 });
priceDataSchema.index({ symbol: 1, timestamp: -1 });
priceDataSchema.index({ intervalStartTime: 1, intervalHour: 1 });

export const PriceData = model<TPriceData>("PriceData", priceDataSchema);

import { Schema, model } from "mongoose";
import { TSymbol } from "./symbol.interface";

const symbolSchema = new Schema<TSymbol>(
  {
    symbol: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
    },
    baseAsset: {
      type: String,
      required: true,
      uppercase: true,
    },
    quoteAsset: {
      type: String,
      required: true,
      uppercase: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

symbolSchema.index({ symbol: 1 });
symbolSchema.index({ isActive: 1 });

export const Symbol = model<TSymbol>("Symbol", symbolSchema);

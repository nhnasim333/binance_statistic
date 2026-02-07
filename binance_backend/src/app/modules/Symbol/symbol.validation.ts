import { z } from "zod";

const createSymbolValidationSchema = z.object({
  body: z.object({
    symbol: z.string({
      required_error: "Symbol is required",
    }),
    baseAsset: z.string({
      required_error: "Base asset is required",
    }),
    quoteAsset: z.string({
      required_error: "Quote asset is required",
    }),
    isActive: z.boolean().optional(),
  }),
});

const updateSymbolValidationSchema = z.object({
  body: z.object({
    symbol: z.string().optional(),
    baseAsset: z.string().optional(),
    quoteAsset: z.string().optional(),
    isActive: z.boolean().optional(),
  }),
});

export const SymbolValidation = {
  createSymbolValidationSchema,
  updateSymbolValidationSchema,
};

import { baseApi } from "../../api/baseApi";

export const priceDataApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    // Get recent price data for a symbol
    getRecentPriceData: builder.query({
      query: ({ symbol, intervalHour, limit = 100 }) => ({
        url: "/price-data/recent",
        params: { symbol, intervalHour, limit },
      }),
      providesTags: ["priceData"],
    }),

    // Get aggregated OHLC data for a symbol
    getAggregatedData: builder.query({
      query: ({ symbol, intervalHour, limit = 50 }) => ({
        url: "/price-data/aggregated",
        params: { symbol, intervalHour, limit },
      }),
      providesTags: ["priceData"],
    }),

    // Get current price for a symbol
    getCurrentPrice: builder.query({
      query: (symbol) => `/price-data/current/${symbol}`,
      providesTags: ["priceData"],
    }),

    // Get 24h statistics for all symbols
    getAllPricesStats: builder.query({
      query: () => "/price-data/stats/24h",
      providesTags: ["priceData"],
    }),
  }),
});

export const {
  useGetRecentPriceDataQuery,
  useGetAggregatedDataQuery,
  useGetCurrentPriceQuery,
  useGetAllPricesStatsQuery,
} = priceDataApi;

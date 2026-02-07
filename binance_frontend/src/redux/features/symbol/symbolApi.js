import { baseApi } from "../../api/baseApi";

export const symbolApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    // Get all symbols
    getAllSymbols: builder.query({
      query: () => "/symbols",
      providesTags: ["symbols"],
    }),

    // Get active symbols list (returns array of symbol strings)
    getActiveSymbols: builder.query({
      query: () => "/symbols/active",
      providesTags: ["symbols"],
    }),

    // Get single symbol by ID
    getSymbolById: builder.query({
      query: (id) => `/symbols/${id}`,
      providesTags: ["symbols"],
    }),
  }),
});

export const {
  useGetAllSymbolsQuery,
  useGetActiveSymbolsQuery,
  useGetSymbolByIdQuery,
} = symbolApi;

import { useEffect, useState, useCallback } from "react";
import { Search, Activity, TrendingUp } from "lucide-react";
import { Input } from "@/components/ui/input";
import TokenCard from "@/components/TokenCard";
import PriceChart from "@/components/PriceChart";
import { wsService } from "@/services/websocket";
import { useGetActiveSymbolsQuery } from "@/redux/features/symbol/symbolApi";
import { toast } from "sonner";

const Dashboard = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSymbol, setSelectedSymbol] = useState(null);
  const [livePrices, setLivePrices] = useState({});
  const [chartData, setChartData] = useState([]);
  const [priceChanges, setPriceChanges] = useState({});

  // Helper function to get current 4-hour interval
  const getCurrentIntervalHour = () => {
    const hours = [1, 5, 9, 13, 17, 21];
    const currentHour = new Date().getHours();
    
    // Find the interval this hour belongs to
    for (let i = hours.length - 1; i >= 0; i--) {
      if (currentHour >= hours[i]) {
        return hours[i];
      }
    }
    // If before 1 AM, belongs to previous day's 21 interval
    return 21;
  };

  // Fetch active symbols
  const { data: symbolsResponse, isLoading: symbolsLoading, error: symbolsError } = useGetActiveSymbolsQuery();
  const symbols = symbolsResponse?.data || [];

  // Reset price changes every hour to prevent indefinite accumulation
  useEffect(() => {
    const resetChanges = () => {
      console.log("🔄 Resetting price changes for fresh calculations");
      // Reset all changes to 0%
      setPriceChanges(prev => {
        const resetChanges = {};
        Object.keys(prev).forEach(symbol => {
          resetChanges[symbol] = 0;
        });
        return resetChanges;
      });
    };

    // Reset changes every hour
    const intervalId = setInterval(resetChanges, 60 * 60 * 1000);

    return () => clearInterval(intervalId);
  }, []);

  // Connect to WebSocket and subscribe to symbols
  useEffect(() => {
    if (symbols.length === 0) return;

    // Connect WebSocket
    wsService.connect();

    // Subscribe to all symbols
    wsService.subscribe(symbols);

    console.log("📊 Subscribed to", symbols.length, "symbols");

    // Cleanup on unmount
    return () => {
      wsService.unsubscribe(symbols);
    };
  }, [symbols]);

  // Handle price updates
  useEffect(() => {
    const handlePriceUpdate = (data) => {
      if (!data.updates) {
        console.warn("⚠️ No updates in price data");
        return;
      }

      console.log("💰 Price update received:", data.updates.length, "symbols");

      setLivePrices(prevPrices => {
        const newPrices = { ...prevPrices };
        
        data.updates.forEach((update) => {
          if (update.price && update.symbol) {
            const price = typeof update.price === 'number' ? update.price : parseFloat(update.price);
            newPrices[update.symbol] = {
              price: price,
              timestamp: update.timestamp || Date.now(),
            };
          }
        });
        
        return newPrices;
      });

      // Calculate changes based on price changes data
      setPriceChanges(prev => {
        const newChanges = { ...prev };

        data.updates.forEach((update) => {
          if (update.symbol && update.priceChangePercent !== undefined) {
            const changePercent = typeof update.priceChangePercent === 'number' 
              ? update.priceChangePercent 
              : parseFloat(update.priceChangePercent) || 0;
            newChanges[update.symbol] = changePercent;
          }
        });
        
        const sampleChanges = Object.entries(newChanges).slice(0, 5);
        if (sampleChanges.length > 0) {
          console.log("📈 Price changes updated:", sampleChanges);
        }
        
        return newChanges;
      });
    };

    const handleInitialData = (data) => {
      console.log("📊 Received initial data:", data);
      if (data.data && data.data.length > 0) {
        // Set initial prices from the initial data
        const initialPrices = {};
        const initialChanges = {};
        
        data.data.forEach((item) => {
          if (item.symbol && item.currentPrice) {
            const priceData = item.currentPrice;
            initialPrices[item.symbol] = {
              price: priceData.price,
              timestamp: priceData.timestamp || Date.now(),
            };
            initialChanges[item.symbol] = priceData.priceChangePercent || 0;
          }
        });
        
        setLivePrices(prev => ({ ...prev, ...initialPrices }));
        setPriceChanges(prev => ({ ...prev, ...initialChanges }));
        
        console.log("📊 Initial prices loaded:", Object.keys(initialPrices).length);
        console.log("📈 Initial changes sample:", Object.entries(initialChanges).slice(0, 5));
        
        toast.success(`Loaded data for ${data.data.length} symbols`);
      }
    };

    const handleIntervalUpdate = (data) => {
      console.log("📊 Interval update:", data);
    };

    const handleHistoricalData = (data) => {
      console.log("📈 Received historical data:", data);
      if (data.data && Array.isArray(data.data)) {
        console.log("📊 Chart data sample:", data.data.slice(0, 5));
        console.log("📊 Total data points:", data.data.length);
        setChartData(data.data);
        if (data.data.length > 0) {
          toast.success(`Loaded ${data.data.length} data points for ${data.symbol}`);
        } else {
          toast.info(`No historical data available for ${data.symbol} in current interval`);
        }
      } else {
        console.warn("⚠️ No data array in response:", data);
        setChartData([]);
      }
    };

    // Subscribe to events
    const unsubscribePrice = wsService.on("price_update", handlePriceUpdate);
    const unsubscribeInitial = wsService.on("initial_data", handleInitialData);
    const unsubscribeInterval = wsService.on("interval_update", handleIntervalUpdate);
    const unsubscribeHistorical = wsService.on("historical_data", handleHistoricalData);

    return () => {
      unsubscribePrice();
      unsubscribeInitial();
      unsubscribeInterval();
      unsubscribeHistorical();
    };
  }, []); // Empty deps - handlers use functional updates

  // Handle symbol selection
  const handleSymbolClick = useCallback((symbol) => {
    setSelectedSymbol(symbol);
    setChartData([]); // Clear previous chart data
    // Request historical data for the selected symbol
    const intervalHour = getCurrentIntervalHour();
    console.log(`📊 Requesting data for ${symbol} at interval ${intervalHour}:00`);
    wsService.getHistoricalData(symbol, intervalHour);
  }, []);

  // Filter symbols based on search
  const filteredSymbols = symbols.filter((symbol) =>
    symbol.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Show loading state
  if (symbolsLoading) {
    return (
      <div className="min-h-screen bg-[#0B0E11] flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-[#FCD535] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-white text-lg font-semibold">Loading tokens...</p>
          <p className="text-gray-400 text-sm mt-2">Fetching 242 cryptocurrency symbols</p>
        </div>
      </div>
    );
  }

  // Show error state
  if (symbolsError) {
    return (
      <div className="min-h-screen bg-[#0B0E11] flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-[#1E2329] rounded-lg p-8 text-center">
          <div className="w-16 h-16 bg-[#F6465D] bg-opacity-20 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-[#F6465D]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-white mb-2">Failed to Load Symbols</h2>
          <p className="text-gray-400 mb-6">
            {symbolsError?.data?.message || 'Could not connect to backend server. Please make sure the backend is running on port 5000.'}
          </p>
          <button
            onClick={() => window.location.reload()}
            className="w-full bg-[#FCD535] hover:bg-[#E7C32D] text-black font-semibold py-3 px-6 rounded-lg transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0B0E11] text-white">
      {/* Header */}
      <div className="bg-[#1E2329] border-b border-[#2B3139] sticky top-0 z-10">
        <div className="max-w-[1920px] mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-[#FCD535] rounded-full flex items-center justify-center">
                <span className="text-xl font-bold text-black">B</span>
              </div>
              <div>
                <h1 className="text-xl font-bold">Binance Stats Dashboard</h1>
                <p className="text-xs text-gray-400">
                  Real-time cryptocurrency prices
                </p>
              </div>
            </div>

          <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 bg-[#0B0E11] px-3 py-2 rounded-lg">
                <Activity className="w-4 h-4 text-[#0ECB81]" />
                <span className="text-sm font-semibold">
                  {symbols.length} Tokens
                </span>
              </div>
              <div className="flex items-center gap-2 bg-[#0B0E11] px-3 py-2 rounded-lg">
                <TrendingUp className="w-4 h-4 text-[#FCD535]" />
                <span className="text-sm font-semibold">Live</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-[1920px] mx-auto px-6 py-6">
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          {/* Left Side - Token List */}
          <div className="xl:col-span-1">
            <div className="bg-[#1E2329] rounded-lg p-4 sticky top-24">
              <div className="mb-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <Input
                    type="text"
                    placeholder="Search tokens..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 bg-[#2B3139] border-[#2B3139] text-white placeholder:text-gray-500 focus:border-[#FCD535]"
                  />
                </div>
              </div>

              <div className="space-y-2 max-h-[calc(100vh-200px)] overflow-y-auto custom-scrollbar">
                {filteredSymbols.length === 0 ? (
                  <div className="text-center py-8 text-gray-400">
                    No symbols found
                  </div>
                ) : (
                  filteredSymbols.map((symbol) => (
                    <TokenCard
                      key={symbol}
                      symbol={symbol}
                      price={livePrices[symbol]?.price}
                      change24h={priceChanges[symbol] || 0}
                      isSelected={selectedSymbol === symbol}
                      onClick={() => handleSymbolClick(symbol)}
                    />
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Right Side - Chart */}
          <div className="xl:col-span-2">
            <div className="bg-[#1E2329] rounded-lg p-6">
              {selectedSymbol ? (
                <>
                  <div className="mb-6">
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <h2 className="text-2xl font-bold">
                          {selectedSymbol.replace("USDT", "")}/USDT
                        </h2>
                        <p className="text-gray-400 text-sm">
                          4-Hour Interval Chart
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-3xl font-bold text-white">
                          ${(() => {
                            const price = livePrices[selectedSymbol]?.price;
                            const numPrice = typeof price === 'number' ? price : parseFloat(price) || 0;
                            return numPrice > 0 ? numPrice.toFixed(numPrice < 1 ? 6 : 2) : "0.00";
                          })()}
                        </p>
                        <p
                          className={`text-sm font-semibold ${
                            (priceChanges[selectedSymbol] || 0) >= 0
                              ? "text-[#0ECB81]"
                              : "text-[#F6465D]"
                          }`}
                        >
                          {(priceChanges[selectedSymbol] || 0) >= 0 ? "+" : ""}
                          {(priceChanges[selectedSymbol] || 0).toFixed(2)}%
                        </p>
                      </div>
                    </div>
                  </div>

                  {chartData.length === 0 ? (
                    <div className="bg-[#0B0E11] rounded-lg p-8 text-center">
                      <div className="text-gray-400 mb-2">
                        <svg className="w-16 h-16 mx-auto mb-3 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                        </svg>
                        <p className="text-lg font-semibold">No Data Available</p>
                        <p className="text-sm mt-1">Waiting for price data in current interval...</p>
                      </div>
                    </div>
                  ) : (
                    <PriceChart
                      symbol={selectedSymbol}
                      data={chartData}
                      livePrice={livePrices[selectedSymbol]}
                    />
                  )}

                  <div className="mt-6 grid grid-cols-4 gap-4">
                    <div className="bg-[#0B0E11] rounded-lg p-3">
                      <p className="text-gray-400 text-xs mb-1">24h High</p>
                      <p className="text-white font-semibold">
                        ${(() => {
                          if (!chartData || chartData.length === 0) return "--";
                          const high = Math.max(...chartData.map(d => d.price || 0));
                          return high > 0 ? high.toFixed(high < 1 ? 6 : 2) : "--";
                        })()}
                      </p>
                    </div>
                    <div className="bg-[#0B0E11] rounded-lg p-3">
                      <p className="text-gray-400 text-xs mb-1">24h Low</p>
                      <p className="text-white font-semibold">
                        ${(() => {
                          if (!chartData || chartData.length === 0) return "--";
                          const low = Math.min(...chartData.map(d => d.price || Infinity));
                          return low > 0 && low !== Infinity ? low.toFixed(low < 1 ? 6 : 2) : "--";
                        })()}
                      </p>
                    </div>
                    <div className="bg-[#0B0E11] rounded-lg p-3">
                      <p className="text-gray-400 text-xs mb-1">Volume</p>
                      <p className="text-white font-semibold">
                        {(Math.random() * 1000000).toFixed(0)} USDT
                      </p>
                    </div>
                    <div className="bg-[#0B0E11] rounded-lg p-3">
                      <p className="text-gray-400 text-xs mb-1">Interval</p>
                      <p className="text-white font-semibold">4 Hours</p>
                    </div>
                  </div>
                </>
              ) : (
                <div className="text-center py-20">
                  <div className="w-20 h-20 bg-[#2B3139] rounded-full flex items-center justify-center mx-auto mb-4">
                    <TrendingUp className="w-10 h-10 text-gray-400" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-300 mb-2">
                    Select a Token
                  </h3>
                  <p className="text-gray-400">
                    Choose a token from the list to view its price chart
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: #2B3139;
          border-radius: 3px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #474D57;
          border-radius: 3px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #5E6673;
        }
      `}</style>
    </div>
  );
};

export default Dashboard;

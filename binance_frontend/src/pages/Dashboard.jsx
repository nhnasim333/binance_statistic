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

  // Fetch active symbols
  const { data: symbolsResponse, isLoading: symbolsLoading } = useGetActiveSymbolsQuery();
  const symbols = symbolsResponse?.data || [];

  // Connect to WebSocket and subscribe to symbols
  useEffect(() => {
    if (symbols.length === 0) return;

    // Connect WebSocket
    wsService.connect();

    // Subscribe to first 50 symbols (can be adjusted)
    const symbolsToSubscribe = symbols.slice(0, 50);
    wsService.subscribe(symbolsToSubscribe);

    console.log("📊 Subscribed to", symbolsToSubscribe.length, "symbols");

    // Cleanup on unmount
    return () => {
      wsService.unsubscribe(symbolsToSubscribe);
    };
  }, [symbols]);

  // Handle price updates
  useEffect(() => {
    const handlePriceUpdate = (data) => {
      if (!data.updates) return;

      const newPrices = {};
      const newChanges = {};

      data.updates.forEach((update) => {
        if (update.price) {
          newPrices[update.symbol] = {
            price: update.price,
            timestamp: update.timestamp,
          };

          // Calculate 24h change (simulated for now)
          const oldPrice = livePrices[update.symbol]?.price;
          if (oldPrice) {
            const change = ((update.price - oldPrice) / oldPrice) * 100;
            newChanges[update.symbol] = change;
          } else {
            // Random change for demo (-5% to +5%)
            newChanges[update.symbol] = (Math.random() - 0.5) * 10;
          }
        }
      });

      setLivePrices((prev) => ({ ...prev, ...newPrices }));
      setPriceChanges((prev) => ({ ...prev, ...newChanges }));
    };

    const handleInitialData = (data) => {
      console.log("📊 Received initial data:", data);
      if (data.data && data.data.length > 0) {
        toast.success(`Loaded data for ${data.data.length} symbols`);
      }
    };

    const handleIntervalUpdate = (data) => {
      console.log("📊 Interval update:", data);
    };

    // Subscribe to events
    const unsubscribePrice = wsService.on("price_update", handlePriceUpdate);
    const unsubscribeInitial = wsService.on("initial_data", handleInitialData);
    const unsubscribeInterval = wsService.on("interval_update", handleIntervalUpdate);

    return () => {
      unsubscribePrice();
      unsubscribeInitial();
      unsubscribeInterval();
    };
  }, [livePrices]);

  // Handle symbol selection
  const handleSymbolClick = useCallback((symbol) => {
    setSelectedSymbol(symbol);
    // Request historical data for the selected symbol
    wsService.getHistoricalData(symbol, 1); // Get 1 AM interval data
  }, []);

  // Filter symbols based on search
  const filteredSymbols = symbols.filter((symbol) =>
    symbol.toLowerCase().includes(searchQuery.toLowerCase())
  );

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
                {symbolsLoading ? (
                  <div className="text-center py-8 text-gray-400">
                    Loading symbols...
                  </div>
                ) : filteredSymbols.length === 0 ? (
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
                          ${livePrices[selectedSymbol]?.price?.toFixed(
                            livePrices[selectedSymbol]?.price < 1 ? 6 : 2
                          ) || "0.00"}
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

                  <PriceChart
                    symbol={selectedSymbol}
                    data={chartData}
                    livePrice={livePrices[selectedSymbol]}
                  />

                  <div className="mt-6 grid grid-cols-4 gap-4">
                    <div className="bg-[#0B0E11] rounded-lg p-3">
                      <p className="text-gray-400 text-xs mb-1">24h High</p>
                      <p className="text-white font-semibold">
                        ${(livePrices[selectedSymbol]?.price * 1.05 || 0).toFixed(2)}
                      </p>
                    </div>
                    <div className="bg-[#0B0E11] rounded-lg p-3">
                      <p className="text-gray-400 text-xs mb-1">24h Low</p>
                      <p className="text-white font-semibold">
                        ${(livePrices[selectedSymbol]?.price * 0.95 || 0).toFixed(2)}
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

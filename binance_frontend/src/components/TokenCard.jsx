import PropTypes from "prop-types";
import { TrendingUp, TrendingDown } from "lucide-react";

const TokenCard = ({ symbol, price, change24h, onClick }) => {
  const isPositive = change24h >= 0;
  const baseSymbol = symbol?.replace("USDT", "") || "";

  return (
    <div
      onClick={onClick}
      className="bg-[#1E2329] rounded-lg p-4 cursor-pointer hover:bg-[#2B3139] transition-all border border-transparent hover:border-[#FCD535]"
    >
      <div className="flex items-start justify-between mb-2">
        <div>
          <h3 className="text-white font-semibold text-lg">{baseSymbol}</h3>
          <p className="text-gray-400 text-xs">{symbol}</p>
        </div>
        <div className={`flex items-center gap-1 ${isPositive ? "text-[#0ECB81]" : "text-[#F6465D]"}`}>
          {isPositive ? (
            <TrendingUp className="w-4 h-4" />
          ) : (
            <TrendingDown className="w-4 h-4" />
          )}
          <span className="text-sm font-semibold">
            {isPositive ? "+" : ""}{change24h?.toFixed(2) || "0.00"}%
          </span>
        </div>
      </div>

      <div className="space-y-1">
        <p className="text-white text-xl font-bold">
          ${price?.toFixed(price < 1 ? 6 : 2) || "0.00"}
        </p>
        <p className="text-gray-400 text-xs">Last update: just now</p>
      </div>
    </div>
  );
};

TokenCard.propTypes = {
  symbol: PropTypes.string.isRequired,
  price: PropTypes.number,
  change24h: PropTypes.number,
  onClick: PropTypes.func,
};

export default TokenCard;

import PropTypes from "prop-types";
import { TrendingUp, TrendingDown } from "lucide-react";

const TokenCard = ({ symbol, price, change24h, onClick, onHover, isSelected }) => {
  const isPositive = change24h >= 0;
  const baseSymbol = symbol?.replace("USDT", "") || "";
  
  // Ensure price is a number
  const numPrice = typeof price === 'number' ? price : parseFloat(price) || 0;
  const numChange = typeof change24h === 'number' ? change24h : parseFloat(change24h) || 0;

  return (
    <div
      onClick={onClick}
      onMouseEnter={onHover}
      className={`bg-[#1E2329] rounded-lg p-4 cursor-pointer transition-all border-2 ${
        isSelected 
          ? "border-[#FCD535] bg-[#2B3139] shadow-lg shadow-[#FCD535]/20" 
          : "border-transparent hover:border-[#FCD535] hover:bg-[#2B3139]"
      }`}
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
            {isPositive ? "+" : ""}{numChange.toFixed(2)}%
          </span>
        </div>
      </div>

      <div className="space-y-1">
        <p className="text-white text-xl font-bold">
          ${numPrice > 0 ? numPrice.toFixed(numPrice < 1 ? 6 : 2) : "0.00"}
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
  onHover: PropTypes.func,
  isSelected: PropTypes.bool,
};

export default TokenCard;

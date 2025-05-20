import { useState, useEffect } from 'react';
import BondingCurveChart from './BondingCurveChart';
import { generateCurvePoints, getPriceImpact, getAveragePrice } from '../lib/bondingCurve';

export default function BuySellModal({ 
  open, 
  onClose, 
  team, 
  type, 
  onConfirm, 
  loading, 
  error, 
  preview,
  shares,
  onSharesChange,
  totalSupply = 0
}) {
  // If shares and onSharesChange are not provided, use local state for backward compatibility
  const [localShares, setLocalShares] = useState('');
  const controlledMode = shares !== undefined && onSharesChange !== undefined;
  const [curvePoints, setCurvePoints] = useState([]);
  const [priceImpact, setPriceImpact] = useState(null);
  const [averagePrice, setAveragePrice] = useState(0);
  
  // Reset local shares and update curve data when modal opens
  useEffect(() => {
    if (open) {
      setLocalShares('');
      if (totalSupply !== undefined) {
        // Generate a wider range of points to show "to infinity"
        const points = generateCurvePoints(totalSupply, 50);
        setCurvePoints(points);
      }
      setAveragePrice(0);
    }
  }, [open, totalSupply]);
  
  // Update price impact and average price when shares change
  useEffect(() => {
    const sharesNum = Number(controlledMode ? shares : localShares) || 0;
    if (sharesNum > 0 && totalSupply !== undefined) {
      const impact = getPriceImpact(totalSupply, sharesNum, type === 'buy');
      setPriceImpact(impact);
      
      // Calculate average price
      const avgPrice = getAveragePrice(totalSupply, sharesNum, type === 'buy');
      setAveragePrice(avgPrice);
    } else {
      setPriceImpact(null);
      setAveragePrice(0);
    }
  }, [shares, localShares, totalSupply, type, controlledMode]);

  if (!open || !team) return null;

  const isBuy = type === 'buy';
  const action = isBuy ? 'Buy' : 'Sell';
  
  // Use either controlled or uncontrolled pattern
  const currentShares = controlledMode ? shares : localShares;
  const handleSharesChange = (e) => {
    const value = e.target.value;
    if (controlledMode) {
      onSharesChange(value);
    } else {
      setLocalShares(value);
    }
  };
  
  // Get contrasting text color based on background
  const getContrastColor = (hexColor) => {
    // Remove the # if present
    const color = hexColor.startsWith('#') ? hexColor.slice(1) : hexColor;
    
    // Convert to RGB
    const r = parseInt(color.substr(0, 2), 16);
    const g = parseInt(color.substr(2, 2), 16);
    const b = parseInt(color.substr(4, 2), 16);
    
    // Calculate luminance
    const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
    
    // Return white for dark colors, black for light colors
    return luminance > 0.5 ? '#000000' : '#ffffff';
  };
  
  // Generate styles based on team colors
  const primaryColor = team.primaryColor || '#004c54';
  const secondaryColor = team.secondaryColor || '#000000';
  const primaryTextColor = getContrastColor(primaryColor);
  const secondaryTextColor = getContrastColor(secondaryColor);
  
  // Determine action color based on type
  const actionColor = isBuy ? primaryColor : secondaryColor;
  const actionTextColor = isBuy ? primaryTextColor : secondaryTextColor;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70">
      <div className="bg-gray-900 rounded-2xl shadow-2xl w-full max-w-md relative animate-fadeIn overflow-hidden">
        {/* Header */}
        <div 
          className="p-4 text-center relative"
          style={{ backgroundColor: primaryColor, color: primaryTextColor }}
        >
          <button 
            className="absolute top-2 right-3 text-2xl font-bold transition-colors hover:opacity-80"
            onClick={onClose}
            style={{ color: primaryTextColor }}
          >
            &times;
          </button>
          <h2 className="text-2xl font-extrabold tracking-widest">{action} {team.symbol}</h2>
          <div className="text-sm opacity-90 font-medium">{team.name}</div>
        </div>
        
        <div className="p-6">
          {/* Bonding Curve Chart (Shares 1-1000) */}
          <div className="mb-4">
            <h3 className="text-sm font-medium text-gray-400 mb-1">Bonding Curve</h3>
            <BondingCurveChart 
              currentSupply={totalSupply}
              shares={Number(currentShares) || 0}
              isBuy={isBuy}
              primaryColor={primaryColor}
              secondaryColor={secondaryColor}
              fixed1To1000={true}
            />
            
            {priceImpact && Number(currentShares) > 0 && (
              <div className="text-xs text-gray-400 mt-2 space-y-1 bg-gray-800/50 p-2 rounded-lg border border-gray-700/50">
                <div className="flex justify-between">
                  <span>Price Range:</span>
                  <div>
                    <span className="text-gray-300">${priceImpact.startPrice.toFixed(4)}</span>
                    <span className="mx-1">→</span>
                    <span className="text-gray-300">${priceImpact.endPrice.toFixed(4)}</span>
                    <span className={`ml-2 ${priceImpact.percentChange > 0 ? "text-green-400" : "text-red-400"}`}>
                      {priceImpact.percentChange > 0 ? "+" : ""}{priceImpact.percentChange.toFixed(2)}%
                    </span>
                  </div>
                </div>
                <div className="flex justify-between font-medium">
                  <span>Average Price:</span>
                  <span className="text-cyan-300">${averagePrice.toFixed(4)}</span>
                </div>
              </div>
            )}
          </div>
          
          <form
            onSubmit={e => {
              e.preventDefault();
              if (currentShares && Number(currentShares) > 0) onConfirm(Number(currentShares));
            }}
            className="flex flex-col gap-4"
          >
            <div className="flex flex-col gap-1">
              <label className="font-medium text-gray-200 text-sm">
                {action} how many shares?
              </label>
              <div className="relative">
                <input
                  type="number"
                  min="1"
                  step="1"
                  className="p-4 rounded-lg bg-gray-800 text-white border focus:outline-none focus:ring-2 text-lg transition w-full text-center font-mono"
                  style={{ 
                    borderColor: `${actionColor}40`,
                    boxShadow: `0 0 0 1px ${actionColor}10`,
                    caretColor: actionColor
                  }}
                  value={currentShares}
                  onChange={handleSharesChange}
                  required
                  autoFocus
                />
              </div>
            </div>
            
            {preview && (
              <div 
                className="rounded-lg p-4 flex flex-col gap-2 text-sm mt-1"
                style={{ 
                  backgroundColor: `${secondaryColor}15`, 
                  borderLeft: `3px solid ${primaryColor}`,
                  color: 'white'
                }}
              >
                <div className="flex justify-between items-center">
                  <span className="text-gray-300">{isBuy ? 'Cost' : 'Refund'}</span>
                  <span className="text-lg font-semibold">${preview.amount.toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-gray-400">2% Fee</span>
                  <span style={{ color: '#ff6b6b' }}>${preview.fee.toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center font-bold text-lg border-t border-gray-700 pt-2 mt-1" 
                  style={{ color: primaryColor }}
                >
                  <span>Total</span>
                  <span>${preview.total.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-xs pt-1 text-gray-400">
                  <span>Per Share (Avg)</span>
                  <span className="text-cyan-300 font-mono">${(preview.amount / Number(currentShares)).toFixed(4)}</span>
                </div>
              </div>
            )}
            
            {error && (
              <div 
                className="p-3 rounded text-center text-xs animate-pulse"
                style={{ backgroundColor: '#ff4444', color: 'white' }}
              >
                {error}
              </div>
            )}
            
            <button
              type="submit"
              className="w-full font-bold py-3 px-4 rounded-lg shadow-lg text-lg transition-all duration-200 mt-2"
              style={{ 
                backgroundColor: actionColor,
                color: actionTextColor,
                opacity: loading || !currentShares || Number(currentShares) <= 0 ? '0.6' : '1'
              }}
              disabled={loading || !currentShares || Number(currentShares) <= 0}
            >
              {loading ? 'Please wait...' : `${action} Shares`}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
} 
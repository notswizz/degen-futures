import { useState, useEffect } from 'react';
import BondingCurveChart from './BondingCurveChart';
import { getPriceImpact, getAveragePrice } from '../lib/bondingCurve';
import Cookies from 'js-cookie';
import { jwtDecode } from 'jwt-decode';

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
  const [priceImpact, setPriceImpact] = useState(null);
  const [averagePrice, setAveragePrice] = useState(0);
  const [userBalance, setUserBalance] = useState(0);
  const [userShares, setUserShares] = useState(0);
  const [balanceError, setBalanceError] = useState('');
  const [showChart, setShowChart] = useState(false); // New state for chart toggle
  
  // Get user balance and holdings when modal opens
  useEffect(() => {
    if (open && team) {
      // Get user data from JWT token
      const token = Cookies.get('token');
      if (token) {
        try {
          const decoded = jwtDecode(token);
          setUserBalance(decoded.balance || 0);
        } catch (err) {
          console.error('Error decoding token:', err);
        }
      }
      
      // Fetch user's holdings for this team
      fetchUserHoldings(team._id);
      
      // Reset shares input
      setLocalShares('');
      setAveragePrice(0);
      setBalanceError('');
      setShowChart(false); // Default to hide chart on mobile
    }
  }, [open, team]);
  
  // Fetch user's holdings for the current team
  const fetchUserHoldings = async (teamId) => {
    try {
      const token = Cookies.get('token');
      if (!token) return;
      
      const response = await fetch('/api/market/holdings', {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      
      const holdings = await response.json();
      const teamHolding = holdings.find(h => h.teamId === teamId);
      setUserShares(teamHolding ? teamHolding.shares : 0);
    } catch (err) {
      console.error('Error fetching holdings:', err);
    }
  };
  
  // Set max shares for selling
  const handleSellMax = () => {
    if (controlledMode) {
      onSharesChange(userShares.toString());
    } else {
      setLocalShares(userShares.toString());
    }
  };
  
  // Check if user has enough balance for this transaction
  useEffect(() => {
    if (preview && type === 'buy') {
      if (userBalance < preview.total) {
        setBalanceError(`Insufficient balance. You need $${preview.total.toFixed(2)} but only have $${userBalance.toFixed(2)}.`);
      } else {
        setBalanceError('');
      }
    } else {
      setBalanceError('');
    }
  }, [preview, userBalance, type]);
  
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

  // Handle form submission
  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Check if user has enough balance for buying
    if (isBuy && userBalance < (preview?.total || 0)) {
      setBalanceError(`Insufficient balance. You need $${preview?.total.toFixed(2)} but only have $${userBalance.toFixed(2)}.`);
      return;
    }
    
    // Check if user has enough shares for selling
    if (!isBuy && userShares < Number(currentShares)) {
      setBalanceError(`You only have ${userShares} shares to sell.`);
      return;
    }
    
    if (currentShares && Number(currentShares) > 0) {
      onConfirm(Number(currentShares));
    }
  };

  // Toggle chart visibility
  const toggleChart = () => {
    setShowChart(!showChart);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70">
      <div className="bg-gray-900 rounded-2xl shadow-2xl w-full max-w-md relative animate-fadeIn overflow-hidden max-h-[90vh] flex flex-col">
        {/* Header */}
        <div 
          className="p-3 text-center relative flex-shrink-0"
          style={{ backgroundColor: primaryColor, color: primaryTextColor }}
        >
          <button 
            className="absolute top-2 right-3 text-2xl font-bold transition-colors hover:opacity-80"
            onClick={onClose}
            style={{ color: primaryTextColor }}
          >
            &times;
          </button>
          <h2 className="text-xl font-extrabold tracking-widest">{action} {team.symbol}</h2>
          <div className="text-xs opacity-90 font-medium">{team.name}</div>
        </div>
        
        {/* Scrollable content */}
        <div className="p-4 overflow-y-auto flex-grow">
          {/* User Info - Balance for Buy, Holdings for Sell */}
          <div className="mb-3 p-2 rounded bg-gray-800/50 text-sm border border-gray-700/50 flex justify-between">
            {isBuy ? (
              <>
                <span className="text-gray-400">Your Balance:</span>
                <span className="font-semibold text-cyan-300">${userBalance.toFixed(2)}</span>
              </>
            ) : (
              <>
                <span className="text-gray-400">Your Shares:</span>
                <span className="font-semibold text-cyan-300">{userShares}</span>
              </>
            )}
          </div>
          
          {/* Chart toggle button */}
          <button 
            onClick={toggleChart}
            className="w-full mb-3 text-xs px-3 py-1.5 rounded bg-gray-800 hover:bg-gray-700 text-cyan-300 transition-colors flex items-center justify-center"
          >
            <svg 
              xmlns="http://www.w3.org/2000/svg" 
              className="h-3 w-3 mr-1" 
              viewBox="0 0 20 20" 
              fill="currentColor"
            >
              <path d="M2 11a1 1 0 011-1h2a1 1 0 011 1v5a1 1 0 01-1 1H3a1 1 0 01-1-1v-5zm6-4a1 1 0 011-1h2a1 1 0 011 1v9a1 1 0 01-1 1H9a1 1 0 01-1-1V7zm6-3a1 1 0 011-1h2a1 1 0 011 1v12a1 1 0 01-1 1h-2a1 1 0 01-1-1V4z" />
            </svg>
            {showChart ? 'Hide' : 'Show'} Bonding Curve
          </button>
          
          {/* Bonding Curve Chart (toggleable) */}
          {showChart && (
            <div className="mb-3">
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
                </div>
              )}
            </div>
          )}
          
          <form
            onSubmit={handleSubmit}
            className="flex flex-col gap-3"
          >
            <div className="flex flex-col gap-1">
              <div className="flex justify-between items-center">
                <label className="font-medium text-gray-200 text-sm">
                  {action} how many shares?
                </label>
                
                {/* Sell Max button - only for sell */}
                {!isBuy && userShares > 0 && (
                  <button
                    type="button"
                    className="text-xs px-2 py-1 rounded bg-gray-700 hover:bg-gray-600 text-white transition-colors"
                    onClick={handleSellMax}
                  >
                    Sell Max ({userShares})
                  </button>
                )}
              </div>
              
              <div className="relative">
                <input
                  type="number"
                  min="1"
                  step="1"
                  max={!isBuy ? userShares : undefined}
                  className="p-3 rounded-lg bg-gray-800 text-white border focus:outline-none focus:ring-2 text-lg transition w-full text-center font-mono"
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
            
            {/* Average Price (compact version) */}
            {averagePrice > 0 && Number(currentShares) > 0 && !showChart && (
              <div className="text-xs text-gray-300 bg-gray-800/50 p-2 rounded-lg border border-gray-700/50 flex justify-between">
                <span>Average Price:</span>
                <span className="text-cyan-300 font-medium">${averagePrice.toFixed(4)}</span>
              </div>
            )}
            
            {preview && (
              <div 
                className="rounded-lg p-3 flex flex-col gap-2 text-sm"
                style={{ 
                  backgroundColor: `${secondaryColor}15`, 
                  borderLeft: `3px solid ${primaryColor}`,
                  color: 'white'
                }}
              >
                <div className="flex justify-between items-center">
                  <span className="text-gray-300">Total</span>
                  <span className="text-lg font-semibold">${preview.amount.toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-gray-400">2% Fee</span>
                  <span style={{ color: '#ff6b6b' }}>${preview.fee.toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center font-bold text-lg border-t border-gray-700 pt-2 mt-1" 
                  style={{ color: primaryColor }}
                >
                  <span>{isBuy ? "You Pay" : "You Receive"}</span>
                  <span>${preview.total.toFixed(2)}</span>
                </div>
              </div>
            )}
          </form>
        </div>
        
        {/* Footer with action button - fixed to bottom */}
        <div className="p-3 border-t border-gray-800 flex-shrink-0">
          {/* Show either the balance error or the API error */}
          {(balanceError || error) && (
            <div 
              className="p-2 rounded text-center text-xs animate-pulse mb-3"
              style={{ backgroundColor: '#ff4444', color: 'white' }}
            >
              {balanceError || error}
            </div>
          )}
          
          <button
            type="submit"
            onClick={handleSubmit}
            className="w-full font-bold py-2.5 px-4 rounded-lg shadow-lg text-base transition-all duration-200"
            style={{ 
              backgroundColor: actionColor,
              color: actionTextColor,
              opacity: loading || 
                !currentShares || 
                Number(currentShares) <= 0 || 
                (isBuy && userBalance < (preview?.total || 0)) || 
                (!isBuy && userShares < Number(currentShares)) 
                ? '0.6' : '1'
            }}
            disabled={loading || 
              !currentShares || 
              Number(currentShares) <= 0 || 
              (isBuy && userBalance < (preview?.total || 0)) || 
              (!isBuy && userShares < Number(currentShares))
            }
          >
            {loading ? 'Please wait...' : `${action} Shares`}
          </button>
        </div>
      </div>
    </div>
  );
} 
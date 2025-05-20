import { useEffect, useRef } from 'react';

export default function TeamCard({ id, team, userShares, onBuy, onSell, highlighted }) {
  const cardRef = useRef(null);

  // Add pulse animation when highlighted
  useEffect(() => {
    if (highlighted && cardRef.current) {
      cardRef.current.classList.add('highlight-pulse');
      // Remove the highlight after animation completes
      setTimeout(() => {
        if (cardRef.current) {
          cardRef.current.classList.remove('highlight-pulse');
        }
      }, 2000);
    }
  }, [highlighted]);
  
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
  
  return (
    <div 
      id={id}
      ref={cardRef}
      className={`rounded-xl shadow-xl overflow-hidden transition-transform duration-300 h-full flex flex-col ${
        highlighted ? 'ring-2 ring-pink-500 ring-offset-2 ring-offset-gray-900' : ''
      }`}
      style={{ 
        background: secondaryColor, 
        boxShadow: `0 10px 30px -5px ${primaryColor}40, 0 0 5px ${secondaryColor}80`
      }}
    >
      {/* Header with primary color */}
      <div 
        className="p-3 flex items-center justify-between relative"
        style={{ backgroundColor: primaryColor, color: primaryTextColor }}
      >
        <span className="text-2xl font-extrabold tracking-widest">{team.symbol}</span>
        
        {/* Enhanced Price tag */}
        <div 
          className="px-3 py-1 font-mono text-sm font-bold flex items-center"
          style={{ 
            backgroundColor: secondaryColor, 
            color: secondaryTextColor,
            clipPath: 'polygon(10px 0, 100% 0, 100% 100%, 0 100%)',
            boxShadow: `0 3px 10px rgba(0,0,0,0.3)`,
            borderRight: `3px solid ${primaryColor}`
          }}
        >
          <div className="price-shine absolute inset-0 opacity-20 z-0"></div>
          <span className="mr-1 text-xs opacity-60">$</span>
          <span className="text-base">{team.price.toFixed(2)}</span>
        </div>
      </div>
      
      {/* Team name bar */}
      <div className="py-1 px-2 text-center" style={{ backgroundColor: `${primaryColor}90`, color: primaryTextColor }}>
        <span className="text-sm font-medium truncate block">{team.name}</span>
      </div>
      
      {/* Content */}
      <div className="p-4 flex-grow flex flex-col justify-between" style={{ color: secondaryTextColor }}>
        <div className="grid grid-cols-2 gap-y-2 mb-3">
          <div className="text-xs opacity-80">Market Cap</div>
          <div className="text-xs font-bold text-right">${team.marketCap.toLocaleString()}</div>
          
          <div className="text-xs opacity-80">Volume</div>
          <div className="text-xs font-bold text-right">${team.volume.toLocaleString()}</div>
          
          {typeof userShares === 'number' && (
            <>
              <div className="text-xs opacity-80">Your Shares</div>
              <div 
                className="text-xs font-bold text-right"
                style={{ color: primaryColor }}
              >
                {userShares}
              </div>
            </>
          )}
        </div>
        
        {/* Buttons */}
        <div className="grid grid-cols-2 gap-2 mt-auto">
          <button
            className="py-2 rounded-md text-sm font-bold transition-all shadow-md flex items-center justify-center"
            style={{ 
              backgroundColor: primaryColor, 
              color: primaryTextColor,
              border: `1px solid ${primaryTextColor}20`
            }}
            onClick={() => onBuy(team)}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 3a1 1 0 00-1 1v5H4a1 1 0 100 2h5v5a1 1 0 102 0v-5h5a1 1 0 100-2h-5V4a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            Buy
          </button>
          <button
            className={`py-2 rounded-md text-sm font-bold transition-all shadow-md flex items-center justify-center ${
              !userShares || userShares <= 0 ? 'opacity-50 cursor-not-allowed' : ''
            }`}
            style={{ 
              backgroundColor: secondaryColor, 
              color: secondaryTextColor,
              border: `1px solid ${secondaryTextColor}20`
            }}
            onClick={() => onSell(team)}
            disabled={!userShares || userShares <= 0}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M3 10a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
            </svg>
            Sell
          </button>
        </div>
      </div>
      
      {highlighted && (
        <div className="absolute inset-0 z-10 pointer-events-none">
          <div className="h-full w-full highlight-pulse" style={{ boxShadow: `inset 0 0 30px ${primaryColor}` }}></div>
        </div>
      )}
      
      {/* Add highlight pulse animation */}
      <style jsx>{`
        @keyframes highlightPulse {
          0% { opacity: 0.4; }
          50% { opacity: 0.7; }
          100% { opacity: 0.4; }
        }
        .highlight-pulse {
          animation: highlightPulse 1.5s ease-in-out infinite;
        }
        
        @keyframes shine {
          0% { background-position: -100px; }
          60% { background-position: 200px; }
          100% { background-position: 200px; }
        }
        
        .price-shine {
          background: linear-gradient(to right, 
            rgba(255,255,255,0) 0%,
            rgba(255,255,255,0.8) 50%,
            rgba(255,255,255,0) 100%);
          background-size: 200px 100%;
          background-repeat: no-repeat;
          animation: shine 3s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
} 
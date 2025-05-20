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

  return (
    <div 
      id={id}
      ref={cardRef}
      className={`bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 border-2 ${
        highlighted ? 'border-pink-500' : 'border-cyan-500/30'
      } rounded-xl shadow-xl p-6 flex flex-col items-center relative overflow-hidden hover:border-cyan-400/80 transition-all group`}
    >
      <div className="absolute inset-0 pointer-events-none animate-pulse" style={{ boxShadow: '0 0 40px 8px #0ff3fc22' }} />
      {highlighted && (
        <div className="absolute -inset-1 bg-pink-500/20 z-0 rounded-xl"></div>
      )}
      <div className="z-10 w-full flex flex-col items-center">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-2xl font-extrabold text-cyan-300 tracking-widest drop-shadow-glow">{team.symbol}</span>
          <span className="text-lg text-cyan-100 font-mono">{team.name}</span>
        </div>
        <div className="flex flex-col gap-1 w-full mb-3">
          <div className="flex justify-between w-full text-cyan-200 font-mono text-sm">
            <span>Price</span>
            <span className="font-bold text-cyan-400">${team.price.toFixed(2)}</span>
          </div>
          <div className="flex justify-between w-full text-cyan-200 font-mono text-xs">
            <span>Market Cap</span>
            <span>${team.marketCap.toLocaleString()}</span>
          </div>
          <div className="flex justify-between w-full text-cyan-200 font-mono text-xs">
            <span>Volume</span>
            <span>${team.volume.toLocaleString()}</span>
          </div>
          {typeof userShares === 'number' && (
            <div className="flex justify-between w-full text-pink-400 font-mono text-xs">
              <span>Your Shares</span>
              <span>{userShares}</span>
            </div>
          )}
        </div>
        <div className="flex gap-3 mt-2 w-full">
          <button
            className="flex-1 py-2 rounded-lg bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-bold shadow-md tracking-widest text-sm transition-all duration-200 focus:ring-2 focus:ring-cyan-300 focus:ring-opacity-50"
            onClick={() => onBuy(team)}
          >
            Buy
          </button>
          <button
            className={`flex-1 py-2 rounded-lg bg-gradient-to-r from-pink-500 to-pink-700 hover:from-pink-400 hover:to-pink-600 text-white font-bold shadow-md tracking-widest text-sm transition-all duration-200 focus:ring-2 focus:ring-pink-300 focus:ring-opacity-50 ${
              !userShares || userShares <= 0 ? 'opacity-50 cursor-not-allowed' : ''
            }`}
            onClick={() => onSell(team)}
            disabled={!userShares || userShares <= 0}
          >
            Sell
          </button>
        </div>
      </div>
      
      {/* Add highlight pulse animation */}
      <style jsx>{`
        @keyframes highlightPulse {
          0% { box-shadow: 0 0 0 0 rgba(236, 72, 153, 0.7); }
          70% { box-shadow: 0 0 0 15px rgba(236, 72, 153, 0); }
          100% { box-shadow: 0 0 0 0 rgba(236, 72, 153, 0); }
        }
        .highlight-pulse {
          animation: highlightPulse 1s ease-out infinite;
        }
      `}</style>
    </div>
  );
} 
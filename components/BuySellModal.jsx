import { useState, useEffect } from 'react';

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
  onSharesChange
}) {
  // If shares and onSharesChange are not provided, use local state for backward compatibility
  const [localShares, setLocalShares] = useState('');
  const controlledMode = shares !== undefined && onSharesChange !== undefined;
  
  // Reset local shares when modal opens
  useEffect(() => {
    if (open) setLocalShares('');
  }, [open]);

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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70">
      <div className="bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 border-2 border-cyan-500/40 rounded-2xl shadow-2xl p-8 w-full max-w-md relative animate-fadeIn">
        <button className="absolute top-3 right-4 text-cyan-400 text-2xl font-bold hover:text-pink-400 transition" onClick={onClose}>&times;</button>
        <h2 className="text-2xl font-extrabold text-cyan-300 mb-2 text-center tracking-widest drop-shadow-glow">{action} {team.symbol}</h2>
        <div className="text-cyan-200 text-center mb-4 font-mono">{team.name}</div>
        <form
          onSubmit={e => {
            e.preventDefault();
            if (currentShares && Number(currentShares) > 0) onConfirm(Number(currentShares));
          }}
          className="flex flex-col gap-4"
        >
          <label className="flex flex-col gap-1 text-cyan-200 font-mono">
            {action} how many shares?
            <input
              type="number"
              min="1"
              step="1"
              className="p-3 rounded-lg bg-gray-900 text-cyan-100 border border-cyan-700 focus:outline-none focus:ring-2 focus:ring-cyan-400 font-mono text-lg transition"
              value={currentShares}
              onChange={handleSharesChange}
              required
              autoFocus
            />
          </label>
          {preview && (
            <div className="bg-gray-800/80 rounded-lg p-4 flex flex-col gap-2 text-cyan-100 text-sm font-mono border border-cyan-700">
              <div className="flex justify-between"><span>{isBuy ? 'Cost' : 'Refund'}</span><span>${preview.amount.toFixed(2)}</span></div>
              <div className="flex justify-between"><span>2% Fee</span><span className="text-pink-400">${preview.fee.toFixed(2)}</span></div>
              <div className="flex justify-between font-bold text-cyan-300"><span>Total</span><span>${preview.total.toFixed(2)}</span></div>
            </div>
          )}
          {error && <div className="bg-pink-600/80 text-white p-2 rounded text-center font-mono text-xs shadow-lg animate-pulse">{error}</div>}
          <button
            type="submit"
            className="w-full bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-extrabold py-3 px-4 rounded-lg shadow-lg tracking-widest text-lg transition-all duration-200 focus:ring-4 focus:ring-cyan-300 focus:ring-opacity-50 mt-2"
            disabled={loading || !currentShares || Number(currentShares) <= 0}
            style={{ textShadow: '0 0 8px #0ff3fc' }}
          >
            {loading ? 'Please wait...' : `${action} Shares`}
          </button>
        </form>
      </div>
    </div>
  );
} 
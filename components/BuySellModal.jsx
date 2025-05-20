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
          <form
            onSubmit={e => {
              e.preventDefault();
              if (currentShares && Number(currentShares) > 0) onConfirm(Number(currentShares));
            }}
            className="flex flex-col gap-4"
          >
            <label className="flex flex-col gap-1 text-gray-200">
              <span className="font-medium">{action} how many shares?</span>
              <input
                type="number"
                min="1"
                step="1"
                className="p-3 rounded-lg bg-gray-800 text-white border focus:outline-none focus:ring-2 text-lg transition"
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
            </label>
            
            {preview && (
              <div 
                className="rounded-lg p-4 flex flex-col gap-2 text-sm"
                style={{ 
                  backgroundColor: `${secondaryColor}20`, 
                  borderLeft: `3px solid ${primaryColor}`,
                  color: 'white'
                }}
              >
                <div className="flex justify-between">
                  <span>{isBuy ? 'Cost' : 'Refund'}</span>
                  <span>${preview.amount.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>2% Fee</span>
                  <span style={{ color: '#ff6b6b' }}>${preview.fee.toFixed(2)}</span>
                </div>
                <div className="flex justify-between font-bold text-lg" style={{ color: primaryColor }}>
                  <span>Total</span>
                  <span>${preview.total.toFixed(2)}</span>
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
import { useState } from 'react';

export default function BalanceModal({ open, onClose, currentBalance = 0, onAddBalance, loading, error }) {
  const [amount, setAmount] = useState('');
  
  // Ensure currentBalance is always a number
  const safeBalance = typeof currentBalance === 'number' ? currentBalance : 0;

  if (!open) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (amount && Number(amount) > 0) {
      onAddBalance(Number(amount));
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70">
      <div className="bg-gray-900 rounded-2xl shadow-2xl w-full max-w-md relative animate-fadeIn overflow-hidden">
        {/* Header */}
        <div 
          className="p-4 text-center relative bg-cyan-700 text-white"
        >
          <button 
            className="absolute top-2 right-3 text-2xl font-bold transition-colors hover:opacity-80 text-white"
            onClick={onClose}
          >
            &times;
          </button>
          <h2 className="text-2xl font-extrabold tracking-widest">Manage Balance</h2>
          <div className="text-sm opacity-90 font-medium">Current Balance: ${safeBalance.toFixed(2)}</div>
        </div>
        
        <div className="p-6">
          <form
            onSubmit={handleSubmit}
            className="flex flex-col gap-4"
          >
            <label className="flex flex-col gap-1 text-gray-200">
              <span className="font-medium">Add funds to your account</span>
              <input
                type="number"
                min="1"
                step="1"
                className="p-3 rounded-lg bg-gray-800 text-white border border-cyan-500/40 focus:outline-none focus:ring-2 focus:ring-cyan-400 text-lg transition"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="Enter amount"
                required
                autoFocus
              />
            </label>
            
            {error && (
              <div className="p-3 rounded text-center text-xs animate-pulse bg-red-500 text-white">
                {error}
              </div>
            )}
            
            <button
              type="submit"
              className="w-full font-bold py-3 px-4 rounded-lg shadow-lg text-lg transition-all duration-200 mt-2 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white"
              style={{ 
                opacity: loading || !amount || Number(amount) <= 0 ? '0.6' : '1'
              }}
              disabled={loading || !amount || Number(amount) <= 0}
            >
              {loading ? 'Processing...' : 'Add Funds'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
} 
import { useState } from 'react';

export default function BalanceModal({ isOpen, onClose, onAddBalance, loading, error }) {
  const [amount, setAmount] = useState('');
  
  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (amount && Number(amount) > 0) {
      onAddBalance(Number(amount));
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-night-950/80 backdrop-blur-sm">
      <div 
        className="bg-night-900 rounded-xl shadow-2xl w-full max-w-md relative animate-fadeIn overflow-hidden border border-night-800"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div 
          className="p-4 text-center relative bg-gradient-to-r from-brand-600 to-brand-700 text-white border-b border-brand-500/50"
        >
          <button 
            className="absolute top-2 right-3 text-2xl font-bold transition-all hover:opacity-80 text-white"
            onClick={onClose}
            aria-label="Close modal"
          >
            &times;
          </button>
          <h2 className="text-xl font-display font-bold">Add Funds</h2>
        </div>
        
        <div className="p-6">
          <form
            onSubmit={handleSubmit}
            className="flex flex-col gap-4"
          >
            <label className="flex flex-col gap-2 text-night-200">
              <span className="font-medium">Amount to add:</span>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <span className="text-brand-400 font-mono">$</span>
                </div>
                <input
                  type="number"
                  min="1"
                  step="1"
                  className="block w-full pl-8 pr-4 py-3 rounded-lg bg-night-800 text-white border border-night-700 focus:outline-none focus:ring-2 focus:ring-brand-400 focus:border-brand-400 text-lg transition-all"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="Enter amount"
                  required
                  autoFocus
                />
              </div>
            </label>
            
            {error && (
              <div className="p-3 rounded-md text-center text-sm bg-red-500/80 text-white">
                {error}
              </div>
            )}
            
            <div className="flex gap-3 mt-2">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 font-medium py-2.5 px-4 rounded-md text-sm transition-all border border-night-700 bg-night-800 hover:bg-night-700 text-white"
              >
                Cancel
              </button>
              
              <button
                type="submit"
                className="flex-1 font-medium py-2.5 px-4 rounded-md shadow-lg text-sm transition-all bg-brand-600 hover:bg-brand-500 hover:shadow-brand-500/20 text-white disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={loading || !amount || Number(amount) <= 0}
              >
                {loading ? 'Processing...' : 'Add Funds'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
} 
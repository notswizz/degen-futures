import { useEffect, useState } from 'react';
import TeamCard from '../components/TeamCard';
import BuySellModal from '../components/BuySellModal';
import Cookies from 'js-cookie';
import { useRouter } from 'next/router';

export default function MarketPage() {
  const [teams, setTeams] = useState([]);
  const [holdings, setHoldings] = useState({});
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState({ open: false, type: 'buy', team: null });
  const [modalLoading, setModalLoading] = useState(false);
  const [modalError, setModalError] = useState('');
  const [modalPreview, setModalPreview] = useState(null);
  const [shares, setShares] = useState('');
  const [highlighted, setHighlighted] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const router = useRouter();

  // Fetch teams
  useEffect(() => {
    fetch('/api/market/teams')
      .then(res => res.json())
      .then(data => {
        setTeams(data);
        setLoading(false);
      });
  }, [refreshKey]); // Refresh when key changes

  // Setup automatic refresh every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setRefreshKey(oldKey => oldKey + 1);
    }, 30000);
    
    return () => clearInterval(interval);
  }, []);

  // Fetch user holdings if logged in
  useEffect(() => {
    const token = Cookies.get('token');
    if (!token) return;
    
    fetch('/api/market/holdings', {
      headers: { 'Authorization': `Bearer ${token}` },
    })
      .then(res => res.json())
      .then(data => {
        // Map: { teamId: shares }
        const map = {};
        data.forEach(h => { map[h.teamId] = h.shares; });
        setHoldings(map);
      });
  }, [refreshKey]); // Also refresh holdings

  // Check for URL parameters
  useEffect(() => {
    if (!router.isReady || teams.length === 0) return;
    
    const { highlight, action, teamId } = router.query;
    
    // Handle highlighted team
    if (highlight) {
      setHighlighted(highlight);
      // Scroll to element
      setTimeout(() => {
        const element = document.getElementById(`team-${highlight}`);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, 500);
    }
    
    // Handle buy/sell actions from URL
    if (action && teamId) {
      const team = teams.find(t => t._id === teamId);
      if (team) {
        setModal({ 
          open: true, 
          type: action === 'sell' ? 'sell' : 'buy',
          team
        });
        
        // Remove query params after opening modal
        router.replace('/market', undefined, { shallow: true });
      }
    }
  }, [router.isReady, router.query, teams]);

  // Reset shares input when modal opens or closes
  useEffect(() => {
    if (modal.open) {
      setShares('');
      setModalPreview(null);
    }
  }, [modal.open]);

  // Update preview when shares change
  useEffect(() => {
    handlePreview(Number(shares));
  }, [shares, modal.team, modal.type]);

  // Modal preview calculation
  const handlePreview = async (shares) => {
    if (!modal.team || !shares || shares <= 0) return setModalPreview(null);
    
    const team = modal.team;
    const totalSupply = team.totalSupply;
    let amount = 0, fee = 0, total = 0;
    
    if (modal.type === 'buy') {
      // replicate getBuyCost
      const basePrice = 1, slope = 1;
      const a = totalSupply;
      const b = totalSupply + shares;
      amount = basePrice * (b - a) + slope * ((1 + b) * Math.log(1 + b) - (1 + a) * Math.log(1 + a) - (b - a));
      fee = amount * 0.02;
      total = amount + fee;
    } else {
      // replicate getSellRefund
      const basePrice = 1, slope = 1;
      const a = totalSupply - shares;
      const b = totalSupply;
      amount = basePrice * (b - a) + slope * ((1 + b) * Math.log(1 + b) - (1 + a) * Math.log(1 + a) - (b - a));
      fee = amount * 0.02;
      total = amount - fee;
    }
    
    setModalPreview({ amount, fee, total });
  };

  // Handle buy/sell confirm
  const handleConfirm = async (shares) => {
    setModalLoading(true);
    setModalError('');
    const token = Cookies.get('token');
    if (!token) {
      setModalError('You must be logged in.');
      setModalLoading(false);
      return;
    }
    try {
      const res = await fetch(`/api/market/${modal.type}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ teamId: modal.team._id, shares }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Transaction failed');
      
      // Update teams and holdings
      setTeams(teams => teams.map(t => t._id === data.team._id ? { ...t, ...data.team } : t));
      setHoldings(h => ({ ...h, [data.team._id]: (data.holding ? data.holding.shares : 0) }));
      setModal({ open: false, type: 'buy', team: null });
      
      // Force a refresh to update all prices
      setRefreshKey(oldKey => oldKey + 1);
      
      // Show toast notification
      showNotification(`Successfully ${modal.type === 'buy' ? 'bought' : 'sold'} ${shares} shares of ${data.team.symbol}`);
    } catch (err) {
      setModalError(err.message);
    } finally {
      setModalLoading(false);
    }
  };

  const handleSharesChange = (newShares) => {
    setShares(newShares);
  };
  
  // Simple toast notification system
  const showNotification = (message) => {
    // Create toast element
    const toast = document.createElement('div');
    toast.className = 'fixed bottom-4 right-4 bg-green-600 text-white px-4 py-2 rounded-lg shadow-lg animate-fadeIn z-50 transition-opacity';
    toast.textContent = message;
    document.body.appendChild(toast);
    
    // Remove after 3 seconds
    setTimeout(() => {
      toast.style.opacity = '0';
      setTimeout(() => {
        document.body.removeChild(toast);
      }, 500);
    }, 3000);
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950 text-cyan-100 py-10 px-2">
      <div className="flex justify-between items-center max-w-7xl mx-auto mb-6 px-4">
        <h1 className="text-4xl md:text-5xl font-extrabold tracking-widest text-cyan-300 drop-shadow-glow animate-pulse">NFL Market</h1>
        <button 
          onClick={() => setRefreshKey(k => k + 1)}
          className="bg-gray-800 hover:bg-gray-700 text-cyan-300 rounded-lg px-4 py-2 flex items-center gap-2 transition-all"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" />
          </svg>
          Refresh
        </button>
      </div>
      
      {loading ? (
        <div className="text-center text-cyan-200 font-mono py-20">
          <div className="inline-block w-12 h-12 border-4 border-cyan-400 border-t-transparent rounded-full animate-spin mb-4"></div>
          <p>Loading teams...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8 max-w-7xl mx-auto">
          {teams.map(team => (
            <TeamCard
              key={team._id}
              id={`team-${team._id}`}
              team={team}
              userShares={holdings[team._id]}
              onBuy={t => setModal({ open: true, type: 'buy', team: t })}
              onSell={t => setModal({ open: true, type: 'sell', team: t })}
              highlighted={highlighted === team._id}
            />
          ))}
        </div>
      )}
      <BuySellModal
        open={modal.open}
        onClose={() => setModal({ open: false, type: 'buy', team: null })}
        team={modal.team}
        type={modal.type}
        onConfirm={handleConfirm}
        loading={modalLoading}
        error={modalError}
        preview={modalPreview}
        shares={shares}
        onSharesChange={handleSharesChange}
      />
      
      {/* Add fadeIn animation to global CSS for the toast */}
      <style jsx global>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fadeIn {
          animation: fadeIn 0.3s ease-out forwards;
        }
      `}</style>
    </main>
  );
} 
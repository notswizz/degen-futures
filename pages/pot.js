import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Cookies from 'js-cookie';
import { jwtDecode } from 'jwt-decode';

export default function PotPage() {
  const [potAmount, setPotAmount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [user, setUser] = useState(null);
  const router = useRouter();

  // Check if user is logged in
  useEffect(() => {
    const token = Cookies.get('token');
    if (!token) {
      router.push('/login');
      return;
    }

    try {
      const decoded = jwtDecode(token);
      setUser(decoded);
    } catch (err) {
      console.error('Invalid token:', err);
      router.push('/login');
    }
  }, [router]);

  // Fetch pot data
  useEffect(() => {
    if (!user) return;
    
    const fetchPotData = async () => {
      setLoading(true);
      setError('');
      
      try {
        const response = await fetch('/api/pot');
        
        if (!response.ok) {
          throw new Error('Failed to fetch pot data');
        }
        
        const data = await response.json();
        setPotAmount(data.amount);
      } catch (err) {
        console.error('Error fetching pot data:', err);
        setError('Failed to load pot data. Please try again later.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchPotData();
  }, [user]);

  // Format currency
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount);
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950 text-cyan-100 py-10 px-4">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-4xl md:text-5xl font-extrabold tracking-widest text-cyan-300 drop-shadow-glow mb-6 text-center animate-pulse">
          THE PRIZE POT
        </h1>
        
        <p className="text-center text-cyan-200 opacity-80 mb-12 max-w-2xl mx-auto">
          The pot contains 2% of all transaction fees. After the Super Bowl, this entire amount will be distributed among holders of the winning team.
        </p>

        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block w-12 h-12 border-4 border-cyan-400 border-t-transparent rounded-full animate-spin mb-4"></div>
            <p className="text-cyan-300 font-mono">Loading pot data...</p>
          </div>
        ) : error ? (
          <div className="text-center py-12 bg-pink-900/20 rounded-xl border border-pink-800/40">
            <p className="text-pink-300">{error}</p>
          </div>
        ) : (
          <div className="bg-gray-900/50 rounded-2xl border border-cyan-700/30 p-8 max-w-3xl mx-auto shadow-lg shadow-cyan-900/20 flex flex-col items-center">
            <div className="text-center mb-8">
              <h2 className="text-xl text-cyan-200 font-semibold mb-2">
                CURRENT POT VALUE
              </h2>
              <div className="text-5xl md:text-7xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500 font-mono tracking-tight">
                {formatCurrency(potAmount)}
              </div>
            </div>
            
            <div className="w-full h-3 bg-gray-800 rounded-full overflow-hidden mb-8">
              <div 
                className="h-full bg-gradient-to-r from-cyan-500 to-blue-600 rounded-full animate-pulse" 
                style={{ width: `${Math.min(100, potAmount / 10)}%` }}
              ></div>
            </div>
            
            <div className="text-center bg-gray-900/70 p-6 rounded-xl border border-cyan-900/30">
              <h3 className="text-lg font-bold text-cyan-300 mb-3">
                How It Works
              </h3>
              <p className="text-gray-300 text-sm mb-2">
                • 2% fee on all buy and sell transactions goes to this pot
              </p>
              <p className="text-gray-300 text-sm mb-2">
                • After the Super Bowl, pot is distributed to holders of the winning team
              </p>
              <p className="text-gray-300 text-sm">
                • Distribution is proportional to share ownership
              </p>
            </div>
          </div>
        )}
      </div>
    </main>
  );
} 
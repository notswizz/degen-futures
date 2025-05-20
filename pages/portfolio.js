import { useState, useEffect } from 'react';
import Cookies from 'js-cookie';
import { jwtDecode } from 'jwt-decode';
import Link from 'next/link';
import { useRouter } from 'next/router';

export default function PortfolioPage() {
  const [holdings, setHoldings] = useState([]);
  const [teams, setTeams] = useState({});
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [totalValue, setTotalValue] = useState(0);
  const [sortMethod, setSortMethod] = useState('value'); // 'value', 'shares', 'name'
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

  // Fetch team data
  useEffect(() => {
    if (!user) return;

    // Get all teams
    fetch('/api/market/teams')
      .then(res => res.json())
      .then(teamsData => {
        // Map teams by ID for easy lookup
        const teamsMap = {};
        teamsData.forEach(team => {
          teamsMap[team._id] = team;
        });
        setTeams(teamsMap);
      });

    // Get user holdings
    fetch('/api/market/holdings', {
      headers: { 'Authorization': `Bearer ${Cookies.get('token')}` },
    })
      .then(res => res.json())
      .then(holdingsData => {
        setHoldings(holdingsData);
        setLoading(false);
      })
      .catch(err => {
        console.error('Error fetching holdings:', err);
        setLoading(false);
      });
  }, [user]);

  // Calculate total value when holdings or teams change
  useEffect(() => {
    if (Object.keys(teams).length === 0 || holdings.length === 0) return;

    let total = 0;
    holdings.forEach(holding => {
      const team = teams[holding.teamId];
      if (team) {
        // Calculate value using bonding curve
        const basePrice = 1, slope = 1;
        const supply = team.totalSupply;
        const sharesValue = basePrice * holding.shares + 
          slope * ((1 + supply) * Math.log(1 + supply) - 
                  (1 + (supply - holding.shares)) * Math.log(1 + (supply - holding.shares)) - 
                  holding.shares);
        total += sharesValue;
      }
    });
    setTotalValue(total);
  }, [holdings, teams]);

  // Sort holdings based on selected method
  const sortedHoldings = [...holdings].sort((a, b) => {
    const teamA = teams[a.teamId];
    const teamB = teams[b.teamId];
    
    if (!teamA || !teamB) return 0;

    // Calculate values for sorting
    const getTeamValue = (team, shares) => {
      const basePrice = 1, slope = 1;
      const supply = team.totalSupply;
      return basePrice * shares + 
        slope * ((1 + supply) * Math.log(1 + supply) - 
                (1 + (supply - shares)) * Math.log(1 + (supply - shares)) - 
                shares);
    };

    const valueA = getTeamValue(teamA, a.shares);
    const valueB = getTeamValue(teamB, b.shares);

    if (sortMethod === 'value') {
      return valueB - valueA; // Sort by value (high to low)
    } else if (sortMethod === 'shares') {
      return b.shares - a.shares; // Sort by shares (high to low)
    } else {
      return teamA.name.localeCompare(teamB.name); // Sort by name
    }
  });

  const calculateValue = (team, shares) => {
    if (!team) return 0;
    const basePrice = 1, slope = 1;
    const supply = team.totalSupply;
    return basePrice * shares + 
      slope * ((1 + supply) * Math.log(1 + supply) - 
              (1 + (supply - shares)) * Math.log(1 + (supply - shares)) - 
              shares);
  };

  // Handle sell directly from portfolio
  const handleSell = (teamId) => {
    const team = teams[teamId];
    if (team) {
      router.push({
        pathname: '/market',
        query: { action: 'sell', teamId: teamId }
      });
    }
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950 text-cyan-100 py-10 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-10">
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-widest text-cyan-300 drop-shadow-glow mb-4 animate-pulse">YOUR PORTFOLIO</h1>
          {user && (
            <p className="text-xl text-cyan-200 font-mono mb-2">
              Welcome back, <span className="text-pink-400">{user.email}</span>
            </p>
          )}
          {!loading && (
            <div className="mt-4 bg-gradient-to-r from-gray-800 to-gray-900 p-5 rounded-xl border border-cyan-500/30 inline-block">
              <p className="text-2xl font-bold text-cyan-200">
                Total Value: <span className="text-cyan-300 font-mono">${totalValue.toFixed(2)}</span>
              </p>
              <p className="text-sm text-cyan-400 mt-1">Across {holdings.length} teams</p>
            </div>
          )}
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block w-12 h-12 border-4 border-cyan-400 border-t-transparent rounded-full animate-spin mb-4"></div>
            <p className="text-cyan-300 font-mono">Loading your portfolio...</p>
          </div>
        ) : holdings.length === 0 ? (
          <div className="text-center py-12 bg-gray-900/50 rounded-xl border border-cyan-800/30">
            <h2 className="text-2xl font-bold text-cyan-300 mb-4">No holdings yet</h2>
            <p className="text-cyan-200 mb-6">Start building your portfolio by purchasing team shares in the market.</p>
            <Link href="/market" className="px-6 py-3 rounded-lg bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-bold shadow-md tracking-widest text-lg transition-all duration-200">
              Go to Market
            </Link>
          </div>
        ) : (
          <>
            {/* Sort controls */}
            <div className="flex justify-end mb-4 gap-2">
              <span className="text-cyan-300 mr-2 self-center">Sort by:</span>
              <button 
                onClick={() => setSortMethod('value')}
                className={`px-3 py-1 rounded ${sortMethod === 'value' ? 'bg-cyan-700 text-white' : 'bg-gray-800 text-cyan-200 hover:bg-gray-700'}`}
              >
                Value
              </button>
              <button 
                onClick={() => setSortMethod('shares')}
                className={`px-3 py-1 rounded ${sortMethod === 'shares' ? 'bg-cyan-700 text-white' : 'bg-gray-800 text-cyan-200 hover:bg-gray-700'}`}
              >
                Shares
              </button>
              <button 
                onClick={() => setSortMethod('name')}
                className={`px-3 py-1 rounded ${sortMethod === 'name' ? 'bg-cyan-700 text-white' : 'bg-gray-800 text-cyan-200 hover:bg-gray-700'}`}
              >
                Name
              </button>
            </div>

            {/* Holdings grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {sortedHoldings.map(holding => {
                const team = teams[holding.teamId];
                if (!team) return null;
                
                const value = calculateValue(team, holding.shares);
                const percentOfTotal = totalValue > 0 ? (value / totalValue) * 100 : 0;
                
                return (
                  <div 
                    key={holding._id} 
                    className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-xl border-2 border-cyan-500/30 p-5 hover:border-cyan-400/50 transition-all duration-300 shadow-lg hover:shadow-cyan-900/30"
                    style={{ boxShadow: '0 0 15px rgba(15, 243, 252, 0.1)' }}
                  >
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h3 className="text-xl font-bold text-cyan-300">{team.city} {team.name}</h3>
                        <p className="text-cyan-200 font-mono">{team.symbol}</p>
                      </div>
                      <div className="bg-cyan-900/40 px-3 py-1 rounded border border-cyan-700 font-mono text-cyan-300">
                        {holding.shares} {holding.shares === 1 ? 'share' : 'shares'}
                      </div>
                    </div>
                    
                    <div className="bg-gray-800/60 rounded-lg p-3 mb-3">
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-cyan-200">Current Value:</span>
                        <span className="text-cyan-300 font-mono">${value.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-cyan-200">% of Portfolio:</span>
                        <span className="text-cyan-300 font-mono">{percentOfTotal.toFixed(2)}%</span>
                      </div>
                      <div className="mt-2 w-full bg-gray-700 rounded-full h-2">
                        <div 
                          className="h-2 rounded-full bg-gradient-to-r from-cyan-500 to-blue-600" 
                          style={{ width: `${percentOfTotal}%` }}
                        ></div>
                      </div>
                    </div>
                    
                    <div className="flex gap-3 mt-4">
                      <Link 
                        href={`/market?highlight=${team._id}`}
                        className="flex-1 py-2 text-center rounded-lg bg-gray-800 text-cyan-300 border border-cyan-600/40 hover:bg-cyan-900/30 transition-all duration-200 text-sm font-bold"
                      >
                        Buy More
                      </Link>
                      <button 
                        onClick={() => handleSell(team._id)}
                        className="flex-1 py-2 text-center rounded-lg bg-gray-800 text-pink-300 border border-pink-600/40 hover:bg-pink-900/30 transition-all duration-200 text-sm font-bold"
                      >
                        Sell
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>
    </main>
  );
} 
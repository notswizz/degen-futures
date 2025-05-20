import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Cookies from 'js-cookie';
import { jwtDecode } from 'jwt-decode';
import Link from 'next/link';

export default function HistoryPage() {
  const [activeTab, setActiveTab] = useState('user'); // 'user' or 'global'
  const [activeTimeFrame, setActiveTimeFrame] = useState('all'); // 'day', 'week', 'month', 'all'
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [user, setUser] = useState(null);
  const [stats, setStats] = useState({
    totalBuys: 0,
    totalSells: 0,
    totalVolume: {
      day: 0,
      week: 0,
      month: 0,
      all: 0
    },
    totalTrades: {
      day: 0,
      week: 0,
      month: 0,
      all: 0
    },
    mostActiveTeam: {
      day: { symbol: '', count: 0 },
      week: { symbol: '', count: 0 },
      month: { symbol: '', count: 0 },
      all: { symbol: '', count: 0 }
    }
  });
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

  // Fetch transaction history based on active tab
  useEffect(() => {
    if (!user) return;
    
    const fetchTransactions = async () => {
      setLoading(true);
      setError('');
      
      try {
        const token = Cookies.get('token');
        const response = await fetch(`/api/history/transactions?type=${activeTab}`, {
          headers: token ? { 'Authorization': `Bearer ${token}` } : {},
        });
        
        if (!response.ok) {
          throw new Error('Failed to fetch transactions');
        }
        
        const data = await response.json();
        setTransactions(data);
        calculateStats(data);
      } catch (err) {
        console.error('Error fetching transactions:', err);
        setError('Failed to load transaction history. Please try again later.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchTransactions();
  }, [activeTab, user]);

  // Calculate statistics from transaction data
  const calculateStats = (txs) => {
    if (!txs || txs.length === 0) {
      setStats({
        totalBuys: 0,
        totalSells: 0,
        totalVolume: {
          day: 0,
          week: 0,
          month: 0,
          all: 0
        },
        totalTrades: {
          day: 0,
          week: 0,
          month: 0,
          all: 0
        },
        mostActiveTeam: {
          day: { symbol: '', count: 0 },
          week: { symbol: '', count: 0 },
          month: { symbol: '', count: 0 },
          all: { symbol: '', count: 0 }
        }
      });
      return;
    }

    const buys = txs.filter(tx => tx.type === 'buy');
    const sells = txs.filter(tx => tx.type === 'sell');

    // Get current date and time boundaries
    const now = new Date();
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const oneMonthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    // Filter transactions by time frame
    const dayTxs = txs.filter(tx => new Date(tx.timestamp) > oneDayAgo);
    const weekTxs = txs.filter(tx => new Date(tx.timestamp) > oneWeekAgo);
    const monthTxs = txs.filter(tx => new Date(tx.timestamp) > oneMonthAgo);

    // Calculate volume by time frame
    const totalVolumeAll = txs.reduce((sum, tx) => sum + tx.price, 0);
    const totalVolumeDay = dayTxs.reduce((sum, tx) => sum + tx.price, 0);
    const totalVolumeWeek = weekTxs.reduce((sum, tx) => sum + tx.price, 0);
    const totalVolumeMonth = monthTxs.reduce((sum, tx) => sum + tx.price, 0);

    // Calculate total trades by time frame
    const totalTradesAll = txs.length;
    const totalTradesDay = dayTxs.length;
    const totalTradesWeek = weekTxs.length;
    const totalTradesMonth = monthTxs.length;

    // Find most active team by time frame
    const getMostActiveTeam = (transactions) => {
      const teamCounts = {};
      transactions.forEach(tx => {
        const symbol = tx.teamSymbol;
        teamCounts[symbol] = (teamCounts[symbol] || 0) + 1;
      });

      let mostActive = { symbol: '', count: 0 };
      Object.entries(teamCounts).forEach(([symbol, count]) => {
        if (count > mostActive.count) {
          mostActive = { symbol, count };
        }
      });
      
      return mostActive;
    };

    setStats({
      totalBuys: buys.length,
      totalSells: sells.length,
      totalVolume: {
        day: totalVolumeDay,
        week: totalVolumeWeek,
        month: totalVolumeMonth,
        all: totalVolumeAll
      },
      totalTrades: {
        day: totalTradesDay,
        week: totalTradesWeek,
        month: totalTradesMonth,
        all: totalTradesAll
      },
      mostActiveTeam: {
        day: getMostActiveTeam(dayTxs),
        week: getMostActiveTeam(weekTxs),
        month: getMostActiveTeam(monthTxs),
        all: getMostActiveTeam(txs)
      }
    });
  };

  // Format date
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    }).format(date);
  };

  // Format currency
  const formatCurrency = (amount) => {
    return `$${amount.toFixed(2)}`;
  };

  // Time frame labels
  const timeFrameLabels = {
    day: '24h',
    week: '7d',
    month: '30d',
    all: 'All time'
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950 text-cyan-100 py-6 px-3 md:py-10 md:px-4">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl md:text-5xl font-extrabold tracking-widest text-cyan-300 drop-shadow-glow mb-3 md:mb-6 text-center animate-pulse">
          TRANSACTION HISTORY
        </h1>

        {/* Tabs */}
        <div className="flex justify-center mb-4 md:mb-6">
          <div className="flex bg-gray-900 rounded-lg p-1 border border-cyan-500/30">
            <button
              className={`px-3 py-2 md:px-6 md:py-3 rounded-lg font-bold transition-all duration-200 ${
                activeTab === 'user'
                  ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-lg'
                  : 'text-cyan-200 hover:text-cyan-100'
              }`}
              onClick={() => setActiveTab('user')}
            >
              Your Activity
            </button>
            <button
              className={`px-3 py-2 md:px-6 md:py-3 rounded-lg font-bold transition-all duration-200 ${
                activeTab === 'global'
                  ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-lg'
                  : 'text-cyan-200 hover:text-cyan-100'
              }`}
              onClick={() => setActiveTab('global')}
            >
              Global Activity
            </button>
          </div>
        </div>

        {/* Time Frame Toggle */}
        {!loading && !error && transactions.length > 0 && (
          <div className="flex justify-center mb-4 md:mb-6 overflow-x-auto pb-2">
            <div className="flex bg-gray-900/60 rounded-lg p-1 border border-cyan-800/30 gap-1">
              {Object.entries(timeFrameLabels).map(([key, label]) => (
                <button
                  key={key}
                  className={`px-2 py-1 md:px-4 md:py-2 rounded-lg text-xs md:text-sm font-bold transition-all duration-200 min-w-[60px] ${
                    activeTimeFrame === key
                      ? 'bg-gradient-to-r from-cyan-600 to-blue-700 text-white shadow-lg'
                      : 'text-cyan-200 hover:bg-gray-800/50'
                  }`}
                  onClick={() => setActiveTimeFrame(key)}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Stats Section */}
        {!loading && !error && transactions.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-6 mb-4 md:mb-8">
            {/* Volume Stats */}
            <div className="bg-gray-900/60 rounded-lg p-4 md:p-5 border border-cyan-800/20 shadow-lg hover:border-cyan-500/30 transition-all duration-300">
              <h3 className="text-cyan-300 font-bold mb-2 md:mb-3 text-base md:text-lg text-center">Volume ({timeFrameLabels[activeTimeFrame]})</h3>
              <div className="flex justify-center items-center py-2 md:py-4">
                <span className="text-2xl md:text-3xl font-bold text-cyan-200 font-mono">{formatCurrency(stats.totalVolume[activeTimeFrame])}</span>
              </div>
              <div className="mt-2 md:mt-3 text-center text-xs md:text-sm text-gray-400">
                {stats.totalTrades[activeTimeFrame]} trades • {activeTimeFrame === 'all' ? stats.totalBuys : '-'} buys • {activeTimeFrame === 'all' ? stats.totalSells : '-'} sells
              </div>
            </div>
            
            {/* Most Active Team Stats */}
            <div className="bg-gray-900/60 rounded-lg p-4 md:p-5 border border-cyan-800/20 shadow-lg hover:border-cyan-500/30 transition-all duration-300">
              <h3 className="text-cyan-300 font-bold mb-2 md:mb-3 text-base md:text-lg text-center">Most Active Team ({timeFrameLabels[activeTimeFrame]})</h3>
              <div className="flex flex-col items-center justify-center py-2 md:py-4">
                <span className="text-2xl md:text-3xl font-bold text-cyan-200 mb-1 md:mb-2">{stats.mostActiveTeam[activeTimeFrame].symbol || 'N/A'}</span>
                {stats.mostActiveTeam[activeTimeFrame].count > 0 && (
                  <span className="text-xs md:text-sm text-gray-400">{stats.mostActiveTeam[activeTimeFrame].count} trades</span>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Content */}
        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block w-12 h-12 border-4 border-cyan-400 border-t-transparent rounded-full animate-spin mb-4"></div>
            <p className="text-cyan-300 font-mono">Loading transactions...</p>
          </div>
        ) : error ? (
          <div className="text-center py-12 bg-pink-900/20 rounded-xl border border-pink-800/40">
            <p className="text-pink-300">{error}</p>
          </div>
        ) : transactions.length === 0 ? (
          <div className="text-center py-8 md:py-12 bg-gray-900/50 rounded-xl border border-cyan-800/30">
            <h2 className="text-xl md:text-2xl font-bold text-cyan-300 mb-3 md:mb-4">No transactions yet</h2>
            {activeTab === 'user' ? (
              <>
                <p className="text-cyan-200 mb-4 md:mb-6 px-4">Start trading in the market to see your transaction history.</p>
                <Link
                  href="/market"
                  className="px-4 py-2 md:px-6 md:py-3 inline-block rounded-lg bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-bold shadow-md tracking-widest text-base md:text-lg transition-all duration-200"
                >
                  Go to Market
                </Link>
              </>
            ) : (
              <p className="text-cyan-200">Be the first to make a trade in this market!</p>
            )}
          </div>
        ) : (
          <>
            {/* Desktop view table */}
            <div className="hidden sm:block overflow-x-auto bg-gray-900/30 rounded-xl border border-cyan-800/20 shadow-lg">
              <table className="min-w-full divide-y divide-gray-800">
                <thead className="bg-gray-900">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-cyan-300 uppercase tracking-wider">
                      Time
                    </th>
                    {activeTab === 'global' && (
                      <th className="px-6 py-4 text-left text-xs font-semibold text-cyan-300 uppercase tracking-wider">
                        User
                      </th>
                    )}
                    <th className="px-6 py-4 text-left text-xs font-semibold text-cyan-300 uppercase tracking-wider">
                      Team
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-cyan-300 uppercase tracking-wider">
                      Type
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-cyan-300 uppercase tracking-wider">
                      Shares
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-cyan-300 uppercase tracking-wider">
                      Price
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-cyan-300 uppercase tracking-wider">
                      Fee
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-cyan-300 uppercase tracking-wider">
                      Total
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-800">
                  {transactions.map((tx) => {
                    const total = tx.type === 'buy' 
                      ? tx.price + tx.fee 
                      : tx.price - tx.fee;
                      
                    return (
                      <tr 
                        key={`desktop-${tx._id}`} 
                        className="hover:bg-gray-800/50 transition-colors"
                      >
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-gray-300">
                          {formatDate(tx.timestamp)}
                        </td>
                        {activeTab === 'global' && (
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                            {tx.userEmail}
                          </td>
                        )}
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="ml-1">
                              <div className="text-sm font-medium text-cyan-300">{tx.teamSymbol || 'N/A'}</div>
                              <div className="text-xs text-gray-400">{tx.teamName || 'Unknown Team'}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            tx.type === 'buy' 
                              ? 'bg-cyan-900/40 text-cyan-300' 
                              : 'bg-pink-900/40 text-pink-300'
                          }`}>
                            {tx.type.toUpperCase()}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-gray-300">
                          {tx.shares || tx.quantity}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-gray-300">
                          {formatCurrency(tx.price)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-pink-300">
                          {formatCurrency(tx.fee)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-mono font-bold">
                          <span className={tx.type === 'buy' ? 'text-pink-300' : 'text-cyan-300'}>
                            {tx.type === 'buy' ? '-' : '+'}{formatCurrency(Math.abs(total))}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>

              {/* Legend */}
              <div className="px-6 py-4 bg-gray-900/50 flex flex-wrap justify-end gap-4 text-xs text-gray-400">
                <div className="flex items-center">
                  <span className="inline-block w-3 h-3 bg-cyan-900/40 rounded-full mr-1"></span>
                  <span>Buy</span>
                </div>
                <div className="flex items-center">
                  <span className="inline-block w-3 h-3 bg-pink-900/40 rounded-full mr-1"></span>
                  <span>Sell</span>
                </div>
                <div className="flex items-center">
                  <span className="text-pink-300 mr-1">-$</span>
                  <span>Cash Out</span>
                </div>
                <div className="flex items-center">
                  <span className="text-cyan-300 mr-1">+$</span>
                  <span>Cash In</span>
                </div>
              </div>
            </div>

            {/* Mobile view - cards */}
            <div className="sm:hidden">
              <div className="flex flex-col gap-3">
                {transactions.map((tx) => {
                  const total = tx.type === 'buy' 
                    ? tx.price + tx.fee 
                    : tx.price - tx.fee;
                    
                  return (
                    <div 
                      key={`mobile-${tx._id}`} 
                      className="bg-gray-900/40 rounded-lg border border-gray-800 overflow-hidden"
                    >
                      {/* Card header */}
                      <div className={`p-2 flex justify-between items-center ${
                        tx.type === 'buy' 
                          ? 'bg-cyan-900/30' 
                          : 'bg-pink-900/30'
                      }`}>
                        <div className="flex items-center">
                          <span className={`px-2 py-1 text-xs font-bold rounded-full mr-2 ${
                            tx.type === 'buy' 
                              ? 'bg-cyan-800/70 text-cyan-200' 
                              : 'bg-pink-800/70 text-pink-200'
                          }`}>
                            {tx.type.toUpperCase()}
                          </span>
                          <span className="text-xs text-gray-300 font-mono">{formatDate(tx.timestamp)}</span>
                        </div>
                        <span className={`font-mono font-bold text-sm ${tx.type === 'buy' ? 'text-pink-300' : 'text-cyan-300'}`}>
                          {tx.type === 'buy' ? '-' : '+'}{formatCurrency(Math.abs(total))}
                        </span>
                      </div>
                      
                      {/* Card content */}
                      <div className="p-3">
                        {/* Team info */}
                        <div className="mb-3 pb-2 border-b border-gray-800">
                          <div className="text-sm font-medium text-cyan-300 mb-1">{tx.teamSymbol || 'N/A'}</div>
                          <div className="text-xs text-gray-400">{tx.teamName || 'Unknown Team'}</div>
                        </div>
                        
                        {/* Global view user */}
                        {activeTab === 'global' && (
                          <div className="mb-3 pb-2 border-b border-gray-800">
                            <div className="text-xs text-gray-400 mb-1">User</div>
                            <div className="text-sm text-gray-300">{tx.userEmail}</div>
                          </div>
                        )}
                        
                        {/* Transaction details */}
                        <div className="grid grid-cols-3 gap-2 text-xs">
                          <div>
                            <div className="text-gray-400 mb-1">Shares</div>
                            <div className="font-mono text-gray-300">{tx.shares || tx.quantity}</div>
                          </div>
                          <div>
                            <div className="text-gray-400 mb-1">Price</div>
                            <div className="font-mono text-gray-300">{formatCurrency(tx.price)}</div>
                          </div>
                          <div>
                            <div className="text-gray-400 mb-1">Fee</div>
                            <div className="font-mono text-pink-300">{formatCurrency(tx.fee)}</div>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
              
              {/* Mobile legend */}
              <div className="mt-4 px-3 py-3 bg-gray-900/50 rounded-lg flex flex-wrap justify-center gap-3 text-xs text-gray-400">
                <div className="flex items-center">
                  <span className="inline-block w-3 h-3 bg-cyan-900/40 rounded-full mr-1"></span>
                  <span>Buy</span>
                </div>
                <div className="flex items-center">
                  <span className="inline-block w-3 h-3 bg-pink-900/40 rounded-full mr-1"></span>
                  <span>Sell</span>
                </div>
                <div className="flex items-center">
                  <span className="text-pink-300 mr-1">-$</span>
                  <span>Cash Out</span>
                </div>
                <div className="flex items-center">
                  <span className="text-cyan-300 mr-1">+$</span>
                  <span>Cash In</span>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
      
      {/* Add animations */}
      <style jsx>{`
        .drop-shadow-glow {
          filter: drop-shadow(0 0 8px rgba(103, 232, 249, 0.6));
        }
      `}</style>
    </main>
  );
}
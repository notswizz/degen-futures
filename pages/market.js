import { useEffect, useState, useRef } from 'react';
import TeamCard from '../components/TeamCard';
import BuySellModal from '../components/BuySellModal';
import Cookies from 'js-cookie';
import { useRouter } from 'next/router';

export default function MarketPage() {
  const [teams, setTeams] = useState([]);
  const [filteredTeams, setFilteredTeams] = useState([]);
  const [holdings, setHoldings] = useState({});
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState({ open: false, type: 'buy', team: null });
  const [modalLoading, setModalLoading] = useState(false);
  const [modalError, setModalError] = useState('');
  const [modalPreview, setModalPreview] = useState(null);
  const [shares, setShares] = useState('');
  const [highlighted, setHighlighted] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);
  // Sorting states
  const [sortDropdownOpen, setSortDropdownOpen] = useState(false);
  const [sortOption, setSortOption] = useState('default');
  // Filter states
  const [symbolFilter, setSymbolFilter] = useState('');
  const [priceRange, setPriceRange] = useState({ min: '', max: '' });
  const [volumeRange, setVolumeRange] = useState({ min: '', max: '' });
  // Mobile scroll state
  const [activeCardIndex, setActiveCardIndex] = useState(0);
  // Search state
  const [searchQuery, setSearchQuery] = useState('');
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);
  const scrollContainerRef = useRef(null);
  const router = useRouter();

  // Fetch teams
  useEffect(() => {
    fetch('/api/market/teams')
      .then(res => res.json())
      .then(data => {
        setTeams(data);
        setFilteredTeams(data);
        setLoading(false);
      });
  }, [refreshKey]); // Refresh when key changes

  // Apply filters when teams or filter values change
  useEffect(() => {
    if (teams.length === 0) return;
    
    let result = [...teams];
    
    // Filter by symbol/ABC
    if (symbolFilter) {
      result = result.filter(team => 
        team.symbol.toLowerCase().includes(symbolFilter.toLowerCase()) ||
        team.name.toLowerCase().includes(symbolFilter.toLowerCase())
      );
    }
    
    // Search query filter (will override symbolFilter if both are present)
    if (searchQuery) {
      result = result.filter(team => 
        team.symbol.toLowerCase().includes(searchQuery.toLowerCase()) ||
        team.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    
    // Filter by price
    if (priceRange.min) {
      result = result.filter(team => team.price >= Number(priceRange.min));
    }
    if (priceRange.max) {
      result = result.filter(team => team.price <= Number(priceRange.max));
    }
    
    // Filter by volume
    if (volumeRange.min) {
      result = result.filter(team => team.volume >= Number(volumeRange.min));
    }
    if (volumeRange.max) {
      result = result.filter(team => team.volume <= Number(volumeRange.max));
    }
    
    // Apply sorting
    if (sortOption !== 'default') {
      result = sortTeams(result, sortOption);
    }
    
    setFilteredTeams(result);
  }, [teams, symbolFilter, priceRange, volumeRange, sortOption, searchQuery]);

  // Sort teams based on selected option
  const sortTeams = (teamsToSort, option) => {
    switch (option) {
      case 'symbol-asc':
        return [...teamsToSort].sort((a, b) => a.symbol.localeCompare(b.symbol));
      case 'symbol-desc':
        return [...teamsToSort].sort((a, b) => b.symbol.localeCompare(a.symbol));
      case 'price-asc':
        return [...teamsToSort].sort((a, b) => a.price - b.price);
      case 'price-desc':
        return [...teamsToSort].sort((a, b) => b.price - a.price);
      case 'volume-asc':
        return [...teamsToSort].sort((a, b) => a.volume - b.volume);
      case 'volume-desc':
        return [...teamsToSort].sort((a, b) => b.volume - a.volume);
      default:
        return teamsToSort;
    }
  };

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
  
  // Handle filter changes
  const handlePriceRangeChange = (type, value) => {
    setPriceRange(prev => ({ ...prev, [type]: value }));
  };
  
  const handleVolumeRangeChange = (type, value) => {
    setVolumeRange(prev => ({ ...prev, [type]: value }));
  };
  
  const resetFilters = () => {
    setSymbolFilter('');
    setPriceRange({ min: '', max: '' });
    setVolumeRange({ min: '', max: '' });
  };
  
  // Toggle sort dropdown
  const toggleSortDropdown = () => {
    setSortDropdownOpen(!sortDropdownOpen);
  };
  
  // Handle sort selection
  const handleSortChange = (option) => {
    setSortOption(option);
    setSortDropdownOpen(false);
  };
  
  // Get sort option display text
  const getSortOptionText = () => {
    switch (sortOption) {
      case 'symbol-asc':
        return 'Symbol (A-Z)';
      case 'symbol-desc':
        return 'Symbol (Z-A)';
      case 'price-asc':
        return 'Price (Low-High)';
      case 'price-desc':
        return 'Price (High-Low)';
      case 'volume-asc':
        return 'Volume (Low-High)';
      case 'volume-desc':
        return 'Volume (High-Low)';
      default:
        return 'Default';
    }
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
  
  // Admin function to update team colors
  const updateTeamColors = async () => {
    try {
      const res = await fetch('/api/market/seed', {
        method: 'POST',
      });
      const data = await res.json();
      if (res.ok) {
        showNotification('Team colors updated successfully');
        setRefreshKey(oldKey => oldKey + 1);
      } else {
        showNotification('Error: ' + data.message);
      }
    } catch (error) {
      showNotification('Error updating team colors');
    }
  };

  // Track scroll position for mobile view
  const handleScroll = () => {
    if (!scrollContainerRef.current || filteredTeams.length === 0) return;
    
    const scrollContainer = scrollContainerRef.current;
    const scrollPosition = scrollContainer.scrollLeft;
    const cardWidth = scrollContainer.clientWidth * 0.85; // 85vw width
    const cardWithMargin = cardWidth + 16; // Include margins
    
    const index = Math.round(scrollPosition / cardWithMargin);
    setActiveCardIndex(Math.min(Math.max(0, index), filteredTeams.length - 1));
  };

  // Toggle mobile filter dropdown
  const toggleMobileFilter = () => {
    setMobileFilterOpen(!mobileFilterOpen);
  };

  // Clear search query
  const clearSearch = () => {
    setSearchQuery('');
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950 text-cyan-100 py-10 px-2">
      {/* Desktop Header */}
      <div className="hidden sm:flex justify-between items-center max-w-7xl mx-auto mb-6 px-4">
        <h1 className="text-4xl md:text-5xl font-extrabold tracking-widest text-cyan-300 drop-shadow-glow animate-pulse">NFL Market</h1>
        <div className="flex items-center gap-3">
          {/* Sort Dropdown Toggle */}
          <div className="relative">
            <button 
              onClick={toggleSortDropdown}
              className="bg-gray-800 hover:bg-gray-700 text-cyan-300 rounded-lg px-4 py-2 flex items-center gap-2 transition-all"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path d="M5 4a1 1 0 00-2 0v7.268a2 2 0 000 3.464V16a1 1 0 102 0v-1.268a2 2 0 000-3.464V4zM11 4a1 1 0 10-2 0v1.268a2 2 0 000 3.464V16a1 1 0 102 0V8.732a2 2 0 000-3.464V4zM16 3a1 1 0 011 1v7.268a2 2 0 010 3.464V16a1 1 0 11-2 0v-1.268a2 2 0 010-3.464V4a1 1 0 011-1z" />
              </svg>
              Sort: {getSortOptionText()}
            </button>
            
            {/* Sort Dropdown - Desktop */}
            {sortDropdownOpen && (
              <div className="absolute right-0 mt-2 bg-gray-800 border border-cyan-500/30 rounded-lg overflow-hidden shadow-xl z-10 w-48">
                <div className="text-xs uppercase text-cyan-500/70 px-3 py-1 border-b border-cyan-500/20">
                  Symbol
                </div>
                <button 
                  onClick={() => handleSortChange('symbol-asc')}
                  className={`w-full text-left px-3 py-2 text-sm hover:bg-gray-700 ${sortOption === 'symbol-asc' ? 'bg-cyan-900/30 text-cyan-300' : 'text-cyan-100'}`}
                >
                  A-Z
                </button>
                <button 
                  onClick={() => handleSortChange('symbol-desc')}
                  className={`w-full text-left px-3 py-2 text-sm hover:bg-gray-700 ${sortOption === 'symbol-desc' ? 'bg-cyan-900/30 text-cyan-300' : 'text-cyan-100'}`}
                >
                  Z-A
                </button>
                
                <div className="text-xs uppercase text-cyan-500/70 px-3 py-1 border-b border-cyan-500/20 border-t border-cyan-500/20">
                  Price
                </div>
                <button 
                  onClick={() => handleSortChange('price-asc')}
                  className={`w-full text-left px-3 py-2 text-sm hover:bg-gray-700 ${sortOption === 'price-asc' ? 'bg-cyan-900/30 text-cyan-300' : 'text-cyan-100'}`}
                >
                  Low to High
                </button>
                <button 
                  onClick={() => handleSortChange('price-desc')}
                  className={`w-full text-left px-3 py-2 text-sm hover:bg-gray-700 ${sortOption === 'price-desc' ? 'bg-cyan-900/30 text-cyan-300' : 'text-cyan-100'}`}
                >
                  High to Low
                </button>
                
                <div className="text-xs uppercase text-cyan-500/70 px-3 py-1 border-b border-cyan-500/20 border-t border-cyan-500/20">
                  Volume
                </div>
                <button 
                  onClick={() => handleSortChange('volume-asc')}
                  className={`w-full text-left px-3 py-2 text-sm hover:bg-gray-700 ${sortOption === 'volume-asc' ? 'bg-cyan-900/30 text-cyan-300' : 'text-cyan-100'}`}
                >
                  Low to High
                </button>
                <button 
                  onClick={() => handleSortChange('volume-desc')}
                  className={`w-full text-left px-3 py-2 text-sm hover:bg-gray-700 ${sortOption === 'volume-desc' ? 'bg-cyan-900/30 text-cyan-300' : 'text-cyan-100'}`}
                >
                  High to Low
                </button>
                
                <div className="border-t border-cyan-500/20">
                  <button 
                    onClick={() => handleSortChange('default')}
                    className={`w-full text-left px-3 py-2 text-sm hover:bg-gray-700 ${sortOption === 'default' ? 'bg-cyan-900/30 text-cyan-300' : 'text-cyan-100'}`}
                  >
                    Default Order
                  </button>
                </div>
              </div>
            )}
          </div>
          
          <button 
            onClick={() => setRefreshKey(k => k + 1)}
            className="bg-gray-800 hover:bg-gray-700 text-cyan-300 rounded-lg px-4 py-2 flex items-center gap-2 transition-all"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" />
            </svg>
            Refresh
          </button>
          
          {/* Hidden admin button (Alt+C to activate) */}
          <button 
            onClick={updateTeamColors}
            className="hidden"
            id="update-colors-btn"
            title="Update team colors"
          >
            Update Colors
          </button>
        </div>
      </div>
      
      {/* Mobile Header & Controls */}
      <div className="sm:hidden mb-6">
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-3xl font-extrabold tracking-widest text-cyan-300 drop-shadow-glow animate-pulse">NFL Market</h1>
          <div className="flex items-center gap-2">
            <button 
              onClick={toggleMobileFilter}
              className="bg-gray-800 hover:bg-gray-700 text-cyan-300 rounded-full p-2 flex items-center transition-all"
              aria-label="Filters"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path d="M5 4a1 1 0 00-2 0v7.268a2 2 0 000 3.464V16a1 1 0 102 0v-1.268a2 2 0 000-3.464V4zM11 4a1 1 0 10-2 0v1.268a2 2 0 000 3.464V16a1 1 0 102 0V8.732a2 2 0 000-3.464V4zM16 3a1 1 0 011 1v7.268a2 2 0 010 3.464V16a1 1 0 11-2 0v-1.268a2 2 0 010-3.464V4a1 1 0 011-1z" />
              </svg>
            </button>
            
            <button 
              onClick={() => setRefreshKey(k => k + 1)}
              className="bg-gray-800 hover:bg-gray-700 text-cyan-300 rounded-full p-2 flex items-center transition-all"
              aria-label="Refresh"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" />
              </svg>
            </button>
          </div>
        </div>
        
        {/* Mobile Search Bar */}
        <div className="relative mb-4">
          <input
            type="text"
            placeholder="Search teams..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-cyan-100 focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:border-transparent pl-10"
          />
          <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
            <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
            </svg>
          </div>
          {searchQuery && (
            <button 
              onClick={clearSearch}
              className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-cyan-300"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
              </svg>
            </button>
          )}
        </div>
        
        {/* Mobile Filter Dropdown */}
        {mobileFilterOpen && (
          <div className="bg-gray-800 border border-cyan-500/30 rounded-lg mb-4 overflow-hidden shadow-xl animate-fadeIn">
            <div className="border-b border-cyan-500/20 p-3 flex justify-between items-center">
              <span className="text-sm font-medium text-cyan-300">Sort Options</span>
              <button 
                onClick={toggleMobileFilter} 
                className="text-gray-400 hover:text-cyan-300"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                </svg>
              </button>
            </div>
            
            <div className="p-3 grid grid-cols-2 gap-2">
              <button 
                onClick={() => {
                  handleSortChange('symbol-asc');
                  toggleMobileFilter();
                }}
                className={`px-3 py-2 rounded-md text-sm text-center ${
                  sortOption === 'symbol-asc' ? 'bg-cyan-900/50 text-cyan-300' : 'bg-gray-700/50 text-cyan-100'
                }`}
              >
                Symbol A-Z
              </button>
              <button 
                onClick={() => {
                  handleSortChange('symbol-desc');
                  toggleMobileFilter();
                }}
                className={`px-3 py-2 rounded-md text-sm text-center ${
                  sortOption === 'symbol-desc' ? 'bg-cyan-900/50 text-cyan-300' : 'bg-gray-700/50 text-cyan-100'
                }`}
              >
                Symbol Z-A
              </button>
              <button 
                onClick={() => {
                  handleSortChange('price-asc');
                  toggleMobileFilter();
                }}
                className={`px-3 py-2 rounded-md text-sm text-center ${
                  sortOption === 'price-asc' ? 'bg-cyan-900/50 text-cyan-300' : 'bg-gray-700/50 text-cyan-100'
                }`}
              >
                Price ↓
              </button>
              <button 
                onClick={() => {
                  handleSortChange('price-desc');
                  toggleMobileFilter();
                }}
                className={`px-3 py-2 rounded-md text-sm text-center ${
                  sortOption === 'price-desc' ? 'bg-cyan-900/50 text-cyan-300' : 'bg-gray-700/50 text-cyan-100'
                }`}
              >
                Price ↑
              </button>
              <button 
                onClick={() => {
                  handleSortChange('volume-asc');
                  toggleMobileFilter();
                }}
                className={`px-3 py-2 rounded-md text-sm text-center ${
                  sortOption === 'volume-asc' ? 'bg-cyan-900/50 text-cyan-300' : 'bg-gray-700/50 text-cyan-100'
                }`}
              >
                Volume ↓
              </button>
              <button 
                onClick={() => {
                  handleSortChange('volume-desc');
                  toggleMobileFilter();
                }}
                className={`px-3 py-2 rounded-md text-sm text-center ${
                  sortOption === 'volume-desc' ? 'bg-cyan-900/50 text-cyan-300' : 'bg-gray-700/50 text-cyan-100'
                }`}
              >
                Volume ↑
              </button>
            </div>
            
            <button 
              onClick={() => {
                handleSortChange('default');
                toggleMobileFilter();
              }}
              className={`w-full p-2 border-t border-cyan-500/20 text-sm ${
                sortOption === 'default' ? 'bg-cyan-900/30 text-cyan-300' : 'text-cyan-100'
              }`}
            >
              Default Order
            </button>
          </div>
        )}
        
        {/* Current Sort Indicator */}
        <div className="flex justify-between items-center text-xs text-cyan-400/70 mb-2 px-1">
          <div>
            {filteredTeams.length} {filteredTeams.length === 1 ? 'team' : 'teams'} found
          </div>
          <div>
            Sorted by: {getSortOptionText()}
          </div>
        </div>
      </div>
      
      {/* Add keyboard shortcut for admin function */}
      <div className="hidden" dangerouslySetInnerHTML={{ __html: `
        <script>
          document.addEventListener('keydown', (e) => {
            if (e.altKey && e.key === 'c') {
              document.getElementById('update-colors-btn').click();
            }
          });
        </script>
      `}} />
      
      {loading ? (
        <div className="text-center text-cyan-200 font-mono py-20">
          <div className="inline-block w-12 h-12 border-4 border-cyan-400 border-t-transparent rounded-full animate-spin mb-4"></div>
          <p>Loading teams...</p>
        </div>
      ) : (
        <>
          {/* Desktop view - grid layout */}
          <div className="hidden sm:grid sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8 max-w-7xl mx-auto">
            {filteredTeams.map(team => (
              <TeamCard
                key={`desktop-${team._id}`}
                id={`team-${team._id}`}
                team={team}
                userShares={holdings[team._id]}
                onBuy={t => setModal({ open: true, type: 'buy', team: t })}
                onSell={t => setModal({ open: true, type: 'sell', team: t })}
                highlighted={highlighted === team._id}
              />
            ))}
          </div>
          
          {/* Mobile view - horizontal scroll with snap */}
          <div className="sm:hidden mb-10">
            <div className="relative">
              <div 
                ref={scrollContainerRef}
                className="flex overflow-x-auto snap-x snap-mandatory pb-6 px-4 -mx-4 scrollbar-hide"
                onScroll={handleScroll}
              >
                {filteredTeams.map((team, index) => (
                  <div 
                    key={`mobile-${team._id}`} 
                    className="flex-shrink-0 w-[85vw] snap-center mx-2 first:ml-4 last:mr-4"
                  >
                    <TeamCard
                      id={`team-mobile-${team._id}`}
                      team={team}
                      userShares={holdings[team._id]}
                      onBuy={t => setModal({ open: true, type: 'buy', team: t })}
                      onSell={t => setModal({ open: true, type: 'sell', team: t })}
                      highlighted={highlighted === team._id}
                    />
                  </div>
                ))}
              </div>
              
              {/* Empty state for search results */}
              {filteredTeams.length === 0 && searchQuery && (
                <div className="py-16 text-center">
                  <svg className="mx-auto h-12 w-12 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <p className="mt-4 text-cyan-300/70">No teams match "{searchQuery}"</p>
                  <button 
                    onClick={clearSearch} 
                    className="mt-2 text-cyan-400 hover:underline"
                  >
                    Clear search
                  </button>
                </div>
              )}
              
              {/* Card indicator - removed from individual cards and centralized here */}
              {filteredTeams.length > 0 && (
                <div className="flex justify-center mt-2 space-x-1">
                  {filteredTeams.map((_, i) => (
                    <div 
                      key={`indicator-${i}`} 
                      className={`h-1.5 rounded-full transition-all duration-300 ${i === activeCardIndex ? 'w-4 bg-cyan-400' : 'w-1.5 bg-gray-600'}`}
                      onClick={() => {
                        if (scrollContainerRef.current) {
                          const cardWidth = scrollContainerRef.current.clientWidth * 0.85;
                          const margin = 16; // 2 * 8px (mx-2)
                          scrollContainerRef.current.scrollTo({
                            left: i * (cardWidth + margin),
                            behavior: 'smooth'
                          });
                        }
                      }}
                    />
                  ))}
                </div>
              )}
              
              {/* Scroll hint arrows - only shown when there are multiple cards */}
              {filteredTeams.length > 1 && (
                <div className="absolute left-0 right-0 top-1/2 transform -translate-y-1/2 flex justify-between px-2 pointer-events-none">
                  <div className={`p-2 rounded-full bg-gray-900/50 backdrop-blur-sm ${activeCardIndex === 0 ? 'opacity-30' : 'opacity-70'}`}>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-cyan-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                  </div>
                  <div className={`p-2 rounded-full bg-gray-900/50 backdrop-blur-sm ${activeCardIndex === filteredTeams.length - 1 ? 'opacity-30' : 'opacity-70'}`}>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-cyan-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </div>
              )}
            </div>
            
            {/* Current card info */}
            {filteredTeams.length > 0 && (
              <div className="text-center text-xs text-cyan-400/70 mt-1">
                {activeCardIndex + 1} of {filteredTeams.length}
              </div>
            )}
          </div>
          
          {filteredTeams.length === 0 && !searchQuery && (
            <div className="col-span-full text-center py-10 text-cyan-300/70">
              <p className="text-lg">No teams match your filter criteria</p>
              <button 
                onClick={resetFilters}
                className="mt-2 text-cyan-400 hover:underline"
              >
                Reset Filters
              </button>
            </div>
          )}
        </>
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
        
        /* Hide scrollbar but maintain functionality */
        .scrollbar-hide {
          -ms-overflow-style: none;  /* IE and Edge */
          scrollbar-width: none;  /* Firefox */
        }
        .scrollbar-hide::-webkit-scrollbar {
          display: none;  /* Chrome, Safari and Opera */
        }
        
        /* Improve touch scrolling on mobile */
        @media (max-width: 640px) {
          .snap-x {
            scroll-snap-type: x mandatory;
            -webkit-overflow-scrolling: touch;
          }
          
          .snap-center {
            scroll-snap-align: center;
          }
          
          /* Add momentum scrolling for iOS devices */
          * {
            -webkit-overflow-scrolling: touch;
          }
        }
      `}</style>
    </main>
  );
} 
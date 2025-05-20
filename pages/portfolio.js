import { useState, useEffect, useRef } from 'react';
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
  // Mobile scroll state
  const [activeCardIndex, setActiveCardIndex] = useState(0);
  const scrollContainerRef = useRef(null);
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
  
  // Get contrasting text color based on background
  const getContrastColor = (hexColor) => {
    // Remove the # if present
    const color = hexColor?.startsWith('#') ? hexColor.slice(1) : hexColor;
    if (!color) return '#ffffff';
    
    // Convert to RGB
    const r = parseInt(color.substr(0, 2), 16);
    const g = parseInt(color.substr(2, 2), 16);
    const b = parseInt(color.substr(4, 2), 16);
    
    // Calculate luminance
    const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
    
    // Return white for dark colors, black for light colors
    return luminance > 0.5 ? '#000000' : '#ffffff';
  };

  // Track scroll position for mobile view
  const handleScroll = () => {
    if (!scrollContainerRef.current || sortedHoldings.length === 0) return;
    
    const scrollContainer = scrollContainerRef.current;
    const scrollPosition = scrollContainer.scrollLeft;
    const cardWidth = scrollContainer.clientWidth * 0.85; // 85vw width
    const cardWithMargin = cardWidth + 16; // Include margins
    
    const index = Math.round(scrollPosition / cardWithMargin);
    setActiveCardIndex(Math.min(Math.max(0, index), sortedHoldings.length - 1));
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950 text-cyan-100 py-6 px-3 md:py-10 md:px-4">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-6 md:mb-10">
        
        
          {!loading && (
            <div className="mt-3 md:mt-4 bg-gradient-to-r from-gray-800 to-gray-900 p-4 md:p-5 rounded-xl border border-cyan-500/30 inline-block shadow-lg">
              <p className="text-xl md:text-2xl font-bold text-cyan-200">
                Total Value: <span className="text-cyan-300 font-mono">${totalValue.toFixed(2)}</span>
              </p>
              <p className="text-xs md:text-sm text-cyan-400 mt-1"> {holdings.length} teams</p>
            </div>
          )}
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block w-12 h-12 border-4 border-cyan-400 border-t-transparent rounded-full animate-spin mb-4"></div>
            <p className="text-cyan-300 font-mono">Loading your portfolio...</p>
          </div>
        ) : holdings.length === 0 ? (
          <div className="text-center py-8 md:py-12 bg-gray-900/50 rounded-xl border border-cyan-800/30">
            <h2 className="text-xl md:text-2xl font-bold text-cyan-300 mb-3 md:mb-4">No holdings yet</h2>
            <p className="text-cyan-200 mb-4 md:mb-6 px-4">Start building your portfolio by purchasing team shares in the market.</p>
            <Link href="/market" className="px-4 py-2 md:px-6 md:py-3 rounded-lg bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-bold shadow-md tracking-widest text-base md:text-lg transition-all duration-200">
              Go to Market
            </Link>
          </div>
        ) : (
          <>
            {/* Sort controls */}
            <div className="flex flex-wrap justify-center md:justify-end mb-4 gap-2 sticky top-0 z-10 bg-gray-900/80 py-2 px-2 rounded-lg backdrop-blur-sm">
              <span className="text-cyan-300 md:mr-2 self-center text-sm md:text-base">Sort by:</span>
              <div className="flex gap-1">
                <button 
                  onClick={() => setSortMethod('value')}
                  className={`px-2 py-1 md:px-3 rounded text-sm ${sortMethod === 'value' ? 'bg-cyan-700 text-white' : 'bg-gray-800 text-cyan-200 hover:bg-gray-700'}`}
                >
                  Value
                </button>
                <button 
                  onClick={() => setSortMethod('shares')}
                  className={`px-2 py-1 md:px-3 rounded text-sm ${sortMethod === 'shares' ? 'bg-cyan-700 text-white' : 'bg-gray-800 text-cyan-200 hover:bg-gray-700'}`}
                >
                  Shares
                </button>
                <button 
                  onClick={() => setSortMethod('name')}
                  className={`px-2 py-1 md:px-3 rounded text-sm ${sortMethod === 'name' ? 'bg-cyan-700 text-white' : 'bg-gray-800 text-cyan-200 hover:bg-gray-700'}`}
                >
                  Name
                </button>
              </div>
            </div>

            {/* Desktop holdings grid */}
            <div className="hidden sm:grid sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
              {sortedHoldings.map(holding => {
                const team = teams[holding.teamId];
                if (!team) return null;
                
                const value = calculateValue(team, holding.shares);
                const percentOfTotal = totalValue > 0 ? (value / totalValue) * 100 : 0;
                
                // Get team colors
                const primaryColor = team.primaryColor || '#004c54';
                const secondaryColor = team.secondaryColor || '#000000';
                const primaryTextColor = getContrastColor(primaryColor);
                const secondaryTextColor = getContrastColor(secondaryColor);
                
                return (
                  <div 
                    key={`desktop-${holding._id}`} 
                    className="rounded-xl overflow-hidden shadow-xl transition-transform duration-300 hover:scale-105 relative"
                    style={{ 
                      background: secondaryColor,
                      boxShadow: `0 10px 25px -5px ${primaryColor}40, 0 0 5px ${secondaryColor}80`
                    }}
                  >
                    {/* Header with team color */}
                    <div 
                      className="p-3 flex items-center justify-between relative"
                      style={{ backgroundColor: primaryColor, color: primaryTextColor }}
                    >
                      <div className="flex flex-col">
                        <span className="text-2xl font-extrabold tracking-widest">{team.symbol}</span>
                        <span className="text-xs font-medium opacity-90">{team.name}</span>
                      </div>
                      
                      {/* Price tag */}
                      <div 
                        className="absolute -right-1 top-0 shadow-lg px-3 py-1 font-mono text-sm font-bold flex items-center transform translate-y-0 z-10"
                        style={{ 
                          backgroundColor: secondaryColor, 
                          color: secondaryTextColor,
                          clipPath: 'polygon(0 0, 100% 0, 100% 100%, 15px 100%)',
                          boxShadow: `0 3px 10px rgba(0,0,0,0.3)`,
                          borderLeft: `3px solid ${primaryColor}`
                        }}
                      >
                        <div className="price-shine absolute inset-0 opacity-20 z-0"></div>
                        <span className="mr-1 text-xs opacity-60">$</span>
                        <span className="text-base">{team.price.toFixed(2)}</span>
                      </div>
                    </div>
                    
                    {/* Content */}
                    <div className="p-4" style={{ color: secondaryTextColor }}>
                      {/* Shares badge - large and centered */}
                      <div className="flex justify-center mb-4">
                        <div 
                          className="font-mono text-lg font-bold px-4 py-2 rounded-md flex items-center shadow-md"
                          style={{ 
                            backgroundColor: `${primaryColor}20`, 
                            color: primaryTextColor === '#000000' ? primaryColor : secondaryTextColor,
                            border: `2px solid ${primaryColor}80`
                          }}
                        >
                          <span className="text-2xl mr-2">{holding.shares}</span>
                          <span>{holding.shares === 1 ? 'share' : 'shares'}</span>
                        </div>
                      </div>
                      
                      {/* Value info */}
                      <div className="grid grid-cols-2 gap-y-3 mb-4">
                        <div className="text-sm opacity-80">Current Value</div>
                        <div className="text-sm font-bold text-right">${value.toFixed(2)}</div>
                        
                        <div className="text-sm opacity-80">% of Portfolio</div>
                        <div className="text-sm font-bold text-right">{percentOfTotal.toFixed(2)}%</div>
                      </div>
                      
                      {/* Progress bar */}
                      <div className="mt-3 mb-4 w-full rounded-full h-3" style={{ backgroundColor: `${primaryColor}20` }}>
                        <div 
                          className="h-3 rounded-full relative overflow-hidden" 
                          style={{ 
                            width: `${Math.max(5, percentOfTotal)}%`, 
                            backgroundColor: primaryColor 
                          }}
                        >
                          <div className="progress-shine absolute inset-0"></div>
                        </div>
                      </div>
                      
                      {/* Buttons */}
                      <div className="flex gap-2 mt-4">
                        <Link 
                          href={`/market?highlight=${team._id}`}
                          className="flex-1 py-2 text-center rounded-md text-sm font-bold transition-all shadow-md hover:shadow-lg hover:translate-y-[-2px]"
                          style={{ 
                            backgroundColor: primaryColor, 
                            color: primaryTextColor,
                            border: `1px solid ${primaryTextColor}20`
                          }}
                        >
                          Buy More
                        </Link>
                        <button 
                          onClick={() => handleSell(team._id)}
                          className="flex-1 py-2 text-center rounded-md text-sm font-bold transition-all shadow-md hover:shadow-lg hover:translate-y-[-2px]"
                          style={{ 
                            backgroundColor: secondaryColor, 
                            color: secondaryTextColor,
                            border: `1px solid ${primaryColor}80`
                          }}
                        >
                          Sell
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Mobile view - horizontal scroll with snap */}
            <div className="sm:hidden mb-10">
              <div className="relative">
                <div 
                  ref={scrollContainerRef}
                  className="flex overflow-x-auto snap-x snap-mandatory pb-6 px-4 -mx-4 scrollbar-hide"
                  onScroll={handleScroll}
                >
                  {sortedHoldings.map((holding, index) => {
                    const team = teams[holding.teamId];
                    if (!team) return null;
                    
                    const value = calculateValue(team, holding.shares);
                    const percentOfTotal = totalValue > 0 ? (value / totalValue) * 100 : 0;
                    
                    // Get team colors
                    const primaryColor = team.primaryColor || '#004c54';
                    const secondaryColor = team.secondaryColor || '#000000';
                    const primaryTextColor = getContrastColor(primaryColor);
                    const secondaryTextColor = getContrastColor(secondaryColor);
                    
                    return (
                      <div 
                        key={`mobile-${holding.teamId}-${index}`} 
                        className="flex-shrink-0 w-[85vw] snap-center mx-2 first:ml-4 last:mr-4"
                      >
                        <div 
                          className="rounded-xl overflow-hidden shadow-xl h-full flex flex-col"
                          style={{ 
                            background: secondaryColor,
                            boxShadow: `0 10px 25px -5px ${primaryColor}40, 0 0 5px ${secondaryColor}80`
                          }}
                        >
                          {/* Header with team color */}
                          <div 
                            className="p-3 flex items-center justify-between relative"
                            style={{ backgroundColor: primaryColor, color: primaryTextColor }}
                          >
                            <div className="flex flex-col">
                              <span className="text-2xl font-extrabold tracking-widest">{team.symbol}</span>
                              <span className="text-xs font-medium opacity-90">{team.name}</span>
                            </div>
                            
                            {/* Price tag */}
                            <div 
                              className="px-3 py-1 font-mono text-sm font-bold flex items-center"
                              style={{ 
                                backgroundColor: secondaryColor, 
                                color: secondaryTextColor,
                                clipPath: 'polygon(10px 0, 100% 0, 100% 100%, 0 100%)',
                                boxShadow: `0 3px 10px rgba(0,0,0,0.3)`,
                                borderRight: `3px solid ${primaryColor}`
                              }}
                            >
                              <div className="price-shine absolute inset-0 opacity-20 z-0"></div>
                              <span className="mr-1 text-xs opacity-60">$</span>
                              <span className="text-base">{team.price.toFixed(2)}</span>
                            </div>
                          </div>
                          
                          {/* Content */}
                          <div className="p-4 flex-1 flex flex-col" style={{ color: secondaryTextColor }}>
                            {/* Shares badge - large and centered */}
                            <div className="flex justify-center mb-4">
                              <div 
                                className="font-mono text-lg font-bold px-4 py-2 rounded-md flex items-center shadow-md"
                                style={{ 
                                  backgroundColor: `${primaryColor}20`, 
                                  color: primaryTextColor === '#000000' ? primaryColor : secondaryTextColor,
                                  border: `2px solid ${primaryColor}80`
                                }}
                              >
                                <span className="text-2xl mr-2">{holding.shares}</span>
                                <span>{holding.shares === 1 ? 'share' : 'shares'}</span>
                              </div>
                            </div>
                            
                            {/* Value info */}
                            <div className="grid grid-cols-2 gap-y-3 mb-4">
                              <div className="text-sm opacity-80">Current Value</div>
                              <div className="text-sm font-bold text-right">${value.toFixed(2)}</div>
                              
                              <div className="text-sm opacity-80">% of Portfolio</div>
                              <div className="text-sm font-bold text-right">{percentOfTotal.toFixed(2)}%</div>
                            </div>
                            
                            {/* Progress bar */}
                            <div className="mt-3 mb-4 w-full rounded-full h-3" style={{ backgroundColor: `${primaryColor}20` }}>
                              <div 
                                className="h-3 rounded-full relative overflow-hidden" 
                                style={{ 
                                  width: `${Math.max(5, percentOfTotal)}%`, 
                                  backgroundColor: primaryColor 
                                }}
                              >
                                <div className="progress-shine absolute inset-0"></div>
                              </div>
                            </div>
                            
                            {/* Buttons */}
                            <div className="flex gap-2 mt-auto">
                              <Link 
                                href={`/market?highlight=${team._id}`}
                                className="flex-1 py-2 text-center rounded-md text-sm font-bold transition-all shadow-md hover:shadow-lg hover:translate-y-[-2px]"
                                style={{ 
                                  backgroundColor: primaryColor, 
                                  color: primaryTextColor,
                                  border: `1px solid ${primaryTextColor}20`
                                }}
                              >
                                Buy More
                              </Link>
                              <button 
                                onClick={() => handleSell(team._id)}
                                className="flex-1 py-2 text-center rounded-md text-sm font-bold transition-all shadow-md hover:shadow-lg hover:translate-y-[-2px]"
                                style={{ 
                                  backgroundColor: secondaryColor, 
                                  color: secondaryTextColor,
                                  border: `1px solid ${primaryColor}80`
                                }}
                              >
                                Sell
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Card indicator - dots */}
                {sortedHoldings.length > 0 && (
                  <div className="flex justify-center mt-2 space-x-1">
                    {sortedHoldings.map((holding, i) => (
                      <div 
                        key={`indicator-${holding.teamId}-${i}`} 
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
              </div>
            </div>
          </>
        )}
      </div>
    </main>
  );
}
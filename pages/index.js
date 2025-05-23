import Head from "next/head";
import Link from 'next/link';
import ChatBox from '../components/ChatBox';
import { useState, useEffect } from 'react';

export default function HomePage() {
  const [isMobile, setIsMobile] = useState(false);
  const [stats, setStats] = useState({
    totalUsers: 0,
    potAmount: 0,
    totalTeams: 0,
    totalVolume: 0,
    totalTrades: 0
  });
  const [loading, setLoading] = useState(true);
  
  // Check if the device is mobile on client-side
  useEffect(() => {
    setIsMobile(window.innerWidth < 768);
    
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Fetch stats on component mount
  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await fetch('/api/stats');
        if (!response.ok) {
          throw new Error('Failed to fetch stats');
        }
        const data = await response.json();
        setStats(data);
      } catch (error) {
        console.error('Failed to fetch stats:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  // Format numbers with commas for thousands
  const formatNumber = (num) => {
    return new Intl.NumberFormat().format(Math.round(num));
  };

  // Format currency
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  return (
    <>
      <Head>
        <title>Degen Futures</title>
        <meta name="description" content="Fantasy futures market for NFL teams" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <main className="min-h-screen flex flex-col items-center bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950 text-cyan-100 relative overflow-hidden py-6 px-4 md:py-10">
        {/* Background effects */}
        <div className="absolute top-0 left-0 w-full h-full pointer-events-none z-0" 
             style={{ background: 'radial-gradient(circle at 60% 40%, #0ff3fc22 0%, transparent 70%)' }} />
        <div className="absolute bottom-0 right-0 w-full h-full pointer-events-none z-0 opacity-20"
             style={{ background: 'radial-gradient(circle at 20% 80%, #0ff3fc22 0%, transparent 60%)' }} />
        
        <header className="z-10 w-full max-w-6xl px-4 mb-6 md:mb-10">
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 to-blue-400 text-center drop-shadow-glow animate-pulse py-2">
            DEGEN FUTURES
          </h1>
        </header>
        
        {/* Stats cards - now at the top */}
        <div className="w-full max-w-6xl grid grid-cols-2 md:grid-cols-4 gap-3 mb-6 z-10">
          <div className="bg-gray-900/60 border border-cyan-700/20 rounded-lg p-4 text-center transition-all duration-300 hover:bg-gray-800/60 hover:border-cyan-600/30">
            <div className="text-cyan-300 text-sm">Current Pot</div>
            {loading ? (
              <div className="h-8 bg-gray-700/50 animate-pulse rounded mt-1"></div>
            ) : (
              <div className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 to-blue-400 mt-1">{formatCurrency(stats.potAmount)}</div>
            )}
          </div>
          <div className="bg-gray-900/60 border border-cyan-700/20 rounded-lg p-4 text-center transition-all duration-300 hover:bg-gray-800/60 hover:border-cyan-600/30">
            <div className="text-cyan-300 text-sm">Volume</div>
            {loading ? (
              <div className="h-8 bg-gray-700/50 animate-pulse rounded mt-1"></div>
            ) : (
              <div className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 to-blue-400 mt-1">{formatCurrency(stats.totalVolume)}</div>
            )}
          </div>
          <div className="bg-gray-900/60 border border-cyan-700/20 rounded-lg p-4 text-center transition-all duration-300 hover:bg-gray-800/60 hover:border-cyan-600/30">
            <div className="text-cyan-300 text-sm">Trades</div>
            {loading ? (
              <div className="h-8 bg-gray-700/50 animate-pulse rounded mt-1"></div>
            ) : (
              <div className="text-2xl font-bold text-white mt-1">{formatNumber(stats.totalTrades)}</div>
            )}
          </div>
          <div className="bg-gray-900/60 border border-cyan-700/20 rounded-lg p-4 text-center transition-all duration-300 hover:bg-gray-800/60 hover:border-cyan-600/30">
            <div className="text-cyan-300 text-sm">Active Users</div>
            {loading ? (
              <div className="h-8 bg-gray-700/50 animate-pulse rounded mt-1"></div>
            ) : (
              <div className="text-2xl font-bold text-white mt-1">{formatNumber(stats.totalUsers)}</div>
            )}
          </div>
        </div>
        
        {/* Main content section */}
        <section className="z-10 flex flex-col items-center max-w-6xl w-full px-2 md:px-4 gap-6 md:gap-8">
          {/* Info card - always appears first on mobile */}
          <div className="w-full flex flex-col gap-5 p-6 md:p-8 rounded-xl bg-gray-900/80 border-2 border-cyan-500/20 shadow-2xl backdrop-blur-sm">
            <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-cyan-200 mb-1">
              Fantasy Football Prediction Market
            </h2>
            
            <p className="text-base md:text-lg text-cyan-200 font-mono">
              Buy & sell shares of NFL teams, ride the hype, and win the pot if your team takes the Super Bowl. 
              <span className="block mt-2">
                Powered by a live bonding curve. <span className="text-pink-400 font-bold">2% fee</span> on every trade goes to the winner!
              </span>
            </p>
            
            <div className="flex flex-wrap gap-3 mt-1">
              <Link href="/register" className="px-5 py-2.5 rounded-lg bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-extrabold text-lg shadow-lg tracking-wider transition-all duration-200 focus:ring-4 focus:ring-cyan-300 focus:ring-opacity-50" style={{ textShadow: '0 0 8px #0ff3fc' }}>
                Register
              </Link>
              <Link href="/login" className="px-5 py-2.5 rounded-lg bg-gray-800 hover:bg-gray-700 text-cyan-100 font-bold text-lg shadow-md tracking-wider border border-cyan-400/40 transition-all duration-200">
                Login
              </Link>
            </div>
            
            <div className="mt-4 pt-4 border-t border-cyan-500/20">
              <h3 className="text-lg md:text-xl font-bold text-cyan-300 mb-3">How It Works</h3>
              <ul className="space-y-2 text-cyan-100 text-sm md:text-base">
                <li className="flex items-start">
                  <span className="text-cyan-400 mr-2 text-lg">•</span> 
                  Buy shares of teams you think will win the Super Bowl
                </li>
                <li className="flex items-start">
                  <span className="text-cyan-400 mr-2 text-lg">•</span> 
                  Prices rise and fall based on a bonding curve formula
                </li>
                <li className="flex items-start">
                  <span className="text-cyan-400 mr-2 text-lg">•</span> 
                  Trade anytime: buy low, sell high
                </li>
                <li className="flex items-start">
                  <span className="text-cyan-400 mr-2 text-lg">•</span> 
                  2% fee on all trades goes to the prize pot
                </li>
                <li className="flex items-start">
                  <span className="text-cyan-400 mr-2 text-lg">•</span> 
                  Win big if you hold shares of the Super Bowl champion
                </li>
              </ul>
            </div>
          </div>
          
          {/* Chatbot - appears below info card */}
          <div className="w-full">
            <ChatBox />
          </div>
        </section>
        
        <footer className="mt-auto pt-10 pb-4 w-full text-center text-cyan-500/60 text-xs">
          © 2025 Degen Futures. All rights reserved. Not financial advice.
        </footer>
      </main>
    </>
  );
}

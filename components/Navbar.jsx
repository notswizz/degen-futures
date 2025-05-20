import Link from 'next/link';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import Cookies from 'js-cookie';
import { isAuthenticated } from '../lib/auth';
import { jwtDecode } from 'jwt-decode';
import BalanceModal from './BalanceModal';

const navLinks = [
  { href: '/market', label: 'Market' },
  { href: '/portfolio', label: 'Portfolio' },
  { href: '/history', label: 'History' },
  { href: '/pot', label: 'Pot' },
];

export default function Navbar() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [authSource, setAuthSource] = useState('none');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [balanceModalOpen, setBalanceModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [balance, setBalance] = useState(0);

  // Prevent any automatic refreshing entirely by removing user from dependencies
  useEffect(() => {
    console.log('Route changed');
    // Just check auth without refreshing data
    checkAuth();
    // Close mobile menu on route change
    setMobileMenuOpen(false);
  }, [router.asPath]);

  // Initial auth check on component mount (once only)
  useEffect(() => {
    console.log('Initial auth check');
    checkAuth();
    
    // Add logging for every render to track what's causing re-renders
    console.log('Navbar rendered at:', new Date().toISOString());
  }, []);

  // Check auth state using multiple sources - make pure function with no side effects
  const checkAuth = () => {
    console.log('Navbar: checking authentication state at:', new Date().toISOString());
    
    // Try to get token from cookies
    const token = Cookies.get('token');
    console.log('Token in cookies:', token ? 'yes' : 'no');
    
    if (token) {
      try {
        // Use jwt-decode for more robust decoding
        const decoded = jwtDecode(token);
        console.log('Decoded token payload:', decoded);
        setUser(decoded);
        // Ensure balance is a number, default to 1000 if undefined
        const safeBalance = typeof decoded.balance === 'number' ? decoded.balance : 1000;
        setBalance(safeBalance);
        setAuthSource('cookie');
        return;
      } catch (err) {
        console.error('Error decoding JWT token:', err);
      }
    }
    
    // Fallback to localStorage
    try {
      const storedUser = localStorage.getItem('user');
      if (storedUser) {
        const parsedUser = JSON.parse(storedUser);
        console.log('User from localStorage:', parsedUser);
        setUser(parsedUser);
        // Ensure balance is a number, default to 1000 if undefined
        const safeBalance = typeof parsedUser.balance === 'number' ? parsedUser.balance : 1000;
        setBalance(safeBalance);
        setAuthSource('localStorage');
        return;
      }
    } catch (err) {
      console.error('Error parsing user from localStorage:', err);
    }
    
    console.log('No authentication found');
    setUser(null);
    setBalance(0);
    setAuthSource('none');
  };

  const handleLogout = () => {
    console.log('Logging out');
    Cookies.remove('token');
    localStorage.removeItem('user');
    setUser(null);
    setAuthSource('none');
    router.push('/login');
  };

  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

  const openBalanceModal = () => {
    // Verify user is logged in before opening modal
    if (!user) {
      router.push('/login');
      return;
    }
    setBalanceModalOpen(true);
    setError('');
  };

  const closeBalanceModal = () => {
    setBalanceModalOpen(false);
    setError('');
  };

  const handleAddBalance = async (amount) => {
    setLoading(true);
    setError('');
    
    try {
      // Get the latest token
      const token = Cookies.get('token');
      if (!token) {
        throw new Error('You must be logged in to add balance');
      }
      
      // Ensure amount is a proper number
      const numericAmount = Number(amount);
      if (isNaN(numericAmount) || numericAmount <= 0) {
        throw new Error('Please enter a valid positive number');
      }
      
      console.log('Adding to balance - amount:', numericAmount, 'type:', typeof numericAmount);
      
      const response = await fetch('/api/user/balance', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ amount: numericAmount }),
        credentials: 'include' // Include cookies in the request
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to add balance');
      }
      
      console.log('Balance updated successfully:', data);
      
      // Make sure we have a balance value from the response
      const newBalance = typeof data.balance === 'number' ? data.balance : 1000;
      
      // Update local state with new balance
      setBalance(newBalance);
      
      // If user exists, update it with the new balance
      if (user) {
        const updatedUser = { ...user, balance: newBalance };
        
        // Update localStorage if that's where the user was stored
        if (authSource === 'localStorage') {
          localStorage.setItem('user', JSON.stringify(updatedUser));
        }
        
        setUser(updatedUser);
      }
      
      // Close the modal after successful update
      setBalanceModalOpen(false);
      
      // Single check after update (no chains)
      checkAuth();
    } catch (error) {
      console.error('Error adding balance:', error);
      setError(error.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };
  
  // Make refresh a purely manual operation
  const refreshUserData = async () => {
    try {
      console.log('Manually refreshing user data at:', new Date().toISOString());
      const response = await fetch('/api/auth/refresh', {
        method: 'GET',
        credentials: 'include',
        // Add cache control to prevent automatic refreshes
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        console.log('Refresh response:', data);
        
        // Force balance update from response if available
        if (data.user && typeof data.user.balance === 'number') {
          console.log('Setting balance from refresh:', data.user.balance);
          setBalance(data.user.balance);
          
          // Update user state as well
          if (user) {
            setUser({
              ...user,
              balance: data.user.balance
            });
          }
        }
      }
    } catch (error) {
      console.error('Error refreshing user data:', error);
    }
  };

  // Make sure balance is always a number to avoid the toFixed() error
  const safeBalance = typeof balance === 'number' ? balance : 0;

  console.log('Render navbar. Auth state:', authSource, 'User:', user, 'Balance:', safeBalance);

  return (
    <nav className="w-full bg-gradient-to-r from-gray-950 via-gray-900 to-gray-950 py-3 md:py-4 px-3 md:px-6 flex items-center justify-center shadow-xl border-b-2 border-cyan-500/30 relative z-20">
      <div className="flex gap-2 md:gap-6 items-center w-full max-w-7xl justify-between">
        {/* Logo/Brand - visible on both mobile and desktop */}
        <div className="flex items-center">
          <Link href="/" className="text-cyan-300 no-underline">
            <h1 className="m-0 font-extrabold text-base md:text-xl">
              <span className="text-cyan-300">DEGEN</span>
              <span className="text-cyan-400 text-sm md:text-base ml-1">FUTURES</span>
            </h1>
          </Link>
        </div>

        {/* Desktop Navigation */}
        <div className="hidden md:flex gap-6">
          {navLinks.map(({ href, label }) => {
            const active = router.pathname === href;
            return (
              <Link key={href} href={href} className={`relative px-4 py-2 rounded-lg font-bold tracking-widest text-cyan-200 transition-all duration-200
                ${active ? 'bg-cyan-700/30 text-cyan-300 shadow-[0_0_12px_2px_#0ff3fc55] border border-cyan-400' : 'hover:bg-cyan-800/20 hover:text-cyan-100'}`}
                style={active ? { textShadow: '0 0 8px #0ff3fc' } : {}}
              >
                {label}
                {active && (
                  <span className="absolute left-1/2 -bottom-1 w-2 h-2 bg-cyan-400 rounded-full blur-sm animate-pulse" style={{ transform: 'translateX(-50%)' }} />
                )}
              </Link>
            );
          })}
        </div>

        {/* Mobile & Desktop Auth Buttons */}
        <div className="flex gap-2 md:gap-4 items-center">
          {user ? (
            <>
              {/* Balance display - desktop */}
              <button 
                onClick={openBalanceModal}
                className="hidden md:flex items-center gap-1 text-cyan-200 font-mono text-sm px-3 py-1 rounded bg-cyan-800/40 border border-cyan-700 hover:bg-cyan-700/50 transition-colors"
              >
                <span className="font-semibold">
                  ${safeBalance.toFixed(2)}
                </span>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-cyan-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
              </button>
              
              <span className="hidden md:inline text-cyan-200 font-mono text-sm px-3 py-1 rounded bg-cyan-900/40 border border-cyan-700">
                {user.email}
              </span>
              <button
                onClick={handleLogout}
                className="hidden md:block px-3 py-1.5 md:px-4 md:py-2 rounded-lg bg-gradient-to-r from-pink-500 to-pink-700 hover:from-pink-400 hover:to-pink-600 text-white font-bold shadow-md tracking-widest text-xs md:text-sm transition-all duration-200 focus:ring-2 focus:ring-pink-300 focus:ring-opacity-50"
              >
                Logout
              </button>
            </>
          ) : (
            <>
              <Link href="/login" className="hidden md:inline-block px-4 py-2 rounded-lg bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-bold shadow-md tracking-widest text-sm transition-all duration-200 focus:ring-2 focus:ring-cyan-300 focus:ring-opacity-50">
                Login
              </Link>
              <Link href="/register" className="hidden md:inline-block px-4 py-2 rounded-lg bg-gradient-to-r from-gray-800 to-cyan-700 hover:from-gray-700 hover:to-cyan-600 text-cyan-100 font-bold shadow-md tracking-widest text-sm border border-cyan-400/40 transition-all duration-200">
                Register
              </Link>
              <Link href="/login" className="md:hidden px-3 py-1.5 rounded-lg bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-bold shadow-md tracking-widest text-xs">
                Login
              </Link>
            </>
          )}

          {/* Mobile menu toggle button */}
          <button 
            onClick={toggleMobileMenu}
            className="md:hidden flex flex-col justify-center items-center w-10 h-10 p-2 rounded-lg bg-cyan-800/20 border border-cyan-700/40 focus:outline-none"
            aria-label="Toggle mobile menu"
          >
            <span className={`bg-cyan-300 h-0.5 w-5 rounded-lg transition-all duration-200 mb-1 ${mobileMenuOpen ? 'transform rotate-45 translate-y-1.5' : ''}`} />
            <span className={`bg-cyan-300 h-0.5 w-5 rounded-lg transition-all duration-200 ${mobileMenuOpen ? 'opacity-0' : ''}`} />
            <span className={`bg-cyan-300 h-0.5 w-5 rounded-lg transition-all duration-200 mt-1 ${mobileMenuOpen ? 'transform -rotate-45 -translate-y-1.5' : ''}`} />
          </button>
        </div>
      </div>

      {/* Mobile Menu - Slide down panel */}
      <div 
        className={`absolute top-full left-0 right-0 bg-gray-900/95 backdrop-blur-sm shadow-lg border-b border-cyan-500/30 transition-all duration-300 overflow-hidden md:hidden ${
          mobileMenuOpen ? 'max-h-screen opacity-100' : 'max-h-0 opacity-0'
        }`}
      >
        <div className="flex flex-col p-3 gap-2">
          {user && (
            <button 
              onClick={openBalanceModal}
              className="flex items-center justify-between px-4 py-3 rounded-md bg-cyan-800/40 border border-cyan-700 text-cyan-200"
            >
              <span className="font-medium">Balance</span>
              <span className="font-mono text-cyan-300 font-bold">${safeBalance.toFixed(2)}</span>
            </button>
          )}
          
          {navLinks.map(({ href, label }) => {
            const active = router.pathname === href;
            return (
              <Link
                key={`mobile-${href}`}
                href={href}
                className={`px-4 py-3 rounded-md font-bold text-center ${
                  active 
                    ? 'bg-cyan-700/30 text-cyan-300 shadow-inner border border-cyan-400/50' 
                    : 'text-cyan-200 bg-gray-800/50 border border-gray-700/50'
                }`}
              >
                {label}
              </Link>
            );
          })}
          
          {!user && (
            <Link 
              href="/register" 
              className="mt-2 px-4 py-3 rounded-md bg-gradient-to-r from-gray-800 to-cyan-800 text-cyan-100 font-bold shadow-md text-center border border-cyan-400/40"
            >
              Register
            </Link>
          )}
          
          {user && (
            <>
              <div className="mt-2 p-3 bg-gray-800/50 rounded-md border border-gray-700/50">
                <p className="text-xs text-center text-cyan-200 font-mono mb-1 truncate">
                  {user.email}
                </p>
              </div>
              <button
                onClick={handleLogout}
                className="mt-2 px-4 py-3 rounded-md bg-gradient-to-r from-pink-600 to-pink-800 text-white font-bold shadow-md text-center"
              >
                Logout
              </button>
            </>
          )}
        </div>
      </div>
      
      {/* Balance Modal */}
      <BalanceModal 
        open={balanceModalOpen} 
        onClose={closeBalanceModal}
        currentBalance={safeBalance}
        onAddBalance={handleAddBalance}
        loading={loading}
        error={error}
      />
      
      {/* Add animations */}
      <style jsx>{`
        .drop-shadow-glow {
          filter: drop-shadow(0 0 8px rgba(103, 232, 249, 0.4));
        }
      `}</style>
    </nav>
  );
} 
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
    <>
      <nav className="bg-night-900/80 backdrop-blur-md border-b border-night-800/80 sticky top-0 z-50 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo and brand */}
            <div className="flex items-center">
              <Link href="/" className="flex items-center">
                <span className="text-xl font-display font-extrabold text-white mr-1">DEGEN</span>
                <span className="text-lg font-display font-medium text-brand-400">FUTURES</span>
              </Link>
            </div>
            
            {/* Desktop navigation */}
            <div className="hidden md:block">
              <div className="ml-10 flex items-center space-x-2">
                {navLinks.map((link) => {
                  const isActive = router.pathname === link.href;
                  return (
                    <Link
                      key={link.href}
                      href={link.href}
                      className={`px-4 py-2 rounded-md text-sm font-medium transition-all duration-200 ${
                        isActive
                          ? 'bg-brand-600/90 text-white shadow-md shadow-brand-600/20'
                          : 'text-night-300 hover:bg-night-800 hover:text-white'
                      }`}
                    >
                      {link.label}
                    </Link>
                  );
                })}
              </div>
            </div>
            
            {/* User section - desktop */}
            <div className="hidden md:flex items-center gap-3">
              {user ? (
                <>
                  <button
                    onClick={openBalanceModal}
                    className="bg-night-800 hover:bg-night-700 text-white px-3 py-1.5 rounded-md flex items-center font-medium text-sm transition-all group relative border border-night-700"
                  >
                    <span className="font-mono mr-1 text-brand-400 group-hover:text-brand-300">$</span>
                    <span className="font-mono tracking-tight">
                      {balance.toLocaleString('en-US', {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </span>
                    <span className="ml-1 text-xs text-night-400 group-hover:text-night-300">+</span>
                  </button>
                  
                  <div className="text-sm text-night-300 px-3 py-1.5 rounded-md bg-night-800/50 border border-night-700/50">
                    {user.email}
                  </div>
                  
                  <button
                    onClick={handleLogout}
                    className="bg-red-500/80 hover:bg-red-500 text-white px-3 py-1.5 rounded-md text-sm font-medium transition-all shadow-md hover:shadow-red-500/20"
                  >
                    Logout
                  </button>
                </>
              ) : (
                <>
                  <Link
                    href="/login"
                    className="bg-night-800 hover:bg-night-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-all"
                  >
                    Login
                  </Link>
                  <Link
                    href="/register"
                    className="bg-brand-600 hover:bg-brand-500 text-white px-4 py-2 rounded-md text-sm font-medium shadow-md hover:shadow-brand-600/20 transition-all"
                  >
                    Register
                  </Link>
                </>
              )}
            </div>
            
            {/* Mobile menu button */}
            <div className="md:hidden flex items-center">
              <button
                onClick={toggleMobileMenu}
                className="inline-flex items-center justify-center p-2 rounded-md text-night-300 hover:text-white hover:bg-night-800 focus:outline-none"
              >
                <span className="sr-only">Open main menu</span>
                {!mobileMenuOpen ? (
                  <svg className="block h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
                  </svg>
                ) : (
                  <svg className="block h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                )}
              </button>
            </div>
          </div>
        </div>
        
        {/* Mobile menu */}
        <div className={`${mobileMenuOpen ? 'block' : 'hidden'} md:hidden backdrop-blur-md`}>
          <div className="px-2 pt-2 pb-3 space-y-1 bg-night-900/95 border-y border-night-800/80 shadow-lg">
            {navLinks.map((link) => {
              const isActive = router.pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`block px-3 py-2 rounded-md text-base font-medium ${
                    isActive
                      ? 'bg-brand-600/90 text-white'
                      : 'text-night-300 hover:bg-night-800 hover:text-white'
                  }`}
                >
                  {link.label}
                </Link>
              );
            })}
            
            {/* Mobile user section */}
            <div className="pt-4 pb-3 border-t border-night-800">
              {user ? (
                <div className="space-y-2">
                  <div className="flex items-center justify-between px-3">
                    <div className="text-sm text-night-300">
                      {user.email}
                    </div>
                    <button
                      onClick={openBalanceModal}
                      className="bg-night-800 hover:bg-night-700 text-white px-3 py-1.5 rounded-md flex items-center text-sm transition-all"
                    >
                      <span className="font-mono mr-1 text-brand-400">$</span>
                      <span className="font-mono tracking-tight">
                        {balance.toLocaleString('en-US', {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                      </span>
                      <span className="ml-1 text-xs text-night-400">+</span>
                    </button>
                  </div>
                  <div className="px-3">
                    <button
                      onClick={handleLogout}
                      className="w-full bg-red-500/80 hover:bg-red-500 text-white px-4 py-2 rounded-md text-sm font-medium transition-all"
                    >
                      Logout
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-2 px-3">
                  <Link
                    href="/login"
                    className="block w-full bg-night-800 hover:bg-night-700 text-white px-4 py-2 rounded-md text-sm text-center font-medium transition-all"
                  >
                    Login
                  </Link>
                  <Link
                    href="/register"
                    className="block w-full bg-brand-600 hover:bg-brand-500 text-white px-4 py-2 rounded-md text-sm text-center font-medium shadow-md hover:shadow-brand-600/20 transition-all"
                  >
                    Register
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </nav>
      
      {/* Balance modal */}
      <BalanceModal
        isOpen={balanceModalOpen}
        onClose={closeBalanceModal}
        onAddBalance={handleAddBalance}
        loading={loading}
        error={error}
      />
    </>
  );
} 
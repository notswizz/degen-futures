import Link from 'next/link';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import Cookies from 'js-cookie';
import { isAuthenticated } from '../lib/auth';
import { jwtDecode } from 'jwt-decode';

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

  // Force a refresh of auth state when route changes
  useEffect(() => {
    checkAuth();
    // Close mobile menu on route change
    setMobileMenuOpen(false);
  }, [router.asPath]);

  // Check auth state using multiple sources
  const checkAuth = () => {
    console.log('Navbar: checking authentication state');
    
    // Try to get token from cookies
    const token = Cookies.get('token');
    console.log('Token in cookies:', token ? 'yes' : 'no');
    
    if (token) {
      try {
        // Use jwt-decode for more robust decoding
        const decoded = jwtDecode(token);
        console.log('Decoded token payload:', decoded);
        setUser(decoded);
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
        setAuthSource('localStorage');
        return;
      }
    } catch (err) {
      console.error('Error parsing user from localStorage:', err);
    }
    
    console.log('No authentication found');
    setUser(null);
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

  console.log('Render navbar. Auth state:', authSource, 'User:', user);

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
      
      {/* Add animations */}
      <style jsx>{`
        .drop-shadow-glow {
          filter: drop-shadow(0 0 8px rgba(103, 232, 249, 0.4));
        }
      `}</style>
    </nav>
  );
} 
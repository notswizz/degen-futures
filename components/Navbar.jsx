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

  // Force a refresh of auth state when route changes
  useEffect(() => {
    checkAuth();
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

  console.log('Render navbar. Auth state:', authSource, 'User:', user);

  return (
    <nav className="w-full bg-gradient-to-r from-gray-950 via-gray-900 to-gray-950 py-4 px-6 flex items-center justify-center shadow-xl border-b-2 border-cyan-500/30 relative z-20">
      <div className="flex gap-6 items-center w-full max-w-7xl justify-between">
        <div className="flex gap-6">
          {navLinks.map(({ href, label }) => {
            const active = router.pathname === href;
            return (
              <Link key={href} href={href} legacyBehavior>
                <a
                  className={`relative px-4 py-2 rounded-lg font-bold tracking-widest text-cyan-200 transition-all duration-200
                    ${active ? 'bg-cyan-700/30 text-cyan-300 shadow-[0_0_12px_2px_#0ff3fc55] border border-cyan-400' : 'hover:bg-cyan-800/20 hover:text-cyan-100'}
                  `}
                  style={active ? { textShadow: '0 0 8px #0ff3fc' } : {}}
                >
                  {label}
                  {active && (
                    <span className="absolute left-1/2 -bottom-1 w-2 h-2 bg-cyan-400 rounded-full blur-sm animate-pulse" style={{ transform: 'translateX(-50%)' }} />
                  )}
                </a>
              </Link>
            );
          })}
        </div>
        <div className="flex gap-4 items-center">
          {user ? (
            <>
              <span className="text-cyan-200 font-mono text-sm px-3 py-1 rounded bg-cyan-900/40 border border-cyan-700">
                {user.email}
              </span>
              <button
                onClick={handleLogout}
                className="px-4 py-2 rounded-lg bg-gradient-to-r from-pink-500 to-pink-700 hover:from-pink-400 hover:to-pink-600 text-white font-bold shadow-md tracking-widest text-sm transition-all duration-200 focus:ring-2 focus:ring-pink-300 focus:ring-opacity-50"
              >
                Logout
              </button>
            </>
          ) : (
            <>
              <Link href="/login" legacyBehavior>
                <a className="px-4 py-2 rounded-lg bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-bold shadow-md tracking-widest text-sm transition-all duration-200 focus:ring-2 focus:ring-cyan-300 focus:ring-opacity-50">Login</a>
              </Link>
              <Link href="/register" legacyBehavior>
                <a className="px-4 py-2 rounded-lg bg-gradient-to-r from-gray-800 to-cyan-700 hover:from-gray-700 hover:to-cyan-600 text-cyan-100 font-bold shadow-md tracking-widest text-sm border border-cyan-400/40 transition-all duration-200">Register</a>
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
} 
import '../styles/globals.css';
import Navbar from '../components/Navbar';
import { useEffect, useRef } from 'react';
import { useRouter } from 'next/router';
import { Analytics } from "@vercel/analytics/next";

export default function App({ Component, pageProps }) {
  const router = useRouter();
  const renderCountRef = useRef(0);
  
  // Track and log renders for debugging
  useEffect(() => {
    renderCountRef.current += 1;
    console.log(`App component rendered #${renderCountRef.current} at ${new Date().toISOString()}`);
    console.log('Current route:', router.pathname);
    
    // Report to diagnostic endpoint to track refresh patterns
    try {
      fetch('/api/debug/refresh-tracker', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          route: router.pathname,
          renderCount: renderCountRef.current,
          query: router.query
        }),
      }).catch(err => {
        // Silently fail - we don't want to cause more issues
      });
    } catch (error) {
      // Ignore errors
    }
    
    // Stop any Fast Refresh or hot reloading that might be happening
    if (process.env.NODE_ENV === 'development' && typeof window !== 'undefined') {
      // This won't work in production anyway, but it might help in development
      if (window.__NEXT_DATA__?.props?.pageProps?._nextI18Next) {
        window.__NEXT_DATA__.props.pageProps._nextI18Next.initialI18nStore = {};
      }
    }
  });
  
  return (
    <>
      <Navbar />
      <Component {...pageProps} />
      <Analytics />
    </>
  );
}

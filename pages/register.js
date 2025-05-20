import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import AuthForm from '../components/AuthForm';
import Cookies from 'js-cookie';
import { jwtDecode } from 'jwt-decode';

export default function RegisterPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  // Check if user is already logged in
  useEffect(() => {
    const token = Cookies.get('token');
    if (token) {
      try {
        jwtDecode(token); // Validate token format
        console.log('User already logged in, redirecting to portfolio');
        router.push('/portfolio');
      } catch (err) {
        console.error('Invalid token found:', err);
        Cookies.remove('token'); // Clean up invalid token
      }
    }
  }, [router]);

  const handleRegister = async (email, password) => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
        credentials: 'include',
      });
      
      if (!res.ok) {
        const data = await res.json();
        setError(data.message || 'Registration failed');
      } else {
        const data = await res.json();
        console.log('Registration response:', data);
        
        // Store token explicitly too
        if (data.token) {
          Cookies.set('token', data.token, { expires: 7 });
          console.log('Token set in cookie:', !!data.token);
        }
        
        // Store user in localStorage
        if (data.user) {
          console.log('Saving user to localStorage:', data.user);
          localStorage.setItem('user', JSON.stringify(data.user));
        }
        
        // Go to portfolio page since we're already logged in
        router.push('/portfolio');
      }
    } catch (err) {
      console.error('Registration error:', err);
      setError('Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return <AuthForm type="register" onSubmit={handleRegister} loading={loading} error={error} />;
} 
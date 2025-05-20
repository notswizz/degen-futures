import { useState } from 'react';
import { useRouter } from 'next/router';

export default function AdminPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const migrateUsers = async () => {
    setLoading(true);
    setError(null);
    setResult(null);
    
    try {
      const response = await fetch('/api/admin/migrate-users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to migrate users');
      }
      
      setResult(data);
    } catch (error) {
      console.error('Error in migration:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const updateCurrentUserBalance = async () => {
    setLoading(true);
    setError(null);
    setResult(null);
    
    try {
      const response = await fetch('/api/user/update-balance', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include', // Include cookies in request
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to update balance');
      }
      
      setResult(data);
    } catch (error) {
      console.error('Error updating balance:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };
  
  const directUpdateBalance = async () => {
    setLoading(true);
    setError(null);
    setResult(null);
    
    try {
      const response = await fetch('/api/admin/direct-update', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to perform direct update');
      }
      
      setResult(data);
    } catch (error) {
      console.error('Error in direct update:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100 flex flex-col">
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-8 text-cyan-300">Admin Dashboard</h1>
        
        <div className="grid md:grid-cols-3 gap-6">
          <div className="bg-gray-800 p-6 rounded-xl border border-cyan-700/30 shadow-lg">
            <h2 className="text-xl font-bold mb-4 text-cyan-400">User Migration</h2>
            <p className="text-gray-300 mb-4">
              Add balance field to all users that don't have it yet. 
              This will set a default balance of 1000 for all users.
            </p>
            <button
              onClick={migrateUsers}
              disabled={loading}
              className="w-full px-4 py-2 rounded-lg bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-bold shadow-md tracking-wide text-sm transition-all duration-200 disabled:opacity-50"
            >
              {loading ? 'Processing...' : 'Migrate All Users'}
            </button>
          </div>
          
          <div className="bg-gray-800 p-6 rounded-xl border border-cyan-700/30 shadow-lg">
            <h2 className="text-xl font-bold mb-4 text-cyan-400">Current User Update</h2>
            <p className="text-gray-300 mb-4">
              Update your own balance to 1000 and refresh your authentication token.
              Use this if the balance isn't showing up correctly.
            </p>
            <button
              onClick={updateCurrentUserBalance}
              disabled={loading}
              className="w-full px-4 py-2 rounded-lg bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-400 hover:to-purple-500 text-white font-bold shadow-md tracking-wide text-sm transition-all duration-200 disabled:opacity-50"
            >
              {loading ? 'Processing...' : 'Update My Balance'}
            </button>
          </div>
          
          <div className="bg-gray-800 p-6 rounded-xl border border-red-700/30 shadow-lg">
            <h2 className="text-xl font-bold mb-4 text-red-400">Direct MongoDB Update</h2>
            <p className="text-gray-300 mb-4">
              Directly updates MongoDB documents using raw commands, bypassing Mongoose schema.
              Use this as a last resort if other methods fail.
            </p>
            <button
              onClick={directUpdateBalance}
              disabled={loading}
              className="w-full px-4 py-2 rounded-lg bg-gradient-to-r from-red-500 to-orange-600 hover:from-red-400 hover:to-orange-500 text-white font-bold shadow-md tracking-wide text-sm transition-all duration-200 disabled:opacity-50"
            >
              {loading ? 'Processing...' : 'Force Direct Update'}
            </button>
          </div>
        </div>
        
        {result && (
          <div className="mt-8 p-4 bg-cyan-900/30 border border-cyan-500/30 rounded-lg">
            <h3 className="font-bold text-cyan-300 mb-2">Result:</h3>
            <pre className="bg-black/30 p-3 rounded text-xs overflow-auto">
              {JSON.stringify(result, null, 2)}
            </pre>
          </div>
        )}
        
        {error && (
          <div className="mt-8 p-4 bg-red-900/30 border border-red-500/30 rounded-lg">
            <h3 className="font-bold text-red-300 mb-2">Error:</h3>
            <p className="text-red-200">{error}</p>
          </div>
        )}
        
        <div className="mt-8">
          <button
            onClick={() => router.push('/')}
            className="px-4 py-2 text-sm text-cyan-300 hover:text-cyan-100"
          >
            ← Back to Home
          </button>
        </div>
      </div>
    </div>
  );
} 
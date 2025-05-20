import React, { useState } from 'react';

function AuthForm({ type, onSubmit, loading, error }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    await onSubmit(email, password);
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 p-8 rounded-xl shadow-2xl w-full max-w-md mx-auto mt-20 border-2 border-blue-500/30 hover:border-cyan-400/60 transition-all duration-300 relative overflow-hidden"
      style={{ boxShadow: '0 0 32px 4px #0ff3fc33, 0 0 0 1px #222 inset' }}
    >
      <div className="absolute inset-0 pointer-events-none animate-pulse" style={{ boxShadow: '0 0 80px 10px #0ff3fc22' }} />
      <h2 className="text-3xl font-extrabold mb-6 text-center text-cyan-300 tracking-widest drop-shadow-glow">
        {type === 'login' ? 'LOGIN' : 'REGISTER'}
      </h2>
      {error && <div className="bg-pink-600/80 text-white p-2 mb-4 rounded text-center font-mono text-sm shadow-lg animate-pulse">{error}</div>}
      <div className="mb-5">
        <label className="block text-cyan-200 mb-1 font-semibold tracking-wide">Email</label>
        <input
          type="email"
          className="w-full p-3 rounded-lg bg-gray-900 text-cyan-100 border border-cyan-700 focus:outline-none focus:ring-2 focus:ring-cyan-400 font-mono text-base transition"
          value={email}
          onChange={e => setEmail(e.target.value)}
          required
          autoComplete="email"
        />
      </div>
      <div className="mb-8">
        <label className="block text-cyan-200 mb-1 font-semibold tracking-wide">Password</label>
        <input
          type="password"
          className="w-full p-3 rounded-lg bg-gray-900 text-cyan-100 border border-cyan-700 focus:outline-none focus:ring-2 focus:ring-cyan-400 font-mono text-base transition"
          value={password}
          onChange={e => setPassword(e.target.value)}
          required
          autoComplete={type === 'login' ? 'current-password' : 'new-password'}
        />
      </div>
      <button
        type="submit"
        className="w-full bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-extrabold py-3 px-4 rounded-lg shadow-lg tracking-widest text-lg transition-all duration-200 focus:ring-4 focus:ring-cyan-300 focus:ring-opacity-50"
        disabled={loading}
        style={{ textShadow: '0 0 8px #0ff3fc' }}
      >
        {loading ? 'Please wait...' : type === 'login' ? 'LOGIN' : 'REGISTER'}
      </button>
    </form>
  );
}

export default AuthForm; 
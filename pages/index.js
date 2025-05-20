import Head from "next/head";
import Link from 'next/link';

export default function MarketPage() {
  return (
    <>
      <Head>
        <title>Degen Futures</title>
        <meta name="description" content="Fantasy futures market for NFL teams" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <main className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950 text-cyan-100 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-full pointer-events-none z-0" style={{ background: 'radial-gradient(circle at 60% 40%, #0ff3fc22 0%, transparent 70%)' }} />
        <section className="z-10 flex flex-col items-center gap-6 p-10 rounded-xl bg-gray-900/80 border-2 border-cyan-500/20 shadow-2xl mt-16">
          <h1 className="text-5xl md:text-6xl font-extrabold tracking-widest text-cyan-300 drop-shadow-glow mb-2 animate-pulse">DEGEN FUTURES</h1>
          <p className="text-lg md:text-2xl text-cyan-200 font-mono text-center max-w-xl mb-4">
            Fantasy futures market for NFL teams. Buy & sell shares, ride the hype, and win the pot if your team takes the Super Bowl. Powered by a live bonding curve. <span className="text-pink-400 font-bold">2% fee</span> on every trade goes to the winner!
          </p>
          <div className="flex gap-4 mt-2">
            <Link href="/register" legacyBehavior>
              <a className="px-6 py-3 rounded-lg bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-extrabold text-lg shadow-lg tracking-widest transition-all duration-200 focus:ring-4 focus:ring-cyan-300 focus:ring-opacity-50" style={{ textShadow: '0 0 8px #0ff3fc' }}>
                Register
              </a>
            </Link>
            <Link href="/login" legacyBehavior>
              <a className="px-6 py-3 rounded-lg bg-gradient-to-r from-gray-800 to-cyan-700 hover:from-gray-700 hover:to-cyan-600 text-cyan-100 font-bold text-lg shadow-md tracking-widest border border-cyan-400/40 transition-all duration-200">
                Login
              </a>
            </Link>
          </div>
        </section>
      </main>
    </>
  );
}

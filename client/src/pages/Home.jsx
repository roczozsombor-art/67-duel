import React, { useState, useEffect } from 'react';
import RankBadge from '../components/RankBadge';

export default function Home({ onEnterLobby }) {
  const [username, setUsername] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [leaderboard, setLeaderboard] = useState([]);

  useEffect(() => {
    // Check for saved user
    const saved = localStorage.getItem('67duel_user');
    if (saved) {
      try {
        const u = JSON.parse(saved);
        setUsername(u.username || '');
      } catch {}
    }
    fetchLeaderboard();
  }, []);

  async function fetchLeaderboard() {
    try {
      const res = await fetch('/api/leaderboard');
      const data = await res.json();
      setLeaderboard(data.slice(0, 10));
    } catch {}
  }

  async function handlePlay() {
    if (!username.trim()) { setError('Enter a username'); return; }
    setError('');
    setLoading(true);
    try {
      const res = await fetch('/api/user/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: username.trim() }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || 'Error'); setLoading(false); return; }
      localStorage.setItem('67duel_user', JSON.stringify(data.user));
      onEnterLobby(data.user, data.rank);
    } catch {
      setError('Server error');
      setLoading(false);
    }
  }

  function getRankForElo(elo) {
    if (elo <= 800) return { name: 'Bronze Mogger', tier: 'bronze' };
    if (elo <= 1100) return { name: 'Silver Mogger', tier: 'silver' };
    if (elo <= 1400) return { name: 'Gold Mogger', tier: 'gold' };
    if (elo <= 1700) return { name: 'Platinum Mogger', tier: 'platinum' };
    if (elo <= 2000) return { name: 'Diamond Mogger', tier: 'diamond' };
    return { name: 'Sigma Skibidi 67 King', tier: 'sigma' };
  }

  return (
    <div className="min-h-screen bg-dark-bg grid-bg bg-scanline flex flex-col items-center justify-center p-4">
      {/* Animated background orbs */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -left-40 w-96 h-96 rounded-full opacity-10 blur-3xl"
          style={{ background: 'radial-gradient(circle, #00ff88, transparent)' }} />
        <div className="absolute -bottom-40 -right-40 w-96 h-96 rounded-full opacity-10 blur-3xl"
          style={{ background: 'radial-gradient(circle, #00d4ff, transparent)' }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full opacity-5 blur-3xl"
          style={{ background: 'radial-gradient(circle, #ff0080, transparent)' }} />
      </div>

      <div className="relative z-10 w-full max-w-5xl flex flex-col lg:flex-row gap-8 items-start justify-center">
        {/* Main hero */}
        <div className="flex-1 flex flex-col items-center lg:items-start gap-6">
          {/* Logo */}
          <div className="flex flex-col gap-2">
            <div className="flex items-baseline gap-3">
              <h1 className="font-display font-black text-8xl lg:text-9xl leading-none"
                style={{
                  background: 'linear-gradient(135deg, #00ff88, #00d4ff)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  textShadow: 'none',
                  filter: 'drop-shadow(0 0 20px #00ff8888)',
                }}>
                67
              </h1>
              <h1 className="font-display font-black text-5xl lg:text-6xl leading-none neon-text-cyan">
                DUEL
              </h1>
            </div>
            <p className="font-mono text-sm opacity-50 tracking-[0.4em] uppercase">
              Mog or get mogged
            </p>
          </div>

          {/* Description */}
          <div className="glass rounded-2xl p-5 neon-border-green max-w-md">
            <p className="font-mono text-sm leading-relaxed opacity-80">
              Face strangers in <span className="neon-text-green font-bold">real-time 67 battles</span>.
              Perform the viral "6-7" hand gesture as many times as possible in 60 seconds.
              Most reps wins. Ranked ELO ladder. No mercy.
            </p>
          </div>

          {/* How to play */}
          <div className="glass rounded-xl p-4 max-w-md w-full" style={{ border: '1px solid #1a1a2e' }}>
            <h3 className="font-display text-xs tracking-widest uppercase neon-text-cyan mb-3">How to Play</h3>
            <div className="space-y-2">
              {[
                ['1', 'Allow camera access'],
                ['2', 'Get matched with a random opponent'],
                ['3', 'Perform the 67 hand gesture repeatedly'],
                ['4', 'Most reps in 60s wins'],
              ].map(([n, t]) => (
                <div key={n} className="flex items-center gap-3 text-sm font-mono">
                  <span className="w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold neon-text-green"
                    style={{ border: '1px solid #00ff8844' }}>{n}</span>
                  <span className="opacity-70">{t}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Login form */}
          <div className="w-full max-w-md glass rounded-2xl p-6 neon-border-cyan">
            <h2 className="font-display text-lg font-bold neon-text-cyan mb-4 tracking-widest">ENTER THE MOG PIT</h2>
            <div className="flex flex-col gap-3">
              <input
                type="text"
                value={username}
                onChange={e => setUsername(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handlePlay()}
                placeholder="Your username..."
                maxLength={20}
                className="w-full bg-dark-bg border border-dark-border rounded-lg px-4 py-3 font-mono text-sm
                  text-white placeholder-white/20 outline-none transition-all duration-200
                  focus:border-neon-green focus:shadow-[0_0_10px_#00ff8844]"
              />
              {error && <p className="text-xs font-mono neon-text-pink">{error}</p>}
              <button
                onClick={handlePlay}
                disabled={loading}
                className="btn-neon w-full text-lg py-4"
              >
                {loading ? 'Connecting...' : '⚡ FIND OPPONENT'}
              </button>
            </div>
          </div>
        </div>

        {/* Leaderboard */}
        {leaderboard.length > 0 && (
          <div className="w-full lg:w-80 glass rounded-2xl p-5" style={{ border: '1px solid #1a1a2e' }}>
            <h3 className="font-display text-sm tracking-widest uppercase neon-text-green mb-4 flex items-center gap-2">
              <span>🏆</span> Leaderboard
            </h3>
            <div className="space-y-2">
              {leaderboard.map((u, i) => (
                <div key={u.id} className="flex items-center gap-3 py-2 border-b border-dark-border last:border-0">
                  <span className="font-display text-xs font-bold w-6 text-center opacity-40">
                    {i + 1}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="font-mono text-sm truncate text-white/80">{u.username}</p>
                    <RankBadge rank={getRankForElo(u.elo)} size="sm" />
                  </div>
                  <span className="font-display text-sm font-bold neon-text-green">{u.elo}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

import React, { useEffect, useState } from 'react';
import RankBadge from '../components/RankBadge';
import { useSocket } from '../hooks/useSocket';

export default function Lobby({ user, rank, onMatchFound, onLeave }) {
  const [status, setStatus] = useState('idle'); // idle | queuing | found
  const [queuePos, setQueuePos] = useState(0);
  const [dots, setDots] = useState('');

  const socket = useSocket({
    'queue-status': ({ position }) => setQueuePos(position),
    'match-found': ({ matchId, opponent, role }) => {
      setStatus('found');
      setTimeout(() => onMatchFound({ matchId, opponent, role }), 800);
    },
  });

  useEffect(() => {
    socket.emit('identify', {
      userId: user.id,
      username: user.username,
      elo: user.elo,
    });
  }, [user]);

  useEffect(() => {
    if (status !== 'queuing') return;
    const id = setInterval(() => setDots(d => d.length >= 3 ? '' : d + '.'), 400);
    return () => clearInterval(id);
  }, [status]);

  function joinQueue() {
    socket.emit('join-queue');
    setStatus('queuing');
  }

  function leaveQueue() {
    socket.emit('leave-queue');
    setStatus('idle');
  }

  return (
    <div className="min-h-screen bg-dark-bg grid-bg flex flex-col items-center justify-center p-4">
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-64 h-64 rounded-full opacity-10 blur-3xl"
          style={{ background: 'radial-gradient(circle, #00ff88, transparent)', animation: 'float 4s ease-in-out infinite' }} />
        <div className="absolute bottom-1/4 right-1/4 w-64 h-64 rounded-full opacity-10 blur-3xl"
          style={{ background: 'radial-gradient(circle, #00d4ff, transparent)', animation: 'float 5s ease-in-out infinite reverse' }} />
      </div>

      <div className="relative z-10 w-full max-w-md flex flex-col gap-6">
        {/* Player card */}
        <div className="glass rounded-2xl p-6 neon-border-green flex flex-col items-center gap-3">
          <div className="w-16 h-16 rounded-full flex items-center justify-center text-3xl"
            style={{ border: '2px solid #00ff8844', background: '#00ff8811' }}>
            ✊
          </div>
          <div className="text-center">
            <h2 className="font-display font-bold text-xl neon-text-green">{user.username}</h2>
            <div className="mt-1">
              <RankBadge rank={rank} elo={user.elo} />
            </div>
          </div>
          <div className="flex gap-6 text-center text-xs font-mono opacity-60">
            <div><div className="text-lg font-bold text-white/80">{user.wins || 0}</div>Wins</div>
            <div><div className="text-lg font-bold text-white/80">{user.losses || 0}</div>Losses</div>
            <div><div className="text-lg font-bold text-white/80">{user.draws || 0}</div>Draws</div>
          </div>
        </div>

        {/* Queue panel */}
        <div className="glass rounded-2xl p-6 neon-border-cyan flex flex-col items-center gap-5">
          {status === 'idle' && (
            <>
              <p className="font-mono text-sm opacity-60 text-center">
                Ready to mog? Press the button to enter the queue.
              </p>
              <button onClick={joinQueue} className="btn-neon w-full text-xl py-5">
                ⚡ FIND OPPONENT
              </button>
            </>
          )}

          {status === 'queuing' && (
            <>
              <div className="flex flex-col items-center gap-3">
                <div className="relative w-16 h-16">
                  <div className="absolute inset-0 rounded-full animate-ping opacity-30"
                    style={{ background: '#00ff8833', border: '2px solid #00ff88' }} />
                  <div className="absolute inset-0 rounded-full flex items-center justify-center text-2xl"
                    style={{ border: '2px solid #00ff88', background: '#00ff8811' }}>⏳</div>
                </div>
                <p className="font-display text-sm neon-text-green tracking-widest uppercase">
                  Searching{dots}
                </p>
                {queuePos > 0 && (
                  <p className="font-mono text-xs opacity-40">Queue position: #{queuePos}</p>
                )}
              </div>
              <button onClick={leaveQueue} className="btn-neon-pink text-sm py-2 px-4">
                Cancel
              </button>
            </>
          )}

          {status === 'found' && (
            <div className="flex flex-col items-center gap-3">
              <div className="text-4xl animate-bounce">⚡</div>
              <p className="font-display text-lg neon-text-green tracking-widest">OPPONENT FOUND!</p>
              <p className="font-mono text-xs opacity-50">Loading match...</p>
            </div>
          )}
        </div>

        <button onClick={onLeave} className="font-mono text-xs opacity-30 hover:opacity-60 transition-opacity self-center">
          ← Back to home
        </button>
      </div>
    </div>
  );
}

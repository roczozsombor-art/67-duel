import React, { useEffect } from 'react';
import confetti from 'canvas-confetti';
import RankBadge from '../components/RankBadge';
import BrainrotText from '../components/BrainrotText';

export default function Results({ result, user, opponent, onPlayAgain, onHome }) {
  const isWin = result?.result === 'win';
  const isDraw = result?.result === 'draw';
  const isForfeit = result?.forfeit;

  useEffect(() => {
    if (isWin) {
      const duration = 3000;
      const end = Date.now() + duration;
      const frame = () => {
        confetti({
          particleCount: 3,
          angle: 60,
          spread: 55,
          origin: { x: 0 },
          colors: ['#00ff88', '#00d4ff', '#ffffff'],
        });
        confetti({
          particleCount: 3,
          angle: 120,
          spread: 55,
          origin: { x: 1 },
          colors: ['#00ff88', '#00d4ff', '#ff0080'],
        });
        if (Date.now() < end) requestAnimationFrame(frame);
      };
      frame();
    }
  }, [isWin]);

  if (!result) return null;

  const { yourReps, opponentReps, eloDelta, newElo, newRank } = result;

  return (
    <div className="min-h-screen bg-dark-bg grid-bg flex flex-col items-center justify-center p-4">
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        {isWin && (
          <>
            <div className="absolute inset-0 opacity-5"
              style={{ background: 'radial-gradient(ellipse at center, #00ff88, transparent 70%)' }} />
          </>
        )}
      </div>

      <div className="relative z-10 w-full max-w-lg flex flex-col gap-5">
        {/* Result header */}
        <div className="text-center">
          <div className="font-display font-black text-7xl lg:text-8xl leading-none mb-2"
            style={isWin ? {
              background: 'linear-gradient(135deg, #00ff88, #00d4ff)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              filter: 'drop-shadow(0 0 20px #00ff8888)',
            } : isDraw ? {
              color: '#facc15',
              textShadow: '0 0 20px #facc1566',
            } : {
              color: '#ff0080',
              textShadow: '0 0 20px #ff008088',
            }}>
            {isWin ? 'WIN' : isDraw ? 'DRAW' : 'LOSS'}
          </div>
          {isForfeit && (
            <p className="font-mono text-xs opacity-40">(opponent disconnected)</p>
          )}
        </div>

        {/* Brainrot text */}
        <BrainrotText result={result?.result} />

        {/* Score card */}
        <div className="glass rounded-2xl p-6 neon-border-cyan">
          <div className="flex items-center justify-around mb-5">
            <div className="flex flex-col items-center gap-1">
              <span className="font-mono text-xs opacity-40 uppercase tracking-widest">You</span>
              <span className="font-display font-black neon-text-green"
                style={{ fontSize: '4rem', textShadow: '0 0 20px #00ff88' }}>
                {yourReps}
              </span>
              <span className="font-mono text-xs opacity-30">reps</span>
            </div>
            <div className="font-display text-2xl opacity-20">VS</div>
            <div className="flex flex-col items-center gap-1">
              <span className="font-mono text-xs opacity-40 uppercase tracking-widest">
                {opponent?.username?.substring(0, 8) || 'Opponent'}
              </span>
              <span className="font-display font-black neon-text-cyan"
                style={{ fontSize: '4rem', textShadow: '0 0 20px #00d4ff' }}>
                {opponentReps}
              </span>
              <span className="font-mono text-xs opacity-30">reps</span>
            </div>
          </div>

          {/* ELO change */}
          <div className="border-t border-dark-border pt-4 flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <span className="font-mono text-xs opacity-50">ELO change</span>
              <span className={`font-display font-bold text-lg ${eloDelta >= 0 ? 'neon-text-green' : 'neon-text-pink'}`}>
                {eloDelta >= 0 ? '+' : ''}{eloDelta}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="font-mono text-xs opacity-50">New ELO</span>
              <span className="font-display font-bold text-lg neon-text-cyan">{newElo}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="font-mono text-xs opacity-50">Rank</span>
              <RankBadge rank={newRank} />
            </div>
          </div>
        </div>

        {/* Buttons */}
        <div className="flex flex-col gap-3">
          <button onClick={onPlayAgain} className="btn-neon w-full text-lg py-4">
            ⚡ PLAY AGAIN
          </button>
          <button onClick={onHome} className="btn-neon-cyan w-full py-3 text-sm">
            ← Main Menu
          </button>
        </div>
      </div>
    </div>
  );
}

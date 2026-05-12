import React from 'react';

export default function Timer({ seconds }) {
  const isLow = seconds <= 10;
  const isCritical = seconds <= 5;

  return (
    <div className="flex flex-col items-center">
      <span className="text-xs font-mono uppercase tracking-widest opacity-60 mb-1">TIME</span>
      <span
        className={`font-display text-6xl font-black tabular-nums transition-all duration-300 ${
          isCritical
            ? 'neon-text-pink animate-pulse'
            : isLow
            ? 'text-yellow-400'
            : 'neon-text-cyan'
        }`}
        style={
          isCritical
            ? { textShadow: '0 0 10px #ff0080, 0 0 40px #ff0080, 0 0 80px #ff0080' }
            : isLow
            ? { textShadow: '0 0 10px #facc15, 0 0 30px #facc15' }
            : { textShadow: '0 0 10px #00d4ff, 0 0 30px #00d4ff' }
        }
      >
        {String(seconds).padStart(2, '0')}
      </span>
    </div>
  );
}

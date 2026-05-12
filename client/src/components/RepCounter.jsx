import React, { useEffect, useRef } from 'react';

export default function RepCounter({ reps, label = 'YOU', color = 'green', animate = true }) {
  const prevRef = useRef(reps);
  const flashRef = useRef(false);

  useEffect(() => {
    if (reps !== prevRef.current) {
      flashRef.current = true;
      prevRef.current = reps;
    }
  }, [reps]);

  const isGreen = color === 'green';
  const neonColor = isGreen ? '#00ff88' : '#00d4ff';

  return (
    <div className="flex flex-col items-center gap-1">
      <span className="text-xs font-mono uppercase tracking-[0.3em] opacity-50">{label}</span>
      <div
        className="relative font-display tabular-nums select-none"
        style={{
          fontSize: 'clamp(4rem, 10vw, 7rem)',
          fontWeight: 900,
          color: neonColor,
          textShadow: animate
            ? `0 0 10px ${neonColor}, 0 0 30px ${neonColor}, 0 0 60px ${neonColor}88`
            : `0 0 5px ${neonColor}66`,
          lineHeight: 1,
          transition: 'text-shadow 0.1s',
        }}
      >
        {reps}
      </div>
      <span className="text-xs font-mono opacity-40 tracking-widest">REPS</span>
    </div>
  );
}

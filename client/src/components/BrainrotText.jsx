import React, { useMemo } from 'react';

const ROASTS = [
  'BRUTAL 67 MOG 💀',
  'skibidi rejection arc activated',
  'you got ratio\'d by an Ohio sigma',
  'L + ratio + no 67 + fanum taxed',
  'your mogging license has been revoked',
  'certified brainrot bottom frag',
  '67 said no 💔',
  'gyatt damn that was rough',
  'the 67 overlords have spoken',
  'rizzless performance detected',
  'Ohio council votes: CRINGE',
  'NPC behavior confirmed',
  'cooked. absolutely cooked.',
  'sigma grindset: FAILED',
  'imagine losing at 67 💀💀💀',
];

const WIN_TEXTS = [
  'GIGACHAD MOGGER 🏆',
  'SIGMA 67 OVERLORD ⚡',
  'ABSOLUTE UNIT OF MOGGING 💪',
  'MAX LEVEL 67 ACHIEVED',
  'OHIO APPROVED ✅',
  'RIZZ: INFINITE 🔥',
];

export default function BrainrotText({ result }) {
  const text = useMemo(() => {
    if (result === 'win') {
      return WIN_TEXTS[Math.floor(Math.random() * WIN_TEXTS.length)];
    }
    if (result === 'draw') return 'BOTH EQUALLY COOKED 🤝';
    return ROASTS[Math.floor(Math.random() * ROASTS.length)];
  }, [result]);

  const isWin = result === 'win';
  const isDraw = result === 'draw';

  return (
    <div className={`text-center font-display font-black uppercase tracking-widest py-3 px-6 rounded-xl text-xl
      ${isWin
        ? 'neon-text-green border border-neon-green'
        : isDraw
        ? 'text-yellow-400'
        : 'neon-text-pink border border-pink-500'
      }`}
      style={isWin ? {
        boxShadow: '0 0 20px #00ff8866',
        background: '#00ff8811',
        textShadow: '0 0 10px #00ff88, 0 0 30px #00ff88',
        animation: 'counterGlow 1s ease-in-out infinite alternate',
      } : isDraw ? {} : {
        boxShadow: '0 0 20px #ff008066',
        background: '#ff008011',
        textShadow: '0 0 10px #ff0080, 0 0 30px #ff0080',
      }}
    >
      {text}
    </div>
  );
}

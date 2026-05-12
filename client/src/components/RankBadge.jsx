import React from 'react';

const TIER_STYLES = {
  bronze:   { color: '#cd7f32', glow: '#cd7f3266' },
  silver:   { color: '#c0c0c0', glow: '#c0c0c066' },
  gold:     { color: '#ffd700', glow: '#ffd70066' },
  platinum: { color: '#00d4ff', glow: '#00d4ff66' },
  diamond:  { color: '#b9f2ff', glow: '#b9f2ff88' },
  sigma:    { color: '#00ff88', glow: '#00ff8888' },
};

const TIER_ICONS = {
  bronze: '🥉',
  silver: '🥈',
  gold: '🥇',
  platinum: '💠',
  diamond: '💎',
  sigma: '⚡',
};

export default function RankBadge({ rank, elo, size = 'md' }) {
  if (!rank) return null;
  const tier = rank.tier || 'bronze';
  const style = TIER_STYLES[tier] || TIER_STYLES.bronze;
  const icon = TIER_ICONS[tier] || '🥉';

  const sizeClass = size === 'sm'
    ? 'text-xs px-2 py-0.5'
    : size === 'lg'
    ? 'text-base px-4 py-2'
    : 'text-sm px-3 py-1';

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full font-mono font-bold ${sizeClass}`}
      style={{
        color: style.color,
        border: `1px solid ${style.color}`,
        boxShadow: `0 0 8px ${style.glow}`,
        background: `${style.glow}22`,
      }}
    >
      <span>{icon}</span>
      <span>{rank.name}</span>
      {elo !== undefined && <span className="opacity-60">· {elo}</span>}
    </span>
  );
}

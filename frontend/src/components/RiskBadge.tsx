import React from 'react';

interface Props {
  level: string;
  size?: 'sm' | 'md' | 'lg';
  showDot?: boolean;
}

export const RiskBadge: React.FC<Props> = ({ level, size = 'md', showDot = true }) => {
  const norm = level ? level.toLowerCase() : 'low';
  
  let bg = 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30';
  let dot = 'bg-emerald-400';

  if (norm === 'critical') {
    bg = 'bg-rose-500/15 text-rose-400 border-rose-500/30 animate-pulse';
    dot = 'bg-rose-500';
  } else if (norm === 'high') {
    bg = 'bg-orange-500/15 text-orange-400 border-orange-500/30';
    dot = 'bg-orange-400';
  } else if (norm === 'medium') {
    bg = 'bg-amber-500/15 text-amber-400 border-amber-500/30';
    dot = 'bg-amber-400';
  }

  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5',
    md: 'text-xs px-2.5 py-1',
    lg: 'text-sm px-3 py-1.5 font-medium'
  }[size];

  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border ${bg} ${sizeClasses}`}>
      {showDot && <span className={`w-1.5 h-1.5 rounded-full ${dot}`} />}
      {level}
    </span>
  );
};

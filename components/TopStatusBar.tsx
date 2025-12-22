import React from 'react';
import { Coins, Star } from 'lucide-react';

export type TopStatusBarProps = {
  avatar: string;
  username: string;
  level: number;
  gold: number;
};

export const TopStatusBar: React.FC<TopStatusBarProps> = ({ avatar, username, level, gold }) => {
  return (
    <header className="shrink-0 px-4 pt-4">
      <div className="max-w-3xl mx-auto">
        <div className="ww-surface ww-surface--soft rounded-[22px] px-4 py-3 flex items-center gap-3">
          {/* Avatar */}
          <div
            className="w-12 h-12 rounded-full bg-[rgba(252,203,89,0.95)] overflow-hidden flex items-center justify-center shrink-0"
            style={{ border: '3px solid var(--ww-stroke)' }}
          >
            {avatar.startsWith('data:image') || avatar.startsWith('http') ? (
              <img src={avatar} alt="Avatar" className="w-full h-full object-cover" />
            ) : (
              <span className="text-2xl">{avatar}</span>
            )}
          </div>

          {/* Name + Level */}
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 min-w-0">
              <div className="text-sm font-black ww-ink truncate">{username}</div>
            </div>
            <div className="mt-0.5 flex items-center gap-1.5">
              <Star size={14} style={{ color: 'var(--ww-stroke)' }} />
              <div className="text-[11px] font-black uppercase tracking-widest ww-muted">Lv. {level}</div>
            </div>
          </div>

          {/* Gold */}
          <div className="shrink-0">
            <div className="px-3 py-2 ww-pill ww-pill--accent flex items-center gap-2">
              <Coins size={16} className="text-black" />
              <span className="text-black font-black font-mono tabular-nums">{gold}</span>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};



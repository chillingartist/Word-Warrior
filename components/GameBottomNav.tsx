import React, { useMemo } from 'react';
import { BookOpen, GraduationCap, Swords, Trophy, User } from 'lucide-react';

type GameBottomNavItem = {
  disabled?: boolean;
  id: string;
  label: string;
  icon: React.ReactNode;
};

export type GameBottomNavProps = {
  activeId: string;
  onSelect: (id: string) => void;
};

export const GameBottomNav: React.FC<GameBottomNavProps> = ({ activeId, onSelect }) => {
  const items: GameBottomNavItem[] = useMemo(
    () => [
      {
        id: 'vocab',
        label: '背单词',
        icon: <BookOpen size={20} />,
      },
      {
        id: 'scholar',
        label: '学习之路',
        icon: <GraduationCap size={20} />,
      },
      {
        id: 'arena',
        label: '对战',
        icon: <Swords size={20} />,
      },
      {
        id: 'leaderboard',
        label: '排行榜',
        icon: <Trophy size={20} />,
      },
      {
        id: 'profile',
        label: '档案',
        icon: <User size={20} />,
      },
    ],
    []
  );

  return (
    <div
      className="fixed bottom-0 left-0 right-0 z-[200] px-3 pt-2 pointer-events-none"
      style={{ paddingBottom: 'calc(env(safe-area-inset-bottom) + 10px)' }}
    >
      <div className="max-w-lg mx-auto pointer-events-auto">
        {/* VDL Banner-style bottom bar (match TopStatusBar) */}
        <nav className="ww-surface ww-surface--soft rounded-[22px] px-2 py-2">
          <div className="w-full flex items-stretch justify-between gap-2">
            {items.map((item) => {
              const isActive = item.id === activeId;
              const activeStyle = isActive
                ? 'bg-[rgba(252,203,89,0.95)] border-[color:var(--ww-stroke)]'
                : 'bg-[rgba(255,255,255,0.20)] border-[color:var(--ww-stroke-soft)]';

              return (
                <button
                  key={item.id}
                  type="button"
                  className={`flex-1 min-w-0 rounded-2xl border-2 px-3 py-2 flex flex-col items-center justify-center gap-1 transition-all active:translate-y-[1px] ${activeStyle}`}
                  onClick={() => {
                    if (item.disabled) return;
                    onSelect(item.id);
                  }}
                  aria-current={isActive ? 'page' : undefined}
                >
                  <div
                    className="flex items-center justify-center"
                    style={{ color: isActive ? 'var(--ww-stroke)' : 'rgba(26,15,40,0.75)' }}
                  >
                    {item.icon}
                  </div>
                  <div
                    className={`text-[10px] font-black uppercase tracking-widest truncate ${
                      isActive ? 'text-black' : 'text-[rgba(26,15,40,0.75)]'
                    }`}
                  >
                    {item.label}
                  </div>
                </button>
              );
            })}
          </div>
        </nav>
      </div>
    </div>
  );
};




import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Lock, Award } from 'lucide-react';
import { ACHIEVEMENTS } from '../constants.tsx';
import { UserStats } from '../types';

interface AchievementsPanelProps {
  stats: UserStats;
}

const AchievementsPanel: React.FC<AchievementsPanelProps> = ({ stats }) => {
  const [filter, setFilter] = useState<'all' | 'unlocked' | 'locked'>('all');

  // Calculate unlocked status for all achievements
  const processedAchievements = ACHIEVEMENTS.map(ach => ({
    ...ach,
    isUnlocked: ach.condition(stats)
  }));

  const filteredList = processedAchievements.filter(ach => {
    if (filter === 'unlocked') return ach.isUnlocked;
    if (filter === 'locked') return !ach.isUnlocked;
    return true;
  });

  const unlockedCount = processedAchievements.filter(a => a.isUnlocked).length;
  const totalCount = processedAchievements.length;

  return (
    <div className="space-y-4">
      {/* Header + Filter (VDL) */}
      <div className="ww-surface ww-surface--soft rounded-[22px] p-4">
        <div className="flex items-center gap-2">
          <Award size={18} style={{ color: 'var(--ww-accent)' }} />
          <h2 className="text-[12px] font-black uppercase tracking-widest ww-ink">荣耀殿堂</h2>
          <div className="ml-auto px-3 py-1.5 ww-pill ww-pill--accent">
            <span className="text-[10px] font-black text-black tabular-nums">{unlockedCount} / {totalCount}</span>
          </div>
        </div>

        <div className="mt-3 flex gap-2">
          {(['all', 'unlocked', 'locked'] as const).map((f) => {
            const isActive = filter === f;
            return (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`flex-1 py-2 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all border-2 ${
                  isActive
                    ? 'bg-[rgba(252,203,89,0.95)] text-black border-[color:var(--ww-stroke)]'
                    : 'bg-[rgba(255,255,255,0.25)] text-[rgba(26,15,40,0.75)] border-[color:var(--ww-stroke-soft)]'
                }`}
              >
                {f === 'all' ? '全部' : f === 'unlocked' ? '已达成' : '未达成'}
              </button>
            );
          })}
        </div>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <AnimatePresence mode="popLayout">
          {filteredList.map((ach) => (
            <motion.div
              layout
              key={ach.id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className={`relative aspect-square rounded-[22px] p-4 flex flex-col items-center justify-center text-center gap-3 transition-all overflow-hidden ${
                ach.isUnlocked ? 'ww-surface ww-surface--soft' : 'ww-surface ww-surface--soft opacity-65 grayscale'
              }`}
            >
              {/* Icon Container */}
              <div
                className="w-12 h-12 rounded-full flex items-center justify-center"
                style={{
                  background: ach.isUnlocked ? 'rgba(252,203,89,0.95)' : 'rgba(26,15,40,0.10)',
                  border: `3px solid ${ach.isUnlocked ? 'var(--ww-stroke)' : 'rgba(43,23,63,0.22)'}`,
                  boxShadow: '0 6px 0 rgba(0,0,0,0.18)',
                  color: ach.isUnlocked ? 'black' : 'rgba(26,15,40,0.6)',
                }}
              >
                {ach.isUnlocked ? ach.icon : <Lock size={20} />}
              </div>

              {/* Text Info */}
              <div className="z-10 w-full px-1">
                <h4 className="text-xs font-black uppercase tracking-tight mb-1 truncate ww-ink">
                  {ach.title}
                </h4>
                <p className="text-[9px] font-black ww-muted leading-tight line-clamp-2">
                  {ach.desc}
                </p>
              </div>

              {/* Completed Badge */}
              {ach.isUnlocked && (
                <div
                  className="absolute top-2 right-2 w-2.5 h-2.5 rounded-full"
                  style={{ background: 'rgba(16,185,129,0.95)', boxShadow: '0 0 10px rgba(16,185,129,0.55)' }}
                />
              )}
            </motion.div>
          ))}
        </AnimatePresence>

        {filteredList.length === 0 && (
          <div className="col-span-2 md:col-span-3 py-12 text-center text-slate-400">
            <p className="text-xs font-black uppercase tracking-widest">暂无相关成就</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default AchievementsPanel;

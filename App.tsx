
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, X, LogOut, Bell, Coins, User, ArrowLeft, ChevronRight } from 'lucide-react';
import { INITIAL_STATS, NAVIGATION, GAME_MODES } from './constants.tsx';
import { UserStats, Rank } from './types';

// Components
import StatsPanel from './components/StatsPanel';
import VocabTraining from './components/VocabTraining';
import SkillsTraining from './components/SkillsTraining';
import BattleArena from './components/BattleArena';
import AdminPanel from './components/AdminPanel';

const App: React.FC = () => {
  const [stats, setStats] = useState<UserStats>(() => {
    const saved = localStorage.getItem('ww_stats');
    return saved ? JSON.parse(saved) : INITIAL_STATS;
  });
  const [activeTab, setActiveTab] = useState('mode_select');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  useEffect(() => {
    localStorage.setItem('ww_stats', JSON.stringify(stats));
  }, [stats]);

  const handleGainExp = (exp: number, statType?: 'atk' | 'def' | 'crit' | 'hp') => {
    setStats(prev => {
      let newStats = { ...prev, exp: prev.exp + exp };
      if (newStats.exp >= prev.level * 100) {
        newStats.exp -= prev.level * 100;
        newStats.level += 1;
        newStats.maxHp += 10;
        newStats.hp = newStats.maxHp;
      }
      if (statType) {
        if (statType === 'crit') newStats.crit += 0.001;
        else (newStats as any)[statType] += 1;
      }
      return newStats;
    });
  };

  const handleBattleWin = () => {
    handleGainExp(50);
    setStats(prev => ({
      ...prev,
      rankPoints: prev.rankPoints + 1,
      winStreak: prev.winStreak + 1,
    }));
    setActiveTab('mode_select');
  };

  const handleBattleLoss = () => {
    setStats(prev => ({
      ...prev,
      winStreak: 0,
      rankPoints: Math.max(0, prev.rankPoints - (prev.rank === Rank.BRONZE ? 0 : 1)),
    }));
    setActiveTab('mode_select');
  };

  const renderContent = () => {
    return (
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.2 }}
          className="h-full"
        >
          {(() => {
            switch (activeTab) {
              case 'mode_select':
                return (
                  <div className="max-w-6xl mx-auto pt-8 space-y-12">
                    <header className="text-center space-y-4">
                      <h1 className="text-5xl font-black rpg-font tracking-tight uppercase">战士征程</h1>
                      <p className="text-slate-500 max-w-lg mx-auto">选择你的训练模式，通过不断的磨砺，最终在竞技场中封神。</p>
                    </header>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      {GAME_MODES.map((mode) => (
                        <motion.button
                          key={mode.id}
                          whileHover={{ y: -10, scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={() => setActiveTab(mode.id)}
                          className={`relative group h-full text-left p-8 rounded-[2.5rem] bg-gradient-to-br ${mode.color} border border-slate-800 transition-all hover:border-slate-500 overflow-hidden flex flex-col`}
                        >
                          <div className="mb-8 p-4 bg-slate-900/50 rounded-2xl w-fit">
                            {mode.icon}
                          </div>
                          <div className="mt-auto space-y-3">
                            <span className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">{mode.stat}</span>
                            <h3 className="text-3xl font-black rpg-font">{mode.name}</h3>
                            <p className="text-slate-400 text-sm leading-relaxed">{mode.description}</p>
                            <div className="pt-4 flex items-center text-xs font-bold gap-2 text-white group-hover:gap-4 transition-all">
                              立即开启 <ChevronRight size={14} />
                            </div>
                          </div>
                          
                          {/* Decorative Background Elements */}
                          <div className="absolute -right-8 -bottom-8 opacity-5 group-hover:opacity-10 transition-opacity">
                             {/* Fix: Added explicit generic type to allow setting the size property during cloneElement */}
                             {React.cloneElement(mode.icon as React.ReactElement<any>, { size: 160 })}
                          </div>
                        </motion.button>
                      ))}
                    </div>
                  </div>
                );
              case 'dashboard':
                return (
                  <div className="max-w-4xl mx-auto pt-8 space-y-8">
                    <div className="flex items-center gap-4 mb-8">
                       <button onClick={() => setActiveTab('mode_select')} className="p-2 hover:bg-slate-800 rounded-full transition-colors">
                         <ArrowLeft size={24} />
                       </button>
                       <h2 className="text-3xl font-black rpg-font">战士个人主页</h2>
                    </div>
                    <div className="bg-slate-900/50 p-10 rounded-[3rem] border border-slate-800">
                      <StatsPanel stats={stats} />
                    </div>
                  </div>
                );
              case 'vocab':
                return (
                  <div className="h-full flex flex-col">
                    <button onClick={() => setActiveTab('mode_select')} className="flex items-center gap-2 text-xs font-black uppercase text-slate-500 hover:text-white mb-6">
                      <ArrowLeft size={14} /> 返回模式选择
                    </button>
                    <VocabTraining onMastered={(word) => handleGainExp(5, 'atk')} />
                  </div>
                );
              case 'skills':
                return (
                  <div className="h-full flex flex-col">
                    <button onClick={() => setActiveTab('mode_select')} className="flex items-center gap-2 text-xs font-black uppercase text-slate-500 hover:text-white mb-6">
                      <ArrowLeft size={14} /> 返回模式选择
                    </button>
                    <SkillsTraining onSuccess={(exp, type) => handleGainExp(exp, type as any)} />
                  </div>
                );
              case 'pvp':
                return (
                  <div className="h-full flex flex-col">
                    <button onClick={() => setActiveTab('mode_select')} className="flex items-center gap-2 text-xs font-black uppercase text-slate-500 hover:text-white mb-2">
                      <ArrowLeft size={14} /> 逃离竞技场
                    </button>
                    <BattleArena playerStats={stats} onVictory={handleBattleWin} onDefeat={handleBattleLoss} />
                  </div>
                );
              case 'admin':
                return <AdminPanel onUpdateStats={(s) => setStats(prev => ({ ...prev, ...s }))} />;
              default:
                return null;
            }
          })()}
        </motion.div>
      </AnimatePresence>
    );
  };

  return (
    <div className="h-screen flex flex-col lg:flex-row bg-[#020617] text-slate-200">
      {/* Sidebar Mobile Navigation */}
      <div className="lg:hidden flex items-center justify-between p-6 border-b border-slate-900">
        <div className="rpg-font font-black text-xl tracking-widest">WW</div>
        <div className="flex items-center gap-4">
           <button onClick={() => setActiveTab('dashboard')} className="w-8 h-8 rounded-full overflow-hidden border border-slate-700">
             <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=Felix" alt="Avatar" />
           </button>
           <button onClick={() => setIsSidebarOpen(!isSidebarOpen)}>
             {isSidebarOpen ? <X /> : <Menu />}
           </button>
        </div>
      </div>

      {/* Desktop Sidebar */}
      <aside className={`fixed inset-0 z-50 lg:relative lg:z-auto w-72 bg-[#020617] border-r border-slate-900 p-8 flex flex-col transition-transform duration-300 lg:translate-x-0 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="mb-16 flex items-center gap-3">
          <div className="w-8 h-8 bg-white rounded flex items-center justify-center font-black text-black">W</div>
          <span className="rpg-font font-black tracking-widest text-lg uppercase">单词战士</span>
        </div>

        <nav className="flex-1 space-y-1">
          {NAVIGATION.map((item) => (
            <button
              key={item.id}
              onClick={() => { setActiveTab(item.id); setIsSidebarOpen(false); }}
              className={`w-full flex items-center gap-4 px-4 py-3 rounded-2xl text-xs font-black tracking-widest uppercase transition-all ${activeTab === item.id ? 'bg-white text-black shadow-lg shadow-white/10' : 'text-slate-500 hover:text-slate-200'}`}
            >
              {item.icon}
              {item.name}
            </button>
          ))}
        </nav>

        <div className="pt-8 border-t border-slate-900 space-y-6">
          <div className="flex flex-col items-center">
             <div className="p-1 rounded-full bg-slate-900 mb-2">
                <div className="w-20 h-1 bg-indigo-500 rounded-full" style={{ width: `${(stats.exp / (stats.level * 100)) * 100}%` }} />
             </div>
             <span className="text-[9px] font-black text-slate-600 uppercase">LVL {stats.level} 进度</span>
          </div>
          <button className="w-full flex items-center gap-3 text-[10px] font-black tracking-widest text-slate-700 hover:text-red-400 uppercase transition-colors">
            <LogOut size={14} /> 退出系统
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 overflow-hidden relative flex flex-col">
        <header className="hidden lg:flex items-center justify-between px-12 py-8">
          <div className="flex items-center gap-8">
            <div className="flex items-center gap-2">
              <Coins size={14} className="text-amber-500" />
              <span className="text-[10px] font-black tracking-widest">{stats.rankPoints * 100} 积分</span>
            </div>
            <div className="text-[10px] font-black tracking-widest text-slate-700">赛季剩余: 14天</div>
          </div>
          <div className="flex items-center gap-8">
            <div className="flex items-center gap-6">
              <button className="text-slate-500 hover:text-white transition-colors">
                <Bell size={18} />
              </button>
            </div>
            
            {/* User Profile Picture Icon - Top Right Entry to Dashboard */}
            <motion.button 
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setActiveTab('dashboard')}
              className={`flex items-center gap-4 pl-2 pr-5 py-2 rounded-full border transition-all ${activeTab === 'dashboard' ? 'bg-indigo-600 border-indigo-500' : 'bg-slate-900 border-slate-800 hover:border-slate-700'}`}
            >
              <div className="w-8 h-8 rounded-full overflow-hidden bg-slate-800 border-2 border-slate-700">
                <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=Felix" alt="Avatar" />
              </div>
              <div className="text-left">
                <p className="text-[10px] font-black tracking-widest text-slate-500 uppercase leading-none mb-1">主页</p>
                <p className="text-xs font-bold leading-none">WARRIOR_01</p>
              </div>
            </motion.button>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto px-6 lg:px-12 pb-12 custom-scrollbar">
          {renderContent()}
        </div>
      </main>
    </div>
  );
};

export default App;

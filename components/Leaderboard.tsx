
import React from 'react';
import { Trophy, Medal, Crown, TrendingUp, User, BookOpen } from 'lucide-react';
import { motion } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';

type LeaderboardTab = 'rank' | 'words';

interface LeaderRowProps {
  leader: any;
  activeTab: LeaderboardTab;
}

const LeaderRow: React.FC<LeaderRowProps> = ({ leader, activeTab }) => (
  <tr className={`group transition-colors ${leader.isUser ? 'bg-[rgba(252,203,89,0.35)]' : 'hover:bg-[rgba(255,255,255,0.18)]'}`}>
    <td className={`px-4 py-4 md:px-8 md:py-6 text-sm font-black ${leader.isUser ? 'text-[color:var(--ww-stroke)]' : 'ww-muted'}`}>
      #{leader.rank}
    </td>
    <td className="px-4 py-4 md:px-8 md:py-6">
      <div className="flex items-center gap-2 md:gap-3">
        <div className="relative shrink-0">
          <img
            src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${leader.name}`}
            className="w-7 h-7 md:w-10 md:h-10 rounded-full bg-white"
            style={{
              border: leader.isUser ? '3px solid var(--ww-stroke)' : '2px solid rgba(43,23,63,0.22)',
              boxShadow: leader.isUser ? '0 0 0 4px rgba(252,203,89,0.55)' : undefined,
            }}
            alt=""
          />
          {leader.isUser && <div className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full" style={{ background: 'rgba(16,185,129,0.95)', border: '2px solid var(--ww-surface)' }} />}
        </div>
        <span className={`font-black text-xs md:text-sm truncate max-w-[80px] md:max-w-none ${leader.isUser ? 'ww-ink' : 'ww-ink'}`}>
          {leader.name}
        </span>
      </div>
    </td>
    {activeTab === 'rank' && (
      <td className="px-4 py-4 md:px-8 md:py-6">
        <span className="text-[9px] md:text-[10px] font-black uppercase tracking-wider px-2 py-0.5 md:px-3 md:py-1 rounded-xl border-2"
          style={{ borderColor: 'rgba(43,23,63,0.22)', background: 'rgba(255,255,255,0.25)', color: 'rgba(26,15,40,0.75)' }}
        >
          {leader.title}
        </span>
      </td>
    )}
    <td className="px-8 py-6 hidden md:table-cell">
      <span className="text-xs font-black ww-muted">Lvl {leader.level}</span>
    </td>
    {activeTab === 'rank' && (
      <td className="px-8 py-6 hidden lg:table-cell">
        <div className="flex items-center gap-2">
          <TrendingUp size={14} className="text-emerald-500" />
          <span className="text-sm font-black ww-ink">{leader.winRate}</span>
        </div>
      </td>
    )}
    <td className={`px-4 py-4 md:px-8 md:py-6 text-right font-black rpg-font text-xs md:text-base ${leader.isUser ? 'ww-ink' : 'ww-ink'}`}>
      {activeTab === 'rank' ? leader.points : leader.wordsCount}
    </td>
  </tr>
);

const Leaderboard: React.FC = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = React.useState<LeaderboardTab>('rank');
  const [leaders, setLeaders] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [currentUserRank, setCurrentUserRank] = React.useState<any>(null);

  // Calculate neighbors dynamically based on current user rank
  const userNeighbors = React.useMemo(() => {
    if (!currentUserRank || leaders.length === 0) return [];

    const currentIndex = leaders.findIndex(l => l.rank === currentUserRank.rank);
    if (currentIndex === -1) return [];

    const start = Math.max(0, currentIndex - 1);
    const end = Math.min(leaders.length, currentIndex + 2);

    // Always try to show 3 items if possible
    let visibleSlice = leaders.slice(start, end);
    if (visibleSlice.length < 3) {
      if (start === 0) {
        visibleSlice = leaders.slice(0, 3);
      } else {
        visibleSlice = leaders.slice(Math.max(0, leaders.length - 3), leaders.length);
      }
    }

    return visibleSlice;
  }, [leaders, currentUserRank]);

  React.useEffect(() => {
    const fetchLeaderboard = async () => {
      setLoading(true);
      try {
        const { getLeaderboard, getWordLeaderboard } = await import('../services/databaseService');

        const data = activeTab === 'rank'
          ? await getLeaderboard(50)
          : await getWordLeaderboard(50);

        // Transform data based on active tab
        const formattedLeaders = data.map((item: any, index: number) => ({
          rank: index + 1,
          name: item.profiles?.username || 'Unknown',
          title: item.rank || 'Bronze',
          level: item.level,
          winRate: `${item.win_streak}`,
          points: item.rank_points,
          wordsCount: item.mastered_words_count,
          isUser: user ? item.user_id === user.id : false
        }));

        setLeaders(formattedLeaders);

        // Find current user
        const currentUser = formattedLeaders.find((l: any) => l.isUser);
        if (currentUser) {
          setCurrentUserRank(currentUser);
        } else {
          setCurrentUserRank(null);
        }
      } catch (error) {
        console.error("Failed to fetch leaderboard", error);
      } finally {
        setLoading(false);
      }
    };

    fetchLeaderboard();
  }, [user, activeTab]);

  return (
    <div className="max-w-5xl mx-auto py-6 space-y-8 px-2 md:px-0">
      <div className="text-center space-y-2">
        <h2 className="text-3xl md:text-4xl font-black rpg-font tracking-tighter uppercase text-white">排行榜</h2>
        <p className="text-white/70 font-black text-[10px] uppercase tracking-[0.3em]">全球实时数据 • 竞争白热化</p>
      </div>

      {/* Tab Switcher */}
      <div className="flex justify-center gap-3">
        <button
          onClick={() => setActiveTab('rank')}
          className={`px-5 py-2.5 rounded-full font-black text-xs uppercase tracking-wider transition-all flex items-center gap-2 ${activeTab === 'rank'
              ? 'text-black'
              : 'text-white/70 border-2 border-[rgba(255,255,255,0.25)] bg-[rgba(255,255,255,0.15)] hover:bg-[rgba(255,255,255,0.25)]'
            }`}
          style={activeTab === 'rank' ? {
            background: 'rgba(252,203,89,0.95)',
            border: '3px solid var(--ww-stroke)',
            boxShadow: '0 6px 0 rgba(0,0,0,0.18)',
          } : {}}
        >
          <Trophy size={14} />
          排位榜
        </button>
        <button
          onClick={() => setActiveTab('words')}
          className={`px-5 py-2.5 rounded-full font-black text-xs uppercase tracking-wider transition-all flex items-center gap-2 ${activeTab === 'words'
              ? 'text-black'
              : 'text-white/70 border-2 border-[rgba(255,255,255,0.25)] bg-[rgba(255,255,255,0.15)] hover:bg-[rgba(255,255,255,0.25)]'
            }`}
          style={activeTab === 'words' ? {
            background: 'rgba(252,203,89,0.95)',
            border: '3px solid var(--ww-stroke)',
            boxShadow: '0 6px 0 rgba(0,0,0,0.18)',
          } : {}}
        >
          <BookOpen size={14} />
          单词榜
        </button>
      </div>

      {loading ? (
        <div className="text-center py-20">
          <p className="text-slate-500">Loading leaderboard...</p>
        </div>
      ) : (
        <>
          {/* Top 3 Featured */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 mb-8">
            {leaders.slice(0, 3).map((leader) => (
              <motion.div
                key={leader.rank}
                whileHover={{ y: -3 }}
                className="ww-surface ww-surface--soft relative p-6 md:p-8 rounded-[2.5rem] md:rounded-[3rem] flex flex-col items-center text-center transition-all"
                style={{
                  boxShadow:
                    leader.rank === 1
                      ? '0 14px 30px rgba(0,0,0,0.22), 0 0 0 6px rgba(252,203,89,0.45)'
                      : leader.rank === 2
                        ? '0 14px 30px rgba(0,0,0,0.18), 0 0 0 6px rgba(43,23,63,0.12)'
                        : '0 14px 30px rgba(0,0,0,0.18), 0 0 0 6px rgba(234,88,12,0.18)',
                }}
              >
                <div
                  className="absolute -top-3 px-4 py-1 rounded-full text-[9px] font-black uppercase tracking-widest flex items-center gap-2"
                  style={{
                    background: 'rgba(252,203,89,0.95)',
                    border: '3px solid var(--ww-stroke)',
                    boxShadow: '0 6px 0 rgba(0,0,0,0.18)',
                    color: 'black',
                  }}
                >
                  {leader.rank === 1 ? <Crown size={12} className="text-black" /> : <Medal size={12} className="text-black" />}
                  TOP {leader.rank}
                </div>
                <img
                  src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${leader.name}`}
                  className="w-16 h-16 md:w-20 md:h-20 rounded-full mb-3 bg-white"
                  style={{ border: '3px solid var(--ww-stroke)', boxShadow: '0 8px 0 rgba(0,0,0,0.18)' }}
                  alt={leader.name}
                />
                <h3 className="text-lg font-black rpg-font mb-0.5 ww-ink truncate w-full px-2">{leader.name}</h3>
                <span className="text-[8px] md:text-[9px] font-black uppercase ww-muted mb-3">{leader.title}</span>

                <div className="w-full mt-2 grid grid-cols-2 gap-2">
                  <div className="rounded-2xl border-2 px-3 py-2" style={{ borderColor: 'rgba(43,23,63,0.22)', background: 'rgba(255,255,255,0.25)' }}>
                    <div className="text-[8px] font-black uppercase ww-muted">
                      {activeTab === 'rank' ? '分数' : '单词数'}
                    </div>
                    <div className="text-xs font-black ww-ink tabular-nums">
                      {activeTab === 'rank' ? leader.points : leader.wordsCount}
                    </div>
                  </div>
                  <div className="rounded-2xl border-2 px-3 py-2" style={{ borderColor: 'rgba(43,23,63,0.22)', background: 'rgba(255,255,255,0.25)' }}>
                    <div className="text-[8px] font-black uppercase ww-muted">等级</div>
                    <div className="text-xs font-black ww-ink tabular-nums">{leader.level}</div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Main Leaderboard Table */}
          <div className="space-y-6">
            <div className="ww-surface ww-surface--soft rounded-[2rem] overflow-hidden">
              <table className="w-full text-left border-collapse table-fixed">
                <thead className="text-[9px] md:text-[10px] font-black uppercase tracking-widest border-b" style={{ color: 'rgba(26,15,40,0.72)', borderColor: 'rgba(43,23,63,0.22)', background: 'rgba(255,255,255,0.22)' }}>
                  <tr>
                    <th className="px-4 py-4 md:px-8 md:py-6 w-[15%] md:w-24">排名</th>
                    <th className="px-4 py-4 md:px-8 md:py-6 w-[35%]">武者</th>
                    {activeTab === 'rank' && <th className="px-4 py-4 md:px-8 md:py-6 w-[25%] md:w-auto">段位</th>}
                    <th className="px-8 py-6 hidden md:table-cell">等级</th>
                    {activeTab === 'rank' && <th className="px-8 py-6 hidden lg:table-cell">连胜</th>}
                    <th className="px-4 py-4 md:px-8 md:py-6 text-right w-[25%] md:w-32">
                      {activeTab === 'rank' ? '分数' : '单词数'}
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y" style={{ borderColor: 'rgba(43,23,63,0.16)' }}>
                  {leaders.slice(3).map((leader) => (
                    <LeaderRow key={leader.rank} leader={leader} activeTab={activeTab} />
                  ))}
                </tbody>
              </table>
            </div>

            {/* Separator / Your Position Section */}
            <div className="relative flex items-center justify-center py-4">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-dashed" style={{ borderColor: 'rgba(255,255,255,0.25)' }} />
              </div>
              <div className="relative px-6 flex items-center gap-2">
                <User size={14} style={{ color: 'var(--ww-accent)' }} />
                <span
                  className="px-3 py-1.5 text-[9px] md:text-[10px] font-black uppercase tracking-[0.3em] rounded-full"
                  style={{
                    background: 'rgba(252,203,89,0.95)',
                    border: '3px solid var(--ww-stroke)',
                    boxShadow: '0 6px 0 rgba(0,0,0,0.18)',
                    color: 'black',
                  }}
                >
                  我的排名
                </span>
              </div>
            </div>

            <div className="ww-surface ww-surface--soft rounded-[2rem] overflow-hidden">
              <table className="w-full text-left border-collapse table-fixed">
                <tbody className="divide-y" style={{ borderColor: 'rgba(43,23,63,0.16)' }}>
                  {userNeighbors.map((leader) => (
                    <LeaderRow key={leader.rank} leader={leader} activeTab={activeTab} />
                  ))}
                  {userNeighbors.length === 0 && (
                    <tr>
                      <td colSpan={activeTab === 'rank' ? 6 : 4} className="px-4 py-6 text-center ww-muted text-sm font-black">
                        你暂未进入前 50，继续冲刺！
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default Leaderboard;

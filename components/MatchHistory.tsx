import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Sword, Scroll, Skull, Trophy, Handshake, Calendar, Loader2 } from 'lucide-react';
// import { PixelCard } from './ui/PixelComponents';
import { getMatchHistory, MatchHistoryItem } from '../services/pvpService';

interface MatchHistoryProps {
    userId: string;
}

const MatchHistory: React.FC<MatchHistoryProps> = ({ userId }) => {
    const [history, setHistory] = useState<MatchHistoryItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(0);
    const [hasMore, setHasMore] = useState(false);
    const [loadingMore, setLoadingMore] = useState(false);

    useEffect(() => {
        // Initial load
        loadHistory(0);
    }, [userId]);

    const loadHistory = async (pageNum: number) => {
        if (pageNum === 0) setLoading(true);
        else setLoadingMore(true);

        const { items, hasMore: moreAvailable } = await getMatchHistory(userId, pageNum);

        if (pageNum === 0) {
            setHistory(items);
        } else {
            setHistory(prev => [...prev, ...items]);
        }

        setHasMore(moreAvailable);
        setPage(pageNum);

        if (pageNum === 0) setLoading(false);
        else setLoadingMore(false);
    };

    const handleLoadMore = () => {
        loadHistory(page + 1);
    };

    if (loading) {
        return (
            <div className="flex justify-center p-8">
                <Loader2 className="animate-spin" size={24} style={{ color: 'var(--ww-accent)' }} />
            </div>
        );
    }

    if (history.length === 0) {
        return (
            <div className="text-center py-10">
                <div className="inline-flex items-center gap-2 px-4 py-2 ww-pill" style={{ background: 'rgba(255,255,255,0.25)' }}>
                    <Sword size={14} style={{ color: 'var(--ww-stroke)' }} />
                    <p className="text-[10px] font-black uppercase tracking-widest ww-muted">暂无对战记录</p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-3">
            <div className="flex items-center justify-between">
                <h3 className="text-[12px] font-black uppercase tracking-widest ww-ink">
                    对战记录
                </h3>
                <div className="px-3 py-1.5 ww-pill ww-pill--accent">
                    <span className="text-[10px] font-black text-black tabular-nums">{history.length}</span>
                </div>
            </div>

            <div className="max-h-[420px] overflow-y-auto px-1 space-y-2 custom-scrollbar">
                {history.map((match, idx) => (
                    <motion.div
                        key={match.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: idx * 0.05 }}
                    >
                        <div
                            className="p-3 relative rounded-[18px] border-2 flex items-center justify-between transition-colors"
                            style={{
                                borderColor: match.result === 'win' ? 'rgba(16,185,129,0.55)'
                                    : match.result === 'loss' ? 'rgba(239,68,68,0.55)'
                                        : 'rgba(43,23,63,0.22)',
                                background: 'rgba(255,255,255,0.22)',
                                boxShadow: '0 10px 18px rgba(0,0,0,0.12)',
                            }}
                        >

                            {/* Left: Mode & Result */}
                            <div className="flex items-center gap-3">
                                <div
                                    className="w-10 h-10 flex items-center justify-center rounded-2xl"
                                    style={{
                                        background: match.result === 'win' ? 'rgba(16,185,129,0.18)'
                                            : match.result === 'loss' ? 'rgba(239,68,68,0.16)'
                                                : 'rgba(26,15,40,0.10)',
                                        border: '2px solid rgba(43,23,63,0.22)',
                                        color: match.result === 'win' ? 'rgba(16,185,129,0.95)'
                                            : match.result === 'loss' ? 'rgba(239,68,68,0.95)'
                                                : 'rgba(26,15,40,0.65)',
                                    }}
                                >
                                    {match.result === 'win' ? <Trophy size={18} /> :
                                        match.result === 'loss' ? <Skull size={18} /> :
                                            <Handshake size={18} />}
                                </div>
                                <div className="flex flex-col">
                                    <span
                                        className="text-[11px] font-black uppercase tracking-widest"
                                        style={{
                                            color: match.result === 'win' ? 'rgba(16,185,129,0.95)'
                                                : match.result === 'loss' ? 'rgba(239,68,68,0.95)'
                                                    : 'rgba(26,15,40,0.75)',
                                        }}
                                    >
                                        {match.result === 'win' ? '胜利' : match.result === 'loss' ? '失败' : '平局'}
                                    </span>
                                    {match.isResignation && (
                                        <span className="text-[9px] font-black ww-muted -mt-0.5">
                                            {match.result === 'win' ? '对手投降' : '投降'}
                                        </span>
                                    )}
                                    <div className="flex items-center gap-1 text-[10px] font-black ww-muted">
                                        {match.mode === 'blitz' ? <Sword size={12} /> : <Scroll size={12} />}
                                        {match.mode === 'blitz' ? '闪击战' : '阵地战'}
                                    </div>
                                </div>
                            </div>

                            {/* Middle: Score */}
                            <div className="flex flex-col items-center">
                                <span className="text-lg font-black italic ww-ink tabular-nums">{match.score}</span>
                                <div className="flex flex-col items-center mt-1">
                                    {match.scoreChange !== undefined && (
                                        <span
                                            className="text-[10px] font-black tabular-nums"
                                            style={{
                                                color:
                                                    match.scoreChange > 0 || (match.scoreChange === 0 && match.result !== 'loss')
                                                        ? 'rgba(16,185,129,0.95)'
                                                        : 'rgba(239,68,68,0.95)'
                                            }}
                                        >
                                            {match.scoreChange > 0 ? '+' : (match.scoreChange === 0 && match.result === 'loss' ? '-' : (match.scoreChange === 0 ? '+' : ''))}{Math.abs(match.scoreChange)}
                                        </span>
                                    )}
                                    {match.startRankPoints !== undefined && (
                                        <span className="text-[9px] ww-muted font-mono tabular-nums">起始 {match.startRankPoints}</span>
                                    )}
                                </div>
                            </div>


                            {/* Right: Opponent & Time */}
                            <div className="flex flex-col items-end text-right">
                                <span className="text-xs font-black ww-ink max-w-[110px] truncate">
                                    对手 {match.opponentName}
                                </span>
                                <span className="text-[9px] font-mono ww-muted mt-0.5">
                                    {tryFormatTime(match.createdAt)}
                                </span>
                            </div>
                        </div>
                    </motion.div>
                ))}

                {/* Load More Button */}
                {hasMore && (
                    <div className="pt-2 pb-4 flex justify-center">
                        <button
                            onClick={handleLoadMore}
                            disabled={loadingMore}
                            className="ww-btn ww-btn--accent px-5 py-2 rounded-2xl text-[10px] flex items-center gap-2"
                        >
                            {loadingMore ? (
                                <>
                                    <Loader2 size={12} className="animate-spin" /> 加载中...
                                </>
                            ) : (
                                <>
                                    加载更多 <Calendar size={12} />
                                </>
                            )}
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

const tryFormatTime = (dateStr: string) => {
    try {
        const date = new Date(dateStr);
        const now = new Date();
        const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

        if (diffInSeconds < 60) return '刚刚';
        if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} 分钟前`;
        if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} 小时前`;
        return `${Math.floor(diffInSeconds / 86400)} 天前`;
    } catch (e) {
        return '未知时间';
    }
};

export default MatchHistory;


import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShoppingBag, Coins, Lock, Check, Sword, Shield, X } from 'lucide-react';
import { useWarrior } from '../../contexts/WarriorContext';
import { SHOP_ITEMS } from '../../constants.tsx';
import { ShopItem } from '../../types';

interface ShopPanelProps {
    onClose: () => void;
}

const ShopPanel: React.FC<ShopPanelProps> = ({ onClose }) => {
    const { state, buyItem, equipItem, shopItems } = useWarrior();
    const [filter, setFilter] = useState<'all' | 'weapon' | 'armor' | 'shield'>('all');

    const filteredItems = shopItems.filter(item => filter === 'all' || item.type === filter);



    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="w-full max-w-4xl ww-surface ww-modal rounded-3xl overflow-hidden flex flex-col"
            >
                {/* Header */}
                <div className="p-6 ww-divider flex justify-between items-center">
                    <div className="flex items-center gap-3">
                        <ShoppingBag style={{ color: 'var(--ww-stroke)' }} size={24} />
                        <div>
                            <h2 className="text-xl font-black uppercase tracking-widest ww-ink">商店</h2>
                            <p className="text-[10px] ww-muted font-bold uppercase tracking-widest">Upgrade Your Gear</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-6">
                        <div className="flex items-center gap-2 px-4 py-2 ww-pill ww-pill--accent">
                            <Coins size={16} className="text-black" />
                            <span className="text-black font-black font-mono">{state.gold} G</span>
                        </div>
                        <button onClick={onClose} className="p-2 rounded-full transition-colors ww-btn ww-btn--ink" aria-label="Close shop">
                            <X size={20} />
                        </button>
                    </div>
                </div>

                <div className="flex flex-1 overflow-hidden">
                    {/* Sidebar / Filter */}
                    <div className="w-16 md:w-20 border-r border-[color:var(--ww-stroke-soft)] flex flex-col items-center py-6 gap-6">
                        <button
                            onClick={() => setFilter('all')}
                            className={`p-3 rounded-xl transition-all ${filter === 'all' ? 'ww-btn ww-btn--accent' : 'ww-btn'}`}
                            title="All Items"
                        >
                            <LayoutGridIcon size={20} />
                        </button>
                        <button
                            onClick={() => setFilter('weapon')}
                            className={`p-3 rounded-xl transition-all ${filter === 'weapon' ? 'ww-btn ww-btn--accent' : 'ww-btn'}`}
                            title="Weapons"
                        >
                            <Sword size={20} />
                        </button>
                        <button
                            onClick={() => setFilter('shield')}
                            className={`p-3 rounded-xl transition-all ${filter === 'shield' ? 'ww-btn ww-btn--accent' : 'ww-btn'}`}
                            title="Shields"
                        >
                            <Shield size={20} />
                        </button>
                        <button
                            onClick={() => setFilter('armor')}
                            className={`p-3 rounded-xl transition-all ${filter === 'armor' ? 'ww-btn ww-btn--accent' : 'ww-btn'}`}
                            title="Armor"
                        >
                            <div className="relative">
                                <Shield size={20} className="scale-x-75" />
                                <div className="absolute inset-0 flex items-center justify-center">
                                    <div className="w-1 h-3 bg-current rounded-full"></div>
                                </div>
                            </div>
                        </button>
                    </div>

                    {/* Item Grid */}
                    <div className="flex-1 overflow-y-auto p-6">
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                            {filteredItems.map(item => {
                                const isOwned = state.inventory.includes(item.id);
                                const isEquipped = state.equipped.armor === item.id || state.equipped.weapon === item.id || state.equipped.shield === item.id;
                                const canAfford = state.gold >= item.price;

                                // Determine Stat Icon/Text
                                let statLabel = '';
                                if (item.statBonus.atk) statLabel = `+${item.statBonus.atk} ATK`;
                                else if (item.statBonus.def) statLabel = `+${item.statBonus.def} DEF`;
                                else if (item.statBonus.hp) statLabel = `+${item.statBonus.hp} HP`;

                                const handleAction = async () => {
                                    if (isEquipped) return;

                                    if (isOwned) {
                                        // Equip logic
                                        await equipItem(item.type, item.id);
                                    } else {
                                        // Buy logic
                                        if (!canAfford) {
                                            alert("金币不足，无法购买");
                                            return;
                                        }

                                        const success = await buyItem(item.id);
                                        if (success) {
                                            alert("购买成功");
                                        } else {
                                            alert("购买失败，请重试");
                                        }
                                    }
                                };

                                return (
                                    <motion.div
                                        key={item.id}
                                        whileHover={{ y: -2 }}
                                        className={`relative p-4 rounded-2xl border-2 group flex flex-col ${isEquipped ? 'bg-[rgba(252,203,89,0.25)] border-[color:var(--ww-brand)]' : isOwned ? 'bg-[rgba(255,255,255,0.08)] border-[color:var(--ww-stroke)]' : 'bg-[rgba(255,255,255,0.03)] border-[color:var(--ww-stroke-soft)]'}`}
                                    >
                                        <div className="aspect-square mb-4 rounded-xl bg-[rgba(26,15,40,0.10)] flex items-center justify-center relative overflow-hidden border border-[color:var(--ww-stroke-soft)] p-2">
                                            {/* Icon Logic */}
                                            {/* Icon Logic */}
                                            <div className="relative w-full h-full flex items-center justify-center">
                                                <img
                                                    src={`/assets/items/${item.assetKey}.png`}
                                                    alt={item.name}
                                                    className="w-full h-full object-contain drop-shadow-md"
                                                    onError={(e) => {
                                                        // Fallback to Lucide if image fails to load
                                                        (e.target as HTMLImageElement).style.display = 'none';
                                                        (e.target as HTMLImageElement).parentElement?.querySelector('.lucide-fallback')?.classList.remove('hidden');
                                                    }}
                                                />
                                                <div className="lucide-fallback hidden">
                                                    {item.type === 'weapon' ? <Sword size={32} className="text-[color:var(--ww-stroke)]" /> :
                                                        item.type === 'shield' ? <Shield size={32} className="text-[color:var(--ww-stroke)]" /> :
                                                            <div className="relative"><Shield size={32} className="scale-x-75 text-[color:var(--ww-stroke)]" /></div>}
                                                </div>
                                            </div>

                                            {isEquipped && (
                                                <div className="absolute top-2 right-2 ww-pill ww-pill--accent text-[10px] font-black px-2 py-0.5 uppercase z-10 shadow-sm">
                                                    Equipped
                                                </div>
                                            )}
                                            {!isEquipped && isOwned && (
                                                <div className="absolute top-2 right-2 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded text-[10px] font-black px-2 py-0.5 uppercase z-10">
                                                    Owned
                                                </div>
                                            )}
                                        </div>

                                        <div className="flex-1">
                                            <h3 className="font-black ww-ink text-sm leading-tight mb-1">{item.name}</h3>
                                            <div className="inline-block px-1.5 py-0.5 rounded bg-[color:var(--ww-stroke-soft)]/20 text-[10px] ww-muted font-bold uppercase mb-3">
                                                {statLabel}
                                            </div>
                                        </div>

                                        <button
                                            onClick={handleAction}
                                            disabled={isEquipped}
                                            className={`
                                                w-full py-2 rounded-lg text-xs flex items-center justify-center gap-1 transition-all mt-auto font-black uppercase tracking-wide
                                                ${isEquipped
                                                    ? 'bg-transparent text-[color:var(--ww-muted)] cursor-default border-2 border-transparent'
                                                    : isOwned
                                                        ? 'bg-[color:var(--ww-brand)] text-black shadow-lg shadow-amber-500/20 hover:scale-[1.02] active:scale-[0.98]'
                                                        : canAfford
                                                            ? 'ww-btn ww-btn--ink hover:bg-[color:var(--ww-ink)] hover:text-white'
                                                            : 'bg-white/5 text-white/40 hover:bg-white/10'} 
                                            `}
                                        >
                                            {isEquipped ? (
                                                <span>已装备</span>
                                            ) : isOwned ? (
                                                <span>装备</span>
                                            ) : (
                                                <div className="flex items-center gap-1">
                                                    <span>{item.price}</span>
                                                    <Coins size={12} />
                                                </div>
                                            )}
                                        </button>
                                    </motion.div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            </motion.div>
        </div>
    );
};

const LayoutGridIcon = ({ size }: { size: number }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect width="7" height="7" x="3" y="3" rx="1" />
        <rect width="7" height="7" x="14" y="3" rx="1" />
        <rect width="7" height="7" x="14" y="14" rx="1" />
        <rect width="7" height="7" x="3" y="14" rx="1" />
    </svg>
);

export default ShopPanel;

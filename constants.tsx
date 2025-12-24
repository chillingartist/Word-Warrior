
import React from 'react';
import { Swords, Zap, PenTool, LayoutGrid, Settings, BookOpen, Mic2, Headphones, Trophy, ShieldCheck, Flame, Target, Award, Crown, Sun, Calendar, Scroll, Medal, Star } from 'lucide-react';
import { Rank } from './types';

export const calculateKP = (stats: { atk: number; def: number; hp: number; level: number }, gearBonus: { atk: number; def: number; hp: number } = { atk: 0, def: 0, hp: 0 }) => {
  const totalAtk = stats.atk + gearBonus.atk;
  const totalDef = stats.def + gearBonus.def;
  const totalHp = stats.hp + gearBonus.hp;

  return (totalAtk * 10) + (totalDef * 15) + (totalHp * 2) + (stats.level * 100);
};

export const KP_RANKS = [
  { name: '见习学徒', label: 'Novice', min: 0, max: 2000, color: 'text-slate-500', bg: 'bg-slate-500/10', border: 'border-slate-400' },
  { name: '青铜笔杆', label: 'Bronze', min: 2001, max: 5000, color: 'text-amber-700', bg: 'bg-amber-700/10', border: 'border-amber-700' },
  { name: '白银卷轴', label: 'Silver', min: 5001, max: 10000, color: 'text-slate-400', bg: 'bg-slate-400/10', border: 'border-slate-300' },
  { name: '黄金羽毛', label: 'Gold', min: 10001, max: 20000, color: 'text-yellow-600', bg: 'bg-yellow-500/10', border: 'border-yellow-500' },
  { name: '钻石圣贤', min: 20001, max: 50000, color: 'text-purple-600', bg: 'bg-purple-500/10', border: 'border-purple-500 shadow-[0_0_10px_rgba(168,85,247,0.5)]' },
  { name: '单词武神', label: 'Legend', min: 50001, max: Infinity, color: 'text-red-600', bg: 'bg-red-500/10', border: 'border-red-600 shadow-[0_0_15px_rgba(239,68,68,0.6)]' },
];

export const getKPRank = (kp: number) => {
  return KP_RANKS.find(r => kp >= r.min && kp <= r.max) || KP_RANKS[0];
};

export const INITIAL_STATS = {
  level: 1,
  exp: 0,
  atk: 10,
  def: 10,
  crit: 0.05,
  hp: 100,
  maxHp: 100,
  rank: Rank.BRONZE,
  rankPoints: 120,
  winStreak: 0,
  masteredWordsCount: 0,
  loginDays: 1,
  gold: 100,
};

export const NAVIGATION = [
  { name: '主控室', icon: <LayoutGrid size={20} />, id: 'dashboard' },
  { name: '排行榜', icon: <Trophy size={20} />, id: 'leaderboard' },
  { name: '管理端', icon: <Settings size={20} />, id: 'admin' },
];

export const TRAINING_MODES = [
  { id: 'vocab', name: '词汇训练', icon: <Swords size={20} />, desc: 'Swipable Cards', stat: 'ATK' },
  { id: 'listening', name: '听力磨炼', icon: <Headphones size={20} />, desc: 'Audio Quiz', stat: 'DEF' },
  { id: 'oral', name: '口语修行', icon: <Mic2 size={20} />, desc: 'AI Coaching', stat: 'EXP' },
  { id: 'reading', name: '阅读试炼', icon: <BookOpen size={20} />, desc: 'Comprehension', stat: 'HP' },
  { id: 'writing', name: '写作工坊', icon: <PenTool size={20} />, desc: 'AI Grading', stat: 'ATK' },
];

export const PVP_MODES = [
  {
    id: 'pvp_blitz',
    name: '单词闪击战',
    description: '拼手速！英选汉，伤害结算：ATK × 1.5。',
    icon: <Zap size={24} className="text-white" />,
    color: 'from-yellow-500/80 to-orange-500/80 border-yellow-500/50',
    mechanic: 'Speed-based Burst'
  },
  {
    id: 'pvp_tactics',
    name: '语法阵地战',
    description: '拼正确率！DEF 抵挡伤害，免疫暴击。',
    icon: <ShieldCheck size={24} className="text-white" />,
    color: 'from-cyan-500/80 to-blue-500/80 border-cyan-500/50',
    mechanic: 'Defensive Strategy'
  },

];

export const ACHIEVEMENTS = [
  // Word Count Milestones
  {
    id: 'word_1',
    title: '初出茅庐',
    desc: '累计掌握 1 个单词',
    icon: <Scroll size={24} />,
    color: 'text-slate-500',
    bg: 'bg-slate-500/10 border-slate-500',
    condition: (stats: any) => stats.masteredWordsCount >= 1
  },
  {
    id: 'word_10',
    title: '知识学徒',
    desc: '累计掌握 10 个单词',
    icon: <BookOpen size={24} />,
    color: 'text-blue-500',
    bg: 'bg-blue-500/10 border-blue-500',
    condition: (stats: any) => stats.masteredWordsCount >= 10
  },
  {
    id: 'word_100',
    title: '博学智者',
    desc: '累计掌握 100 个单词',
    icon: <Zap size={24} />,
    color: 'text-indigo-500',
    bg: 'bg-indigo-500/10 border-indigo-500',
    condition: (stats: any) => stats.masteredWordsCount >= 100
  },
  {
    id: 'word_1000',
    title: '万词王',
    desc: '累计掌握 1000 个单词',
    icon: <Crown size={24} />,
    color: 'text-amber-500',
    bg: 'bg-amber-500/10 border-amber-500',
    condition: (stats: any) => stats.masteredWordsCount >= 1000
  },

  // Login/Consistency
  {
    id: 'streak_3',
    title: '三日之约',
    desc: '连续登录学习 3 天',
    icon: <Sun size={24} />,
    color: 'text-orange-500',
    bg: 'bg-orange-500/10 border-orange-500',
    condition: (stats: any) => stats.loginDays >= 3 // Simplified for demo
  },
  {
    id: 'streak_7',
    title: '持之以恒',
    desc: '连续登录学习 7 天',
    icon: <Calendar size={24} />,
    color: 'text-emerald-500',
    bg: 'bg-emerald-500/10 border-emerald-500',
    condition: (stats: any) => stats.loginDays >= 7
  },
  {
    id: 'perfect_month',
    title: '月度守护者',
    desc: '单一月份内全勤打卡',
    icon: <ShieldCheck size={24} />,
    color: 'text-fuchsia-500',
    bg: 'bg-fuchsia-500/10 border-fuchsia-500',
    condition: (stats: any) => stats.loginDays >= 30
  },

  // Level Milestones
  {
    id: 'lvl_5',
    title: '战士觉醒',
    desc: '达到等级 5',
    icon: <Swords size={24} />,
    color: 'text-red-500',
    bg: 'bg-red-500/10 border-red-500',
    condition: (stats: any) => stats.level >= 5
  },
  {
    id: 'lvl_20',
    title: '英雄领域',
    desc: '达到等级 20',
    icon: <Medal size={24} />,
    color: 'text-purple-500',
    bg: 'bg-purple-500/10 border-purple-500',
    condition: (stats: any) => stats.level >= 20
  },

  // Performance
  {
    id: 'streak_win_10',
    title: '势不可挡',
    desc: '获得 10 连胜',
    icon: <Flame size={24} />,
    color: 'text-rose-500',
    bg: 'bg-rose-500/10 border-rose-500',
    condition: (stats: any) => stats.winStreak >= 10
  },
  {
    id: 'high_accuracy',
    title: '精准打击',
    desc: '单次学习正确率 100%',
    icon: <Target size={24} />,
    color: 'text-cyan-500',
    bg: 'bg-cyan-500/10 border-cyan-500',
    condition: (stats: any) => stats.exp > 500 // Mock condition
  }
];

export const MOCK_VOCAB_CARDS = [
  { word: 'Pragmatic', chinese: '务实的', definition: 'Dealing with things sensibly and realistically.', options: ['务实的', '幻想的', '快速的', '沉重的'], correctAnswer: '务实的' },
  { word: 'Inevitably', chinese: '不可避免地', definition: 'As is certain to happen; unavoidably.', options: ['偶尔地', '突然地', '不可避免地', '悄悄地'], correctAnswer: '不可避免地' },
  { word: 'Enthusiastic', chinese: '热情的', definition: 'Having or showing intense and eager enjoyment.', options: ['热情的', '冷淡的', '焦虑的', '疲惫的'], correctAnswer: '热情的' },
  { word: 'Compromise', chinese: '妥协', definition: 'An agreement reached by each side making concessions.', options: ['坚持', '妥协', '进攻', '逃避'], correctAnswer: '妥协' },
];

export const MOCK_GRAMMAR_QUESTIONS = [
  {
    prompt: "If I ______ you, I would take the job immediately.",
    options: ["am", "was", "were", "be"],
    correctAnswer: "were",
    type: "grammar"
  },
  {
    prompt: "She is one of the students who ______ always on time.",
    options: ["is", "are", "was", "be"],
    correctAnswer: "are",
    type: "grammar"
  },
  {
    prompt: "By this time next year, I ______ my master's degree.",
    options: ["will finish", "will have finished", "finish", "finished"],
    correctAnswer: "will have finished",
    type: "grammar"
  },
  {
    prompt: "I wish I ______ to the party last night.",
    options: ["go", "went", "had gone", "would go"],
    correctAnswer: "had gone",
    type: "grammar"
  }
];



export const MOCK_QUESTIONS = [
  {
    id: 'q1',
    type: 'reading',
    prompt: '[Passage] Mastering a new language requires persistence and practice. It opens doors to different cultures and ways of thinking. [Question] What is required to master a new language according to the text?',
    options: ['Persistence and practice', 'Only reading books', 'Living abroad', 'Watching movies'],
    correctAnswer: 'Persistence and practice',
    explanation: '文中第一句提到 "persistence and practice"。',
    difficulty: 2,
  },
  ...MOCK_GRAMMAR_QUESTIONS.map((q, idx) => ({ ...q, id: `g${idx}`, difficulty: 1 }))
];

export const SHOP_ITEMS: import('./types').ShopItem[] = [
  // Weapons (Full 10 Tiers)
  {
    id: 'wpn_wood_sword',
    name: '训练木剑',
    type: 'weapon',
    price: 50,
    statBonus: { atk: 2 },
    description: '一把简单的木剑，适合新手。',
    assetKey: 'weapon_wooden'
  },
  {
    id: 'wpn_iron_sword',
    name: '精铁长剑',
    type: 'weapon',
    price: 200,
    statBonus: { atk: 5 },
    description: '铁匠精心打造的长剑。',
    assetKey: 'weapon_iron'
  },
  {
    id: 'wpn_steel_sword',
    name: '百炼钢剑',
    type: 'weapon',
    price: 500,
    statBonus: { atk: 8 },
    description: '更加坚固且锋利的钢制长剑。',
    assetKey: 'weapon_steel'
  },
  {
    id: 'wpn_reinforced_sword',
    name: '强固巨剑',
    type: 'weapon',
    price: 1200,
    statBonus: { atk: 12 },
    description: '经过加固处理，威力惊人的巨剑。',
    assetKey: 'weapon_reinforced'
  },
  {
    id: 'wpn_elite_sword',
    name: '精英佩剑',
    type: 'weapon',
    price: 3000,
    statBonus: { atk: 20 },
    description: '只有皇家卫队精英才能佩戴的宝剑。',
    assetKey: 'weapon_elite'
  },
  {
    id: 'wpn_commander_sword',
    name: '统帅之剑',
    type: 'weapon',
    price: 8000,
    statBonus: { atk: 35 },
    description: '战场统帅的象征。',
    assetKey: 'weapon_commander'
  },
  {
    id: 'wpn_master_sword',
    name: '大师之剑',
    type: 'weapon',
    price: 20000,
    statBonus: { atk: 60 },
    description: '传奇锻造大师的绝世作品。',
    assetKey: 'weapon_master'
  },
  {
    id: 'wpn_grandmaster_sword',
    name: '大宗师之刃',
    type: 'weapon',
    price: 50000,
    statBonus: { atk: 120 },
    description: '破万军、斩乱麻，大宗师的利刃。',
    assetKey: 'weapon_grandmaster'
  },
  {
    id: 'wpn_legendary_sword',
    name: '传说级幻剑',
    type: 'weapon',
    price: 150000,
    statBonus: { atk: 300 },
    description: '只存在于英雄歌谣中的幻影之剑。',
    assetKey: 'weapon_legendary'
  },
  {
    id: 'wpn_godly_sword',
    name: '弑神之锋',
    type: 'weapon',
    price: 500000,
    statBonus: { atk: 800 },
    description: '足以撕裂空间，挑战神明的绝世凶兵。',
    assetKey: 'weapon_godly'
  },
  // Shields (Tiers 1-5 integrated)
  {
    id: 'shd_wood',
    name: '木盾',
    type: 'shield',
    price: 50,
    statBonus: { def: 2 },
    description: '基础的圆木盾。',
    assetKey: 'shield_wooden'
  },
  {
    id: 'shd_iron',
    name: '铁卫盾',
    type: 'shield',
    price: 200,
    statBonus: { def: 5 },
    description: '精铁打造的方盾。',
    assetKey: 'shield_iron'
  },
  {
    id: 'shd_steel',
    name: '钢狮之盾',
    type: 'shield',
    price: 600,
    statBonus: { def: 12 },
    description: '镌刻着狮子纹章的钢盾。',
    assetKey: 'shield_steel'
  },
  {
    id: 'shd_reinforced',
    name: '金狮强化盾',
    type: 'shield',
    price: 2000,
    statBonus: { def: 25 },
    description: '经过黄金装饰和加固的精英盾牌。',
    assetKey: 'shield_reinforced'
  },
  {
    id: 'shd_elite',
    name: '先锋战盾',
    type: 'shield',
    price: 5000,
    statBonus: { def: 45 },
    description: '由高科技合金打造的先锋战盾。',
    assetKey: 'shield_elite'
  },
  {
    id: 'shd_commander',
    name: '统帅巨盾',
    type: 'shield',
    price: 12000,
    statBonus: { def: 80 },
    description: '刻有狮子佩剑纹章的统帅之盾。',
    assetKey: 'shield_commander'
  },
  {
    id: 'shd_master',
    name: '大师皇冠盾',
    type: 'shield',
    price: 30000,
    statBonus: { def: 150 },
    description: '镶嵌皇室金边的宗师级护盾。',
    assetKey: 'shield_master'
  },
  {
    id: 'shd_grandmaster',
    name: '翼狮大宗师盾',
    type: 'shield',
    price: 75000,
    statBonus: { def: 300 },
    description: '拥有守护之翼的传说大宗师圆盾。',
    assetKey: 'shield_grandmaster'
  },
  {
    id: 'shd_legendary',
    name: '龙魂传说盾',
    type: 'shield',
    price: 200000,
    statBonus: { def: 600 },
    description: '封印着远古龙魂的传说神盾。',
    assetKey: 'shield_legendary'
  },
  {
    id: 'shd_godly',
    name: '烈阳弑神盾',
    type: 'shield',
    price: 600000,
    statBonus: { def: 1200 },
    description: '如烈阳般耀眼，足以抵挡神明一击的终极之盾。',
    assetKey: 'shield_godly'
  },
  // Armor (Tiers 1-5 integrated)
  {
    id: 'arm_wood',
    name: '简易木甲',
    type: 'armor',
    price: 50,
    statBonus: { def: 2, hp: 10 },
    description: '基础的木质装甲，适合新手入门。',
    assetKey: 'armor_wooden'
  },
  {
    id: 'arm_iron',
    name: '精铁战甲',
    type: 'armor',
    price: 250,
    statBonus: { def: 8, hp: 50 },
    description: '铁匠精心打造的坚固铁甲。',
    assetKey: 'armor_iron'
  },
  {
    id: 'arm_steel',
    name: '百炼钢铠',
    type: 'armor',
    price: 800,
    statBonus: { def: 18, hp: 120 },
    description: '更加厚实且轻便的百炼钢铠。',
    assetKey: 'armor_steel'
  },
  {
    id: 'arm_reinforced',
    name: '重装加固铠',
    type: 'armor',
    price: 2500,
    statBonus: { def: 40, hp: 300 },
    description: '全方位加固的重型铠甲，防御惊人。',
    assetKey: 'armor_reinforced'
  },
  {
    id: 'arm_elite',
    name: '精英统帅铠',
    type: 'armor',
    price: 7000,
    statBonus: { def: 85, hp: 800 },
    description: '只有最精锐的统帅才能穿着的传奇铠甲。',
    assetKey: 'armor_elite'
  },
  {
    id: 'arm_commander',
    name: '公爵级重铠',
    type: 'armor',
    price: 20000,
    statBonus: { def: 180, hp: 2000 },
    description: '象征权力和地位的华丽重铠。',
    assetKey: 'armor_commander'
  },
  {
    id: 'arm_master',
    name: '宗师防御铠',
    type: 'armor',
    price: 50000,
    statBonus: { def: 400, hp: 5000 },
    description: '防御大师的巅峰之作。',
    assetKey: 'armor_master'
  },
  {
    id: 'arm_grandmaster',
    name: '大宗师守护神',
    type: 'armor',
    price: 120000,
    statBonus: { def: 900, hp: 12000 },
    description: '在大宗师手中仿佛有了生命的守护神具。',
    assetKey: 'armor_grandmaster'
  },
  {
    id: 'arm_legendary',
    name: '传说幻影铠',
    type: 'armor',
    price: 300000,
    statBonus: { def: 2000, hp: 30000 },
    description: '如幻影般流动的传说级轻质神铠。',
    assetKey: 'armor_legendary'
  },
  {
    id: 'arm_godly',
    name: '弑神不灭铠',
    type: 'armor',
    price: 1000000,
    statBonus: { def: 5000, hp: 100000 },
    description: '足以从神明的审判中存活的不灭之装。',
    assetKey: 'armor_godly'
  }
];

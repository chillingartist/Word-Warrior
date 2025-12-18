
import React from 'react';
import { Swords, Zap, PenTool, LayoutGrid, Settings } from 'lucide-react';
import { Rank } from './types';

// Fix: Use the Rank enum for the initial state to ensure type safety and match UserStats interface
export const INITIAL_STATS = {
  level: 1,
  exp: 0,
  atk: 10,
  def: 10,
  crit: 0.05,
  hp: 100,
  maxHp: 100,
  rank: Rank.BRONZE,
  rankPoints: 0,
  winStreak: 0,
};

export const NAVIGATION = [
  { name: '选择模式', icon: <LayoutGrid size={20} />, id: 'mode_select' },
  { name: '管理后台', icon: <Settings size={20} />, id: 'admin' },
];

export const GAME_MODES = [
  {
    id: 'vocab',
    name: '词汇突袭',
    description: '通过单词卡片快速提升你的词汇攻击力 (ATK)。',
    icon: <Swords size={40} className="text-blue-500" />,
    color: 'from-blue-600/20 to-indigo-600/20',
    stat: '提升 ATK'
  },
  {
    id: 'skills',
    name: '技能训练',
    description: '攻克语法与写作难题，加固你的防御与生命。',
    icon: <PenTool size={40} className="text-emerald-500" />,
    color: 'from-emerald-600/20 to-teal-600/20',
    stat: '提升 DEF/HP'
  },
  {
    id: 'pvp',
    name: '对决竞技场',
    description: '进行实时口语对决，赢取排位积分与连胜。',
    icon: <Zap size={40} className="text-amber-500" />,
    color: 'from-amber-600/20 to-orange-600/20',
    stat: '提升 RANK'
  }
];

export const MOCK_VOCAB_CARDS = [
  { word: 'Abundant', definition: 'Existing or available in large quantities; plentiful.', chinese: '大量的，丰富的' },
  { word: 'Benevolent', definition: 'Well meaning and kindly.', chinese: '仁慈 of the, 好意的' },
  { word: 'Capricious', definition: 'Given to sudden and unaccountable changes of mood or behavior.', chinese: '反复无常的，多变的' },
  { word: 'Diligence', definition: 'Careful and persistent work or effort.', chinese: '勤奋，用功' },
];

export const MOCK_QUESTIONS = [
  {
    id: '1',
    type: 'grammar',
    prompt: '下列哪一个句子在语法上是正确的？',
    options: [
      'He don\'t know the answer.',
      'She has went to the store.',
      'If I were you, I would go.',
      'They was playing football.'
    ],
    correctAnswer: 'If I were you, I would go.',
    difficulty: 2
  },
  {
    id: '2',
    type: 'reading',
    prompt: '阅读这段文字：“工业革命标志着历史的一个重大转折点……” 其主要原因是什么？',
    options: [
      '技术创新',
      '人口增长',
      '战争',
      '饥荒'
    ],
    correctAnswer: '技术创新',
    difficulty: 3
  }
];

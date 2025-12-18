
import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Swords, Mic, ShieldAlert, User, Zap } from 'lucide-react';
import { startLiveSession, encodeAudio } from '../services/liveService';

interface BattleArenaProps {
  playerStats: any;
  onVictory: () => void;
  onDefeat: () => void;
}

const BattleArena: React.FC<BattleArenaProps> = ({ playerStats, onVictory, onDefeat }) => {
  const [battleLog, setBattleLog] = useState<string[]>(['比赛开始：雅思幽灵 现身了...']);
  const [playerHp, setPlayerHp] = useState(playerStats.hp);
  const [enemyHp, setEnemyHp] = useState(100);
  const [isRecording, setIsRecording] = useState(false);
  const [isShaking, setIsShaking] = useState<'player' | 'enemy' | null>(null);
  const [damageNumbers, setDamageNumbers] = useState<{ id: number, val: number, target: 'player' | 'enemy' }[]>([]);
  const [status, setStatus] = useState('轮到你了');
  
  const audioContextRef = useRef<AudioContext | null>(null);
  const scriptProcessorRef = useRef<ScriptProcessorNode | null>(null);
  const sessionPromiseRef = useRef<any>(null);

  const addLog = (msg: string) => setBattleLog(prev => [msg, ...prev].slice(0, 4));

  const triggerDamage = (val: number, target: 'player' | 'enemy') => {
    const id = Date.now();
    setDamageNumbers(prev => [...prev, { id, val, target }]);
    setIsShaking(target);
    setTimeout(() => setIsShaking(null), 300);
    setTimeout(() => setDamageNumbers(prev => prev.filter(d => d.id !== id)), 1000);
  };

  const startDuel = async () => {
    setIsRecording(true);
    setStatus('咏唱中...');
    
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
      const source = audioContextRef.current.createMediaStreamSource(stream);
      scriptProcessorRef.current = audioContextRef.current.createScriptProcessor(4096, 1, 1);

      // Fix: sessionPromiseRef.current must store the promise itself (not the resolved session) 
      // to correctly follow the .then() pattern for sendRealtimeInput as specified in the SDK guidelines.
      sessionPromiseRef.current = startLiveSession((score, feedback) => {
        const damage = Math.floor(playerStats.atk * (score / 100) * (score > 85 ? 2 : 1));
        setEnemyHp(prev => Math.max(0, prev - damage));
        triggerDamage(damage, 'enemy');
        addLog(`咏唱得分: ${score}! 造成伤害: ${damage}`);
        stopDuel();
      }, "你是一个对决裁判。对用户的英语口语评分 0-100。输出格式必须包含 'Score: XX'。请用中文提供简短反馈。");

      scriptProcessorRef.current.onaudioprocess = (e) => {
        const inputData = e.inputBuffer.getChannelData(0);
        const l = inputData.length;
        const int16 = new Int16Array(l);
        for (let i = 0; i < l; i++) int16[i] = inputData[i] * 32768;
        const pcmBlob = { data: encodeAudio(new Uint8Array(int16.buffer)), mimeType: 'audio/pcm;rate=16000' };
        
        // Ensure data is sent only after the session promise resolves
        sessionPromiseRef.current.then((session: any) => {
          session.sendRealtimeInput({ media: pcmBlob });
        });
      };

      source.connect(scriptProcessorRef.current);
      scriptProcessorRef.current.connect(audioContextRef.current.destination);
    } catch (err) {
      console.error(err);
      setStatus('麦克风错误');
      setIsRecording(false);
    }
  };

  const stopDuel = () => {
    if (scriptProcessorRef.current) scriptProcessorRef.current.disconnect();
    if (audioContextRef.current) audioContextRef.current.close();
    setIsRecording(false);
    setStatus('敌人行动中...');
    
    setTimeout(() => {
      const enemyDmg = Math.floor(Math.random() * 10 + 5);
      const reducedDmg = Math.max(0, enemyDmg - Math.floor(playerStats.def / 5));
      setPlayerHp(prev => Math.max(0, prev - reducedDmg));
      triggerDamage(reducedDmg, 'player');
      addLog(`敌人攻击，造成 ${reducedDmg} 点伤害！`);
      setStatus('轮到你了');
    }, 1500);
  };

  useEffect(() => {
    if (enemyHp <= 0) setTimeout(onVictory, 1500);
    if (playerHp <= 0) setTimeout(onDefeat, 1500);
  }, [enemyHp, playerHp]);

  return (
    <div className="h-full flex flex-col space-y-12 py-8">
      {/* HUD Layer */}
      <div className="flex justify-between items-start gap-8 relative px-4">
        {/* Player Side */}
        <div className={`flex-1 transition-transform duration-200 ${isShaking === 'player' ? 'animate-shake' : ''}`}>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 rounded-full bg-indigo-500/20 flex items-center justify-center border border-indigo-500/50">
              <User className="text-indigo-400" size={24} />
            </div>
            <div>
              <h3 className="text-xs font-black uppercase tracking-widest text-slate-500">单词战士</h3>
              <p className="rpg-font text-lg leading-none">LVL {playerStats.level}</p>
            </div>
          </div>
          <div className="relative h-2.5 bg-slate-900 rounded-full border border-slate-800 overflow-hidden">
            <motion.div 
              initial={false}
              animate={{ width: `${(playerHp / playerStats.maxHp) * 100}%` }}
              className="absolute inset-y-0 left-0 bg-gradient-to-r from-blue-600 to-indigo-500 rounded-full"
            />
          </div>
          {damageNumbers.filter(d => d.target === 'player').map(d => (
            <span key={d.id} className="dmg-text text-red-500 font-black text-2xl rpg-font left-12 top-0">-{d.val}</span>
          ))}
        </div>

        {/* VS Divider */}
        <div className="pt-6 flex flex-col items-center gap-1 opacity-20">
          <div className="w-px h-8 bg-slate-500" />
          <span className="text-xs font-black tracking-widest">VS</span>
          <div className="w-px h-8 bg-slate-500" />
        </div>

        {/* Enemy Side */}
        <div className={`flex-1 text-right transition-transform duration-200 ${isShaking === 'enemy' ? 'animate-shake' : ''}`}>
          <div className="flex items-center gap-3 mb-2 justify-end">
            <div>
              <h3 className="text-xs font-black uppercase tracking-widest text-slate-500">考场幽灵</h3>
              <p className="rpg-font text-lg leading-none">领主</p>
            </div>
            <div className="w-12 h-12 rounded-full bg-red-500/20 flex items-center justify-center border border-red-500/50">
              <ShieldAlert className="text-red-400" size={24} />
            </div>
          </div>
          <div className="relative h-2.5 bg-slate-900 rounded-full border border-slate-800 overflow-hidden">
            <motion.div 
              initial={false}
              animate={{ width: `${enemyHp}%` }}
              className="absolute inset-y-0 right-0 bg-gradient-to-l from-red-600 to-orange-500 rounded-full"
            />
          </div>
          {damageNumbers.filter(d => d.target === 'enemy').map(d => (
            <span key={d.id} className="dmg-text text-yellow-500 font-black text-3xl rpg-font right-12 top-0">-{d.val}</span>
          ))}
        </div>
      </div>

      {/* Battle Console */}
      <div className="flex-1 bg-slate-900/40 border border-slate-800/50 rounded-3xl p-6 backdrop-blur-xl flex flex-col justify-end">
        <div className="space-y-3">
          <AnimatePresence mode="popLayout">
            {battleLog.map((log, i) => (
              <motion.div 
                key={log + i}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1 - (i * 0.25), x: 0 }}
                exit={{ opacity: 0 }}
                className={`text-sm font-medium ${i === 0 ? 'text-indigo-400' : 'text-slate-600'}`}
              >
                <span className="mr-3 opacity-30 font-mono">[{new Date().toLocaleTimeString().split(' ')[0]}]</span>
                {log}
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </div>

      {/* Control Pad */}
      <div className="flex flex-col items-center gap-6 pb-4">
        <div className="flex flex-col items-center">
          <motion.div
            animate={{ scale: isRecording ? [1, 1.1, 1] : 1 }}
            transition={{ repeat: Infinity, duration: 1 }}
            className="relative"
          >
            {isRecording && (
              <motion.div 
                initial={{ scale: 0, opacity: 0.5 }}
                animate={{ scale: 2, opacity: 0 }}
                transition={{ repeat: Infinity, duration: 1.5 }}
                className="absolute inset-0 bg-indigo-500 rounded-full"
              />
            )}
            <button 
              onMouseDown={startDuel}
              onMouseUp={stopDuel}
              onTouchStart={startDuel}
              onTouchEnd={stopDuel}
              className={`relative z-10 w-24 h-24 rounded-full flex items-center justify-center transition-all shadow-2xl ${isRecording ? 'bg-red-500 scale-110 shadow-red-500/50' : 'bg-white hover:bg-slate-100 shadow-indigo-500/20'}`}
            >
              <Mic size={36} className={isRecording ? 'text-white' : 'text-black'} />
            </button>
          </motion.div>
          <span className="mt-4 text-[10px] font-black uppercase tracking-[0.3em] text-slate-500">{status}</span>
        </div>
      </div>
    </div>
  );
};

export default BattleArena;

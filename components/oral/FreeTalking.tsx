
import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, Square, Coffee, Plane, Briefcase, BookOpen, Rocket, Palette, Clock, Award, MessageSquare, X } from 'lucide-react';
import { startFreeTalkingSession, resampleAudio, encodeAudio } from '../../services/liveService';
import ReactMarkdown from 'react-markdown';
import { useTheme } from '../../contexts/ThemeContext';

interface FreeTalkingProps {
    onSuccess: (exp: number) => void;
    onClose?: () => void;
}

type SessionState = 'setup' | 'countdown' | 'talking' | 'finished';

const FREE_TALK_TOPICS = [
    { id: 'daily', name: '日常闲聊', nameEn: 'Daily Chat', icon: <Coffee size={32} />, description: '天气、爱好、生活琐事', color: 'from-amber-400 to-orange-500' },
    { id: 'travel', name: '旅游出行', nameEn: 'Travel', icon: <Plane size={32} />, description: '旅游经历、景点推荐', color: 'from-sky-400 to-blue-500' },
    { id: 'work', name: '职场商务', nameEn: 'Business', icon: <Briefcase size={32} />, description: '工作交流、商务沟通', color: 'from-slate-500 to-gray-600' },
    { id: 'study', name: '学术探讨', nameEn: 'Academic', icon: <BookOpen size={32} />, description: '学术话题、知识讨论', color: 'from-indigo-400 to-purple-500' },
    { id: 'tech', name: '科技前沿', nameEn: 'Technology', icon: <Rocket size={32} />, description: '技术趋势、创新产品', color: 'from-violet-400 to-fuchsia-500' },
    { id: 'culture', name: '文化艺术', nameEn: 'Culture & Arts', icon: <Palette size={32} />, description: '电影、音乐、艺术', color: 'from-pink-400 to-rose-500' },
];

const AI_LEVELS = [
    { id: 'beginner', name: '初级', nameEn: 'Beginner', description: '简单词汇，慢速对话', color: 'bg-emerald-500' },
    { id: 'intermediate', name: '中级', nameEn: 'Intermediate', description: '日常交流，正常语速', color: 'bg-blue-500' },
    { id: 'advanced', name: '高级', nameEn: 'Advanced', description: '复杂表达，地道用语', color: 'bg-purple-500' },
];

const CONVERSATION_DURATION = 180; // 3 minutes in seconds

const FreeTalking: React.FC<FreeTalkingProps> = ({ onSuccess, onClose }) => {
    const { getColorClass, primaryColor } = useTheme();

    // State
    const [sessionState, setSessionState] = useState<SessionState>('setup');
    const [selectedTopic, setSelectedTopic] = useState(FREE_TALK_TOPICS[0]);
    const [selectedLevel, setSelectedLevel] = useState(AI_LEVELS[1]);
    const [remainingTime, setRemainingTime] = useState(CONVERSATION_DURATION);
    const [isAISpeaking, setIsAISpeaking] = useState(false);
    const [countdownValue, setCountdownValue] = useState(3);

    // Refs
    const audioContextRef = useRef<AudioContext | null>(null);
    const scriptProcessorRef = useRef<ScriptProcessorNode | null>(null);
    const mediaStreamRef = useRef<MediaStream | null>(null);
    const sessionRef = useRef<any>(null);
    const timerRef = useRef<NodeJS.Timeout | null>(null);

    useEffect(() => {
        return () => {
            cleanupAudio();
            if (sessionRef.current) sessionRef.current.close();
            if (timerRef.current) clearInterval(timerRef.current);
        };
    }, []);

    const cleanupAudio = () => {
        if (scriptProcessorRef.current) {
            scriptProcessorRef.current.disconnect();
            scriptProcessorRef.current = null;
        }
        if (audioContextRef.current) {
            audioContextRef.current.close();
            audioContextRef.current = null;
        }
        if (mediaStreamRef.current) {
            mediaStreamRef.current.getTracks().forEach(track => track.stop());
            mediaStreamRef.current = null;
        }
    };

    const startConversation = async () => {
        // Start countdown
        setSessionState('countdown');
        setCountdownValue(3);

        const countdownInterval = setInterval(() => {
            setCountdownValue(prev => {
                if (prev <= 1) {
                    clearInterval(countdownInterval);
                    initializeSession();
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);
    };

    const initializeSession = async () => {
        setSessionState('talking');
        setRemainingTime(CONVERSATION_DURATION);

        // Start timer
        timerRef.current = setInterval(() => {
            setRemainingTime(prev => {
                if (prev <= 1) {
                    endConversation();
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        // Initialize Live Session
        sessionRef.current = startFreeTalkingSession(
            selectedTopic.nameEn,
            selectedLevel.id,
            (audioData) => {
                setIsAISpeaking(true);
            }
        );

        // Start audio capture
        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                audio: {
                    echoCancellation: true,
                    noiseSuppression: true,
                    autoGainControl: true
                }
            });
            mediaStreamRef.current = stream;
            audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
            const nativeRate = audioContextRef.current.sampleRate;

            const source = audioContextRef.current.createMediaStreamSource(stream);
            scriptProcessorRef.current = audioContextRef.current.createScriptProcessor(4096, 1, 1);

            scriptProcessorRef.current.onaudioprocess = (e) => {
                const inputData = e.inputBuffer.getChannelData(0);
                const resampled = resampleAudio(inputData, nativeRate, 16000);
                const l = resampled.length;
                const int16 = new Int16Array(l);
                for (let i = 0; i < l; i++) int16[i] = resampled[i] * 32768;

                if (sessionRef.current) {
                    sessionRef.current.sendAudio(new Uint8Array(int16.buffer));

                    // Detect if user is speaking (simple volume threshold)
                    const volume = Math.max(...Array.from(inputData).map(Math.abs));
                    if (volume > 0.01) {
                        setIsAISpeaking(false);
                    }
                }
            };

            source.connect(scriptProcessorRef.current);
            scriptProcessorRef.current.connect(audioContextRef.current.destination);

            // Listen for AI audio ending
            setTimeout(() => setIsAISpeaking(false), 2000);
        } catch (e) {
            console.error('Microphone access error:', e);
            alert('无法访问麦克风，请检查权限设置。');
            setSessionState('setup');
        }
    };

    const endConversation = () => {
        if (timerRef.current) clearInterval(timerRef.current);
        cleanupAudio();

        // Close session immediately
        if (sessionRef.current) {
            sessionRef.current.close();
            sessionRef.current = null;
        }

        setSessionState('finished');

        // Award experience based on conversation duration
        const completionPercentage = ((CONVERSATION_DURATION - remainingTime) / CONVERSATION_DURATION) * 100;
        const exp = Math.floor(completionPercentage / 10);
        onSuccess(exp);
    };

    const resetSession = () => {
        setSessionState('setup');
        setRemainingTime(CONVERSATION_DURATION);
        setIsAISpeaking(false);
    };

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    // ===== RENDER STAGES =====

    const renderSetup = () => (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-8 px-4 pt-4"
        >
            {/* Topic Selection */}
            <div className="space-y-4">
                <h3 className="text-xs font-black uppercase tracking-widest text-slate-400">选择话题 (Select Topic)</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {FREE_TALK_TOPICS.map(topic => (
                        <motion.button
                            key={topic.id}
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => setSelectedTopic(topic)}
                            className={`relative p-4 rounded-2xl border-2 transition-all ${selectedTopic.id === topic.id
                                ? `border-${primaryColor}-500 bg-gradient-to-br ${topic.color} text-white shadow-lg`
                                : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300'
                                }`}
                        >
                            <div className="flex flex-col items-center gap-2">
                                <div className={selectedTopic.id === topic.id ? 'text-white' : 'text-slate-400'}>
                                    {topic.icon}
                                </div>
                                <div className="text-center">
                                    <p className="text-xs font-black">{topic.name}</p>
                                    <p className={`text-[10px] font-bold ${selectedTopic.id === topic.id ? 'text-white/80' : 'text-slate-400'}`}>
                                        {topic.nameEn}
                                    </p>
                                </div>
                            </div>
                            {selectedTopic.id === topic.id && (
                                <motion.div
                                    layoutId="topic-selected"
                                    className="absolute inset-0 rounded-2xl border-4 border-white/30"
                                />
                            )}
                        </motion.button>
                    ))}
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 px-2">
                    {selectedTopic.description}
                </p>
            </div>

            {/* Level Selection */}
            <div className="space-y-4">
                <h3 className="text-xs font-black uppercase tracking-widest text-slate-400">选择难度 (Select Level)</h3>
                <div className="grid grid-cols-3 gap-3">
                    {AI_LEVELS.map(level => (
                        <motion.button
                            key={level.id}
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => setSelectedLevel(level)}
                            className={`relative p-4 rounded-xl border-2 transition-all ${selectedLevel.id === level.id
                                ? `${level.color} text-white border-white/30 shadow-lg`
                                : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300'
                                }`}
                        >
                            <div className="text-center">
                                <p className="text-sm font-black">{level.name}</p>
                                <p className={`text-[10px] font-bold ${selectedLevel.id === level.id ? 'text-white/80' : 'text-slate-400'}`}>
                                    {level.nameEn}
                                </p>
                            </div>
                        </motion.button>
                    ))}
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 px-2">
                    {selectedLevel.description}
                </p>
            </div>

            {/* Start Button */}
            <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={startConversation}
                className={`w-full py-5 rounded-2xl ${getColorClass('bg', 600)} text-white font-black text-base uppercase tracking-widest shadow-xl flex items-center justify-center gap-3 hover:brightness-110 transition-all`}
            >
                <Play size={24} />
                开始对话
            </motion.button>
        </motion.div>
    );

    const renderCountdown = () => (
        <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className="h-full flex flex-col items-center justify-center"
        >
            <motion.div
                key={countdownValue}
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 2, opacity: 0 }}
                className={`text-9xl font-black ${getColorClass('text', 600)} mb-8`}
            >
                {countdownValue}
            </motion.div>
            <p className="text-lg font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">
                Get Ready...
            </p>
        </motion.div>
    );

    const renderTalking = () => (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="h-full flex flex-col"
        >
            {/* Timer */}
            <div className="px-6 py-4 flex items-center justify-between border-b border-slate-200 dark:border-slate-800">
                <div className="flex items-center gap-3">
                    <Clock size={20} className="text-slate-400" />
                    <span className="text-2xl font-black text-slate-700 dark:text-white">
                        {formatTime(remainingTime)}
                    </span>
                </div>
                <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={endConversation}
                    className="px-4 py-2 bg-red-500 text-white text-xs font-black uppercase rounded-xl hover:bg-red-600 transition-colors"
                >
                    结束对话
                </motion.button>
            </div>

            {/* Visualization Area */}
            <div className="flex-1 flex flex-col items-center justify-center px-6">
                <motion.div
                    animate={{
                        scale: isAISpeaking ? [1, 1.1, 1] : 1,
                        opacity: isAISpeaking ? [0.8, 1, 0.8] : 0.5
                    }}
                    transition={{ duration: 1, repeat: isAISpeaking ? Infinity : 0 }}
                    className={`w-40 h-40 rounded-full ${isAISpeaking ? 'bg-gradient-to-br from-purple-400 to-pink-500' : 'bg-gradient-to-br from-emerald-400 to-cyan-500'
                        } flex items-center justify-center shadow-2xl`}
                >
                    <MessageSquare size={64} className="text-white" />
                </motion.div>

                <motion.p
                    className="mt-8 text-sm font-black uppercase tracking-widest text-slate-500 dark:text-slate-400"
                    animate={{ opacity: [0.5, 1, 0.5] }}
                    transition={{ duration: 2, repeat: Infinity }}
                >
                    {isAISpeaking ? 'AI 正在说话...' : '你的回合...'}
                </motion.p>

                <div className="mt-6 text-center space-y-2">
                    <p className="text-xs font-bold text-slate-400">话题: {selectedTopic.name}</p>
                    <p className="text-xs font-bold text-slate-400">难度: {selectedLevel.name}</p>
                </div>
            </div>
        </motion.div>
    );

    const renderFinished = () => (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6 px-4 pt-4"
        >
            <div className="flex flex-col items-center mb-4">
                <Award size={64} className={`${getColorClass('text', 600)} mb-3`} />
                <h2 className="text-2xl font-black text-slate-900 dark:text-white">对话完成!</h2>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Great conversation!</p>
            </div>

            <div className="bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 p-6 rounded-3xl border border-indigo-200 dark:border-indigo-500/30">
                <div className="flex items-center gap-2 mb-4">
                    <MessageSquare size={18} className="text-indigo-600 dark:text-indigo-400" />
                    <h3 className="text-xs font-black uppercase tracking-widest text-indigo-600 dark:text-indigo-400">练习总结</h3>
                </div>
                <div className="space-y-3 text-sm text-slate-700 dark:text-slate-300">
                    <p><strong>话题：</strong>{selectedTopic.name}</p>
                    <p><strong>难度：</strong>{selectedLevel.name}</p>
                    <p><strong>对话时长：</strong>{formatTime(CONVERSATION_DURATION - remainingTime)}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-4">
                        太棒了！你完成了一次完整的英语对话练习。继续保持，口语能力会越来越好！
                    </p>
                </div>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-4">
                <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={resetSession}
                    className="py-4 rounded-xl border-2 border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-black text-sm uppercase tracking-widest hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                >
                    再来一次
                </motion.button>
                <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => {
                        console.log('Finish button clicked, onClose:', onClose);
                        onClose ? onClose() : resetSession();
                    }}
                    className={`py-4 rounded-xl ${getColorClass('bg', 600)} text-white font-black text-sm uppercase tracking-widest hover:brightness-110 transition-all`}
                >
                    完成
                </motion.button>
            </div>
        </motion.div>
    );

    return (
        <div className="h-full flex flex-col pb-20">
            <AnimatePresence mode="wait">
                {sessionState === 'setup' && <div key="setup">{renderSetup()}</div>}
                {sessionState === 'countdown' && <div key="countdown">{renderCountdown()}</div>}
                {sessionState === 'talking' && <div key="talking">{renderTalking()}</div>}
                {sessionState === 'finished' && <div key="finished">{renderFinished()}</div>}
            </AnimatePresence>
        </div>
    );
};

export default FreeTalking;

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Coffee,
    Plane,
    Briefcase,
    BookOpen,
    Rocket,
    Mic,
    Square,
    Loader,
    Award,
    Clock,
    History,
    ArrowLeft,
    CheckCircle,
    XCircle,
} from 'lucide-react';
import {
    fetchSpeakingQuestions,
    AudioRecorder,
    audioBlobToBase64,
    assessSpeakingWithAI,
    saveAssessment,
    fetchUserAssessments,
} from '../../services/speakingAssessmentService';
import { type SpeakingAssessment, SpeakingQuestion, AssessmentScore } from '../../types';
import { useTheme } from '../../contexts/ThemeContext';

interface SpeakingAssessmentProps {
    userId: string;
    onSuccess: (exp: number) => void;
    onClose?: () => void;
}

type ViewState = 'selection' | 'recording' | 'evaluating' | 'result' | 'history';

const CATEGORY_ICONS: Record<string, React.ReactElement> = {
    'Daily Chat': <Coffee size={24} />,
    Travel: <Plane size={24} />,
    Business: <Briefcase size={24} />,
    Academic: <BookOpen size={24} />,
    Tech: <Rocket size={24} />,
};

const CATEGORY_COLORS: Record<string, string> = {
    'Daily Chat': 'from-amber-400 to-orange-500',
    Travel: 'from-sky-400 to-blue-500',
    Business: 'from-slate-500 to-gray-600',
    Academic: 'from-indigo-400 to-purple-500',
    Tech: 'from-violet-400 to-fuchsia-500',
};

const SpeakingAssessment: React.FC<SpeakingAssessmentProps> = ({
    userId,
    onSuccess,
    onClose,
}) => {
    const { getColorClass, primaryColor } = useTheme();

    // State
    const [viewState, setViewState] = useState<ViewState>('selection');
    const [selectedDifficulty, setSelectedDifficulty] = useState<'初级' | '中级' | '高级' | null>(null);
    const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
    const [questions, setQuestions] = useState<SpeakingQuestion[]>([]);
    const [selectedQuestion, setSelectedQuestion] = useState<SpeakingQuestion | null>(null);
    const [isRecording, setIsRecording] = useState(false);
    const [recordingDuration, setRecordingDuration] = useState(0);
    const [assessmentResult, setAssessmentResult] = useState<AssessmentScore | null>(null);
    const [expAwarded, setExpAwarded] = useState(0);
    const [assessmentHistory, setAssessmentHistory] = useState<SpeakingAssessment[]>([]);
    const [selectedHistoryItem, setSelectedHistoryItem] = useState<SpeakingAssessment | null>(null);

    // Refs
    const audioRecorderRef = useRef<AudioRecorder | null>(null);
    const recordingTimerRef = useRef<NodeJS.Timeout | null>(null);

    // Load questions on mount
    useEffect(() => {
        loadQuestions();
    }, [selectedDifficulty, selectedCategory]);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            if (recordingTimerRef.current) {
                clearInterval(recordingTimerRef.current);
            }
        };
    }, []);

    const loadQuestions = async () => {
        const data = await fetchSpeakingQuestions(
            selectedDifficulty || undefined,
            selectedCategory as any
        );
        setQuestions(data);
    };

    const loadHistory = async () => {
        const history = await fetchUserAssessments(userId);
        setAssessmentHistory(history);
    };

    const startRecording = async () => {
        try {
            if (!audioRecorderRef.current) {
                audioRecorderRef.current = new AudioRecorder();
            }

            await audioRecorderRef.current.startRecording();
            setIsRecording(true);
            setRecordingDuration(0);

            // Start timer
            recordingTimerRef.current = setInterval(() => {
                setRecordingDuration((prev) => prev + 1);
            }, 1000);
        } catch (error: any) {
            alert(error.message || '无法开始录音');
        }
    };

    const stopRecording = async () => {
        try {
            if (!audioRecorderRef.current || !selectedQuestion) return;

            // Stop timer
            if (recordingTimerRef.current) {
                clearInterval(recordingTimerRef.current);
                recordingTimerRef.current = null;
            }

            setIsRecording(false);
            setViewState('evaluating');

            const audioBlob = await audioRecorderRef.current.stopRecording();
            const audioBase64 = await audioBlobToBase64(audioBlob);

            // Call AI assessment
            const result = await assessSpeakingWithAI(audioBase64, selectedQuestion);
            setAssessmentResult(result);

            // Save to database
            const { expAwarded: exp } = await saveAssessment(
                userId,
                selectedQuestion.id,
                result
            );
            setExpAwarded(exp);

            // Call parent success handler
            if (exp > 0) {
                onSuccess(exp);
            }

            setViewState('result');
        } catch (error: any) {
            alert(error.message || '评估失败，请重试');
            setViewState('recording');
        }
    };

    const formatTime = (seconds: number): string => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    const resetToSelection = () => {
        setViewState('selection');
        setSelectedQuestion(null);
        setRecordingDuration(0);
        setAssessmentResult(null);
        setExpAwarded(0);
    };

    // ===== RENDER FUNCTIONS =====

    const renderSelection = () => (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6 px-4 pt-4 pb-20"
        >
            {/* Header */}
            <div className="flex items-center justify-between">
                <h2 className="text-xl font-black text-slate-900 dark:text-white">口语评估</h2>
                <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={async () => {
                        await loadHistory();
                        setViewState('history');
                    }}
                    className="flex items-center gap-2 px-4 py-2 bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl text-sm font-bold"
                >
                    <History size={16} />
                    历史记录
                </motion.button>
            </div>

            {/* Difficulty Filter */}
            <div className="space-y-3">
                <h3 className="text-xs font-black uppercase tracking-widest text-slate-400">
                    选择难度
                </h3>
                <div className="grid grid-cols-3 gap-2">
                    {['初级', '中级', '高级'].map((difficulty) => (
                        <motion.button
                            key={difficulty}
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() =>
                                setSelectedDifficulty(
                                    selectedDifficulty === difficulty ? null : (difficulty as any)
                                )
                            }
                            className={`py-3 rounded-xl border-2 font-bold text-sm transition-all ${selectedDifficulty === difficulty
                                ? `${getColorClass('bg', 500)} text-white border-transparent`
                                : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300'
                                }`}
                        >
                            {difficulty}
                        </motion.button>
                    ))}
                </div>
            </div>

            {/* Category Filter */}
            <div className="space-y-3">
                <h3 className="text-xs font-black uppercase tracking-widest text-slate-400">
                    选择领域
                </h3>
                <div className="grid grid-cols-2 gap-2">
                    {Object.keys(CATEGORY_ICONS).map((category) => (
                        <motion.button
                            key={category}
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() =>
                                setSelectedCategory(selectedCategory === category ? null : category)
                            }
                            className={`p-3 rounded-xl border-2 transition-all ${selectedCategory === category
                                ? `bg-gradient-to-br ${CATEGORY_COLORS[category]} text-white border-white/30`
                                : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300'
                                }`}
                        >
                            <div className="flex items-center gap-2">
                                {CATEGORY_ICONS[category]}
                                <span className="text-sm font-bold">{category}</span>
                            </div>
                        </motion.button>
                    ))}
                </div>
            </div>

            {/* Question List */}
            <div className="space-y-3">
                <h3 className="text-xs font-black uppercase tracking-widest text-slate-400">
                    选择题目 ({questions.length})
                </h3>
                {questions.length === 0 ? (
                    <div className="text-center py-12 text-slate-400">
                        <p className="text-sm">没有找到题目</p>
                    </div>
                ) : (
                    <div className="space-y-2">
                        {questions.map((question) => (
                            <motion.button
                                key={question.id}
                                whileHover={{ scale: 1.01 }}
                                whileTap={{ scale: 0.99 }}
                                onClick={() => {
                                    setSelectedQuestion(question);
                                    setViewState('recording');
                                }}
                                className="w-full p-4 rounded-xl border-2 border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-left hover:border-slate-300 dark:hover:border-slate-700 transition-all"
                            >
                                <div className="flex items-start justify-between gap-3">
                                    <div className="flex-1">
                                        <p className="text-sm font-bold text-slate-900 dark:text-white mb-1">
                                            {question.question_text}
                                        </p>
                                        <div className="flex items-center gap-2 text-xs text-slate-500">
                                            <span className={`px-2 py-1 rounded ${getColorClass('bg', 100)} ${getColorClass('text', 700)}`}>
                                                {question.difficulty}
                                            </span>
                                            <span className="px-2 py-1 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                                                {question.category}
                                            </span>
                                            <Clock size={12} />
                                            <span>{question.expected_duration}秒</span>
                                        </div>
                                    </div>
                                </div>
                            </motion.button>
                        ))}
                    </div>
                )}
            </div>
        </motion.div>
    );

    const renderRecording = () => (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="h-full flex flex-col p-6"
        >
            {/* Back Button */}
            <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={resetToSelection}
                className="self-start flex items-center gap-2 text-slate-600 dark:text-slate-400 mb-6"
            >
                <ArrowLeft size={20} />
                <span className="text-sm font-bold">返回</span>
            </motion.button>

            {/* Question Display */}
            <div className="bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 p-6 rounded-3xl border border-indigo-200 dark:border-indigo-500/30 mb-8">
                <div className="flex items-center gap-2 mb-3">
                    <span className={`px-3 py-1 rounded-lg text-xs font-black ${getColorClass('bg', 500)} text-white`}>
                        {selectedQuestion?.difficulty}
                    </span>
                    <span className="px-3 py-1 rounded-lg text-xs font-black bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
                        {selectedQuestion?.category}
                    </span>
                </div>
                <p className="text-base font-bold text-slate-900 dark:text-white">
                    {selectedQuestion?.question_text}
                </p>
            </div>

            {/* Recording Interface */}
            <div className="flex-1 flex flex-col items-center justify-center">
                <motion.div
                    animate={{
                        scale: isRecording ? [1, 1.1, 1] : 1,
                        opacity: isRecording ? [0.8, 1, 0.8] : 1,
                    }}
                    transition={{ duration: 1, repeat: isRecording ? Infinity : 0 }}
                    className={`w-32 h-32 rounded-full ${isRecording
                        ? 'bg-gradient-to-br from-red-400 to-pink-500'
                        : 'bg-gradient-to-br from-emerald-400 to-cyan-500'
                        } flex items-center justify-center shadow-2xl mb-6`}
                >
                    <Mic size={48} className="text-white" />
                </motion.div>

                {isRecording && (
                    <div className="text-3xl font-black text-slate-900 dark:text-white mb-4">
                        {formatTime(recordingDuration)}
                    </div>
                )}

                <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={isRecording ? stopRecording : startRecording}
                    className={`px-8 py-4 rounded-2xl font-black text-base uppercase tracking-widest shadow-xl ${isRecording
                        ? 'bg-red-500 hover:bg-red-600 text-white'
                        : `${getColorClass('bg', 600)} text-white hover:brightness-110`
                        } transition-all`}
                >
                    {isRecording ? (
                        <div className="flex items-center gap-2">
                            <Square size={20} />
                            停止录音
                        </div>
                    ) : (
                        <div className="flex items-center gap-2">
                            <Mic size={20} />
                            开始录音
                        </div>
                    )}
                </motion.button>

                <p className="text-xs text-slate-500 dark:text-slate-400 mt-4 text-center">
                    建议录音时长：{selectedQuestion?.expected_duration} 秒
                </p>
            </div>
        </motion.div>
    );

    const renderEvaluating = () => (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="h-full flex flex-col items-center justify-center p-6"
        >
            <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
            >
                <Loader size={64} className={`${getColorClass('text', 600)}`} />
            </motion.div>
            <p className="text-lg font-black text-slate-900 dark:text-white mt-6">
                AI 正在评估中...
            </p>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-2">
                请稍候，这可能需要几秒钟
            </p>
        </motion.div>
    );

    const renderResult = () => (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6 px-4 pt-4 pb-20"
        >
            {/* Header */}
            <div className="text-center mb-6">
                <Award size={64} className={`${getColorClass('text', 600)} mx-auto mb-3`} />
                <h2 className="text-2xl font-black text-slate-900 dark:text-white">评估完成!</h2>
            </div>

            {/* Total Score */}
            <div className="bg-gradient-to-br from-yellow-50 to-amber-50 dark:from-yellow-900/20 dark:to-amber-900/20 p-8 rounded-3xl border-2 border-yellow-200 dark:border-yellow-500/30 text-center">
                <p className="text-sm font-bold text-slate-600 dark:text-slate-400 mb-2">总分</p>
                <p className="text-6xl font-black text-slate-900 dark:text-white mb-2">
                    {assessmentResult?.total_score}
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400">满分 100</p>
                {expAwarded > 0 && (
                    <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="mt-4 flex items-center justify-center gap-2 text-emerald-600 dark:text-emerald-400"
                    >
                        <CheckCircle size={20} />
                        <span className="text-sm font-black">获得 {expAwarded} 经验值!</span>
                    </motion.div>
                )}
            </div>

            {/* Detailed Scores */}
            <div className="space-y-3">
                <h3 className="text-xs font-black uppercase tracking-widest text-slate-400">
                    详细评分
                </h3>
                {[
                    { label: '发音准确度', score: assessmentResult?.pronunciation_score },
                    { label: '流畅度', score: assessmentResult?.fluency_score },
                    { label: '词汇使用', score: assessmentResult?.vocabulary_score },
                    { label: '内容丰富度', score: assessmentResult?.content_score },
                    { label: '是否切题', score: assessmentResult?.on_topic_score },
                ].map((item, index) => (
                    <div key={index} className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-bold text-slate-700 dark:text-slate-300">
                                {item.label}
                            </span>
                            <span className="text-lg font-black text-slate-900 dark:text-white">
                                {item.score}
                            </span>
                        </div>
                        <div className="w-full h-2 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                            <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${item.score}%` }}
                                transition={{ duration: 1, delay: index * 0.1 }}
                                className={`h-full ${getColorClass('bg', 500)}`}
                            />
                        </div>
                    </div>
                ))}
            </div>

            {/* Feedback */}
            <div className="bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20 p-6 rounded-3xl border border-blue-200 dark:border-blue-500/30">
                <h3 className="text-xs font-black uppercase tracking-widest text-blue-600 dark:text-blue-400 mb-3">
                    详细反馈
                </h3>
                <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
                    {assessmentResult?.feedback_text}
                </p>
            </div>

            {/* Action Buttons */}
            <div className="grid grid-cols-2 gap-3">
                <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={resetToSelection}
                    className="py-4 rounded-xl border-2 border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-black text-sm uppercase tracking-widest"
                >
                    再来一题
                </motion.button>
                <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => onClose?.()}
                    className={`py-4 rounded-xl ${getColorClass('bg', 600)} text-white font-black text-sm uppercase tracking-widest`}
                >
                    完成
                </motion.button>
            </div>
        </motion.div>
    );

    const renderHistory = () => (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-4 px-4 pt-4 pb-20"
        >
            <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-black text-slate-900 dark:text-white">做题记录</h2>
                <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => {
                        setViewState('selection');
                        setSelectedHistoryItem(null);
                    }}
                    className="text-slate-600 dark:text-slate-400"
                >
                    <ArrowLeft size={20} />
                </motion.button>
            </div>

            {assessmentHistory.length === 0 ? (
                <div className="text-center py-12 text-slate-400">
                    <History size={48} className="mx-auto mb-3 opacity-50" />
                    <p className="text-sm">还没有做题记录</p>
                </div>
            ) : (
                <div className="space-y-3">
                    {assessmentHistory.map((assessment) => (
                        <motion.button
                            key={assessment.id}
                            whileHover={{ scale: 1.01 }}
                            whileTap={{ scale: 0.99 }}
                            onClick={() => setSelectedHistoryItem(assessment)}
                            className="w-full p-4 rounded-xl border-2 border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-left"
                        >
                            <div className="flex items-start justify-between gap-3">
                                <div className="flex-1">
                                    <p className="text-sm font-bold text-slate-900 dark:text-white mb-2">
                                        {assessment.question?.question_text || '题目已删除'}
                                    </p>
                                    <div className="flex items-center gap-2 text-xs text-slate-500">
                                        <span className={`px-2 py-1 rounded ${getColorClass('bg', 100)} ${getColorClass('text', 700)}`}>
                                            {assessment.question?.difficulty}
                                        </span>
                                        <span className="px-2 py-1 rounded bg-slate-100 dark:bg-slate-800">
                                            {new Date(assessment.created_at).toLocaleDateString()}
                                        </span>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className="text-2xl font-black text-slate-900 dark:text-white">
                                        {assessment.total_score}
                                    </p>
                                    <p className="text-xs text-slate-500">分</p>
                                </div>
                            </div>
                        </motion.button>
                    ))}
                </div>
            )}

            {/* History Detail Modal */}
            <AnimatePresence>
                {selectedHistoryItem && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
                        onClick={() => setSelectedHistoryItem(null)}
                    >
                        <motion.div
                            initial={{ scale: 0.9 }}
                            animate={{ scale: 1 }}
                            exit={{ scale: 0.9 }}
                            onClick={(e) => e.stopPropagation()}
                            className="bg-white dark:bg-slate-900 rounded-3xl p-6 max-w-md w-full max-h-[80vh] overflow-y-auto"
                        >
                            <div className="text-center mb-6">
                                <p className="text-4xl font-black text-slate-900 dark:text-white mb-2">
                                    {selectedHistoryItem.total_score}
                                </p>
                                <p className="text-sm text-slate-500">
                                    {new Date(selectedHistoryItem.created_at).toLocaleString()}
                                </p>
                            </div>

                            <div className="space-y-3 mb-6">
                                {[
                                    { label: '发音', score: selectedHistoryItem.pronunciation_score },
                                    { label: '流畅度', score: selectedHistoryItem.fluency_score },
                                    { label: '词汇', score: selectedHistoryItem.vocabulary_score },
                                    { label: '内容', score: selectedHistoryItem.content_score },
                                    { label: '切题', score: selectedHistoryItem.on_topic_score },
                                ].map((item, index) => (
                                    <div key={index} className="flex items-center justify-between">
                                        <span className="text-sm text-slate-600 dark:text-slate-400">
                                            {item.label}
                                        </span>
                                        <span className="text-lg font-bold text-slate-900 dark:text-white">
                                            {item.score}
                                        </span>
                                    </div>
                                ))}
                            </div>

                            <div className="bg-slate-100 dark:bg-slate-800 p-4 rounded-xl mb-6">
                                <p className="text-xs font-bold text-slate-500 mb-2">反馈</p>
                                <p className="text-sm text-slate-700 dark:text-slate-300">
                                    {selectedHistoryItem.feedback_text}
                                </p>
                            </div>

                            <motion.button
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                onClick={() => setSelectedHistoryItem(null)}
                                className={`w-full py-3 rounded-xl ${getColorClass('bg', 600)} text-white font-black text-sm uppercase`}
                            >
                                关闭
                            </motion.button>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );

    return (
        <div className="h-full flex flex-col">
            <AnimatePresence mode="wait">
                {viewState === 'selection' && <div key="selection">{renderSelection()}</div>}
                {viewState === 'recording' && <div key="recording">{renderRecording()}</div>}
                {viewState === 'evaluating' && <div key="evaluating">{renderEvaluating()}</div>}
                {viewState === 'result' && <div key="result">{renderResult()}</div>}
                {viewState === 'history' && <div key="history">{renderHistory()}</div>}
            </AnimatePresence>
        </div>
    );
};

export default SpeakingAssessment;

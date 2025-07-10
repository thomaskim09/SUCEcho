// src/app/components/CreatePostForm.tsx
"use client";

import { useState, useEffect } from "react";
import { useRouter } from 'next/navigation';
import { useFingerprint } from '@/context/FingerprintContext';
import { addMyEcho } from '@/hooks/useMyEchoes';
import { motion, AnimatePresence } from 'framer-motion';
import { useShareModal } from "@/context/ModalContext";
import { Icon } from './Icon';

// Examples for creating a new echo (Main Echo)
const mainEchoPlaceholders = [
    "此刻你想说什么？",
    "那个戴白色耳机的男生，你的侧脸很好看… #暗恋",
    "感觉自己像个被榨干的柠檬，这里有一样的柠檬人吗？ #FYP",
    "谢谢你，撑伞的陌生人… #校园小事",
    "如果人生有回收站，你会删除哪段记忆？ #深夜思考"
];

// Examples for replying to an echo (Child Echo)
const replyEchoPlaceholders = [
    "写下你的回应...",
    "楼主冲啊！别让它成为下一个遗憾…",
    "天啊一模一样！我们不是一个人在战斗…",
    "谢谢你分享这个，感觉整个世界都亮了一点…",
    "加油，你可以的…"
];

// Examples for replying to another reply
const threadedReplyPlaceholders = [
    "加入这场对话...",
    "我同意你的看法！",
    "让讨论继续！",
    "说得好，补充一点...",
    "原来不止我一个人这么想。"
];

// Examples for creating a poll
const pollPlaceholders = [
    "发起一个投票，看看大家怎么想...",
    "食堂的鸡饭和Mamak的Maggi Goreng，哪个是你的最爱？",
    "你通常在哪个地方自习？",
    "新学期的选课，你最期待哪一门？",
    "心目中的社团干部人选是哪位？"
];

// Animated loading dots component
function LoadingDots() {
    const [dotCount, setDotCount] = useState(0);
    useEffect(() => {
        const interval = setInterval(() => {
            setDotCount((prev) => (prev + 1) % 4);
        }, 400);
        return () => clearInterval(interval);
    }, []);
    return <span>{'.'.repeat(dotCount)}</span>;
}

interface CreatePostFormProps {
    parentPostId?: number;
    parentReplyId?: number;
}


export default function CreatePostForm({ parentPostId, parentReplyId }: CreatePostFormProps) {
    const [content, setContent] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isSent, setIsSent] = useState(false);
    const { fingerprint, isLoading: isFingerprintLoading } = useFingerprint();
    const router = useRouter();
    const { triggerShareModal } = useShareModal();
    const charLimit = typeof process !== 'undefined' && process.env.NEXT_PUBLIC_POST_CHAR_LIMIT
        ? parseInt(process.env.NEXT_PUBLIC_POST_CHAR_LIMIT, 10)
        : 400;

    const [isPoll, setIsPoll] = useState(false);
    const [pollOptions, setPollOptions] = useState(['', '']);
    const [pollError, setPollError] = useState<string | null>(null);

    const placeholderExamples = isPoll
        ? pollPlaceholders
        : parentReplyId
            ? threadedReplyPlaceholders
            : parentPostId
                ? replyEchoPlaceholders
                : mainEchoPlaceholders;

    const [placeholderIndex, setPlaceholderIndex] = useState(0);

    useEffect(() => {
        const interval = setInterval(() => {
            setPlaceholderIndex(prevIndex => (prevIndex + 1) % placeholderExamples.length);
        }, 4000);

        return () => clearInterval(interval);
    }, [placeholderExamples.length]);

    const handlePollOptionChange = (index: number, value: string) => {
        const newOptions = [...pollOptions];
        newOptions[index] = value;
        setPollOptions(newOptions);
    };

    const addPollOption = () => {
        if (pollOptions.length < 5) {
            setPollOptions([...pollOptions, '']);
        } else {
            setPollError("最多只能添加5个投票选项。");
            setTimeout(() => setPollError(null), 3000);
        }
    };

    const removePollOption = (index: number) => {
        if (pollOptions.length > 2) {
            const newOptions = pollOptions.filter((_, i) => i !== index);
            setPollOptions(newOptions);
        } else {
            setPollError("至少需要2个投票选项。");
            setTimeout(() => setPollError(null), 3000);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (isFingerprintLoading || !fingerprint) {
            setError("指纹尚未准备好，请稍后再试。");
            return;
        }

        if (isPoll && !parentPostId) {
            const filledOptions = pollOptions.filter(opt => opt.trim() !== '');
            if (filledOptions.length < 2) {
                setError("投票至少需要2个有效选项。");
                return;
            }
        }

        setIsSubmitting(true);
        setError(null);

        try {
            const response = await fetch('/api/posts', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    content,
                    fingerprintHash: fingerprint,
                    parentPostId: parentPostId,
                    parentReplyId: parentReplyId,
                    type: isPoll && !parentPostId ? 'POLL' : 'DEFAULT',
                    pollOptions: isPoll && !parentPostId ? pollOptions.filter(opt => opt.trim()) : undefined,
                }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || "发布失败");
            }

            const newPost = await response.json();
            if (newPost && newPost.id) {
                addMyEcho(newPost);
            }

            triggerShareModal();
            setIsSent(true);
            setTimeout(() => {
                if (parentPostId) {
                    router.replace(`/post/${parentPostId}`);
                } else {
                    router.push('/');
                }
            }, 600);

        } catch (err: unknown) {
            if (err instanceof Error) {
                setError(err.message);
            } else {
                setError('发生未知错误');
            }
            setIsSubmitting(false);
        }
    };

    return (
        <AnimatePresence>
            {!isSent && (
                <motion.div
                    className="p-4 rounded-lg relative"
                    style={{ backgroundColor: 'var(--card-background)' }}
                    initial={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{
                        y: [0, 20, -250],
                        opacity: [1, 1, 0],
                        scale: [1, 0.98, 0.8],
                    }}
                    transition={{
                        duration: 0.6,
                        ease: "easeInOut",
                        times: [0, 0.4, 1]
                    }}
                >
                    <form onSubmit={handleSubmit} className="relative">
                        {content.length === 0 && (
                            <div className="absolute top-0 left-0 p-2 text-gray-500 pointer-events-none">
                                <AnimatePresence mode="wait">
                                    <motion.p
                                        key={placeholderIndex}
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        exit={{ opacity: 0 }}
                                        transition={{ duration: 0.5 }}
                                    >
                                        {placeholderExamples[placeholderIndex]}
                                    </motion.p>
                                </AnimatePresence>
                            </div>
                        )}
                        <textarea
                            value={content}
                            onChange={(e) => setContent(e.target.value)}
                            className="w-full bg-transparent border-b border-gray-600 focus:outline-none focus:border-accent p-2 relative z-10"
                            rows={5}
                            maxLength={charLimit}
                            autoFocus
                            disabled={isSubmitting}
                        />
                        <AnimatePresence>
                            {isPoll && !parentPostId && (
                                <motion.div
                                    className="mt-4 space-y-2"
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: 'auto' }}
                                    exit={{ opacity: 0, height: 0 }}
                                    transition={{ duration: 0.4, ease: "easeInOut" }}
                                >
                                    <h3 className="font-bold text-gray-300">投票选项</h3>
                                    <AnimatePresence>
                                        {pollOptions.map((option, index) => (
                                            <motion.div
                                                key={index}
                                                className="flex items-center gap-2"
                                                initial={{ opacity: 0, y: -10 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                exit={{ opacity: 0, x: -20 }}
                                                transition={{ duration: 0.3 }}
                                                layout
                                            >
                                                <input
                                                    type="text"
                                                    value={option}
                                                    onChange={(e) => handlePollOptionChange(index, e.target.value)}
                                                    placeholder={`选项 ${index + 1}`}
                                                    className="w-full bg-gray-800 border border-gray-600 rounded-lg p-2 focus:outline-none focus:border-accent"
                                                    maxLength={50}
                                                    required
                                                />
                                                {pollOptions.length > 2 && (
                                                    <button type="button" onClick={() => removePollOption(index)} className="p-2 text-gray-400 hover:text-red-500 transition-colors">
                                                        <Icon name="plus" className="w-6 h-6 transform rotate-45" />
                                                    </button>
                                                )}
                                            </motion.div>
                                        ))}
                                    </AnimatePresence>
                                    {pollOptions.length < 5 && (
                                        <button type="button" onClick={addPollOption} className="text-accent hover:underline mt-2 text-sm font-semibold">
                                            + 添加选项
                                        </button>
                                    )}
                                    {pollError && <p className="text-red-500 text-sm mt-1">{pollError}</p>}
                                </motion.div>
                            )}
                        </AnimatePresence>

                        <div className="flex justify-between items-center mt-3">
                            <span className="text-sm text-gray-400 font-mono">
                                {charLimit - content.length}
                            </span>
                            <div className="flex items-center gap-4">
                                {!parentPostId && (
                                    <label className="flex items-center gap-2 cursor-pointer group select-none">
                                        <input
                                            type="checkbox"
                                            checked={isPoll}
                                            onChange={() => setIsPoll(!isPoll)}
                                            className="sr-only peer"
                                            aria-checked={isPoll}
                                        />
                                        <span
                                            className={`
                                                w-5 h-5 rounded border-2 flex items-center justify-center
                                                transition-colors duration-200
                                                ${isPoll ? '' : 'border-gray-600 bg-gray-800'}
                                                peer-focus:ring-2 peer-focus:ring-[var(--accent)]
                                                group-hover:border-[var(--accent)]
                                            `}
                                            style={isPoll ? { borderColor: 'var(--accent)', backgroundColor: 'var(--accent)' } : {}}
                                        >
                                            {isPoll && (
                                                <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                                </svg>
                                            )}
                                        </span>
                                        <span
                                            className={`
                                                transition-colors duration-200
                                                ${isPoll ? '' : 'text-gray-400'}
                                                group-hover:text-[var(--accent)]
                                            `}
                                            style={isPoll ? { color: 'var(--accent)' } : {}}
                                        >
                                            投票
                                        </span>
                                    </label>
                                )}
                                <button
                                    type="submit"
                                    className="bg-accent text-white font-bold py-2 px-4 rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50"
                                    disabled={!content.trim() || isSubmitting || isFingerprintLoading || !fingerprint || (isPoll && !parentPostId && pollOptions.filter(opt => opt.trim()).length < 2)}
                                >
                                    {parentPostId ? "发布回应" : "发布回音"}
                                </button>
                            </div>
                        </div>
                        {error && <p className="text-red-500 mt-2">{error}</p>}
                        {isFingerprintLoading && !error && <p className="text-gray-400 mt-2">初始化中...</p>}
                        {isSubmitting && (
                            <motion.div
                                className="absolute inset-0 z-40 flex items-center justify-center bg-black/40 backdrop-blur-sm rounded-lg pointer-events-auto"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                transition={{ duration: 0.2 }}
                            >
                                <span className="text-lg font-bold text-white select-none" style={{ letterSpacing: '0.1em' }}>
                                    发送中<LoadingDots />
                                </span>
                            </motion.div>
                        )}
                    </form>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
// sucecho/src/app/components/CreatePostForm.tsx
"use client";

import { useState, useEffect } from "react";
import { useRouter } from 'next/navigation';
import { useFingerprint } from '@/context/FingerprintContext';
import { addMyEcho } from '@/hooks/useMyEchoes';
import { motion, AnimatePresence } from 'motion/react';

// Examples for creating a new echo (Main Echo)
const mainEchoPlaceholders = [
    "此刻你想说什么？",
    "那个戴白色耳机的男生，你的侧脸很好看… #暗恋",
    "感觉自己像个被榨干的柠檬，这里有一样的“柠檬人”吗？ #FYP",
    "谢谢你，撑伞的陌生人… #校园小事",
    "如果人生有回收站，你会删除哪段记忆？ #深夜思考"
];

// Examples for replying to an echo (Child Echo)
const replyEchoPlaceholders = [
    "写下你的回应...",
    "楼主冲啊！别让它成为下一个遗憾…",
    "天啊一模一样！我们不是一个人在战斗…",
    "谢谢你分享这个，感觉整个世界都亮了一点…",
    "我不会删除。抽掉任何一块，整个“我”可能都会崩塌…"
];

interface CreatePostFormProps {
    parentPostId?: number;
}

export default function CreatePostForm({ parentPostId }: CreatePostFormProps) {
    const [content, setContent] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isSent, setIsSent] = useState(false);
    const { fingerprint, isLoading: isFingerprintLoading } = useFingerprint();
    const router = useRouter();
    const charLimit = 400;

    const placeholderExamples = parentPostId ? replyEchoPlaceholders : mainEchoPlaceholders;
    const [placeholderIndex, setPlaceholderIndex] = useState(0);

    useEffect(() => {
        const interval = setInterval(() => {
            setPlaceholderIndex(prevIndex => (prevIndex + 1) % placeholderExamples.length);
        }, 4000);

        return () => clearInterval(interval);
    }, [placeholderExamples.length]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (isFingerprintLoading || !fingerprint) {
            setError("指纹尚未准备好，请稍后再试。");
            return;
        }

        setIsSubmitting(true);
        setError(null);

        try {
            const response = await fetch('/api/posts', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ content, fingerprintHash: fingerprint, parentPostId: parentPostId }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || "发布失败");
            }

            const newPost = await response.json();
            if (newPost && newPost.id) {
                addMyEcho(newPost.id);
            }

            setIsSent(true);

            setTimeout(() => {
                router.push(parentPostId ? `/post/${parentPostId}` : '/');
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
                        y: [0, 20, -250],      // Keyframes: Start -> Pull Down -> Eject Up
                        opacity: [1, 1, 0],     // Keyframes: Opaque -> Opaque -> Fade Out
                        scale: [1, 0.98, 0.8],  // Keyframes: Full size -> Slightly squish -> Shrink
                    }}
                    transition={{
                        duration: 0.6,
                        ease: "easeInOut",
                        times: [0, 0.4, 1] // Defines the timing for each keyframe
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
                        />
                        <div className="flex justify-between items-center mt-3">
                            <span className="text-sm text-gray-400 font-mono">
                                还可输入 {charLimit - content.length} 字
                            </span>
                            <button
                                type="submit"
                                className="bg-accent text-white font-bold py-2 px-4 rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50"
                                disabled={!content.trim() || isSubmitting || isFingerprintLoading || !fingerprint}
                            >
                                {isSubmitting ? "发送中..." : (parentPostId ? "发布回应" : "发布回音")}
                            </button>
                        </div>
                        {error && <p className="text-red-500 mt-2">{error}</p>}
                        {isFingerprintLoading && !error && <p className="text-gray-400 mt-2">初始化中...</p>}
                    </form>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
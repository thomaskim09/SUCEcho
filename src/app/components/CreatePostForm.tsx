// src/app/components/CreatePostForm.tsx
"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from 'next/navigation';
import { useFingerprint } from '@/context/FingerprintContext';
import { motion, AnimatePresence } from 'framer-motion';
import { useShareModal } from "@/context/ModalContext";
import { Icon } from './Icon';

const mainEchoPlaceholders = [
    "此刻你想说什么？",
    "那个戴白色耳机的男生，你的侧脸很好看… #暗恋",
    "感觉自己像个被榨干的柠檬，这里有一样的柠檬人吗？ #FYP",
    "谢谢你，撑伞的陌生人… #校园小事",
    "如果人生有回收站，你会删除哪段记忆？ #深夜思考"
];

const replyEchoPlaceholders = [
    "写下你的回应...",
    "楼主冲啊！别让它成为下一个遗憾…",
    "天啊一模一样！我们不是一个人在战斗…",
    "谢谢你分享这个，感觉整个世界都亮了一点…",
    "加油，你可以的…"
];

const threadedReplyPlaceholders = [
    "加入这场对话...",
    "我同意你的看法！",
    "让讨论继续！",
    "说得好，补充一点...",
    "原来不止我一个人这么想。"
];

const pollPlaceholders = [
    "发起一个投票，看看大家怎么想...",
    "食堂的鸡饭和Mamak的Maggi Goreng，哪个是你的最爱？",
    "你通常在哪个地方自习？",
    "新学期的选课，你最期待哪一门？",
    "心目中的社团干部人选是哪位？"
];

const linkPlaceholders = [
    "分享一个链接，并写下你的看法...",
    "这个问卷调查很重要，希望大家帮忙填写！",
    "这是最新的歌唱比赛，大家一起踊跃报名！",
    "大家这次的活动还开心吗，有什么想告诉我们的可以在这...",
    "这个新闻说的是真的吗，我是在小红书看到的，你们看看..."
];

const jobPlaceholders = [
    "发布一个职位或实习机会...",
    "我们的社团正在招新！需要一位有创意的设计师。",
    "寻找一位校园代理，时间灵活，待遇从优。",
    "毕业设计项目急需一位会剪辑的伙伴！",
    "咖啡厅招聘兼职，有兴趣的同学请联系！"
];

const jobReplyPlaceholders = [
    "询问或分享职位详情...",
    "据我所知，这个工作待遇挺好的，福利也到位。",
    "其实关于这个工作，有个秘辛想和大家说说，能帮助大家少走弯路。",
    "我之前和这个团队合作过，他们的工作氛围真的很不错，注重员工成长。",
    "想分享一下，这个职位对个人能力的提升很有帮助，有很多学习机会。",
    "关于公司的内部情况，我听说晋升通道比较清晰，努力会有回报。"
];

const permanentPlaceholders = [
    "写下一些希望被永远记住的话...",
    "致2025届的毕业生们，愿你们前程似锦！",
    "这首歌，是我们那年夏天共同的回忆。",
    "记录下南院的这个角落，希望它永远都在。",
    "给未来的自己留一段话吧！"
];

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
    feedType?: 'EPHEMERAL' | 'JOB' | 'PERMANENT' | null;
    isPermanent: boolean;
}

const whitelistedDomains = (process.env.NEXT_PUBLIC_WHITELISTED_DOMAINS || '').split(',').map(d => d.trim().toLowerCase());
const linkExamples = whitelistedDomains.map(domain => `e.g., https://${domain}/...`);

export default function CreatePostForm({ parentPostId, parentReplyId, feedType, isPermanent }: CreatePostFormProps) {
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

    const [isUrl, setIsUrl] = useState(false);
    const [url, setUrl] = useState("");
    const [urlError, setUrlError] = useState<string | null>(null);

    const urlRegex = /(https?:\/\/[^\s]+)/g;

    const placeholderExamples = isUrl
        ? linkPlaceholders
        : isPoll
            ? pollPlaceholders
            : feedType === 'JOB' && parentPostId
                ? jobReplyPlaceholders
                : feedType === 'JOB'
                    ? jobPlaceholders
                    : feedType === 'PERMANENT'
                        ? permanentPlaceholders
                        : parentReplyId
                            ? threadedReplyPlaceholders
                            : parentPostId
                                ? replyEchoPlaceholders
                                : mainEchoPlaceholders;


    const [placeholderIndex, setPlaceholderIndex] = useState(0);
    const [linkPlaceholderIndex, setLinkPlaceholderIndex] = useState(0);


    useEffect(() => {
        const interval = setInterval(() => {
            setPlaceholderIndex(prevIndex => (prevIndex + 1) % placeholderExamples.length);
        }, 4000);

        return () => clearInterval(interval);
    }, [placeholderExamples.length]);

    useEffect(() => {
        const interval = setInterval(() => {
            setLinkPlaceholderIndex(prevIndex => (prevIndex + 1) % linkExamples.length);
        }, 4000);
        return () => clearInterval(interval);
    }, [linkExamples.length]);

    useEffect(() => {
        const foundUrls = content.match(urlRegex);
        if (foundUrls && foundUrls.length > 0) {
            const firstUrl = foundUrls[0];
            setUrl(firstUrl);
            setIsUrl(true);
            setContent(content.replace(urlRegex, '').trim());
        }
    }, [content, urlRegex]);

    const handleUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newUrl = e.target.value;
        setUrl(newUrl);

        if (!newUrl.trim()) {
            setUrlError(null);
            return;
        }

        if (newUrl.startsWith('mailto:')) {
            setUrlError(null);
            return;
        }

        try {
            const urlObj = new URL(newUrl);
            const domain = urlObj.hostname.replace(/^www\./, '').toLowerCase();
            if (!whitelistedDomains.includes(domain)) {
                setUrlError(`域名 ${urlObj.hostname} 不被允许。`);
            } else {
                setUrlError(null);
            }
        } catch {
            setUrlError("无效的链接格式。");
        }
    };

    const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        const text = e.target.value;

        if (isUrl) {
            setContent(text);
            return;
        }

        const foundUrls = text.match(urlRegex);
        if (foundUrls && foundUrls.length > 0) {
            const firstUrl = foundUrls[0];
            try {
                const urlObj = new URL(firstUrl);
                const domain = urlObj.hostname.replace(/^www\./, '').toLowerCase();
                if (whitelistedDomains.includes(domain)) {
                    setUrl(firstUrl);
                    setIsUrl(true);
                    setContent(text.replace(urlRegex, '').trim());
                    setUrlError(null);
                    return;
                }
            } catch {
                // Not a valid URL, treat as normal text
            }
        }
        setContent(text);
    };

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

        if (isUrl && (url.trim().length === 0 || urlError)) {
            setError("请提供一个有效的、允许的链接。");
            return;
        }

        setIsSubmitting(true);
        setError(null);

        try {
            const finalFeedType = feedType || (isPermanent ? 'PERMANENT' : 'EPHEMERAL');

            const response = await fetch('/api/posts', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    content,
                    fingerprintHash: fingerprint,
                    parentPostId: parentPostId,
                    parentReplyId: parentReplyId,
                    contentType: isUrl ? 'LINK' : isPoll ? 'POLL' : 'TEXT',
                    feed: finalFeedType,
                    url: isUrl ? url : undefined,
                    pollOptions: isPoll && !parentPostId ? pollOptions.filter(opt => opt.trim()) : undefined,
                }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || "发布失败");
            }

            triggerShareModal();
            setIsSent(true);
            setTimeout(() => {
                if (parentPostId) {
                    router.replace(`/post/${parentPostId}?feedType=${feedType}`);
                } else if (feedType === 'JOB') {
                    router.push('/jobs');
                } else if (feedType === 'PERMANENT' || isPermanent) {
                    router.push('/permanent');
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
                    className="p-4 rounded-lg relative transition-colors duration-500"
                    style={{
                        background: 'var(--card-background)'
                    }}
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
                            onChange={handleContentChange}
                            className="w-full bg-transparent border-b border-gray-600 focus:outline-none focus:border-accent p-2 relative z-10"
                            rows={5}
                            maxLength={charLimit}
                            autoFocus
                            disabled={isSubmitting}
                        />

                        <AnimatePresence>
                            {isUrl && !parentPostId && (
                                <motion.div
                                    className="mt-4 space-y-2"
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: 'auto' }}
                                    exit={{ opacity: 0, height: 0 }}
                                    transition={{ duration: 0.4, ease: "easeInOut" }}
                                >
                                    <h3 className="font-bold text-gray-300">分享链接</h3>
                                    <div className="relative">
                                        <input
                                            type="text"
                                            value={url}
                                            onChange={handleUrlChange}
                                            className={`w-full bg-gray-800 border rounded-lg p-2 focus:outline-none transition-colors ${urlError ? 'border-red-500' : 'border-gray-600 focus:border-accent'}`}
                                            required
                                        />
                                        {url.length === 0 && (
                                            <div className="absolute top-0 left-0 p-2 text-gray-500 pointer-events-none">
                                                <AnimatePresence mode="wait">
                                                    <motion.p
                                                        key={linkPlaceholderIndex}
                                                        initial={{ opacity: 0 }}
                                                        animate={{ opacity: 1 }}
                                                        exit={{ opacity: 0 }}
                                                        transition={{ duration: 0.5 }}
                                                    >
                                                        {linkExamples[linkPlaceholderIndex]}
                                                    </motion.p>
                                                </AnimatePresence>
                                            </div>
                                        )}
                                    </div>
                                    {urlError && <p className="text-red-500 text-sm mt-1">{urlError}</p>}
                                </motion.div>
                            )}
                        </AnimatePresence>
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
                                            checked={isUrl}
                                            onChange={() => { setIsUrl(!isUrl); if (isUrl) setUrl(""); if (!isUrl) setIsPoll(false); }}
                                            className="sr-only peer"
                                            aria-checked={isUrl}
                                        />
                                        <span className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors duration-200 ${isUrl ? 'border-accent bg-accent' : 'border-gray-600 bg-gray-800'} peer-focus:ring-2 peer-focus:ring-accent group-hover:border-accent`}>
                                            {isUrl && <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>}
                                        </span>
                                        <span className={`transition-colors duration-200 ${isUrl ? 'text-accent' : 'text-gray-400'} group-hover:text-accent`}>
                                            链接
                                        </span>
                                    </label>
                                )}
                                {!parentPostId && (
                                    <label className="flex items-center gap-2 cursor-pointer group select-none">
                                        <input
                                            type="checkbox"
                                            checked={isPoll}
                                            onChange={() => { setIsPoll(!isPoll); if (!isPoll) setIsUrl(false); }}
                                            className="sr-only peer"
                                            aria-checked={isPoll}
                                        />
                                        <span className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors duration-200 ${isPoll ? 'border-accent bg-accent' : 'border-gray-600 bg-gray-800'} peer-focus:ring-2 peer-focus:ring-accent group-hover:border-accent`}>
                                            {isPoll && <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>}
                                        </span>
                                        <span className={`transition-colors duration-200 ${isPoll ? 'text-accent' : 'text-gray-400'} group-hover:text-accent`}>
                                            投票
                                        </span>
                                    </label>
                                )}
                                <button
                                    type="submit"
                                    className="bg-accent text-white font-bold py-2 px-4 rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50"
                                    disabled={!fingerprint || isSubmitting || isFingerprintLoading || (isUrl && (!url.trim() || !!urlError)) || (!isUrl && !content.trim() && !isPoll) || (isPoll && pollOptions.filter(opt => opt.trim()).length < 2)}
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
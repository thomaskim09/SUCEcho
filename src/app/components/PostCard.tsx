// sucecho/src/app/components/PostCard.tsx
"use client";

import type { PostWithStats } from "@/lib/types";
import { motion, AnimatePresence } from 'motion/react';
import { useRouter } from 'next/navigation';
import { useFingerprint } from '@/context/FingerprintContext';
import { useAdmin } from '@/context/AdminContext';
import { generateCodename } from '@/lib/codename';
import { useState, useEffect, useRef, MouseEvent, useLayoutEffect } from 'react';
import { Icon } from './Icon';
import { checkPurificationStatus } from "@/lib/purification";
import { timeSince } from "@/lib/time-helpers";
import { useCountdown } from '@/hooks/useCountdown';
import Tooltip from './Tooltip';
import { addPurifiedPostId } from "@/lib/purifiedStore";

interface PostCardProps {
    post: PostWithStats;
    isLink?: boolean;
    onVote: (postId: number, voteType: 1 | -1) => void;
    onDelete?: (postId: number) => void;
    onReport?: (postId: number) => void;
    userVote?: 1 | -1;
    isPurifying?: boolean;
    onFaded?: (postId: number) => void;
    onPurificationComplete?: (postId: number) => void;
    onDeletionComplete?: (postId: number) => void;
    onAutoPurify: (postId: number) => void;
    onCommentNavigate?: (parentPostId: number) => void;
    parentFingerprintHash?: string;
}

interface Ripple {
    key: number;
    x: number;
    y: number;
    size: number;
}

const renderContentWithLinks = (content: string) => {
    const urlRegex = /(\b(https?|ftp|file):\/\/[-A-Z0-9+&@#\/%?=~_|!:,.;]*[-A-Z0-9+&@#\/%=~_|])/ig;
    const parts = content.split(urlRegex);

    return parts.map((part, index) => {
        if (!part) return null;
        if (part.match(urlRegex)) {
            return (
                <a
                    key={index}
                    href={part}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-accent hover:underline"
                    onClick={(e) => e.stopPropagation()}
                >
                    {part}
                </a>
            );
        }
        return part;
    });
};

export default function PostCard({ post, isLink = true, onVote, onDelete, onReport, userVote, isPurifying = false, onPurificationComplete, onDeletionComplete, onFaded, onAutoPurify, onCommentNavigate, parentFingerprintHash }: PostCardProps) {
    const { fingerprint, isLoading: isFingerprintLoading } = useFingerprint();
    const { isAdmin, isVerifying } = useAdmin();
    const router = useRouter();
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [showUpvoteTooltip, setShowUpvoteTooltip] = useState(false);
    const [showDownvoteTooltip, setShowDownvoteTooltip] = useState(false);
    const [ripples, setRipples] = useState<Ripple[]>([]);
    const cardRef = useRef<HTMLDivElement>(null);
    const upvoteTooltipTimer = useRef<NodeJS.Timeout | null>(null);
    const downvoteTooltipTimer = useRef<NodeJS.Timeout | null>(null);
    const [isOverflowing, setIsOverflowing] = useState(false);
    const contentRef = useRef<HTMLDivElement>(null);
    const [shouldPurifyVanish, setShouldPurifyVanish] = useState(false);
    const [isGlitching, setIsGlitching] = useState(false);
    const [isCharging, setIsCharging] = useState(false);
    const [isPurifyGlow, setIsPurifyGlow] = useState(false);
    const isChildEcho = !!post.parentPostId;
    const { countdownText, colorClass, isExpired, isVanishing, isCritical } = useCountdown(new Date(post.createdAt));
    const isAnnouncement = post.type === 'ANNOUNCEMENT';
    const [isEnlarged, setIsEnlarged] = useState(false);
    const [isReplyExpanded, setIsReplyExpanded] = useState(false);
    const [isReplyOverflowing, setIsReplyOverflowing] = useState(false);
    const twentyFourHoursInMs = 24 * 60 * 60 * 1000;
    const fifteenMinutesInMs = 15 * 60 * 1000;
    const postAgeInMs = new Date().getTime() - new Date(post.createdAt).getTime();
    const timeRemainingInMs = twentyFourHoursInMs - postAgeInMs;
    const showCountdownForReply = isChildEcho && timeRemainingInMs <= fifteenMinutesInMs;
    const isOwner = isChildEcho && parentFingerprintHash && post.fingerprintHash === parentFingerprintHash;

    const cardVariants = {
        visible: { opacity: 1, scale: 1, filter: 'blur(0px)', transition: { duration: 0.5 } },
        enlarged: { scale: 1.05, transition: { duration: 0.18 } },
        deleting: { opacity: 0, scale: 0.8, transition: { duration: 0.4 } },
        purifyVanish: { opacity: 0, scale: 1.5, filter: 'blur(10px)', transition: { duration: 1.5, ease: "easeOut" as const } },
        glitching: { opacity: 0, scale: 0.8, filter: 'blur(20px)', transition: { duration: 1.0, ease: "easeOut" as const } }
    };

    const getAnimationState = (): keyof typeof cardVariants => {
        if (isEnlarged) return 'enlarged';
        if (post.isDeleting) return 'deleting';
        if (shouldPurifyVanish) return 'purifyVanish';
        if (isVanishing || isGlitching) return 'glitching';
        return 'visible';
    };

    useEffect(() => {
        let vanishTimeout: NodeJS.Timeout | null = null;
        let textTimeout: NodeJS.Timeout | null = null;
        if (isPurifying) {
            setIsPurifyGlow(true);
            textTimeout = setTimeout(() => {
                setIsPurifyGlow(false);
                setShouldPurifyVanish(true);
                vanishTimeout = setTimeout(() => {
                }, 1500);
            }, 3000);
        } else {
            setIsPurifyGlow(false);
            setShouldPurifyVanish(false);
        }
        return () => {
            if (textTimeout) clearTimeout(textTimeout);
            if (vanishTimeout) clearTimeout(vanishTimeout);
        };
    }, [isPurifying]);

    useEffect(() => {
        if (isExpired) {
            setIsCharging(true);
            const chargeTimer = setTimeout(() => {
                setIsGlitching(true);
            }, 3000);
            return () => clearTimeout(chargeTimer);
        }
    }, [isExpired]);

    useLayoutEffect(() => {
        const checkOverflow = () => {
            if (contentRef.current) {
                const maxHeight = 125;
                setIsOverflowing(contentRef.current.scrollHeight > maxHeight);
                if (isChildEcho) {
                    setIsReplyOverflowing(contentRef.current.scrollHeight > maxHeight);
                }
            }
        };
        checkOverflow();
        window.addEventListener('resize', checkOverflow);
        return () => window.removeEventListener('resize', checkOverflow);
    }, [post.content, isChildEcho]);

    useEffect(() => {
        return () => {
            if (upvoteTooltipTimer.current) clearTimeout(upvoteTooltipTimer.current);
            if (downvoteTooltipTimer.current) clearTimeout(downvoteTooltipTimer.current);
        };
    }, []);

    const handleVote = (e: React.MouseEvent, voteType: 1 | -1) => {
        e.stopPropagation();
        e.preventDefault();
        if (isFingerprintLoading || !fingerprint) {
            alert("我们正在努力识别你的设备，请稍后再试。");
            return;
        }

        if (voteType === 1) {
            const hasSeenUpvoteTip = localStorage.getItem('hasSeenUpvoteTip');
            if (hasSeenUpvoteTip !== 'true') {
                if (upvoteTooltipTimer.current) clearTimeout(upvoteTooltipTimer.current);
                setShowUpvoteTooltip(true);
                localStorage.setItem('hasSeenUpvoteTip', 'true');
                upvoteTooltipTimer.current = setTimeout(() => setShowUpvoteTooltip(false), 5000);
            }
        } else if (voteType === -1) {
            const hasSeenDownvoteTip = localStorage.getItem('hasSeenDownvoteTip');
            if (hasSeenDownvoteTip !== 'true') {
                if (downvoteTooltipTimer.current) clearTimeout(downvoteTooltipTimer.current);
                setShowDownvoteTooltip(true);
                localStorage.setItem('hasSeenDownvoteTip', 'true');
                downvoteTooltipTimer.current = setTimeout(() => setShowDownvoteTooltip(false), 5000);
            }
        }
        onVote(post.id, voteType);
    };

    const handleCommentClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        e.preventDefault();
        if (onCommentNavigate) {
            onCommentNavigate(post.id);
        } else {
            router.push(`/compose?parentPostId=${post.id}`);
        }
    };

    const closeUpvoteTooltip = () => { if (upvoteTooltipTimer.current) clearTimeout(upvoteTooltipTimer.current); setShowUpvoteTooltip(false); };
    const closeDownvoteTooltip = () => { if (downvoteTooltipTimer.current) clearTimeout(downvoteTooltipTimer.current); setShowDownvoteTooltip(false); };
    const handleDelete = (e: React.MouseEvent) => { e.stopPropagation(); e.preventDefault(); if (onDelete) onDelete(post.id); setIsMenuOpen(false); };
    const handleToggleMenu = (e: React.MouseEvent) => { e.stopPropagation(); e.preventDefault(); setIsMenuOpen(!isMenuOpen); };
    const handleViewProfile = (e: React.MouseEvent) => { e.stopPropagation(); e.preventDefault(); router.push(`/admin/users/${post.fingerprintHash}`); setIsMenuOpen(false); };
    const handleShowDetails = (e: React.MouseEvent) => { e.stopPropagation(); e.preventDefault(); alert(`帖子ID: ${post.id}\n指纹哈希: ${post.fingerprintHash}`); setIsMenuOpen(false); };
    const handleReportClick = (e: React.MouseEvent) => { e.stopPropagation(); e.preventDefault(); if (onReport) { onReport(post.id); } setIsMenuOpen(false); };
    const handleCardClick = (e: MouseEvent<HTMLDivElement>) => {
        if (!isLink || isChildEcho) return;
        const card = cardRef.current;
        if (card) {
            const rect = card.getBoundingClientRect();
            const size = Math.max(rect.width, rect.height);
            const x = e.clientX - rect.left - size / 2;
            const y = e.clientY - rect.top - size / 2;
            const newRipple: Ripple = { key: Date.now(), x, y, size };
            setRipples(prev => [...prev, newRipple]);
        }
        setIsEnlarged(true);
        setTimeout(() => setIsEnlarged(false), 180);
        setTimeout(() => router.push(`/post/${post.id}`), 180);
    };

    const { showMeter: showPurificationMeter, meterFillPercentage, shouldPurify } = checkPurificationStatus({
        upvotes: post.stats?.upvotes ?? 0,
        downvotes: post.stats?.downvotes ?? 0,
    });

    useEffect(() => {
        if (shouldPurify && !isPurifying) {
            addPurifiedPostId(post.id);
            onAutoPurify(post.id);
        }
    }, [shouldPurify, isPurifying, post.id, onAutoPurify]);

    const upvoteIsActive = userVote === 1;
    const downvoteIsActive = userVote === -1;
    const hasUpvotes = (post.stats?.upvotes ?? 0) > 0;
    const hasDownvotes = (post.stats?.downvotes ?? 0) > 0;
    const hasComments = (post.stats?.replyCount ?? 0) > 0;

    const upvoteTooltipContent = "点赞是对于内容的肯定\n让有共鸣的声音浮现";
    const downvoteTooltipContent = "到赞是社区净化的力量\n当回声被足够多的人反对时\n回声将被永久销毁";

    return (
        <motion.div
            ref={cardRef}
            layout
            variants={cardVariants}
            initial="visible"
            animate={getAnimationState()}
            onAnimationComplete={(variant) => {
                if (variant === 'deleting' && onDeletionComplete) onDeletionComplete(post.id);
                if (variant === 'purifyVanish' && onPurificationComplete) onPurificationComplete(post.id);
                if (variant === 'glitching' && onFaded) onFaded(post.id);
            }}
            className={`relative ${isMenuOpen ? 'z-10' : ''} ${isAnnouncement ? 'announcement-post' : ''} ${isPurifyGlow ? 'purify-glow' : ''} ${shouldPurifyVanish ? 'vanish-container' : ''} ${(isGlitching || isCharging) && !isPurifying ? 'charge-up' : ''} ${isGlitching && !isPurifying ? 'glitch' : ''} ${isCritical && !isPurifying && !isGlitching && !isCharging ? 'critical-glow' : ''}`}
        >
            <div
                className={`glass-card rounded-lg p-4`}
                onClick={isLink && !isChildEcho ? handleCardClick : undefined}
            >
                <div>
                    {isLink && !isChildEcho && (
                        <div className="ripple-container">
                            {ripples.map((ripple) => (
                                <span
                                    key={ripple.key}
                                    className="ripple"
                                    style={{ top: ripple.y, left: ripple.x, width: ripple.size, height: ripple.size }}
                                    onAnimationEnd={() => setRipples((prev) => prev.filter((r) => r.key !== ripple.key))}
                                />
                            ))}
                        </div>
                    )}

                    {isAnnouncement && (
                        <div className="flex items-center gap-2 mb-3 text-accent font-mono text-sm">
                            <Icon name="zap" className="w-5 h-5" />
                            <span>系统公告</span>
                        </div>
                    )}

                    <div className="flex items-center justify-between text-sm text-gray-400 mb-2">
                        <div className="flex items-center gap-2">
                            {isOwner && (
                                <div className="flex items-center gap-1 text-xs font-bold opacity-50" title="Original Poster">
                                    <Icon name="award" className="w-4 h-4" />
                                    <span>回音贴主</span>
                                </div>
                            )}
                            {!isVerifying && isAdmin && post.type !== 'ANNOUNCEMENT' && (
                                <span className="font-mono text-xs opacity-50">
                                    {isOwner ? `(${generateCodename(post.fingerprintHash)})` : `发布者: ${generateCodename(post.fingerprintHash)}`}
                                </span>
                            )}
                        </div>

                        {(!isVerifying && isAdmin || isChildEcho) && (
                            <div className="absolute top-2 right-2 z-20">
                                <button onClick={handleToggleMenu} className="p-2 rounded-full hover:bg-gray-700">
                                    <Icon name="menu" className="w-4 h-4" />
                                </button>
                            </div>
                        )}
                    </div>

                    <div
                        ref={contentRef}
                        className={
                            isChildEcho
                                ? `relative transition-all duration-300 ${!isReplyExpanded ? 'max-h-[125px] overflow-y-hidden' : ''}`
                                : (isLink ? "max-h-[300px] overflow-y-hidden relative" : "") +
                                (isLink && isOverflowing ? " truncated-content" : "")
                        }
                    >
                        <p className="text-white whitespace-pre-wrap break-words">{post.content && renderContentWithLinks(post.content)}</p>
                    </div>

                    {isChildEcho && isReplyOverflowing && !isReplyExpanded && (
                        <div className="mt-2 text-sm font-bold text-accent hover:underline cursor-pointer z-10" onClick={() => setIsReplyExpanded(true)}>
                            ...[阅读全文]
                        </div>
                    )}
                    {isChildEcho && isReplyOverflowing && isReplyExpanded && (
                        <div className="mt-2 text-sm font-bold text-accent hover:underline cursor-pointer z-10" onClick={() => setIsReplyExpanded(false)}>
                            [收起]
                        </div>
                    )}

                    <AnimatePresence>
                        {showPurificationMeter && (
                            <motion.div className="mt-3 relative z-10" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.3 }}>
                                <div className="flex items-center gap-2"><span className="text-red-400 font-mono text-xs flex-shrink-0">净化进度</span><div className="w-full bg-gray-700 rounded-full h-1.5"><motion.div className="bg-gradient-to-r from-yellow-500 to-red-600 h-1.5 rounded-full" style={{ width: `${meterFillPercentage}%` }} /></div></div>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {post.type !== 'ADVERTISEMENT' && (
                        <div className="relative flex items-center justify-between text-sm text-gray-400 mt-3 z-10">
                            <div className={`font-mono flex-shrink-0 min-w-[120px] text-left ${isPurifying ? 'purify-text-glow-red' : showCountdownForReply ? colorClass : 'text-gray-400'}`}
                                style={{ textAlign: 'left', display: 'inline-block' }}>
                                <AnimatePresence mode="wait">
                                    {isPurifying ? (
                                        <motion.span
                                            key="purify-text"
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            exit={{ opacity: 0 }}
                                            transition={{ duration: 0.3 }}
                                        >
                                            社区自治，自主净化
                                        </motion.span>
                                    ) : !isExpired ? (
                                        <motion.span
                                            key="countdown-text"
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            exit={{ opacity: 0 }}
                                            transition={{ duration: 0.3 }}
                                            style={{ display: 'inline-block', width: '100%' }}
                                        >
                                            {showCountdownForReply || !isChildEcho
                                                ? countdownText
                                                : timeSince(new Date(post.createdAt))}
                                        </motion.span>
                                    ) : (
                                        <motion.span
                                            key="final-message"
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            exit={{ opacity: 0 }}
                                            transition={{ duration: 0.5 }}
                                            style={{ display: 'inline-block', width: '100%' }}
                                        >
                                            心间回音，限定消散。
                                        </motion.span>
                                    )}
                                </AnimatePresence>
                            </div>
                            <div className="flex items-center gap-4 flex-shrink-0 items-center">
                                <div className="relative">
                                    <button onClick={(e) => handleVote(e, 1)} className={`press-animation icon-base icon-thumb-up ${upvoteIsActive ? 'active' : ''} ${hasUpvotes ? 'has-votes' : ''}`} disabled={isFingerprintLoading}><Icon name="thumb-up" value={post.stats?.upvotes ?? 0} /></button>
                                    <Tooltip content={upvoteTooltipContent} isVisible={showUpvoteTooltip} onClose={closeUpvoteTooltip} />
                                </div>
                                <div className="relative">
                                    <button onClick={(e) => handleVote(e, -1)} className={`press-animation icon-base icon-thumb-down ${downvoteIsActive ? 'active' : ''} ${hasDownvotes ? 'has-votes' : ''}`} disabled={isFingerprintLoading}><Icon name="thumb-down" value={post.stats?.downvotes ?? 0} /></button>
                                    <Tooltip content={downvoteTooltipContent} isVisible={showDownvoteTooltip} onClose={closeDownvoteTooltip} />
                                </div>
                                {!isChildEcho && (
                                    <div className="relative">
                                        <button onClick={handleCommentClick} className={`press-animation icon-base icon-comment ${hasComments ? 'has-comments' : ''}`}>
                                            <Icon name="comment" value={post.stats?.replyCount ?? 0} />
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>
                {isMenuOpen && (
                    <div className="absolute top-12 right-2 bg-gray-900 rounded-lg shadow-lg p-2 z-10 w-48">
                        <ul>
                            {!isVerifying && isAdmin && (
                                <>
                                    <li><button onClick={handleDelete} className="w-full text-left p-2 rounded hover:bg-red-800/50">🗑️ 立即删除</button></li>
                                    <li><button onClick={handleViewProfile} className="block w-full text-left p-2 rounded hover:bg-gray-700">👤 查看用户档案</button></li>
                                    <li><button onClick={handleShowDetails} className="w-full text-left p-2 rounded hover:bg-gray-700">ℹ️ 帖子详情</button></li>
                                </>
                            )}
                            {isChildEcho && (
                                <li><button onClick={handleReportClick} className="w-full text-left p-2 rounded hover:bg-red-800/50">🚩 举报此回声</button></li>
                            )}
                        </ul>
                    </div>
                )}
            </div>
        </motion.div>
    );
}
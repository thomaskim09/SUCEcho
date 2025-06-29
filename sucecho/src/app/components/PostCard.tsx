// sucecho/src/app/components/PostCard.tsx
"use client";

import type { PostWithStats } from "@/lib/types";
import { motion, AnimatePresence } from 'motion/react';
import { useRouter } from 'next/navigation';
import { useFingerprint } from '@/context/FingerprintContext';
import { useAdminSession } from '@/hooks/useAdminSession';
import { generateCodename } from '@/lib/codename';
import { useState, useEffect, useRef, MouseEvent, useLayoutEffect } from 'react';
import { Icon } from './Icon';
import { checkPurificationStatus } from "@/lib/purification";
import { timeSince } from "@/lib/time-helpers";
import { useCountdown } from '@/hooks/useCountdown';
import Tooltip from './Tooltip';

interface PostCardProps {
    post: PostWithStats;
    isLink?: boolean;
    onVote: (postId: number, voteType: 1 | -1) => void;
    onDelete?: (postId: number) => void;
    onReport?: (postId: number) => void;
    userVote?: 1 | -1;
    isPurifying?: boolean;
    onPurificationComplete?: (postId: number) => void;
    onFaded?: (postId: number) => void;
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

export default function PostCard({ post, isLink = true, onVote, onDelete, onReport, userVote, isPurifying = false, onPurificationComplete, onFaded }: PostCardProps) {
    const { fingerprint, isLoading: isFingerprintLoading } = useFingerprint();
    const isAdmin = useAdminSession();
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

    const isChildEcho = !!post.parentPostId;
    const { countdownText, colorClass, isExpired, isVanishing, isCritical } = useCountdown(new Date(post.createdAt));
    const [isGlitching, setIsGlitching] = useState(false);
    const [isCharging, setIsCharging] = useState(false);

    useEffect(() => {
        if (isExpired) {
            setIsCharging(true);
            const chargeTimer = setTimeout(() => {
                setIsGlitching(true);
            }, 3000); // 3-second charge-up
            return () => clearTimeout(chargeTimer);
        }
    }, [isExpired]);

    useLayoutEffect(() => {
        const checkOverflow = () => {
            if (contentRef.current) {
                const maxHeight = 125; // px, must match the class below
                setIsOverflowing(contentRef.current.scrollHeight > maxHeight);
            }
        };
        checkOverflow();
        window.addEventListener('resize', checkOverflow);
        return () => window.removeEventListener('resize', checkOverflow);
    }, [post.content]);

    useEffect(() => {
        return () => {
            if (upvoteTooltipTimer.current) clearTimeout(upvoteTooltipTimer.current);
            if (downvoteTooltipTimer.current) clearTimeout(downvoteTooltipTimer.current);
        };
    }, []);

    const handleVote = (e: React.MouseEvent, voteType: 1 | -1) => {
        e.preventDefault();
        e.stopPropagation();
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

    const closeUpvoteTooltip = () => { if (upvoteTooltipTimer.current) clearTimeout(upvoteTooltipTimer.current); setShowUpvoteTooltip(false); };
    const closeDownvoteTooltip = () => { if (downvoteTooltipTimer.current) clearTimeout(downvoteTooltipTimer.current); setShowDownvoteTooltip(false); };
    const handleDelete = (e: React.MouseEvent) => { e.preventDefault(); e.stopPropagation(); if (onDelete) onDelete(post.id); setIsMenuOpen(false); };
    const handleCommentClick = (e: React.MouseEvent) => { e.stopPropagation(); e.preventDefault(); router.push(`/compose?parentPostId=${post.id}`); };
    const handleToggleMenu = (e: React.MouseEvent) => { e.preventDefault(); e.stopPropagation(); setIsMenuOpen(!isMenuOpen); };
    const handleViewProfile = (e: React.MouseEvent) => { e.preventDefault(); e.stopPropagation(); router.push(`/admin/users/${post.fingerprintHash}`); setIsMenuOpen(false); };
    const handleShowDetails = (e: React.MouseEvent) => { e.preventDefault(); e.stopPropagation(); alert(`帖子ID: ${post.id}\n指纹哈希: ${post.fingerprintHash}`); setIsMenuOpen(false); };
    const handleReportClick = (e: React.MouseEvent) => { e.preventDefault(); e.stopPropagation(); if (onReport) { onReport(post.id); } setIsMenuOpen(false); };
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
        router.push(`/post/${post.id}`);
    };

    const { showMeter: showPurificationMeter, meterFillPercentage } = checkPurificationStatus({
        upvotes: post.stats?.upvotes ?? 0,
        downvotes: post.stats?.downvotes ?? 0,
    });

    const upvoteIsActive = userVote === 1;
    const downvoteIsActive = userVote === -1;
    const hasUpvotes = (post.stats?.upvotes ?? 0) > 0;
    const hasDownvotes = (post.stats?.downvotes ?? 0) > 0;
    const hasComments = (post.stats?.replyCount ?? 0) > 0;

    const upvoteTooltipContent = "赞同这个想法，让更多人看见。";
    const downvoteTooltipContent = "反对这个内容，人越多，它消失得越快。";

    const shouldVanish = isVanishing || isPurifying || isGlitching;

    return (
        <motion.div
            ref={cardRef}
            layout
            initial={{ opacity: 1, scale: 1, y: 0 }}
            animate={{
                opacity: shouldVanish ? 0 : 1,
                scale: shouldVanish ? 0.8 : 1,
            }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            onAnimationComplete={() => {
                if (shouldVanish && onFaded) {
                    onFaded(post.id);
                }
            }}
            className={`relative ${isGlitching || isCharging ? 'charge-up' : ''} ${isGlitching ? 'glitch' : ''}`}
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
                    {(isAdmin || isChildEcho) && (
                        <div className="absolute top-2 right-2 z-10">
                            <button onClick={handleToggleMenu} className="p-2 rounded-full hover:bg-gray-700">
                                <Icon name="menu" className="w-4 h-4" />
                            </button>
                        </div>
                    )}
                    <div className="flex items-center justify-between text-sm text-gray-400 mb-2">{isAdmin ? (<span className="font-mono text-xs opacity-50">发布者: {generateCodename(post.fingerprintHash)}</span>) : (<span></span>)}</div>

                    <div
                        ref={contentRef}
                        className={
                            (isLink ? "max-h-[300px] overflow-y-hidden relative" : "") +
                            (isLink && isOverflowing ? " truncated-content" : "")
                        }
                    >
                        <p className="text-white whitespace-pre-wrap break-words">{post.content && renderContentWithLinks(post.content)}</p>
                    </div>

                    {isLink && isOverflowing && (
                        <div className="mt-2 text-sm font-bold text-accent hover:underline cursor-pointer" onClick={handleCardClick}>
                            ...[阅读全文]
                        </div>
                    )}

                    <AnimatePresence>
                        {showPurificationMeter && (
                            <motion.div className="mt-3" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.3 }}>
                                <div className="flex items-center gap-2"><span className="text-red-400 font-mono text-xs flex-shrink-0">净化进度</span><div className="w-full bg-gray-700 rounded-full h-1.5"><motion.div className="bg-gradient-to-r from-yellow-500 to-red-600 h-1.5 rounded-full" style={{ width: `${meterFillPercentage}%` }} /></div></div>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    <div className="flex items-center justify-between text-sm text-gray-400 mt-3">
                        <span className={`font-mono flex-shrink-0 ${colorClass} ${isExpired ? 'fade-in' : ''} ${isCritical ? 'pulse' : ''}`}>
                            {isChildEcho ? timeSince(new Date(post.createdAt)) : countdownText}
                        </span>
                        <div className="flex items-center gap-4 flex-shrink-0">
                            <div className="relative">
                                <button onClick={(e) => handleVote(e, 1)} className={`press-animation icon-base icon-thumb-up ${upvoteIsActive ? 'active' : ''} ${hasUpvotes ? 'has-votes' : ''}`} disabled={isFingerprintLoading}><Icon name="thumb-up" value={post.stats?.upvotes ?? 0} /></button>
                                <Tooltip content={upvoteTooltipContent} isVisible={showUpvoteTooltip} onClose={closeUpvoteTooltip} />
                            </div>
                            <div className="relative">
                                <button onClick={(e) => handleVote(e, -1)} className={`press-animation icon-base icon-thumb-down ${downvoteIsActive ? 'active' : ''} ${hasDownvotes ? 'has-votes' : ''}`} disabled={isFingerprintLoading}><Icon name="thumb-down" value={post.stats?.downvotes ?? 0} /></button>
                                <Tooltip content={downvoteTooltipContent} isVisible={showDownvoteTooltip} onClose={closeDownvoteTooltip} />
                            </div>
                            {!isChildEcho && (
                                <button onClick={handleCommentClick} className={`press-animation icon-base icon-comment ${hasComments ? 'has-comments' : ''}`}>
                                    <Icon name="comment" value={post.stats?.replyCount ?? 0} />
                                </button>
                            )}
                        </div>
                    </div>
                </div>
                {isMenuOpen && (
                    <div className="absolute top-12 right-2 bg-gray-900 rounded-lg shadow-lg p-2 z-10 w-48">
                        {isAdmin ? (
                            <ul>
                                <li><button onClick={handleDelete} className="w-full text-left p-2 rounded hover:bg-red-800/50">🗑️ 立即删除</button></li>
                                <li><button onClick={handleViewProfile} className="block w-full text-left p-2 rounded hover:bg-gray-700">👤 查看用户档案</button></li>
                                <li><button onClick={handleShowDetails} className="w-full text-left p-2 rounded hover:bg-gray-700">ℹ️ 帖子详情</button></li>
                                {!isChildEcho && (
                                    <li><button className="w-full text-left p-2 rounded text-gray-500 cursor-not-allowed" disabled>📌 置顶24小时</button></li>
                                )}
                            </ul>
                        ) : (
                            isChildEcho && (
                                <ul>
                                    <li><button onClick={handleReportClick} className="w-full text-left p-2 rounded hover:bg-red-800/50">🚩 举报此回声</button></li>
                                </ul>
                            )
                        )}
                    </div>
                )}
            </div>
        </motion.div>
    );
}
// sucecho/src/app/components/PostCard.tsx
"use client";

import type { PostWithStats } from "@/lib/types";
import { motion, AnimatePresence, Variants } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { useFingerprint } from '@/context/FingerprintContext';
import { useAdminSession } from '@/hooks/useAdminSession';
import { generateCodename } from '@/lib/codename';
import { useState, useEffect, useRef } from 'react'; // Import useRef
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

export default function PostCard({ post, isLink = true, onVote, onDelete, onReport, userVote, isPurifying = false, onPurificationComplete, onFaded }: PostCardProps) {
    const { fingerprint, isLoading: isFingerprintLoading } = useFingerprint();
    const isAdmin = useAdminSession();
    const router = useRouter();
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [isFadingOut, setIsFadingOut] = useState(false);
    const [showUpvoteTooltip, setShowUpvoteTooltip] = useState(false);
    const [showDownvoteTooltip, setShowDownvoteTooltip] = useState(false);

    // NEW: Refs to hold timer IDs for auto-dismissal
    const upvoteTooltipTimer = useRef<NodeJS.Timeout | null>(null);
    const downvoteTooltipTimer = useRef<NodeJS.Timeout | null>(null);

    const isChildEcho = !!post.parentPostId;
    const { countdownText, colorClass, isExpired } = useCountdown(new Date(post.createdAt));

    // NEW: Effect to clear timers when the component unmounts to prevent memory leaks
    useEffect(() => {
        return () => {
            if (upvoteTooltipTimer.current) clearTimeout(upvoteTooltipTimer.current);
            if (downvoteTooltipTimer.current) clearTimeout(downvoteTooltipTimer.current);
        };
    }, []);

    useEffect(() => {
        if (isExpired && !isChildEcho) {
            setIsFadingOut(true);
        }
    }, [isExpired, isChildEcho]);

    const handleVote = (e: React.MouseEvent, voteType: 1 | -1) => {
        e.preventDefault();
        e.stopPropagation();
        if (isFingerprintLoading || !fingerprint) {
            alert("无法识别您的浏览器。请稍后再试。");
            return;
        }

        if (voteType === 1) {
            const hasSeenUpvoteTip = localStorage.getItem('hasSeenUpvoteTip');
            if (hasSeenUpvoteTip !== 'true') {
                if (upvoteTooltipTimer.current) clearTimeout(upvoteTooltipTimer.current);
                setShowUpvoteTooltip(true);
                localStorage.setItem('hasSeenUpvoteTip', 'true');
                upvoteTooltipTimer.current = setTimeout(() => {
                    setShowUpvoteTooltip(false);
                }, 5000);
            }
        } else if (voteType === -1) {
            const hasSeenDownvoteTip = localStorage.getItem('hasSeenDownvoteTip');
            if (hasSeenDownvoteTip !== 'true') {
                if (downvoteTooltipTimer.current) clearTimeout(downvoteTooltipTimer.current);
                setShowDownvoteTooltip(true);
                localStorage.setItem('hasSeenDownvoteTip', 'true');
                downvoteTooltipTimer.current = setTimeout(() => {
                    setShowDownvoteTooltip(false);
                }, 5000);
            }
        }

        onVote(post.id, voteType);
    };

    const closeUpvoteTooltip = () => {
        if (upvoteTooltipTimer.current) clearTimeout(upvoteTooltipTimer.current);
        setShowUpvoteTooltip(false);
    }
    const closeDownvoteTooltip = () => {
        if (downvoteTooltipTimer.current) clearTimeout(downvoteTooltipTimer.current);
        setShowDownvoteTooltip(false);
    }

    const handleDelete = (e: React.MouseEvent) => { e.preventDefault(); e.stopPropagation(); if (onDelete) onDelete(post.id); setIsMenuOpen(false); };
    const handleCommentClick = (e: React.MouseEvent) => { e.stopPropagation(); e.preventDefault(); router.push(`/compose?parentPostId=${post.id}`); };
    const handleToggleMenu = (e: React.MouseEvent) => { e.preventDefault(); e.stopPropagation(); setIsMenuOpen(!isMenuOpen); };
    const handleViewProfile = (e: React.MouseEvent) => { e.preventDefault(); e.stopPropagation(); router.push(`/admin/users/${post.fingerprintHash}`); setIsMenuOpen(false); };
    const handleShowDetails = (e: React.MouseEvent) => { e.preventDefault(); e.stopPropagation(); alert(`Post ID: ${post.id}\nFingerprint Hash: ${post.fingerprintHash}`); setIsMenuOpen(false); };
    const handleReportClick = (e: React.MouseEvent) => { e.preventDefault(); e.stopPropagation(); if (onReport) { onReport(post.id); } setIsMenuOpen(false); };
    const handleCardClick = () => {
        if (isLink && !isChildEcho) {
            router.push(`/post/${post.id}`);
        }
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

    const cardVariants: Variants = {
        hidden: { opacity: 0, y: 20 },
        enter: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 25 } },
        exit: { opacity: 0, scale: 0.9, transition: { duration: 0.2 } },
        purify: { opacity: 0, scale: 0.8, transition: { duration: 0.6, ease: "easeOut" } },
        fadeOut: { opacity: 0, y: -20, transition: { duration: 0.5 } }
    };

    const animationState = isFadingOut ? "fadeOut" : (isPurifying ? "purify" : "enter");

    const upvoteTooltipContent = "点赞是对于内容的肯定，\n让有共鸣的声音浮现。";
    const downvoteTooltipContent = "到赞是社区净化的力量，\n当一个回声被足够多的人反对，\n它将被永久销毁。";

    return (
        <motion.div
            layout
            variants={cardVariants}
            initial="hidden"
            animate={animationState}
            exit="exit"
            onAnimationComplete={(definition) => {
                if (definition === "purify" && onPurificationComplete) {
                    onPurificationComplete(post.id);
                }
                if (definition === "fadeOut" && onFaded) {
                    onFaded(post.id);
                }
            }}
            onClick={handleCardClick}
            className={`p-4 rounded-lg my-2 glass-card relative ${isPurifying || isFadingOut ? 'pointer-events-none' : ''} ${isLink && !isChildEcho ? 'cursor-pointer' : ''}`}
        >
            {(isAdmin || isChildEcho) && (
                <div className="absolute top-2 right-2">
                    <button onClick={handleToggleMenu} className="p-2 rounded-full hover:bg-gray-700">
                        <Icon name="menu" className="w-4 h-4" />
                    </button>
                </div>
            )}

            <div className="flex items-center justify-between text-sm text-gray-400 mb-2">{isAdmin ? (<span className="font-mono text-xs opacity-50">发布人: {generateCodename(post.fingerprintHash)}</span>) : (<span></span>)}</div>
            <p className="text-white whitespace-pre-wrap break-words">{post.content}</p>

            <AnimatePresence>
                {showPurificationMeter && (
                    <motion.div className="mt-3" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.3 }}>
                        <div className="flex items-center gap-2"><span className="text-red-400 font-mono text-xs flex-shrink-0">净化投票</span><div className="w-full bg-gray-700 rounded-full h-1.5"><motion.div className="bg-gradient-to-r from-yellow-500 to-red-600 h-1.5 rounded-full" style={{ width: `${meterFillPercentage}%` }} /></div></div>
                    </motion.div>
                )}
            </AnimatePresence>

            <div className="flex items-center justify-between text-sm text-gray-400 mt-3">
                <span className={`font-mono flex-shrink-0 ${isChildEcho ? 'text-gray-400' : colorClass}`}>
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
        </motion.div>
    );
}
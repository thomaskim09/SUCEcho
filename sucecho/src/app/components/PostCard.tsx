// src/app/components/PostCard.tsx
"use client";

import type { PostWithStats } from "@/lib/types"; //
import { motion } from 'framer-motion'; //
import Link from 'next/link';
import { useFingerprint } from '@/context/FingerprintContext'; //
import { useAdminSession } from '@/hooks/useAdminSession'; //
import { generateCodename } from '@/lib/codename'; //
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Icon } from './Icon';

const timeSince = (date: Date): string => {
    if (!date) return '';
    const seconds = Math.floor((new Date().getTime() - new Date(date).getTime()) / 1000);
    let interval = seconds / 31536000;
    if (interval > 1) return Math.floor(interval) + "年前";
    interval = seconds / 2592000;
    if (interval > 1) return Math.floor(interval) + "个月前";
    interval = seconds / 86400;
    if (interval > 1) return Math.floor(interval) + "天前";
    interval = seconds / 3600;
    if (interval > 1) return Math.floor(interval) + "小时前";
    interval = seconds / 60;
    if (interval > 1) return Math.floor(interval) + "分钟前";
    return Math.floor(seconds) + "秒前";
};


interface PostCardProps {
    post: PostWithStats;
    isLink?: boolean;
    onVote: (postId: number, voteType: 1 | -1) => void;
    userVote?: 1 | -1;
}

export default function PostCard({ post, isLink = true, onVote, userVote }: PostCardProps) {
    const { fingerprint, isLoading: isFingerprintLoading } = useFingerprint(); //
    const isAdmin = useAdminSession(); //
    const router = useRouter();
    const [isMenuOpen, setIsMenuOpen] = useState(false);

    const handleToggleMenu = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsMenuOpen(!isMenuOpen);
    };

    const handleVote = (e: React.MouseEvent, voteType: 1 | -1) => {
        e.preventDefault();
        e.stopPropagation();
        if (isFingerprintLoading || !fingerprint) {
            alert("无法识别您的浏览器。请稍后再试。");
            return;
        }
        onVote(post.id, voteType);
    };

    const handleDelete = async (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (!confirm(`您确定要删除帖子 #${post.id} 吗？此操作无法撤销。`)) {
            return;
        }

        try {
            const res = await fetch(`/api/admin/posts/${post.id}`, { ///route.ts]
                method: 'DELETE',
            });
            if (!res.ok) {
                const error = await res.json();
                throw new Error(error.message || 'Failed to delete post');
            }
        } catch (err: unknown) {
            alert(`Error: ${(err as Error).message}`);
        }
        setIsMenuOpen(false);
    };

    const handleViewProfile = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        router.push(`/admin/users/${post.fingerprintHash}`); ///page.tsx]
        setIsMenuOpen(false);
    };

    const handleShowDetails = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        alert(`Post ID: ${post.id}\nFingerprint Hash: ${post.fingerprintHash}`);
        setIsMenuOpen(false);
    };


    const upvoteIsActive = userVote === 1;
    const downvoteIsActive = userVote === -1;

    // Conditions for applying color
    const hasUpvotes = (post.stats?.upvotes ?? 0) > 0;
    const hasDownvotes = (post.stats?.downvotes ?? 0) > 0;
    // NEW: Condition for comment icon
    const hasComments = (post.stats?.replyCount ?? 0) > 0;

    const cardContent = (
        <motion.div
            layout
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.3 }}
            className={`p-4 rounded-lg my-2 relative glass-card ${isLink ? 'cursor-pointer' : ''}`}
        >
            {isAdmin && (
                <div className="absolute top-2 right-2">
                    <button onClick={handleToggleMenu} className="p-2 rounded-full hover:bg-gray-700">
                        ...
                    </button>
                </div>
            )}

            <div className="flex items-center justify-between text-sm text-gray-400 mb-2">
                {isAdmin ? (
                    <span className="font-mono text-xs opacity-50">发布人: {generateCodename(post.fingerprintHash)}</span> //
                ) : (
                    <span></span>
                )}
            </div>

            <p className="text-white whitespace-pre-wrap break-words">{post.content}</p>

            <div className="flex items-center justify-between text-sm text-gray-400 mt-3">
                <span className="font-mono">{timeSince(post.createdAt)}</span>
                <div className="flex items-center gap-4">
                    <button
                        onClick={(e) => handleVote(e, 1)}
                        className={`press-animation icon-base icon-thumb-up ${upvoteIsActive ? 'active' : ''} ${hasUpvotes ? 'has-votes' : ''}`}
                        disabled={isFingerprintLoading}
                    >
                        <Icon name="thumb-up" value={post.stats?.upvotes ?? 0} />
                    </button>
                    <button
                        onClick={(e) => handleVote(e, -1)}
                        className={`press-animation icon-base icon-thumb-down ${downvoteIsActive ? 'active' : ''} ${hasDownvotes ? 'has-votes' : ''}`}
                        disabled={isFingerprintLoading}
                    >
                        <Icon name="thumb-down" value={post.stats?.downvotes ?? 0} />
                    </button>
                    {/* UPDATED: Add conditional class here */}
                    <div className={`icon-base icon-comment ${hasComments ? 'has-comments' : ''}`}>
                        <Icon name="comment" value={post.stats?.replyCount ?? 0} />
                    </div>
                </div>
            </div>

            {isMenuOpen && (
                <div className="absolute top-12 right-2 bg-gray-900 rounded-lg shadow-lg p-2 z-10 w-48">
                    <ul>
                        <li><button onClick={handleDelete} className="w-full text-left p-2 rounded hover:bg-red-800/50">🗑️ 立即删除</button></li>
                        <li><button onClick={handleViewProfile} className="block w-full text-left p-2 rounded hover:bg-gray-700">👤 查看用户档案</button></li>
                        <li><button onClick={handleShowDetails} className="w-full text-left p-2 rounded hover:bg-gray-700">ℹ️ 帖子详情</button></li>
                        <li><button className="w-full text-left p-2 rounded text-gray-500 cursor-not-allowed" disabled>📌 置顶24小时</button></li>
                    </ul>
                </div>
            )}
        </motion.div>
    );

    if (!isLink) {
        return cardContent;
    }

    return (
        <Link href={`/post/${post.id}`} className="no-underline" scroll={false}>
            {cardContent}
        </Link>
    );
}
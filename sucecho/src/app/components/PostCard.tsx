// sucecho/src/app/components/PostCard.tsx
"use client";

import type { PostWithStats } from "@/lib/types";
import { motion } from 'framer-motion';
import Link from 'next/link';
import { useFingerprint } from '@/context/FingerprintContext';
import { useAdminSession } from '@/hooks/useAdminSession';
import { generateCodename } from '@/lib/codename';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

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
    const { fingerprint, isLoading: isFingerprintLoading } = useFingerprint();
    const isAdmin = useAdminSession();
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
            alert("Cannot identify your browser. Please try again later.");
            return;
        }
        onVote(post.id, voteType);
    };

    const handleDelete = async (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (!confirm(`Are you sure you want to delete post #${post.id}? This cannot be undone.`)) {
            return;
        }

        try {
            const res = await fetch(`/api/admin/posts/${post.id}`, {
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
        // Here you would also set the user profile into the transition context if you implement that
        router.push(`/admin/users/${post.fingerprintHash}`);
        setIsMenuOpen(false);
    };

    const handleShowDetails = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        alert(`Post ID: ${post.id}\nFingerprint Hash: ${post.fingerprintHash}`);
        setIsMenuOpen(false);
    };

    const upvoteStyle = userVote === 1 ? 'text-accent' : 'hover:text-white';
    const downvoteStyle = userVote === -1 ? 'text-accent' : 'hover:text-white';

    const cardContent = (
        <motion.div
            layout
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.3 }}
            className={`p-4 rounded-lg my-2 transition-colors relative ${isLink ? 'cursor-pointer hover:bg-gray-800/50' : ''}`}
            style={{ backgroundColor: 'var(--card-background)' }}
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
                    <span className="font-mono text-xs opacity-50">Publisher: {generateCodename(post.fingerprintHash)}</span>
                ) : (
                    <span></span>
                )}
            </div>

            <p className="text-white whitespace-pre-wrap break-words">{post.content}</p>

            <div className="flex items-center justify-between text-sm text-gray-400 mt-3">
                <span className="font-mono">{timeSince(post.createdAt)}</span>
                <div className="flex items-center gap-4 font-mono">
                    <button onClick={(e) => handleVote(e, 1)} className={`${upvoteStyle} transition-colors disabled:opacity-50 press-animation`} disabled={isFingerprintLoading}>
                        👍 {post.stats?.upvotes ?? 0}
                    </button>
                    <button onClick={(e) => handleVote(e, -1)} className={`${downvoteStyle} transition-colors disabled:opacity-50 press-animation`} disabled={isFingerprintLoading}>
                        👎 {post.stats?.downvotes ?? 0}
                    </button>
                    <span>💬 {post.stats?.replyCount ?? 0}</span>
                </div>
            </div>

            {isMenuOpen && (
                <div className="absolute top-12 right-2 bg-gray-900 rounded-lg shadow-lg p-2 z-10 w-48">
                    <ul>
                        <li><button onClick={handleDelete} className="w-full text-left p-2 rounded hover:bg-red-800/50">🗑️ Instant Delete</button></li>
                        <li><button onClick={handleViewProfile} className="block w-full text-left p-2 rounded hover:bg-gray-700">👤 View User Profile</button></li>
                        <li><button onClick={handleShowDetails} className="w-full text-left p-2 rounded hover:bg-gray-700">ℹ️ Post Details</button></li>
                        <li><button className="w-full text-left p-2 rounded text-gray-500 cursor-not-allowed" disabled>📌 Pin for 24h</button></li>
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
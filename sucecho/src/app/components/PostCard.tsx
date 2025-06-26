// sucecho/src/app/components/PostCard.tsx
"use client";

import type { PostWithStats } from "@/lib/types";
import { motion } from 'framer-motion';
import Link from 'next/link';
import { useFingerprint } from '@/context/FingerprintContext';

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

// Define the props for the PostCard component, including the optional userVote
interface PostCardProps {
    post: PostWithStats;
    isLink?: boolean;
    onVote: (postId: number, voteType: 1 | -1) => void;
    userVote?: 1 | -1;
}

export default function PostCard({ post, isLink = true, onVote, userVote }: PostCardProps) {
    const { fingerprint, isLoading: isFingerprintLoading } = useFingerprint();

    const handleVote = (e: React.MouseEvent, voteType: 1 | -1) => {
        e.preventDefault();
        e.stopPropagation();

        if (isFingerprintLoading || !fingerprint) {
            alert("无法识别您的浏览器，请稍候再试。");
            return;
        }

        onVote(post.id, voteType);
    };

    // Determine button styles based on the user's vote for instant feedback
    const upvoteStyle = userVote === 1 ? 'text-accent' : 'hover:text-white';
    const downvoteStyle = userVote === -1 ? 'text-accent' : 'hover:text-white';

    const cardContent = (
        <motion.div
            layout
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.3 }}
            className={`p-4 rounded-lg my-2 transition-colors ${isLink ? 'cursor-pointer hover:bg-gray-800/50' : ''}`}
            style={{ backgroundColor: 'var(--card-background)' }}
        >
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

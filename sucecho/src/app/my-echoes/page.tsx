// sucecho/src/app/my-echoes/page.tsx
"use client";

import { useState, useEffect } from 'react';
import type { PostWithStats } from '@/lib/types';
import { getMyEchoes } from '@/hooks/useMyEchoes';
import PostCard from '@/app/components/PostCard';
import PostSkeleton from '@/app/components/PostSkeleton';
import Link from 'next/link';
import { AnimatePresence } from 'framer-motion';

export default function MyEchoesPage() {
    const [myPosts, setMyPosts] = useState<PostWithStats[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    // const [userVotes, setUserVotes] = useState<Record<number, 1 | -1>>({});
    const [userVotes] = useState<Record<number, 1 | -1>>({});

    useEffect(() => {
        const fetchMyPosts = async () => {
            const postIds = getMyEchoes();
            if (postIds.length === 0) {
                setIsLoading(false);
                return;
            }

            try {
                const res = await fetch('/api/posts/mine', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ postIds }),
                });

                if (!res.ok) {
                    throw new Error('Failed to fetch your echoes');
                }

                const posts = await res.json();
                setMyPosts(posts);
            } catch (error) {
                console.error(error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchMyPosts();
    }, []);

    // You can copy the handleOptimisticVote logic from PostFeed.tsx or PostDetailPage
    // for instant voting feedback on this page too. For brevity, it's omitted here
    // but should be included for a consistent UX.
    const handleVote = (postId: number, voteType: 1 | -1) => {
        // Placeholder for optimistic vote logic
        console.log(`Voting on post ${postId} with type ${voteType}`);
    };

    const renderContent = () => {
        if (isLoading) {
            return (
                <div>
                    <PostSkeleton />
                    <PostSkeleton />
                </div>
            );
        }

        if (myPosts.length === 0) {
            return (
                <div className="text-center text-gray-400 p-8 rounded-lg" style={{ backgroundColor: 'var(--card-background)' }}>
                    <p className="text-2xl mb-4">✍️</p>
                    <p className="text-xl">你还没有发布任何回音。</p>
                    <p className="text-base mt-2">在本设备上发布的回音会自动出现在这里。</p>
                    <Link href="/compose" className="text-accent hover:underline mt-6 inline-block">
                        发布第一条回音
                    </Link>
                </div>
            );
        }

        return (
            <AnimatePresence>
                {myPosts.map(post => (
                    <PostCard
                        key={post.id}
                        post={post}
                        onVote={handleVote} // Replace with full optimistic handler
                        userVote={userVotes[post.id]}
                    />
                ))}
            </AnimatePresence>
        );
    };

    return (
        <div className="container mx-auto max-w-2xl p-4">
            <header className="py-4 flex justify-between items-center">
                <h1 className="text-2xl font-bold font-mono">我的回音</h1>
                <Link href="/" className="text-accent hover:underline">
                    ← 返回回音墙
                </Link>
            </header>
            <main className="mt-4">
                {renderContent()}
            </main>
        </div>
    );
}
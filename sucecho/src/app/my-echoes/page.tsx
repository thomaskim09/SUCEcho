"use client";

import { useState, useEffect } from 'react';
import type { PostWithStats } from '@/lib/types';
import { getMyEchoes } from '@/hooks/useMyEchoes';
import PostCard from '@/app/components/PostCard';
import Link from 'next/link';
import { AnimatePresence, motion } from 'motion/react';
import { useOptimisticVote } from '@/hooks/useOptimisticVote';
import { useStaggeredRender } from '@/hooks/useStaggeredRender';
import logger from '@/lib/logger';

export default function MyEchoesPage() {
    const [myPosts, setMyPosts] = useState<PostWithStats[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const { userVotes, handleOptimisticVote } = useOptimisticVote();
    const [renderedPosts] = useStaggeredRender(myPosts);

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
                logger.error(error);
            } finally {
                setIsLoading(false);
            }
        };
        fetchMyPosts();
    }, []);

    const updateMyPostsState = (updatedPost: PostWithStats) => {
        setMyPosts(currentPosts =>
            currentPosts.map(p => (p.id === updatedPost.id ? updatedPost : p))
        );
    };

    const renderContent = () => {
        if (isLoading) {
            return (
                <div className="text-center text-gray-400 p-8">
                    <p>Loading your echoes...</p>
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
            <div className="flex flex-col gap-4">
                <AnimatePresence>
                    {renderedPosts.map(post => {
                        const isChildEcho = !!post.parentPostId;
                        const wrapperClass = isChildEcho
                            ? "border-l-2 border-accent/30 pl-4 ml-4"
                            : "";

                        return (
                            <motion.div
                                key={post.id}
                                className={wrapperClass}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0, transition: { ease: "easeOut", duration: 0.8 } }}
                                exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
                                layout
                            >
                                <PostCard
                                    post={post}
                                    isLink={!isChildEcho}
                                    onVote={(_, voteType) => handleOptimisticVote(post, voteType, updateMyPostsState)}
                                    userVote={userVotes[post.id]}
                                />
                            </motion.div>
                        );
                    })}
                </AnimatePresence>
            </div>
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
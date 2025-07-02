// sucecho/src/app/my-echoes/page.tsx
"use client";

import { useState, useEffect, useCallback } from 'react';
import type { PostWithStats } from '@/lib/types';
import { getMyEchoes } from '@/hooks/useMyEchoes';
import PostCard from '@/app/components/PostCard';
import Link from 'next/link';
import { AnimatePresence, motion } from 'motion/react';
import { useMyEchoesManager } from '@/hooks/useMyEchoesManager';
import logger from '@/lib/logger';
import { usePageVisibility } from '@/hooks/usePageVisibility';
import LoadingVideo from '../components/LoadingVideo';

export default function MyEchoesPage() {
    const [initialPosts] = useState<PostWithStats[]>([]);
    const { posts, setPosts, userVotes, handleVote, handlePostFaded } = useMyEchoesManager(initialPosts);
    const [isLoading, setIsLoading] = useState(true);
    const isVisible = usePageVisibility();

    const fetchMyPosts = useCallback(async (isRefreshing = false) => {
        const postIds = getMyEchoes();
        if (postIds.length === 0) {
            setIsLoading(false);
            return;
        }

        if (!isRefreshing) {
            setIsLoading(true);
        }

        try {
            const res = await fetch('/api/posts/mine', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ postIds }),
            });
            if (!res.ok) throw new Error('Failed to fetch your echoes');
            const fetchedPosts: PostWithStats[] = await res.json();

            setPosts((currentPosts: PostWithStats[]) => {
                const postMap = new Map(currentPosts.map(p => [p.id, p]));
                fetchedPosts.forEach(post => postMap.set(post.id, post));
                const mergedPosts = Array.from(postMap.values());
                mergedPosts.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
                return mergedPosts;
            });

        } catch (error) {
            logger.error(error);
        } finally {
            if (!isRefreshing) {
                setIsLoading(false);
            }
        }
    }, [setPosts]);

    useEffect(() => {
        fetchMyPosts(false);
    }, [fetchMyPosts]);

    useEffect(() => {
        if (isVisible && !isLoading) {
            logger.log('"My Echoes" tab is visible again, refreshing posts...');
            fetchMyPosts(true);
        }
    }, [isVisible, isLoading, fetchMyPosts]);


    const renderContent = () => {
        if (isLoading) {
            return <LoadingVideo label="正在加载你的回音..." />;
        }
        if (posts.length === 0) {
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
                    {posts.map(post => {
                        const isChildEcho = !!post.parentPostId;
                        const wrapperClass = isChildEcho ? "border-l-2 border-accent/30 pl-4 ml-4" : "";

                        return (
                            <motion.div
                                key={post.id}
                                className={wrapperClass}
                                layout
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0, transition: { ease: "easeOut", duration: 0.8 } }}
                                exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
                            >
                                <PostCard
                                    post={post}
                                    isLink={!isChildEcho}
                                    onVote={(_, voteType) => handleVote(post, voteType)}
                                    userVote={userVotes[post.id]}
                                    isPurifying={post.isPurifying}
                                    onPurificationComplete={handlePostFaded}
                                    onDeletionComplete={handlePostFaded}
                                    onFaded={handlePostFaded}
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
                    ← 返回回音壁
                </Link>
            </header>
            <main className="mt-4">
                {renderContent()}
            </main>
        </div>
    );
}
// sucecho/src/app/my-echoes/page.tsx
"use client";

import { useState, useEffect, useCallback, useRef } from 'react';
import type { PostWithStats } from '@/lib/types';
import { getMyEchoes } from '@/hooks/useMyEchoes';
import PostCard from '@/app/components/PostCard';
import Link from 'next/link';
import { AnimatePresence, motion } from 'motion/react';
import { useMyEchoesManager } from '@/hooks/useMyEchoesManager';
import logger from '@/lib/logger';
import { usePageVisibility } from '@/hooks/usePageVisibility';
import LoadingSpinner from '../components/LoadingSpinner';
import { getPurifiedPostIds } from '@/lib/purifiedStore';
import { Icon } from '../components/Icon';

export default function MyEchoesPage() {
    const { posts, setPosts, userVotes, handleVote, handlePostFaded, handlePostPurified } = useMyEchoesManager([]);
    const [isLoading, setIsLoading] = useState(true);
    const isVisible = usePageVisibility();
    const [purifiedPostIds, setPurifiedPostIds] = useState<Set<number>>(new Set());

    useEffect(() => {
        setPurifiedPostIds(getPurifiedPostIds());
    }, []);

    const fetchMyPosts = useCallback(async (isRefreshing = false) => {
        const postIds = getMyEchoes();
        if (postIds.length === 0) {
            setIsLoading(false);
            return;
        }
        if (!isRefreshing) setIsLoading(true);

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
            if (!isRefreshing) setIsLoading(false);
        }
    }, [setPosts]);

    useEffect(() => {
        fetchMyPosts(false);
    }, [fetchMyPosts]);

    const prevIsVisibleRef = useRef<boolean>(true);
    useEffect(() => {
        if (
            prevIsVisibleRef.current === false &&
            isVisible &&
            !isLoading
        ) {
            logger.log('"My Echoes" tab is visible again, refreshing posts...');
            fetchMyPosts(true);
        }
        prevIsVisibleRef.current = isVisible;
    }, [isVisible, isLoading, fetchMyPosts]);

    const renderContent = () => {
        if (isLoading) {
            return <LoadingSpinner label="正在加载你的回音..." />;
        }

        const displayablePosts = posts.filter(p => !purifiedPostIds.has(p.id));

        if (displayablePosts.length === 0) {
            return (
                <div className="flex flex-col items-center justify-center text-gray-400 p-8 rounded-lg gap-2" style={{ backgroundColor: 'var(--card-background)' }}>
                    <div className="mb-3">
                        <Icon name="edit-line" className="w-10 h-10 text-accent" />
                    </div>
                    <p className="text-xl font-semibold">你还没有发布任何回音。</p>
                    <p className="text-base mt-2">在本设备上发布的回音会自动出现在这里。</p>
                    <Link href="/compose" className="mt-6 underline text-accent font-bold text-lg hover:text-accent/80 transition-colors">
                        发布第一条回音
                    </Link>
                </div>
            );
        }

        return (
            <div className="flex flex-col gap-4">
                <AnimatePresence>
                    {displayablePosts.map(post => {
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
                                    onPurificationComplete={(postId) => {
                                        handlePostFaded(postId);
                                        setPurifiedPostIds(prev => new Set([...prev, postId]));
                                    }}
                                    onDeletionComplete={handlePostFaded}
                                    onFaded={handlePostFaded}
                                    onAutoPurify={handlePostPurified}
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
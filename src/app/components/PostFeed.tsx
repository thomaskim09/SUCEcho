// sucecho/src/app/components/PostFeed.tsx
"use client";

import { useState, useEffect, useCallback, useRef } from 'react';
import type { PostWithStats } from '@/lib/types';
import PostCard from './PostCard';
import { AnimatePresence, motion } from 'motion/react';
import { usePostListManager } from '@/hooks/usePostListManager';
import logger from '@/lib/logger';
import { useTabLeaderContext } from './TabLeaderProvider';
import AdvertisementCard from './AdvertisementCard';
import { usePageVisibility } from '@/hooks/usePageVisibility';
import LoadingVideo from './LoadingVideo';

const POST_FEED_LIMIT = parseInt(process.env.NEXT_PUBLIC_POST_FEED_LIMIT || '10', 10);

export default function PostFeed() {
    const [initialPosts] = useState<PostWithStats[]>([]);
    const [initialPostIds, setInitialPostIds] = useState<Set<number>>(new Set());
    const { posts, setPosts, userVotes, handleVote, handleDelete, handlePostFaded } = usePostListManager(initialPosts);
    const [isLoading, setIsLoading] = useState(true);
    const [isFetchingMore, setIsFetchingMore] = useState(false);
    const [nextCursor, setNextCursor] = useState<number | null>(null);
    const observer = useRef<IntersectionObserver | null>(null);
    const { status } = useTabLeaderContext();
    const isVisible = usePageVisibility();

    const postVariants = {
        initial: (isNew: boolean) => ({
            opacity: 0,
            x: isNew ? -100 : 0,
            y: isNew ? 0 : 20,
        }),
        animate: {
            opacity: 1,
            x: 0,
            y: 0,
            transition: { ease: "easeOut" as const, duration: 0.6 }
        },
    };

    const fetchInitialPosts = useCallback(async (isRefreshing = false) => {
        if (status !== 'leader') return;

        if (!isRefreshing) {
            setIsLoading(true);
        }

        try {
            const res = await fetch(`/api/posts?limit=${POST_FEED_LIMIT}`);
            if (!res.ok) throw new Error('Failed to fetch posts');
            const { posts: fetchedPosts, nextCursor: initialNextCursor } = await res.json();

            setPosts(currentPosts => {
                const postMap = new Map(currentPosts.map(p => [p.id, p]));
                fetchedPosts.forEach((post: PostWithStats) => postMap.set(post.id, post));
                const mergedPosts = Array.from(postMap.values());
                mergedPosts.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
                return mergedPosts;
            });

            setInitialPostIds(new Set(fetchedPosts.map((p: PostWithStats) => p.id)));
            setNextCursor(initialNextCursor);
        } catch (error) {
            logger.error("Error fetching initial posts:", error);
        } finally {
            if (!isRefreshing) {
                setIsLoading(false);
            }
        }
    }, [status, setPosts]);

    const loadMorePosts = useCallback(async () => {
        if (isFetchingMore || !nextCursor) return;
        if (status !== 'leader') return;
        setIsFetchingMore(true);
        try {
            const res = await fetch(`/api/posts?limit=${POST_FEED_LIMIT}&cursor=${nextCursor}`);
            if (!res.ok) throw new Error('Failed to fetch more posts');
            const { posts: newPosts, nextCursor: newNextCursor } = await res.json();
            setPosts(prev => [...prev, ...newPosts]);
            setNextCursor(newNextCursor);
        } catch (error) {
            logger.error("Error loading more posts:", error);
        } finally {
            setIsFetchingMore(false);
        }
    }, [nextCursor, isFetchingMore, setPosts, status]);

    const sentinelRef = useCallback((node: HTMLDivElement | null) => {
        if (isLoading) return;
        if (observer.current) observer.current.disconnect();
        observer.current = new IntersectionObserver(entries => {
            if (entries[0].isIntersecting && nextCursor) {
                loadMorePosts();
            }
        });
        if (node) observer.current.observe(node);
    }, [isLoading, loadMorePosts, nextCursor]);

    useEffect(() => {
        if (status === 'leader') {
            fetchInitialPosts(false);
        }
    }, [status, fetchInitialPosts]);

    useEffect(() => {
        if (isVisible && !isLoading && status === 'leader') {
            logger.log('Tab is visible again, refreshing post feed...');
            fetchInitialPosts(true);
        }
    }, [isVisible, isLoading, status, fetchInitialPosts]);

    if (status === 'checking') {
        return <div className="text-center text-gray-400 p-8"><p>加载回音中...</p></div>;
    }
    if (status === 'follower') {
        return <div className="text-center text-gray-400 p-8"><p>请关闭其他标签页并刷新本页以查看回音。</p></div>;
    }

    if (isLoading) {
        return <LoadingVideo label="加载回音中..." />;
    }

    const showEndLabel = !isLoading && !isFetchingMore && !nextCursor;

    const twentyFourHours = 24 * 60 * 60 * 1000;
    const unexpiredPosts = posts.filter(post => {
        const postAge = new Date().getTime() - new Date(post.createdAt).getTime();
        return postAge < twentyFourHours;
    });

    return (
        <div className="flex flex-col gap-4">
            <AnimatePresence>
                {unexpiredPosts.map(post => {
                    if (post.type === 'ADVERTISEMENT') {
                        return (
                            <AdvertisementCard
                                key={post.id}
                                post={post}
                                onFaded={handlePostFaded}
                                onDelete={handleDelete}
                                onDeletionComplete={handlePostFaded}
                            />
                        );
                    }

                    const isNew = !initialPostIds.has(post.id);
                    return (
                        <motion.div
                            key={post.id}
                            custom={isNew}
                            variants={postVariants}
                            initial="initial"
                            animate="animate"
                            layout
                        >
                            <PostCard
                                post={post}
                                isPurifying={post.isPurifying}
                                onPurificationComplete={handlePostFaded}
                                onDeletionComplete={handlePostFaded}
                                onFaded={handlePostFaded}
                                onVote={(_, voteType) => handleVote(post, voteType)}
                                onDelete={handleDelete}
                                userVote={userVotes[post.id]}
                            />
                        </motion.div>
                    );
                })}
            </AnimatePresence>

            {nextCursor && <div ref={sentinelRef} className="h-10" />}
            {isFetchingMore && <p className="text-center text-gray-400 py-4">正在加载更多回音...</p>}

            {showEndLabel && posts.length > 0 && (
                <p className="text-center text-gray-500 py-8">--- 回音壁尽头 ---</p>
            )}

            {!isLoading && posts.length === 0 && (
                <p className="text-center text-gray-400 py-4">还没有回音。快来发布第一个吧！</p>
            )}
        </div>
    );
}
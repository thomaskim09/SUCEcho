// src/app/components/PostFeed.tsx
"use client";

import { useState, useEffect, useCallback, useRef, useLayoutEffect } from 'react';
import type { PostWithStats } from '@/lib/types';
import PostCard from './PostCard';
import { AnimatePresence, motion } from 'framer-motion';
import { usePostListManager } from '@/hooks/usePostListManager';
import logger from '@/lib/logger';
import { useTabLeaderContext } from './TabLeaderProvider';
import AdvertisementCard from './AdvertisementCard';
import { usePageVisibility } from '@/hooks/usePageVisibility';
import LoadingSpinner from './LoadingSpinner';
import { getPurifiedPostIds } from '@/lib/purifiedStore';
import FloatingNotification from './FloatingNotification';
import { useRouter } from 'next/navigation';

const POST_FEED_LIMIT = parseInt(
    process.env.NEXT_PUBLIC_POST_FEED_LIMIT || '10',
    10
);

export default function PostFeed() {
    const [pendingPosts, setPendingPosts] = useState<PostWithStats[]>([]);
    const isNearTopRef = useRef(true);
    const [initialPosts] = useState<PostWithStats[]>([]);
    const postsRef = useRef<PostWithStats[]>(initialPosts);
    const router = useRouter();
    const hasFetchedInitialPosts = useRef(false);

    function handleNewPost(newPost: PostWithStats) {
        const postExists = postsRef.current.some(p => p.id === newPost.id) || pendingPosts.some(p => p.id === newPost.id);
        if (postExists) return;
        if (isNearTopRef.current) {
            setPosts(prev => [newPost, ...prev]);
        } else {
            setPendingPosts(prev => [newPost, ...prev]);
        }
    }

    const {
        posts,
        setPosts,
        userVotes,
        handleVote,
        handleDelete,
        handlePostFaded,
        handlePostPurified,
    } = usePostListManager(initialPosts, handleNewPost);

    useEffect(() => { postsRef.current = posts; }, [posts]);

    const [isLoading, setIsLoading] = useState(true);
    const [isFetchingMore, setIsFetchingMore] = useState(false);
    const [nextCursor, setNextCursor] = useState<number | null>(null);
    const observer = useRef<IntersectionObserver | null>(null);
    const { status } = useTabLeaderContext();
    const isVisible = usePageVisibility();
    const [purifiedPostIds, setPurifiedPostIds] = useState<Set<number>>(
        new Set()
    );
    const hasRestoredFromCache = useRef(false);

    useEffect(() => {
        const handleScroll = () => {
            const nearTop = window.scrollY < 100;
            isNearTopRef.current = nearTop;
            if (nearTop && pendingPosts.length > 0) {
                setPosts(prev => [...pendingPosts, ...prev]);
                setPendingPosts([]);
            }
        };
        window.addEventListener('scroll', handleScroll, { passive: true });
        return () => window.removeEventListener('scroll', handleScroll);
    }, [pendingPosts, setPosts]);

    const postVariants = {
        initial: {
            opacity: 0,
            y: 20,
        },
        animate: {
            opacity: 1,
            y: 0,
            transition: { ease: 'easeOut' as const, duration: 0.6 },
        },
    };

    const fetchInitialPosts = useCallback(async (isRefreshing = false) => {
        if (hasFetchedInitialPosts.current && !isRefreshing) return;
        if (status !== 'leader') return;
        if (!isRefreshing) setIsLoading(true);
        hasFetchedInitialPosts.current = true;

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

            setNextCursor(initialNextCursor);
        } catch (error) {
            logger.error('Error fetching initial posts:', error);
        } finally {
            if (!isRefreshing) setIsLoading(false);
        }
    }, [status, setPosts]);


    const prevIsVisibleRef = useRef<boolean>(true);
    useEffect(() => {
        if (
            prevIsVisibleRef.current === false &&
            isVisible &&
            !isLoading &&
            status === 'leader'
        ) {
            logger.log('Tab is visible again, refreshing post feed...');
            fetchInitialPosts(true);
        }
        prevIsVisibleRef.current = isVisible;
    }, [isVisible, isLoading, status, fetchInitialPosts]);

    useEffect(() => {
        setPurifiedPostIds(getPurifiedPostIds());
    }, []);

    const loadMorePosts = useCallback(async () => {
        if (isFetchingMore || !nextCursor || status !== 'leader') return;
        setIsFetchingMore(true);

        try {
            const res = await fetch(
                `/api/posts?limit=${POST_FEED_LIMIT}&cursor=${nextCursor}`
            );
            if (!res.ok) throw new Error('Failed to fetch more posts');
            const { posts: newPosts, nextCursor: newNextCursor } = await res.json();

            setPosts((prev) => {
                const postMap = new Map(prev.map((p) => [p.id, p]));
                newPosts.forEach((post: PostWithStats) => postMap.set(post.id, post));
                const mergedPosts = Array.from(postMap.values());
                mergedPosts.sort(
                    (a, b) =>
                        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
                );
                return mergedPosts;
            });
            setNextCursor(newNextCursor);
        } catch (error) {
            logger.error('Error loading more posts:', error);
        } finally {
            setIsFetchingMore(false);
        }
    }, [nextCursor, isFetchingMore, status, setPosts]);

    const sentinelRef = useCallback(
        (node: HTMLDivElement | null) => {
            if (isLoading) return;
            if (observer.current) observer.current.disconnect();
            observer.current = new IntersectionObserver((entries) => {
                if (entries[0].isIntersecting && nextCursor) {
                    loadMorePosts();
                }
            });
            if (node) observer.current.observe(node);
        },
        [isLoading, loadMorePosts, nextCursor]
    );

    useEffect(() => {
        if (status === 'leader' && !hasRestoredFromCache.current && !hasFetchedInitialPosts.current) {
            fetchInitialPosts(false);
        }
    }, [status, fetchInitialPosts]);

    const handleFloatingBarClick = () => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const getLastVisiblePostId = () => {
        const postDivs = Array.from(document.querySelectorAll('[data-post-id]'));
        let lastVisibleId = null;
        for (let i = 0; i < postDivs.length; i++) {
            const el = postDivs[i] as HTMLElement;
            const rect = el.getBoundingClientRect();
            if (rect.top < window.innerHeight && rect.bottom > 0) {
                lastVisibleId = el.getAttribute('data-post-id');
            }
        }
        return lastVisibleId;
    };

    const handlePostClick = useCallback((postId: number) => {
        sessionStorage.setItem('postFeedScroll', window.scrollY.toString());
        const lastVisibleId = getLastVisiblePostId();
        if (lastVisibleId) {
            sessionStorage.setItem('postFeedLastVisibleId', lastVisibleId);
        }
        sessionStorage.setItem('postFeedReturnExpected', 'true');
        try {
            sessionStorage.setItem('postFeedCache', JSON.stringify(posts));
        } catch { }
        router.push(`/post/${postId}`);
    }, [router, posts]);

    // Save feed state and scroll position before navigating to compose (comment)
    const handleCommentNavigate = useCallback((parentPostId: number) => {
        sessionStorage.setItem('postFeedScroll', window.scrollY.toString());
        const postDivs = Array.from(document.querySelectorAll('[data-post-id]'));
        let lastVisibleId = null;
        for (let i = 0; i < postDivs.length; i++) {
            const el = postDivs[i] as HTMLElement;
            const rect = el.getBoundingClientRect();
            if (rect.top < window.innerHeight && rect.bottom > 0) {
                lastVisibleId = el.getAttribute('data-post-id');
            }
        }
        if (lastVisibleId) {
            sessionStorage.setItem('postFeedLastVisibleId', lastVisibleId);
        }
        sessionStorage.setItem('postFeedReturnExpected', 'true');
        try {
            sessionStorage.setItem('postFeedCache', JSON.stringify(posts));
        } catch { }
        router.push(`/compose?parentPostId=${parentPostId}`);
    }, [router, posts]);

    useLayoutEffect(() => {
        if (!isLoading && sessionStorage.getItem('postFeedReturnExpected') === 'true' && !hasRestoredFromCache.current) {
            const cached = sessionStorage.getItem('postFeedCache');
            if (cached) {
                try {
                    const cachedPosts: PostWithStats[] = JSON.parse(cached);
                    const updatedPostDetailsJSON = sessionStorage.getItem('updatedPostDetails');
                    if (updatedPostDetailsJSON) {
                        const updatedPostDetails: PostWithStats = JSON.parse(updatedPostDetailsJSON);
                        const postIndex = cachedPosts.findIndex(p => p.id === updatedPostDetails.id);
                        if (postIndex !== -1) {
                            cachedPosts[postIndex].stats = updatedPostDetails.stats;
                            logger.log(`Updated post #${updatedPostDetails.id} stats from sessionStorage.`);
                        }
                        sessionStorage.removeItem('updatedPostDetails'); // Clean up
                    }

                    setPosts(cachedPosts);
                    hasRestoredFromCache.current = true;
                    hasFetchedInitialPosts.current = true;
                    setIsLoading(false);
                    setTimeout(() => {
                        const savedScroll = sessionStorage.getItem('postFeedScroll');
                        if (savedScroll) {
                            window.scrollTo(0, parseInt(savedScroll, 10));
                        }
                        sessionStorage.removeItem('postFeedCache');
                        sessionStorage.removeItem('postFeedScroll');
                        sessionStorage.removeItem('postFeedLastVisibleId');
                        sessionStorage.removeItem('postFeedReturnExpected');
                    }, 0);
                } catch {
                    hasRestoredFromCache.current = true;
                    fetchInitialPosts();
                }
            } else {
                hasRestoredFromCache.current = true;
                fetchInitialPosts();
            }
        }
        // react-hooks/exhaustive-deps
    }, [isLoading, setPosts, fetchInitialPosts]);

    if (status === 'checking')
        return (
            <div className="text-center text-gray-400 p-8">
                <p>加载回音中...</p>
            </div>
        );
    if (status === 'follower')
        return (
            <div className="text-center text-gray-400 p-8">
                <p>请关闭其他标签页并刷新本页以查看回音。</p>
            </div>
        );
    if (isLoading) return <LoadingSpinner label="加载回音中..." />;

    const twentyFourHours = 24 * 60 * 60 * 1000;

    const displayablePosts = posts.filter((post) => {
        const postAge = new Date().getTime() - new Date(post.createdAt).getTime();
        return postAge < twentyFourHours && !purifiedPostIds.has(post.id);
    });

    const showEndLabel =
        !isLoading && !isFetchingMore && !nextCursor && displayablePosts.length > 0;

    return (
        <div className="flex flex-col gap-4">
            <AnimatePresence>
                {pendingPosts.length > 0 && (
                    <FloatingNotification
                        count={pendingPosts.length}
                        onClick={handleFloatingBarClick}
                    />
                )}
            </AnimatePresence>

            <AnimatePresence>
                {displayablePosts.map((post) => {
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
                    const isNew = !posts.some((p) => p.id === post.id);
                    return (
                        <motion.div
                            key={post.id}
                            data-post-id={post.id}
                            custom={isNew}
                            variants={postVariants}
                            initial="initial"
                            animate="animate"
                            layout
                            onClick={() => handlePostClick(post.id)}
                            style={{ cursor: 'pointer' }}
                        >
                            <PostCard
                                post={post}
                                isPurifying={post.isPurifying}
                                onPurificationComplete={(postId) => {
                                    handlePostFaded(postId);
                                    setPurifiedPostIds((prev) => new Set([...prev, postId]));
                                }}
                                onDeletionComplete={handlePostFaded}
                                onFaded={handlePostFaded}
                                onVote={(_, voteType) => handleVote(post, voteType)}
                                onDelete={handleDelete}
                                userVote={userVotes[post.id]}
                                onAutoPurify={handlePostPurified}
                                onCommentNavigate={handleCommentNavigate}
                            />
                        </motion.div>
                    );
                })}
            </AnimatePresence>

            {nextCursor && <div ref={sentinelRef} className="h-10" />}
            {isFetchingMore && (
                <p className="text-center text-gray-400 py-4">正在加载更多回音...</p>
            )}
            {showEndLabel && (
                <p className="text-center text-gray-500 py-8">--- 回音壁尽头 ---</p>
            )}
            {!isLoading && displayablePosts.length === 0 && (
                <p className="text-center text-gray-400 py-4">
                    还没有回音。
                    <br />
                    快来发布第一个吧！
                </p>
            )}
        </div>
    );
}
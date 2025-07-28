// SUCEcho_packaged/src/app/components/PostFeed.tsx
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
import { getExpiredPostIds, addExpiredPostId } from '@/lib/expiredStore';
import FloatingNotification from './FloatingNotification';
import { useRouter } from 'next/navigation';
import { useFingerprint } from '@/context/FingerprintContext';
import { useInfoModal } from '@/context/InfoModalContext';


const POST_FEED_LIMIT = parseInt(
    process.env.NEXT_PUBLIC_POST_FEED_LIMIT || '10',
    10
);

export default function PostFeed({ feedType, fetchMode = 'feed' }: { feedType: 'EPHEMERAL' | 'PERMANENT' | 'JOB' | 'ALL', fetchMode?: 'feed' | 'my-echoes' }) {
    const [pendingPosts, setPendingPosts] = useState<PostWithStats[]>([]);
    const isNearTopRef = useRef(true);
    const [initialPosts] = useState<PostWithStats[]>([]);
    const postsRef = useRef<PostWithStats[]>(initialPosts);
    const router = useRouter();
    const hasFetchedInitialPosts = useRef(false);
    const { fingerprint } = useFingerprint();
    const { showInfoModal } = useInfoModal();

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
    } = usePostListManager(initialPosts, handleNewPost, feedType);

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
    const [expiredPostIds, setExpiredPostIds] = useState<Set<number>>(
        new Set()
    );
    const hasRestoredFromCache = useRef(false);

    useEffect(() => {
        if (feedType === 'JOB') {
            showInfoModal({
                title: "欢迎来到谋生墙",
                iconName: "briefcase",
                content: "这里是为南院人量身打造的互助平台。无论是寻找项目伙伴、寻找实习机会，还是社团招募，你都可以在这里找到归属。在这里发布的内容将不会过期消散，愿你也能在这里，觅得与你心意相通的志同道合，亦或寻得那条与你有缘的谋生之道。",
                storageKey: 'hasSeenJobFeedInfo',
            });
        } else if (feedType === 'PERMANENT') {
            showInfoModal({
                title: "欢迎来到时光档",
                iconName: "archive",
                content: "在南院，有些话语和想法，你或许希望能留存更久。无论是想吐槽日常、分享见闻，还是记录下此刻的心情，都可以在这里放下。因为在这里发布的内容不会过期消散，如同被岁月温柔收藏的时光档案，永远闪耀着属于南院人的独特光华。",
                storageKey: 'hasSeenPermanentFeedInfo',
            });
        }
    }, [feedType, showInfoModal]);

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
        if ((fetchMode === 'my-echoes' && !fingerprint) || (hasFetchedInitialPosts.current && !isRefreshing) || status !== 'leader') {
            return;
        }
        if (!isRefreshing) setIsLoading(true);
        hasFetchedInitialPosts.current = true;

        try {
            let res;
            if (fetchMode === 'my-echoes') {
                res = await fetch(`/api/posts/mine`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ fingerprintHash: fingerprint, limit: POST_FEED_LIMIT }),
                });
            } else {
                res = await fetch(`/api/posts?limit=${POST_FEED_LIMIT}&feed=${feedType}`);
            }

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
    }, [status, setPosts, feedType, fetchMode, fingerprint]);


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
        if (fetchMode === 'my-echoes') {
            setExpiredPostIds(getExpiredPostIds());
        }
    }, [fetchMode]);

    const handlePostExpired = (postId: number) => {
        if (fetchMode === 'my-echoes') {
            addExpiredPostId(postId);
        }
        handlePostFaded(postId);
    };

    const loadMorePosts = useCallback(async () => {
        if (isFetchingMore || !nextCursor || status !== 'leader') return;
        setIsFetchingMore(true);

        try {
            let res;
            if (fetchMode === 'my-echoes') {
                res = await fetch(`/api/posts/mine`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ fingerprintHash: fingerprint, limit: POST_FEED_LIMIT, cursor: nextCursor }),
                });
            } else {
                res = await fetch(
                    `/api/posts?limit=${POST_FEED_LIMIT}&cursor=${nextCursor}&feed=${feedType}`
                );
            }

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
    }, [nextCursor, isFetchingMore, status, setPosts, feedType, fetchMode, fingerprint]);


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
    }, [status, fetchInitialPosts, fingerprint]);

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

    const handlePostClick = useCallback((postId: number, feedType: 'EPHEMERAL' | 'PERMANENT' | 'JOB') => {
        sessionStorage.setItem('postFeedScroll', window.scrollY.toString());
        const lastVisibleId = getLastVisiblePostId();
        if (lastVisibleId) {
            sessionStorage.setItem('postFeedLastVisibleId', lastVisibleId);
        }
        sessionStorage.setItem('postFeedReturnExpected', 'true');
        try {
            sessionStorage.setItem('postFeedCache', JSON.stringify(posts));
        } catch { }
        router.push(`/post/${postId}?feedType=${feedType}`);
    }, [router, posts]);

    const handleCommentNavigate = useCallback((parentPostId: number, feedType: 'EPHEMERAL' | 'PERMANENT' | 'JOB') => {
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
        router.push(`/compose?parentPostId=${parentPostId}&feedType=${feedType}`);
    }, [router, posts]);

    const handleReplyToComment = useCallback((parentPostId: number, replyToId: number) => {
        const post = posts.find(p => p.id === replyToId);
        if (post) {
            router.replace(`/compose?parentPostId=${parentPostId}&parentReplyId=${replyToId}&feedType=${post.feed}`);
        }
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
        if (purifiedPostIds.has(post.id)) {
            return false;
        }

        if (fetchMode === 'my-echoes' && expiredPostIds.has(post.id)) {
            return false;
        }

        if (fetchMode !== 'my-echoes' && post.feed === 'EPHEMERAL') {
            const postAge = new Date().getTime() - new Date(post.createdAt).getTime();
            if (postAge >= twentyFourHours) {
                return false;
            }
        }

        return true;
    });

    const feedEndLabels = {
        EPHEMERAL: '--- 回音壁尽头 ---',
        JOB: '--- 谋生墙尽头 ---',
        PERMANENT: '--- 时光档尽头 ---',
        ALL: '--- 我的回音尽头 ---',
    };

    const showEndLabel =
        !isLoading && !isFetchingMore && !nextCursor && displayablePosts.length > 0;

    return (
        <div className="flex flex-col gap-4 pb-24">
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
                    if (post.contentType === 'ADVERTISEMENT') {
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
                    const isChildEcho = !!post.parentPostId;
                    return (
                        <motion.div
                            key={post.id}
                            data-post-id={post.id}
                            custom={isNew}
                            variants={postVariants}
                            initial="initial"
                            animate="animate"
                            layout
                            onClick={() => !isChildEcho && handlePostClick(post.id, post.feed)}
                            className={isChildEcho ? "border-l-2 border-accent/30 pl-4 ml-4" : ""}
                            style={{ cursor: isChildEcho ? 'default' : 'pointer' }}
                        >
                            <PostCard
                                post={post}
                                isLink={!isChildEcho}
                                isPurifying={post.isPurifying}
                                onPurificationComplete={(postId) => {
                                    handlePostFaded(postId);
                                    setPurifiedPostIds((prev) => new Set([...prev, postId]));
                                }}
                                onDeletionComplete={handlePostFaded}
                                onFaded={handlePostExpired}
                                onVote={(_, voteType) => handleVote(post, voteType)}
                                onDelete={handleDelete}
                                userVote={userVotes[post.id]}
                                onAutoPurify={handlePostPurified}
                                onCommentNavigate={handleCommentNavigate}
                                onReplyClick={handleReplyToComment}
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
                <p className="text-center text-gray-500 py-8">{feedEndLabels[feedType]}</p>
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
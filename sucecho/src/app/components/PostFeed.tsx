// sucecho/src/app/components/PostFeed.tsx
"use client";

import { useState, useEffect, useCallback, useRef } from 'react';
import type { PostWithStats } from '@/lib/types';
import PostCard from './PostCard';
import { AnimatePresence, motion } from 'motion/react';
import { useOptimisticVote } from '@/hooks/useOptimisticVote';
import { useStaggeredRender } from '@/hooks/useStaggeredRender';
import logger from '@/lib/logger';

const POST_FEED_LIMIT = parseInt(process.env.NEXT_PUBLIC_POST_FEED_LIMIT || '10', 10);

export default function PostFeed() {
    const [posts, setPosts] = useState<PostWithStats[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isFetchingMore, setIsFetchingMore] = useState(false);
    const [nextCursor, setNextCursor] = useState<number | null>(null);
    const [renderedPosts, isStaggeringComplete] = useStaggeredRender(posts);
    const observer = useRef<IntersectionObserver | null>(null);
    const { userVotes, handleOptimisticVote } = useOptimisticVote();

    const loadMorePosts = useCallback(async () => {
        if (isFetchingMore || !nextCursor) return;
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
    }, [nextCursor, isFetchingMore]);

    const sentinelRef = useCallback((node: HTMLDivElement | null) => {
        if (isLoading || !isStaggeringComplete) return;
        if (observer.current) observer.current.disconnect();
        observer.current = new IntersectionObserver(entries => {
            if (entries[0].isIntersecting && nextCursor) {
                loadMorePosts();
            }
        });
        if (node) observer.current.observe(node);
    }, [isLoading, isStaggeringComplete, loadMorePosts, nextCursor]);


    const handlePostFaded = (postId: number) => {
        setPosts(prevPosts => prevPosts.filter(p => p.id !== postId));
    };

    const handleDelete = async (postId: number) => {
        if (!confirm(`您确定要删除帖子 #${postId} 吗？此操作无法撤销。`)) return;
        try {
            const res = await fetch(`/api/admin/posts/${postId}`, { method: 'DELETE' });
            if (!res.ok) {
                const error = await res.json();
                throw new Error(error.message || 'Failed to delete post');
            }
            setPosts(prevPosts =>
                prevPosts.map(p =>
                    p.id === postId ? { ...p, isPurifying: true } : p
                )
            );
        } catch (err: unknown) {
            alert(`Error: ${(err as Error).message}`);
        }
    };

    useEffect(() => {
        const fetchInitialPosts = async () => {
            try {
                const res = await fetch(`/api/posts?limit=${POST_FEED_LIMIT}`);
                if (!res.ok) throw new Error('Failed to fetch posts');
                const { posts: initialPosts, nextCursor: initialNextCursor } = await res.json();
                setPosts(initialPosts);
                setNextCursor(initialNextCursor);
            } catch (error) {
                logger.error("Error fetching initial posts:", error);
            } finally {
                setIsLoading(false);
            }
        };
        fetchInitialPosts();

        const eventSource = new EventSource('/api/live');
        logger.log("SSE Connection opened.");

        const handleNewPost = (event: MessageEvent) => {
            const newPost: PostWithStats = JSON.parse(event.data);
            logger.log("SSE event 'new_post' received:", newPost);
            if (!newPost.parentPostId) {
                setPosts(prevPosts => [newPost, ...prevPosts]);
            }
        };

        const handleVoteUpdate = (event: MessageEvent) => {
            const { postId, stats } = JSON.parse(event.data);
            logger.log("SSE event 'update_vote' received for post:", { postId, stats });
            setPosts(prevPosts =>
                prevPosts.map(post =>
                    post.id === postId ? { ...post, stats: stats } : post
                )
            );
        };

        const handleDeletePost = (event: MessageEvent) => {
            const { postId } = JSON.parse(event.data);
            logger.log("SSE event 'delete_post' received for post:", postId);
            setPosts(prevPosts =>
                prevPosts.map(p =>
                    p.id === postId ? { ...p, isPurifying: true } : p
                )
            );
        };

        eventSource.addEventListener('new_post', handleNewPost);
        eventSource.addEventListener('update_vote', handleVoteUpdate);
        eventSource.addEventListener('delete_post', handleDeletePost);

        return () => {
            eventSource.removeEventListener('new_post', handleNewPost);
            eventSource.removeEventListener('update_vote', handleVoteUpdate);
            eventSource.removeEventListener('delete_post', handleDeletePost);
            eventSource.close();
            logger.log("SSE Connection closed.");
        };
    }, []);

    const updatePostInState = (updatedPost: PostWithStats) => {
        setPosts(currentPosts =>
            currentPosts.map(p => (p.id === updatedPost.id ? updatedPost : p))
        );
    };

    if (isLoading) {
        return <div className="text-center text-gray-400 p-8"><p>加载回音中...</p></div>;
    }

    const showEndLabel = !isLoading && !isFetchingMore && !nextCursor;

    return (
        <div className="flex flex-col gap-4">
            <AnimatePresence>
                {renderedPosts.map(post => (
                    <motion.div
                        key={post.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0, transition: { ease: "easeOut", duration: 0.8 } }}
                        exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
                        layout
                    >
                        <PostCard
                            post={post}
                            isPurifying={post.isPurifying}
                            onPurificationComplete={handlePostFaded}
                            onFaded={handlePostFaded}
                            onVote={(_, voteType) => handleOptimisticVote(post, voteType, updatePostInState)}
                            onDelete={handleDelete}
                            userVote={userVotes[post.id]}
                        />
                    </motion.div>
                ))}
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
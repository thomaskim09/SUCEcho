// sucecho/src/app/components/PostFeed.tsx
"use client";

import { useState, useEffect, useCallback, useRef } from 'react';
import type { PostWithStats } from '@/lib/types';
import PostCard from './PostCard';
import PostSkeleton from './PostSkeleton';
import { AnimatePresence } from 'framer-motion';
import { useFingerprint } from '@/context/FingerprintContext';

const POST_FEED_LIMIT = parseInt(process.env.NEXT_PUBLIC_POST_FEED_LIMIT || '10', 10);

export default function PostFeed() {
    const [posts, setPosts] = useState<PostWithStats[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isFetchingMore, setIsFetchingMore] = useState(false);
    const [nextCursor, setNextCursor] = useState<number | null>(null);
    const [userVotes, setUserVotes] = useState<Record<number, 1 | -1>>({});

    const { fingerprint } = useFingerprint();
    const initialFetchDone = useRef(false);

    const observer = useRef<IntersectionObserver | null>(null);

    const loadMorePosts = useCallback(async () => {
        if (isFetchingMore || !nextCursor) return;
        setIsFetchingMore(true);
        try {
            const res = await fetch(`/api/posts?limit=${POST_FEED_LIMIT}&cursor=${nextCursor}`);
            if (!res.ok) throw new Error('Failed to fetch more posts');
            const { posts: newPosts, nextCursor: newNextCursor } = await res.json();

            const existingIds = new Set(posts.map(p => p.id));
            const uniqueNewPosts = newPosts.filter((p: PostWithStats) => !existingIds.has(p.id));

            setPosts(prev => [...prev, ...uniqueNewPosts]);
            setNextCursor(newNextCursor);
        } catch (error) {
            console.error("Error loading more posts:", error);
        } finally {
            setIsFetchingMore(false);
        }
    }, [nextCursor, isFetchingMore, posts]);

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

    // --- NEW HANDLER FOR WHEN ANIMATION FINISHES ---
    const handlePurificationComplete = (postId: number) => {
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
            setIsLoading(true);
            try {
                const res = await fetch(`/api/posts?limit=${POST_FEED_LIMIT}`);
                if (!res.ok) throw new Error('Failed to fetch posts');
                const { posts: initialPosts, nextCursor: initialNextCursor } = await res.json();
                setPosts(initialPosts);
                setNextCursor(initialNextCursor);
            } catch (error) {
                console.error("Error fetching initial posts:", error);
            } finally {
                setIsLoading(false);
            }
        };

        if (!initialFetchDone.current) {
            fetchInitialPosts();
            initialFetchDone.current = true;
        }

        const eventSource = new EventSource('/api/live');

        const handleNewPost = (event: MessageEvent) => {
            const newPost = JSON.parse(event.data);
            if (!newPost.parentId) {
                setPosts(prevPosts => [newPost, ...prevPosts]);
            }
        };

        const handleVoteUpdate = (event: MessageEvent) => {
            const { postId, stats } = JSON.parse(event.data);
            setPosts(prevPosts =>
                prevPosts.map(post =>
                    post.id === postId ? { ...post, stats: stats } : post
                )
            );
        };

        const handleDeletePost = (event: MessageEvent) => {
            const { postId } = JSON.parse(event.data);
            // This now ONLY starts the animation. It does not remove the post.
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
        };
    }, []);

    const handleOptimisticVote = (postId: number, voteType: 1 | -1) => {
        const originalPosts = JSON.parse(JSON.stringify(posts));
        const originalUserVotes = { ...userVotes };

        const currentVote = userVotes[postId];
        let newVoteState: 1 | -1 | undefined = voteType;

        let upvoteChange = 0;
        let downvoteChange = 0;

        // This logic correctly handles all 3 cases: new vote, un-vote, and changing a vote.
        if (currentVote === voteType) { // UN-VOTING
            newVoteState = undefined;
            if (voteType === 1) upvoteChange = -1;
            else downvoteChange = -1;
        } else if (currentVote) { // CHANGING VOTE (e.g., from up to down)
            if (voteType === 1) { // Changing to upvote
                upvoteChange = 1;
                downvoteChange = -1;
            } else { // Changing to downvote
                upvoteChange = -1;
                downvoteChange = 1;
            }
        } else { // NEW VOTE
            if (voteType === 1) upvoteChange = 1;
            else downvoteChange = 1;
        }

        setUserVotes(prev => {
            const newVotes = { ...prev };
            if (newVoteState) {
                newVotes[postId] = newVoteState;
            } else {
                delete newVotes[postId];
            }
            return newVotes;
        });

        setPosts(prevPosts =>
            prevPosts.map(post => {
                if (post.id === postId && post.stats) {
                    return {
                        ...post,
                        stats: {
                            ...post.stats,
                            upvotes: post.stats.upvotes + upvoteChange,
                            downvotes: post.stats.downvotes + downvoteChange,
                        },
                    };
                }
                return post;
            })
        );

        // The backend request remains the same
        const sendVoteRequest = async () => {
            if (!fingerprint) {
                setPosts(originalPosts);
                setUserVotes(originalUserVotes);
                return;
            };

            try {
                const res = await fetch('/api/votes', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ postId, voteType, fingerprintHash: fingerprint }),
                });
                if (!res.ok) {
                    const errorData = await res.json();
                    throw new Error(errorData.error || "Server vote failed");
                }
            } catch (error) {
                console.error("Reverting optimistic vote:", error);
                setPosts(originalPosts);
                setUserVotes(originalUserVotes);
                alert((error as Error).message);
            }
        };
        sendVoteRequest();
    };

    // Filter posts to only those within the last 24 hours
    const now = Date.now();
    const postsWithin24Hours = posts.filter(post => {
        const created = new Date(post.createdAt).getTime();
        return now - created <= 24 * 60 * 60 * 1000;
    });

    if (isLoading) {
        return (<div> <PostSkeleton /> <PostSkeleton /> <PostSkeleton /> </div>);
    }

    return (
        <div className="flex flex-col gap-4">
            <AnimatePresence initial={false}>
                {isLoading
                    ? Array.from({ length: POST_FEED_LIMIT }).map((_, i) => <PostSkeleton key={i} />)
                    : postsWithin24Hours.map(post => (
                        <PostCard
                            key={post.id}
                            post={post}
                            onPurificationComplete={handlePurificationComplete}
                            onVote={handleOptimisticVote}
                            onDelete={handleDelete}
                            userVote={userVotes[post.id]}
                        />
                    ))}
            </AnimatePresence>

            {nextCursor && <div ref={sentinelRef} className="h-10" />}
            {isFetchingMore && <p className="text-center text-gray-400 py-4">正在加载更多回音...</p>}
            {!isLoading && !isFetchingMore && !nextCursor && posts.length > 0 && <p className="text-center text-gray-500 py-8">--- 回音壁尽头 ---</p>}
            {!isLoading && posts.length === 0 && <p className="text-center text-gray-400 py-4">还没有回音。快来发布第一个吧！</p>}
        </div>
    );
} 
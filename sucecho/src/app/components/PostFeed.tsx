// sucecho/src/app/components/PostFeed.tsx
"use client";

import { useState, useEffect, useCallback, useRef } from 'react';
import type { PostWithStats } from '@/lib/types';
import PostCard from './PostCard';
import PostSkeleton from './PostSkeleton';
import { AnimatePresence } from 'framer-motion';
import { useFingerprint } from '@/context/FingerprintContext';

export default function PostFeed() {
    const [posts, setPosts] = useState<PostWithStats[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isFetchingMore, setIsFetchingMore] = useState(false);
    const [nextCursor, setNextCursor] = useState<number | null>(null);
    const [userVotes, setUserVotes] = useState<Record<number, 1 | -1>>({});

    const { fingerprint } = useFingerprint();

    // FIX: Initialize useRef with null and update the type accordingly
    const observer = useRef<IntersectionObserver | null>(null);

    const loadMorePosts = useCallback(async () => {
        if (isFetchingMore || !nextCursor) return;
        setIsFetchingMore(true);
        try {
            const res = await fetch(`/api/posts?limit=20&cursor=${nextCursor}`);
            if (!res.ok) throw new Error('Failed to fetch more posts');
            const { posts: newPosts, nextCursor: newNextCursor } = await res.json();
            setPosts(prev => [...prev, ...newPosts]);
            setNextCursor(newNextCursor);
        } catch (error) {
            console.error("Error loading more posts:", error);
        } finally {
            setIsFetchingMore(false);
        }
    }, [nextCursor, isFetchingMore]);

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
        const fetchInitialPosts = async () => {
            setIsLoading(true);
            try {
                const res = await fetch('/api/posts?limit=20');
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

        fetchInitialPosts();

        const eventSource = new EventSource('/api/live');

        const handleNewPost = (event: MessageEvent) => {
            const newPost = JSON.parse(event.data);
            if (!newPost.parentId) { // Only add top-level posts to the feed
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
            setPosts(prevPosts => prevPosts.filter(post => post.id !== postId));
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

        if (currentVote === voteType) {
            newVoteState = undefined;
            voteType === 1 ? upvoteChange = -1 : downvoteChange = -1;
        } else if (currentVote) {
            voteType === 1 ? (upvoteChange = 1, downvoteChange = -1) : (upvoteChange = -1, downvoteChange = 1);
        } else {
            voteType === 1 ? upvoteChange = 1 : downvoteChange = 1;
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
                if (!res.ok) throw new Error("Server vote failed");
            } catch (error) {
                console.error("Reverting optimistic vote:", error);
                setPosts(originalPosts);
                setUserVotes(originalUserVotes);
                alert("投票失败，请重试。");
            }
        };
        sendVoteRequest();
    };

    if (isLoading) {
        return (
            <div>
                <PostSkeleton />
                <PostSkeleton />
                <PostSkeleton />
            </div>
        );
    }

    return (
        <div>
            <AnimatePresence>
                {posts.map((post) => (
                    <PostCard
                        key={post.id}
                        post={post}
                        onVote={handleOptimisticVote}
                        userVote={userVotes[post.id]}
                    />
                ))}
            </AnimatePresence>

            {nextCursor && <div ref={sentinelRef} className="h-10" />}

            {isFetchingMore && <p className="text-center text-gray-400 py-4">加载更多回音...</p>}

            {!isLoading && !isFetchingMore && !nextCursor && posts.length > 0 &&
                <p className="text-center text-gray-500 py-8">--- 已到达回音壁的尽头 ---</p>
            }

            {!isLoading && posts.length === 0 &&
                <p className="text-center text-gray-400 py-4">暂无回音，快来发表第一条吧！</p>
            }
        </div>
    );
}

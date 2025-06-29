// sucecho/src/hooks/useLivePostUpdates.ts
'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import type { PostWithStats } from '@/lib/types';
import logger from '@/lib/logger';

export function useLivePostUpdates(initialPosts: PostWithStats[] = []) {
    const [posts, setPosts] = useState<PostWithStats[]>(initialPosts);
    const postsRef = useRef(posts);
    postsRef.current = posts;

    useEffect(() => {
        setPosts(initialPosts);
    }, [initialPosts]);

    const handleNewPost = useCallback((event: MessageEvent) => {
        const newPost: PostWithStats = JSON.parse(event.data);
        logger.log("SSE event 'new_post' received:", newPost);
        if (!newPost.parentPostId) {
            setPosts((prevPosts) => [newPost, ...prevPosts]);
        }
    }, []);

    const handleVoteUpdate = useCallback((event: MessageEvent) => {
        const { postId, stats, shouldPurify } = JSON.parse(event.data);
        logger.log("SSE event 'update_vote' received:", {
            postId,
            stats,
            shouldPurify,
        });
        setPosts((prevPosts) =>
            prevPosts.map((post) =>
                post.id === postId
                    ? {
                          ...post,
                          stats: stats,
                          isPurifying: shouldPurify || post.isPurifying,
                      }
                    : post
            )
        );
    }, []);

    const handleDeletePost = useCallback((event: MessageEvent) => {
        const { postId } = JSON.parse(event.data);
        logger.log("SSE event 'delete_post' received:", postId);
        setPosts((prevPosts) =>
            prevPosts.map((p) =>
                p.id === postId ? { ...p, isPurifying: true } : p
            )
        );
    }, []);

    useEffect(() => {
        const eventSource = new EventSource('/api/live');
        logger.log('SSE Connection opened.');

        eventSource.addEventListener('new_post', handleNewPost);
        eventSource.addEventListener('update_vote', handleVoteUpdate);
        eventSource.addEventListener('delete_post', handleDeletePost);

        return () => {
            eventSource.removeEventListener('new_post', handleNewPost);
            eventSource.removeEventListener('update_vote', handleVoteUpdate);
            eventSource.removeEventListener('delete_post', handleDeletePost);
            eventSource.close();
            logger.log('SSE Connection closed.');
        };
    }, [handleNewPost, handleVoteUpdate, handleDeletePost]);

    return [posts, setPosts] as const;
}

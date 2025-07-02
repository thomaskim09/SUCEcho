// sucecho/src/hooks/useLivePostUpdates.ts
'use client';

import { useState, useEffect, useCallback } from 'react';
import type { PostWithStats } from '@/lib/types';
import logger from '@/lib/logger';
import { useRealtime } from './useRealtime';
import { MAIN_CHANNEL } from '@/lib/supabase-realtime';

export function useLivePostUpdates(initialPosts: PostWithStats[] = []) {
    const [posts, setPosts] = useState<PostWithStats[]>(initialPosts);

    useEffect(() => {
        setPosts(initialPosts);
    }, [initialPosts]);

    const handleNewPost = useCallback((newPost: PostWithStats) => {
        logger.log("LIVE event 'new_post' received:", newPost);
        // Only add top-level posts to the main feed
        if (!newPost.parentPostId) {
            setPosts((prevPosts) => [newPost, ...prevPosts]);
        }
    }, []);

    const handleVoteUpdate = useCallback(
        (data: {
            postId: number;
            stats: PostWithStats['stats'];
            shouldPurify?: boolean;
        }) => {
            const { postId, stats, shouldPurify } = data;
            logger.log("LIVE event 'update_vote' received:", {
                postId,
                stats,
                shouldPurify,
            });
            setPosts((prevPosts) =>
                prevPosts.map((post) =>
                    post.id === postId
                        ? {
                              ...post,
                              stats,
                              isPurifying: shouldPurify || post.isPurifying,
                          }
                        : post
                )
            );
        },
        []
    );

    const handleDeletePost = useCallback((data: { postId: number }) => {
        const { postId } = data;
        logger.log(
            "LIVE event 'delete_post' received for admin deletion:",
            postId
        );
        setPosts((prevPosts) =>
            prevPosts.map((p) =>
                p.id === postId ? { ...p, isDeleting: true } : p
            )
        );
    }, []);

    // Subscribe to events using the centralized hook on the main channel
    useRealtime(MAIN_CHANNEL, {
        onNewPost: handleNewPost,
        onUpdateVote: handleVoteUpdate,
        onDeletePost: handleDeletePost,
    });

    return [posts, setPosts] as const;
}

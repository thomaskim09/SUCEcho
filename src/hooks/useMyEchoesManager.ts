// sucecho/src/hooks/useMyEchoesManager.ts
'use client';

import { useState, useEffect } from 'react';
import type { PostWithStats } from '@/lib/types';
import { useOptimisticVote } from './useOptimisticVote';

export const useMyEchoesManager = (initialPosts: PostWithStats[] = []) => {
    const [posts, setPosts] = useState<PostWithStats[]>(initialPosts);
    const { userVotes, handleOptimisticVote } = useOptimisticVote();

    const handlePostPurified = (postId: number) => {
        setPosts((prevPosts) =>
            prevPosts.map((p) =>
                p.id === postId ? { ...p, isPurifying: true } : p
            )
        );
    };

    const handlePostFaded = (postId: number) => {
        setPosts((prevPosts) => prevPosts.filter((p) => p.id !== postId));
    };

    const updatePostInState = (updatedPost: PostWithStats) => {
        setPosts((currentPosts) =>
            currentPosts.map((p) => (p.id === updatedPost.id ? updatedPost : p))
        );
    };

    const handlePostVanished = (postId: number) => {
        setPosts((prevPosts) =>
            prevPosts.map((p) =>
                p.id === postId ? { ...p, isDeleting: true } : p
            )
        );
    };

    const voteHandler = (post: PostWithStats, voteType: 1 | -1) => {
        handleOptimisticVote(
            post,
            voteType,
            updatePostInState,
            handlePostPurified,
            handlePostVanished
        );
    };

    return {
        posts,
        setPosts,
        userVotes,
        handleVote: voteHandler,
        handlePostFaded,
        handlePostPurified,
    };
};

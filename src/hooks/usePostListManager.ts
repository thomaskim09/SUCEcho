// sucecho/src/hooks/usePostListManager.ts
'use client';

import type { PostWithStats } from '@/lib/types';
import { useLivePostUpdates } from './useLivePostUpdates';
import { useOptimisticVote } from './useOptimisticVote';

/**
 * A centralized hook to manage a list of posts, including live updates,
 * voting, and admin actions.
 * @param initialPosts The initial array of posts to display.
 * @returns An object with state and handlers for a post list component.
 */
export const usePostListManager = (initialPosts: PostWithStats[] = []) => {
    const [posts, setPosts] = useLivePostUpdates(initialPosts);
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

    const handleDelete = async (postId: number) => {
        if (!confirm(`您确定要删除帖子 #${postId} 吗？此操作无法撤销。`))
            return;
        try {
            const res = await fetch(`/api/admin/posts/${postId}`, {
                method: 'DELETE',
            });
            if (!res.ok) {
                const error = await res.json();
                throw new Error(error.message || 'Failed to delete post');
            }
            // Use the isDeleting flag for the correct exit animation
            setPosts((prevPosts) =>
                prevPosts.map((p) =>
                    p.id === postId ? { ...p, isDeleting: true } : p
                )
            );
        } catch (err: unknown) {
            alert(`Error: ${(err as Error).message}`);
        }
    };

    const updatePostInState = (updatedPost: PostWithStats) => {
        setPosts((currentPosts) =>
            currentPosts.map((p) => (p.id === updatedPost.id ? updatedPost : p))
        );
    };

    const voteHandler = (post: PostWithStats, voteType: 1 | -1) => {
        handleOptimisticVote(
            post,
            voteType,
            updatePostInState,
            handlePostPurified
        );
    };

    return {
        posts,
        setPosts,
        userVotes,
        handleVote: voteHandler,
        handleDelete,
        handlePostFaded,
    };
};

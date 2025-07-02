// sucecho/src/hooks/useOptimisticVote.ts
'use client';

import { useState, useTransition } from 'react';
import { useFingerprint } from '@/context/FingerprintContext';
import type { PostWithStats } from '@/lib/types';
import logger from '@/lib/logger';

interface UseOptimisticVoteReturn {
    userVotes: Record<number, 1 | -1>;
    handleOptimisticVote: (
        post: PostWithStats,
        voteType: 1 | -1,
        updateStateCallback: (updatedPost: PostWithStats) => void,
        onPurifyCallback: (postId: number) => void
    ) => void;
    isVoting: boolean;
}

export function useOptimisticVote(): UseOptimisticVoteReturn {
    const [userVotes, setUserVotes] = useState<Record<number, 1 | -1>>({});
    const { fingerprint } = useFingerprint();
    const [isVoting, startTransition] = useTransition();

    const handleOptimisticVote = (
        post: PostWithStats,
        voteType: 1 | -1,
        updateStateCallback: (updatedPost: PostWithStats) => void,
        onPurifyCallback: (postId: number) => void
    ) => {
        if (!fingerprint) {
            alert('无法识别您的浏览器，请稍后再试。');
            return;
        }

        startTransition(() => {
            const postId = post.id;
            const originalPost = JSON.parse(JSON.stringify(post)); // Deep copy for rollback
            const originalVote = userVotes[postId];

            // Determine the new vote state
            const newUserVote =
                originalVote === voteType ? undefined : voteType;

            // Update the local record of user votes
            setUserVotes((prev) => {
                const newVotes = { ...prev };
                if (newUserVote) {
                    newVotes[postId] = newUserVote;
                } else {
                    delete newVotes[postId];
                }
                return newVotes;
            });

            // Calculate the new stats based on the change
            let upvoteChange = 0;
            let downvoteChange = 0;

            if (originalVote === voteType) {
                // Undoing a vote
                if (voteType === 1) upvoteChange = -1;
                else downvoteChange = -1;
            } else if (originalVote) {
                // Changing a vote
                if (voteType === 1) {
                    // from down to up
                    upvoteChange = 1;
                    downvoteChange = -1;
                } else {
                    // from up to down
                    upvoteChange = -1;
                    downvoteChange = 1;
                }
            } else {
                // New vote
                if (voteType === 1) upvoteChange = 1;
                else downvoteChange = 1;
            }

            const newStats = {
                upvotes: (post.stats?.upvotes ?? 0) + upvoteChange,
                downvotes: (post.stats?.downvotes ?? 0) + downvoteChange,
                replyCount: post.stats?.replyCount ?? 0,
            };

            // Create a completely new post object to ensure React re-renders
            const updatedPost: PostWithStats = {
                ...post,
                stats: newStats,
            };

            // Immediately update the UI
            updateStateCallback(updatedPost);

            // Send the request to the server
            const sendVoteRequest = async () => {
                try {
                    const res = await fetch('/api/votes', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            postId,
                            voteType,
                            fingerprintHash: fingerprint,
                        }),
                    });

                    if (!res.ok) {
                        const errorData = await res.json();
                        throw new Error(
                            errorData.error || 'Server vote failed'
                        );
                    }

                    const result = await res.json();
                    if (result.purified) {
                        onPurifyCallback(postId);
                    }
                } catch (error) {
                    logger.error('Reverting optimistic vote:', error);
                    alert((error as Error).message);

                    // Revert UI on error
                    setUserVotes((prev) => {
                        const newVotes = { ...prev };
                        if (originalVote) {
                            newVotes[postId] = originalVote;
                        } else {
                            delete newVotes[postId];
                        }
                        return newVotes;
                    });
                    updateStateCallback(originalPost);
                }
            };

            sendVoteRequest();
        });
    };

    return { userVotes, handleOptimisticVote, isVoting };
}

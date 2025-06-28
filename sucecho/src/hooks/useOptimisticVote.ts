// sucecho/src/hooks/useOptimisticVote.ts
'use client';

import { useState } from 'react';
import { useFingerprint } from '@/context/FingerprintContext';
import type { PostWithStats } from '@/lib/types';
import logger from '@/lib/logger';

interface UseOptimisticVoteReturn {
    userVotes: Record<number, 1 | -1>;
    handleOptimisticVote: (
        post: PostWithStats,
        voteType: 1 | -1,
        updateStateCallback: (updatedPost: PostWithStats) => void
    ) => void;
}

export function useOptimisticVote(): UseOptimisticVoteReturn {
    const [userVotes, setUserVotes] = useState<Record<number, 1 | -1>>({});
    const { fingerprint } = useFingerprint();

    const handleOptimisticVote = (
        post: PostWithStats,
        voteType: 1 | -1,
        updateStateCallback: (updatedPost: PostWithStats) => void
    ) => {
        if (!fingerprint) {
            alert('无法识别您的浏览器，请稍后再试。');
            return;
        }

        const postId = post.id;
        // Create a full deep copy of the original post for a reliable revert
        const originalPost = JSON.parse(JSON.stringify(post));
        const originalVote = userVotes[postId];

        let upvoteChange = 0;
        let downvoteChange = 0;
        let newUserVote: 1 | -1 | undefined = voteType;

        if (originalVote === voteType) {
            newUserVote = undefined;
            if (voteType === 1) upvoteChange = -1;
            else downvoteChange = -1;
        } else if (originalVote) {
            if (voteType === 1) {
                upvoteChange = 1;
                downvoteChange = -1;
            } else {
                upvoteChange = -1;
                downvoteChange = 1;
            }
        } else {
            if (voteType === 1) upvoteChange = 1;
            else downvoteChange = 1;
        }

        setUserVotes((prev) => {
            const newVotes = { ...prev };
            if (newUserVote) {
                newVotes[postId] = newUserVote;
            } else {
                delete newVotes[postId];
            }
            return newVotes;
        });

        // Explicitly create the new stats object to ensure it's not null and has the correct shape
        const newStats = {
            upvotes: (post.stats?.upvotes ?? 0) + upvoteChange,
            downvotes: (post.stats?.downvotes ?? 0) + downvoteChange,
            replyCount: post.stats?.replyCount ?? 0,
        };

        // Construct the final updated post object
        const updatedPost: PostWithStats = {
            ...post,
            stats: newStats,
        };

        updateStateCallback(updatedPost);

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
                    throw new Error(errorData.error || 'Server vote failed');
                }
            } catch (error) {
                logger.error('Reverting optimistic vote:', error);
                alert((error as Error).message);

                // Revert state using the deep-copied original post to ensure type safety
                setUserVotes((prev) => ({ ...prev, [postId]: originalVote }));
                updateStateCallback(originalPost);
            }
        };

        sendVoteRequest();
    };

    return { userVotes, handleOptimisticVote };
}

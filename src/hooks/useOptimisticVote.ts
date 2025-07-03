// src/hooks/useOptimisticVote.ts
'use client';

import { useState, useTransition, useEffect } from 'react';
import { useFingerprint } from '@/context/FingerprintContext';
import type { PostWithStats } from '@/lib/types';
import logger from '@/lib/logger';
import { addPurifiedPostId } from '@/lib/purifiedStore';
import { getStoredVotes, storeVote } from '@/lib/voteStore'; // Import the new functions

interface UseOptimisticVoteReturn {
    userVotes: Record<number, 1 | -1>;
    handleOptimisticVote: (
        post: PostWithStats,
        voteType: 1 | -1,
        updateStateCallback: (updatedPost: PostWithStats) => void,
        onPurifyCallback: (postId: number) => void,
        onPostVanished: (postId: number) => void
    ) => void;
    isVoting: boolean;
}

export function useOptimisticVote(): UseOptimisticVoteReturn {
    const [userVotes, setUserVotes] = useState<Record<number, 1 | -1>>({});
    const { fingerprint } = useFingerprint();
    const [isVoting, startTransition] = useTransition();

    useEffect(() => {
        setUserVotes(getStoredVotes());
    }, []);

    const handleOptimisticVote = (
        post: PostWithStats,
        voteType: 1 | -1,
        updateStateCallback: (updatedPost: PostWithStats) => void,
        onPurifyCallback: (postId: number) => void,
        onPostVanished: (postId: number) => void
    ) => {
        if (!fingerprint) {
            alert('无法识别您的浏览器，请稍后再试。');
            return;
        }

        startTransition(() => {
            const postId = post.id;
            const originalPost = JSON.parse(JSON.stringify(post));
            const originalVote = userVotes[postId];

            const newUserVote =
                originalVote === voteType ? undefined : voteType;

            storeVote(postId, newUserVote);

            setUserVotes((prev) => {
                const newVotes = { ...prev };
                if (newUserVote) {
                    newVotes[postId] = newUserVote;
                } else {
                    delete newVotes[postId];
                }
                return newVotes;
            });

            let upvoteChange = 0;
            let downvoteChange = 0;

            if (originalVote === voteType) {
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

            const newStats = {
                upvotes: (post.stats?.upvotes ?? 0) + upvoteChange,
                downvotes: (post.stats?.downvotes ?? 0) + downvoteChange,
                replyCount: post.stats?.replyCount ?? 0,
            };

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
                        if (
                            errorData.error ===
                            '该回音已消失，未能计入你的投票。'
                        ) {
                            onPostVanished(postId);
                        }
                        throw new Error(
                            errorData.error || 'Server vote failed'
                        );
                    }

                    const result = await res.json();

                    const serverCorrectedPost: PostWithStats = {
                        ...post,
                        stats: result.stats,
                    };
                    updateStateCallback(serverCorrectedPost);

                    if (result.purified) {
                        addPurifiedPostId(postId);
                        onPurifyCallback(postId);
                    }
                } catch (error) {
                    const errorMessage = (error as Error).message;
                    logger.error('Vote failed:', error);
                    alert(errorMessage);

                    if (errorMessage !== '该回音已消失，未能计入你的投票。') {
                        logger.log(
                            'Reverting optimistic vote due to server error.'
                        );
                        storeVote(postId, originalVote);
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
                }
            };

            sendVoteRequest();
        });
    };

    return { userVotes, handleOptimisticVote, isVoting };
}

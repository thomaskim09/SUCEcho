// src/hooks/useLivePostThreadUpdates.ts
'use client';

import { useState, useEffect, useCallback } from 'react';
import type { PostWithStats, PostWithReplies } from '@/lib/types';
import logger from '@/lib/logger';
import { useRealtime } from './useRealtime';
import { getPostRoomChannelName, MAIN_CHANNEL } from '@/lib/supabase-realtime';

type PostThread = PostWithReplies & {
    replies: PostWithReplies[];
};

const findReplyById = (
    replies: PostWithReplies[],
    id: number
): PostWithReplies | null => {
    for (const reply of replies) {
        if (reply.id === id) return reply;
        if (reply.replies?.length) {
            const found = findReplyById(reply.replies, id);
            if (found) return found;
        }
    }
    return null;
};

export function useLivePostThreadUpdates(initialPost: PostThread | null) {
    const [postThread, setPostThread] = useState<PostThread | null>(
        initialPost
    );

    useEffect(() => {
        setPostThread(initialPost);
    }, [initialPost]);

    const handleNewPost = useCallback((newPost: PostWithStats) => {
        setPostThread((prevThread) => {
            if (!prevThread) return null;
            if (findReplyById(prevThread.replies, newPost.id))
                return prevThread;

            logger.log(
                "LIVE 'new_post' is a new reply for the current thread:",
                newPost
            );

            const newReplyWithReplies: PostWithReplies = {
                ...newPost,
                replies: [],
            };

            const addReplyRecursively = (
                replies: PostWithReplies[]
            ): PostWithReplies[] => {
                return replies.map((reply) => {
                    if (reply.id === newPost.parentReplyId) {
                        return {
                            ...reply,
                            replies: [
                                ...(reply.replies || []),
                                newReplyWithReplies,
                            ],
                        };
                    }
                    if (reply.replies && reply.replies.length > 0) {
                        return {
                            ...reply,
                            replies: addReplyRecursively(reply.replies),
                        };
                    }
                    return reply;
                });
            };

            const newStats = prevThread.stats
                ? {
                      ...prevThread.stats,
                      replyCount: (prevThread.stats.replyCount ?? 0) + 1,
                  }
                : { upvotes: 0, downvotes: 0, replyCount: 1 };

            if (!newPost.parentReplyId) {
                return {
                    ...prevThread,
                    stats: newStats,
                    replies: [...prevThread.replies, newReplyWithReplies],
                };
            }

            const newReplies = addReplyRecursively(prevThread.replies);
            return { ...prevThread, stats: newStats, replies: newReplies };
        });
    }, []);

    const handleVoteUpdate = useCallback(
        (data: {
            postId: number;
            stats: PostWithStats['stats'];
            shouldPurify?: boolean;
        }) => {
            const { postId, stats, shouldPurify } = data;

            const updateRepliesRecursively = (
                replies: PostWithReplies[]
            ): PostWithReplies[] => {
                return replies.map((reply) => {
                    if (reply.id === postId) {
                        return {
                            ...reply,
                            stats,
                            isPurifying: shouldPurify || reply.isPurifying,
                        };
                    }
                    if (reply.replies && reply.replies.length > 0) {
                        return {
                            ...reply,
                            replies: updateRepliesRecursively(reply.replies),
                        };
                    }
                    return reply;
                });
            };

            setPostThread((currentThread) => {
                if (!currentThread) return null;
                if (currentThread.id === postId) {
                    return {
                        ...currentThread,
                        stats,
                        isPurifying: shouldPurify || currentThread.isPurifying,
                    };
                }
                return {
                    ...currentThread,
                    replies: updateRepliesRecursively(currentThread.replies),
                };
            });
        },
        []
    );

    const handleDeletePost = useCallback((data: { postId: number }) => {
        const { postId } = data;
        setPostThread((currentThread) => {
            if (!currentThread) return null;
            if (currentThread.id === postId) {
                return { ...currentThread, isDeleting: true };
            }
            const deleteRepliesRecursively = (
                replies: PostWithReplies[]
            ): PostWithReplies[] => {
                return replies.map((reply) => {
                    if (reply.id === postId) {
                        return { ...reply, isDeleting: true };
                    }
                    if (reply.replies && reply.replies.length > 0) {
                        return {
                            ...reply,
                            replies: deleteRepliesRecursively(reply.replies),
                        };
                    }
                    return reply;
                });
            };
            return {
                ...currentThread,
                replies: deleteRepliesRecursively(currentThread.replies),
            };
        });
    }, []);

    const isDetailsRealtimeEnabled =
        process.env.NEXT_PUBLIC_REALTIME_POST_DETAILS_ENABLED === 'true';
    const isGranularEnabled =
        process.env.NEXT_PUBLIC_GRANULAR_REALTIME_ENABLED === 'true';

    const channelName =
        initialPost && isDetailsRealtimeEnabled
            ? isGranularEnabled
                ? getPostRoomChannelName(initialPost.id)
                : MAIN_CHANNEL
            : null;

    useRealtime(channelName, {
        onNewPost: initialPost ? handleNewPost : undefined,
        onUpdateVote: initialPost ? handleVoteUpdate : undefined,
        onDeletePost: initialPost ? handleDeletePost : undefined,
        onDeleteReply: initialPost ? handleDeletePost : undefined,
        onDeleteParentPost: initialPost ? handleDeletePost : undefined,
    });

    return [postThread, setPostThread] as const;
}

// src/hooks/useLivePostThreadUpdates.ts
'use client';

import { useState, useEffect, useCallback } from 'react';
import type { PostWithStats } from '@/lib/types';
import logger from '@/lib/logger';
import { useRealtime } from './useRealtime';
import { getPostRoomChannelName, MAIN_CHANNEL } from '@/lib/supabase-realtime';

type PostThread = PostWithStats & {
    replies: PostWithStats[];
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
            if (
                !prevThread ||
                !newPost.parentPostId ||
                newPost.parentPostId.toString() !== prevThread.id.toString() ||
                prevThread.replies.some((r) => r.id === newPost.id)
            ) {
                return prevThread;
            }
            logger.log(
                "LIVE 'new_post' is a reply to the current thread:",
                newPost
            );

            const newStats = prevThread.stats
                ? {
                      ...prevThread.stats,
                      replyCount: (prevThread.stats.replyCount ?? 0) + 1,
                  }
                : { upvotes: 0, downvotes: 0, replyCount: 1 };

            return {
                ...prevThread,
                stats: newStats,
                replies: [...prevThread.replies, newPost],
            };
        });
    }, []);

    const handleVoteUpdate = useCallback(
        (data: {
            postId: number;
            stats: PostWithStats['stats'];
            shouldPurify?: boolean;
        }) => {
            const { postId, stats, shouldPurify } = data;
            logger.log("LIVE 'update_vote' received for post detail page:", {
                postId,
                stats,
                shouldPurify,
            });
            setPostThread((currentThread) => {
                if (!currentThread) return null;
                if (currentThread.id === postId) {
                    return {
                        ...currentThread,
                        stats,
                        isPurifying: shouldPurify || currentThread.isPurifying,
                    };
                }
                const updatedReplies = currentThread.replies.map((reply) =>
                    reply.id === postId
                        ? {
                              ...reply,
                              stats,
                              isPurifying: shouldPurify || reply.isPurifying,
                          }
                        : reply
                );
                return { ...currentThread, replies: updatedReplies };
            });
        },
        []
    );

    const handleDeletePost = useCallback((data: { postId: number }) => {
        const { postId } = data;
        logger.log(
            "LIVE 'delete_post' received for post detail page (admin deletion):",
            postId
        );
        setPostThread((currentThread) => {
            if (!currentThread) return null;

            if (currentThread.id === postId) {
                return { ...currentThread, isDeleting: true };
            }

            const replyExists = currentThread.replies.some(
                (p) => p.id === postId && !p.isDeleting
            );
            if (replyExists) {
                const updatedReplies = currentThread.replies.map((reply) =>
                    reply.id === postId ? { ...reply, isDeleting: true } : reply
                );

                const newStats = currentThread.stats
                    ? {
                          ...currentThread.stats,
                          replyCount: Math.max(
                              0,
                              (currentThread.stats.replyCount ?? 0) - 1
                          ),
                      }
                    : null;

                return {
                    ...currentThread,
                    stats: newStats,
                    replies: updatedReplies,
                };
            }

            return currentThread;
        });
    }, []);

    const isGranularEnabled =
        process.env.NEXT_PUBLIC_GRANULAR_REALTIME_ENABLED === 'true';

    const channelName =
        initialPost && isGranularEnabled
            ? getPostRoomChannelName(initialPost.id)
            : MAIN_CHANNEL;

    useRealtime(channelName, {
        onNewPost: initialPost ? handleNewPost : undefined,
        onUpdateVote: initialPost ? handleVoteUpdate : undefined,
        onDeletePost: initialPost ? handleDeletePost : undefined,
        onDeleteReply: initialPost ? handleDeletePost : undefined,
        onDeleteParentPost: initialPost ? handleDeletePost : undefined,
    });

    return [postThread, setPostThread] as const;
}

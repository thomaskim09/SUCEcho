// sucecho/src/hooks/useLivePostThreadUpdates.ts
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

    const handleNewPost = useCallback(
        (newPost: PostWithStats) => {
            setPostThread((prevThread) => {
                // Check against the latest state inside the updater function
                if (
                    !prevThread ||
                    !newPost.parentPostId ||
                    newPost.parentPostId.toString() !==
                        prevThread.id.toString() ||
                    prevThread.replies.some((r) => r.id === newPost.id)
                ) {
                    return prevThread;
                }
                logger.log(
                    "LIVE 'new_post' is a reply to the current thread:",
                    newPost
                );
                return {
                    ...prevThread,
                    replies: [...prevThread.replies, newPost],
                };
            });
        },
        [setPostThread]
    );

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
            const updatedReplies = currentThread.replies.map((reply) =>
                reply.id === postId ? { ...reply, isDeleting: true } : reply
            );
            return { ...currentThread, replies: updatedReplies };
        });
    }, []);

    const handleDeleteReply = useCallback((data: { postId: number }) => {
        const { postId } = data;
        logger.log(
            "LIVE 'delete_reply' received for post detail page:",
            postId
        );
        setPostThread((currentThread) => {
            if (!currentThread) return null;
            const updatedReplies = currentThread.replies.map((reply) =>
                reply.id === postId ? { ...reply, isDeleting: true } : reply
            );
            return { ...currentThread, replies: updatedReplies };
        });
    }, []);

    const handleDeleteParentPost = useCallback((data: { postId: number }) => {
        const { postId } = data;
        logger.log(
            "LIVE 'delete_parent_post' received for post detail page:",
            postId
        );
        setPostThread((currentThread) => {
            if (!currentThread || currentThread.id !== postId)
                return currentThread;
            return { ...currentThread, isDeleting: true };
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
        onDeleteReply: initialPost ? handleDeleteReply : undefined,
        onDeleteParentPost: initialPost ? handleDeleteParentPost : undefined,
    });

    return [postThread, setPostThread] as const;
}

// sucecho/src/hooks/useLivePostThreadUpdates.ts
'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import type { PostWithStats } from '@/lib/types';
import logger from '@/lib/logger';
import { useRealtime } from './useRealtime';

type PostThread = PostWithStats & {
    replies: PostWithStats[];
};

export function useLivePostThreadUpdates(initialPost: PostThread | null) {
    const [postThread, setPostThread] = useState<PostThread | null>(
        initialPost
    );

    const postThreadRef = useRef(postThread);
    postThreadRef.current = postThread;

    useEffect(() => {
        setPostThread(initialPost);
    }, [initialPost]);

    const handleNewPost = useCallback((newPost: PostWithStats) => {
        const currentThread = postThreadRef.current;
        if (
            !currentThread ||
            !newPost.parentPostId ||
            newPost.parentPostId.toString() !== currentThread.id.toString()
        ) {
            return;
        }
        logger.log(
            "LIVE 'new_post' is a reply to the current thread:",
            newPost
        );
        setPostThread((prevThread) => {
            if (
                !prevThread ||
                prevThread.replies.some((r) => r.id === newPost.id)
            ) {
                return prevThread;
            }
            return { ...prevThread, replies: [...prevThread.replies, newPost] };
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
            const updatedReplies = currentThread.replies.map((reply) =>
                reply.id === postId ? { ...reply, isDeleting: true } : reply
            );
            return { ...currentThread, replies: updatedReplies };
        });
    }, []);

    useRealtime({
        onNewPost: initialPost ? handleNewPost : undefined,
        onUpdateVote: initialPost ? handleVoteUpdate : undefined,
        onDeletePost: initialPost ? handleDeletePost : undefined,
    });

    return [postThread, setPostThread] as const;
}

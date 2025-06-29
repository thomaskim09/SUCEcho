// sucecho/src/hooks/useLivePostThreadUpdates.ts
'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import type { PostWithStats } from '@/lib/types';
import logger from '@/lib/logger';

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

    const handleNewPost = useCallback((event: MessageEvent) => {
        const newPost: PostWithStats = JSON.parse(event.data);
        const currentThread = postThreadRef.current;
        if (
            !currentThread ||
            !newPost.parentPostId ||
            newPost.parentPostId.toString() !== currentThread.id.toString()
        ) {
            return;
        }

        logger.log("SSE 'new_post' is a reply to the current thread:", newPost);
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

    const handleVoteUpdate = useCallback((event: MessageEvent) => {
        const { postId, stats, shouldPurify } = JSON.parse(event.data);
        logger.log("SSE 'update_vote' received for post detail page:", {
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
    }, []);

    const handleDeletePost = useCallback((event: MessageEvent) => {
        const { postId } = JSON.parse(event.data);
        logger.log("SSE 'delete_post' received for post detail page:", postId);

        setPostThread((currentThread) => {
            if (!currentThread) return null;
            if (currentThread.id === postId) {
                return { ...currentThread, content: null, isPurifying: true };
            }
            const updatedReplies = currentThread.replies.map((reply) =>
                reply.id === postId ? { ...reply, isPurifying: true } : reply
            );
            return { ...currentThread, replies: updatedReplies };
        });
    }, []);

    useEffect(() => {
        if (!initialPost) return;

        const eventSource = new EventSource('/api/live');
        logger.log(`SSE Connection opened for Post ID: ${initialPost.id}`);

        eventSource.addEventListener('new_post', handleNewPost);
        eventSource.addEventListener('update_vote', handleVoteUpdate);
        eventSource.addEventListener('delete_post', handleDeletePost);

        return () => {
            eventSource.removeEventListener('new_post', handleNewPost);
            eventSource.removeEventListener('update_vote', handleVoteUpdate);
            eventSource.removeEventListener('delete_post', handleDeletePost);
            eventSource.close();
            logger.log(`SSE Connection closed for Post ID: ${initialPost.id}`);
        };
    }, [initialPost, handleNewPost, handleVoteUpdate, handleDeletePost]);

    return [postThread, setPostThread] as const;
}

// sucecho/src/hooks/useRealtime.ts
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any */
'use client';

import { useEffect, useRef } from 'react';
import logger from '@/lib/logger';
import type { PostWithStats } from '@/lib/types';
import { useTabLeader } from '@/lib/tabLeader';

interface SSEEventData {
    new_post: PostWithStats;
    update_vote: {
        postId: number;
        stats: PostWithStats['stats'];
        shouldPurify?: boolean;
    };
    delete_post: {
        postId: number;
    };
}

interface SSECallbacks {
    onNewPost?: (data: SSEEventData['new_post']) => void;
    onUpdateVote?: (data: SSEEventData['update_vote']) => void;
    onDeletePost?: (data: SSEEventData['delete_post']) => void;
}

let eventSource: EventSource | null = null;

export const useRealtime = (callbacks: SSECallbacks) => {
    const isTabLeader = useTabLeader();

    const memoizedCallbacks = useRef(callbacks);
    useEffect(() => {
        memoizedCallbacks.current = callbacks;
    }, [callbacks.onNewPost, callbacks.onUpdateVote, callbacks.onDeletePost]);

    useEffect(() => {
        if (!isTabLeader) {
            return;
        }
        // Only the leader tab should set up SSE
        if (eventSource) return;
        logger.log('Leader tab establishing LIVE connection.');
        eventSource = new EventSource('/api/live');
        eventSource.onopen = () =>
            logger.log('LIVE Connection successfully established by leader.');
        eventSource.onerror = (err) => {
            logger.error('LIVE Error:', err);
            eventSource?.close();
            eventSource = null;
        };
        const addListener = (
            eventName: string,
            handler?: (data: any) => void
        ) => {
            if (!handler) return;
            eventSource?.addEventListener(eventName, (event: MessageEvent) => {
                const data = JSON.parse(event.data);
                handler(data);
            });
        };
        addListener('new_post', memoizedCallbacks.current.onNewPost);
        addListener('update_vote', memoizedCallbacks.current.onUpdateVote);
        addListener('delete_post', memoizedCallbacks.current.onDeletePost);
        return () => {
            if (eventSource) {
                logger.log('Leader tab closing LIVE connection on unmount.');
                eventSource.close();
                eventSource = null;
            }
        };
    }, [isTabLeader]);
};

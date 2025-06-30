// sucecho/src/hooks/useRealtime.ts
'use client';

import { useEffect, useRef } from 'react';
import logger from '@/lib/logger';
import type { PostWithStats } from '@/lib/types';

const CHANNEL_NAME = 'SUCECHO_REALTIME_CHANNEL';

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
let isLeader = false;

export const useRealtime = (callbacks: SSECallbacks) => {
    const isTabLeader = useRef(false);

    const memoizedCallbacks = useRef(callbacks);
    useEffect(() => {
        memoizedCallbacks.current = callbacks;
    }, [callbacks.onNewPost, callbacks.onUpdateVote, callbacks.onDeletePost]);

    useEffect(() => {
        if (typeof BroadcastChannel === 'undefined') {
            isTabLeader.current = true;
            setupSSE();
            return;
        }

        const channel = new BroadcastChannel(CHANNEL_NAME);
        const tabId = Math.random();

        function setupSSE() {
            if (eventSource) return;

            logger.log('Leader tab establishing SSE connection.');
            eventSource = new EventSource('/api/live');

            eventSource.onopen = () =>
                logger.log(
                    'SSE Connection successfully established by leader.'
                );
            eventSource.onerror = (err) => {
                logger.error('SSE Error:', err);
                eventSource?.close();
                eventSource = null;
            };

            const addListener = (
                eventName: string,
                handler?: (data: any) => void
            ) => {
                if (!handler) return;
                eventSource?.addEventListener(
                    eventName,
                    (event: MessageEvent) => {
                        const data = JSON.parse(event.data);
                        handler(data);
                        channel.postMessage({
                            type: 'broadcast',
                            payload: { event: eventName, data },
                        });
                    }
                );
            };

            addListener('new_post', memoizedCallbacks.current.onNewPost);
            addListener('update_vote', memoizedCallbacks.current.onUpdateVote);
            addListener('delete_post', memoizedCallbacks.current.onDeletePost);
        }

        function electLeader() {
            isLeader = true;
            isTabLeader.current = true;
            logger.log(`Tab ${tabId.toFixed(2)} elected as leader.`);
            channel.postMessage({ type: 'leader_elected' });
            setupSSE();
        }

        const onMessage = (event: MessageEvent) => {
            const { type, payload } = event.data;

            if (type === 'request_leader_status' && isLeader) {
                channel.postMessage({ type: 'leader_elected' });
            } else if (type === 'leader_closing') {
                isLeader = false;
                setTimeout(electLeader, 100);
            } else if (type === 'broadcast' && !isTabLeader.current) {
                const handler =
                    memoizedCallbacks.current[
                        payload.event as keyof SSECallbacks
                    ];
                if (handler) {
                    logger.log(
                        `Follower tab received event '${payload.event}' via BroadcastChannel`,
                        payload.data
                    );
                    (handler as Function)(payload.data);
                }
            }
        };

        channel.addEventListener('message', onMessage);

        const electionTimeout = setTimeout(electLeader, 250);
        channel.postMessage({ type: 'request_leader_status' });

        const handleBeforeUnload = () => {
            if (isTabLeader.current) {
                channel.postMessage({ type: 'leader_closing' });
            }
        };

        window.addEventListener('beforeunload', handleBeforeUnload);

        return () => {
            clearTimeout(electionTimeout);
            window.removeEventListener('beforeunload', handleBeforeUnload);
            channel.removeEventListener('message', onMessage); // --- FIX: Close EventSource if this tab is the leader ---
            if (isTabLeader.current && eventSource) {
                logger.log('Leader tab closing SSE connection on unmount.');
                eventSource.close();
                eventSource = null;
                isLeader = false; // Explicitly relinquish leadership
            }
            channel.close();
        };
    }, []); // This effect correctly runs only once per component mount
};

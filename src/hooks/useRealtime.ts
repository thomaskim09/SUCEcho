// src/hooks/useRealtime.ts
'use client';

import { useEffect, useRef } from 'react';
import logger from '@/lib/logger';
import supabase from '@/lib/supabase-realtime';
import type { PostWithStats } from '@/lib/types';
import { usePageVisibility } from './usePageVisibility';
import { useIdle } from './useIdle';
import { usePathname } from 'next/navigation';
import { useRealtimeStatus } from '@/context/RealtimeStatusContext';
import { useTabLeaderContext } from '@/app/components/TabLeaderProvider';

function isLivePage(pathname: string) {
    return pathname === '/' || pathname.startsWith('/post/');
}

interface LiveEventData {
    new_post: PostWithStats;
    update_vote: {
        postId: number;
        stats: PostWithStats['stats'];
        shouldPurify?: boolean;
    };
    delete_post: {
        postId: number;
    };
    delete_reply: {
        postId: number;
    };
    delete_parent_post: {
        postId: number;
    };
}

interface LiveCallbacks {
    onNewPost?: (data: LiveEventData['new_post']) => void;
    onUpdateVote?: (data: LiveEventData['update_vote']) => void;
    onDeletePost?: (data: LiveEventData['delete_post']) => void;
    onDeleteReply?: (data: LiveEventData['delete_reply']) => void;
    onDeleteParentPost?: (data: LiveEventData['delete_parent_post']) => void;
}

export const useRealtime = (channelName: string, callbacks: LiveCallbacks) => {
    const { setIsSubscribed } = useRealtimeStatus();
    const { status } = useTabLeaderContext();
    const isVisible = usePageVisibility();
    const isIdle = useIdle();
    const pathname = usePathname();

    const memoizedCallbacks = useRef(callbacks);
    useEffect(() => {
        memoizedCallbacks.current = callbacks;
    }, [callbacks]);

    useEffect(() => {
        if (
            status !== 'leader' ||
            !isVisible ||
            isIdle ||
            !isLivePage(pathname)
        ) {
            setIsSubscribed(false);
            return;
        }

        logger.log(
            `Leader tab is active on a live page (${pathname}): Subscribing to ${channelName}.`
        );

        const channel = supabase
            .channel(channelName)
            .on('broadcast', { event: 'new_post' }, (payload) => {
                memoizedCallbacks.current.onNewPost?.(payload.payload);
            })
            .on('broadcast', { event: 'update_vote' }, (payload) => {
                memoizedCallbacks.current.onUpdateVote?.(payload.payload);
            })
            .on('broadcast', { event: 'delete_post' }, (payload) => {
                memoizedCallbacks.current.onDeletePost?.(payload.payload);
            })
            .on('broadcast', { event: 'delete_reply' }, (payload) => {
                memoizedCallbacks.current.onDeleteReply?.(payload.payload);
            })
            .on('broadcast', { event: 'delete_parent_post' }, (payload) => {
                memoizedCallbacks.current.onDeleteParentPost?.(payload.payload);
            })
            .subscribe((status, err) => {
                if (status === 'SUBSCRIBED') {
                    logger.log(
                        `Leader tab: Successfully subscribed to Supabase channel ${channelName}.`
                    );
                    setIsSubscribed(true);
                } else if (
                    status === 'CHANNEL_ERROR' ||
                    status === 'TIMED_OUT'
                ) {
                    logger.error(
                        `Leader tab: Supabase channel error on ${channelName}.`,
                        err
                    );
                    setIsSubscribed(false);
                }
            });

        return () => {
            logger.log(
                `Leader tab: Unsubscribing from Supabase channel ${channelName}.`
            );
            supabase.removeChannel(channel);
            setIsSubscribed(false);
        };
    }, [status, isVisible, isIdle, pathname, channelName, setIsSubscribed]);
};

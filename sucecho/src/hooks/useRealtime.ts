// sucecho/src/hooks/useRealtime.ts
'use client';

import { useEffect, useRef } from 'react';
import logger from '@/lib/logger';
import { useTabLeader } from '@/lib/tabLeader';
import supabase from '@/lib/supabase-realtime';
import type { PostWithStats } from '@/lib/types';
import { usePageVisibility } from './usePageVisibility';
import { useIdle } from './useIdle';
import { usePathname } from 'next/navigation';

function isLivePage(pathname: string): boolean {
    return (
        pathname === '/' ||
        pathname.startsWith('/my-echoes') ||
        pathname.startsWith('/post/')
    );
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
}

interface LiveCallbacks {
    onNewPost?: (data: LiveEventData['new_post']) => void;
    onUpdateVote?: (data: LiveEventData['update_vote']) => void;
    onDeletePost?: (data: LiveEventData['delete_post']) => void;
}

export const useRealtime = (channelName: string, callbacks: LiveCallbacks) => {
    const isTabLeader = useTabLeader();
    const isVisible = usePageVisibility();
    const isIdle = useIdle();
    const pathname = usePathname();

    const memoizedCallbacks = useRef(callbacks);
    useEffect(() => {
        memoizedCallbacks.current = callbacks;
    }, [callbacks]);

    useEffect(() => {
        if (!isTabLeader || !isVisible || isIdle || !isLivePage(pathname)) {
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
            .subscribe((status) => {
                if (status === 'SUBSCRIBED') {
                    logger.log(
                        `Leader tab: Successfully subscribed to ${channelName}.`
                    );
                }
                if (status === 'CHANNEL_ERROR') {
                    logger.error(
                        `Leader tab: Supabase channel error on ${channelName}.`
                    );
                }
            });

        return () => {
            logger.log(`Leader tab: Unsubscribing from ${channelName}.`);
            supabase.removeChannel(channel);
        };
    }, [isTabLeader, isVisible, isIdle, pathname, channelName]);
};

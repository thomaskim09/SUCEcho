// sucecho/src/hooks/useRealtime.ts
'use client';

import { useEffect, useRef } from 'react';
import logger from '@/lib/logger';
import { useTabLeader } from '@/lib/tabLeader';
import supabase, { SUPABASE_CHANNEL_NAME } from '@/lib/supabase-realtime';
import type { PostWithStats } from '@/lib/types';

// The callback interfaces remain the same
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

export const useRealtime = (callbacks: LiveCallbacks) => {
    const isTabLeader = useTabLeader();

    const memoizedCallbacks = useRef(callbacks);
    useEffect(() => {
        memoizedCallbacks.current = callbacks;
    }, [callbacks]);

    useEffect(() => {
        if (!isTabLeader) {
            return;
        }

        logger.log('Leader tab: Subscribing to Supabase channel.');

        // Subscribe directly to the channel using the Supabase client
        const channel = supabase
            .channel(SUPABASE_CHANNEL_NAME)
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
                        'Leader tab: Successfully subscribed to Supabase channel.'
                    );
                }
                if (status === 'CHANNEL_ERROR') {
                    logger.error('Leader tab: Supabase channel error.');
                }
            });

        // The cleanup function is crucial to remove the subscription
        // when the component unmounts.
        return () => {
            logger.log('Leader tab: Unsubscribing from Supabase channel.');
            supabase.removeChannel(channel);
        };
    }, [isTabLeader]);
};

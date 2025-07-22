// src/lib/supabase-realtime.ts
import { createClient } from '@supabase/supabase-js';
import type { FeedType } from '@/lib/types';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error(
        'Missing Supabase URL or Anon Key in client-side environment variables.'
    );
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

export const MAIN_CHANNEL =
    process.env.NEXT_PUBLIC_SUPABASE_CHANNEL_NAME || 'post_room';

export const JOB_CHANNEL =
    process.env.NEXT_PUBLIC_SUPABASE_JOB_CHANNEL_NAME || 'job_room';

export const PERMANENT_CHANNEL =
    process.env.NEXT_PUBLIC_SUPABASE_PERMANENT_CHANNEL_NAME || 'permanent_room';

/**
 * Generates the channel name for a specific post thread.
 * @param postId The ID of the parent post.
 * @returns The Supabase channel name for that post's room.
 */
export const getPostRoomChannelName = (postId: number | string): string => {
    return `post-${postId}`;
};

/**
 * Gets the appropriate broadcast channel name for a given feed type.
 * @param feedType The feed type of the post.
 * @returns The Supabase channel name for that feed.
 */
export const getFeedChannelName = (feedType: FeedType): string => {
    switch (feedType) {
        case 'JOB':
            return JOB_CHANNEL;
        case 'PERMANENT':
            return PERMANENT_CHANNEL;
        case 'EPHEMERAL':
        default:
            return MAIN_CHANNEL;
    }
};

export default supabase;

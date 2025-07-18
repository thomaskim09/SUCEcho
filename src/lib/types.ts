// src/lib/types.ts

export interface PollOption {
    id: number;
    text: string;
    votes: number;
    postId: number;
}

export interface PostWithStats {
    id: number;
    content: string | null;
    createdAt: Date;
    fingerprintHash: string;
    parentPostId?: number | null;
    parentReplyId?: number | null;
    type: 'DEFAULT' | 'ANNOUNCEMENT' | 'ADVERTISEMENT' | 'POLL' | 'LINK';
    url?: string | null;
    stats: {
        upvotes: number;
        downvotes: number;
        replyCount: number;
    } | null;
    isPurifying?: boolean;
    isDeleting?: boolean;
    parentReply?: {
        id: number;
        content: string | null;
    } | null;
    pollOptions?: PollOption[];
}

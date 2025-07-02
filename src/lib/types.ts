// sucecho/src/lib/types.ts

export interface PostWithStats {
    id: number;
    content: string | null;
    createdAt: Date;
    fingerprintHash: string;
    parentPostId?: number | null;
    type: 'DEFAULT' | 'ANNOUNCEMENT' | 'ADVERTISEMENT';
    advertisementUrl?: string | null;
    stats: {
        upvotes: number;
        downvotes: number;
        replyCount: number;
    } | null;
    isPurifying?: boolean;
    isDeleting?: boolean;
}

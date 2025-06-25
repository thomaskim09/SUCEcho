// sucecho/src/lib/types.ts
export interface PostWithStats {
    id: number;
    content: string;
    createdAt: Date;
    stats: {
      upvotes: number;
      downvotes: number;
      replyCount: number;
    } | null;
  }
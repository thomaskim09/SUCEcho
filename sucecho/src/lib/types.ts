// sucecho/src/lib/types.ts

export interface PostWithStats {
  id: number;
  content: string | null; // Content can be null if the post is purified
  createdAt: Date;
  fingerprintHash: string; // <<< ADD THIS LINE
  parentId?: number | null;
  stats: {
    upvotes: number;
    downvotes: number;
    replyCount: number;
  } | null;
}
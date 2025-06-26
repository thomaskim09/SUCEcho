// sucecho/src/lib/types.ts
export interface PostWithStats {
  id: number;
  content: string | null; // Content can be null if the post is purified
  createdAt: Date;
  parentId?: number | null; // Add this for identifying replies
  stats: {
    upvotes: number;
    downvotes: number;
    replyCount: number;
  } | null;
}

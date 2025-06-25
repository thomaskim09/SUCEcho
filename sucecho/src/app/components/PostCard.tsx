// sucecho/src/app/components/PostCard.tsx
import type { PostWithStats } from "@/lib/types";

// Helper function to calculate time since posting
const timeSince = (date: Date): string => {
    const seconds = Math.floor((new Date().getTime() - new Date(date).getTime()) / 1000);
    let interval = seconds / 31536000;
    if (interval > 1) return Math.floor(interval) + "y ago";
    interval = seconds / 2592000;
    if (interval > 1) return Math.floor(interval) + "mo ago";
    interval = seconds / 86400;
    if (interval > 1) return Math.floor(interval) + "d ago";
    interval = seconds / 3600;
    if (interval > 1) return Math.floor(interval) + "h ago";
    interval = seconds / 60;
    if (interval > 1) return Math.floor(interval) + "m ago";
    return Math.floor(seconds) + "s ago";
}

export default function PostCard({ post }: { post: PostWithStats }) {
    return (
        <div className="p-4 rounded-lg my-4" style={{ backgroundColor: 'var(--card-background)' }}>
            <p className="text-white whitespace-pre-wrap">{post.content}</p>
            <div className="flex items-center justify-between text-sm text-gray-400 mt-3">
                <span className="font-mono">{timeSince(post.createdAt)}</span>
                <div className="flex items-center gap-4 font-mono">
                    <span>👍 {post.stats?.upvotes ?? 0}</span>
                    <span>👎 {post.stats?.downvotes ?? 0}</span>
                    <span>💬 {post.stats?.replyCount ?? 0}</span>
                </div>
            </div>
        </div>
    );
}
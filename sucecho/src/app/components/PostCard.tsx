// sucecho/src/app/components/PostCard.tsx
"use client";

import { useState, useEffect } from 'react';
import type { PostWithStats } from "@/lib/types";
import FingerprintJS from '@fingerprintjs/fingerprintjs';

const timeSince = (date: Date): string => {
    // ... (timeSince function remains the same)
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
    const [fingerprint, setFingerprint] = useState<string | null>(null);

    // Get the browser fingerprint once when the component loads
    useEffect(() => {
        const getFingerprint = async () => {
            const fp = await FingerprintJS.load();
            const result = await fp.get();
            setFingerprint(result.visitorId);
        };
        getFingerprint();
    }, []);

    const handleVote = async (voteType: 1 | -1) => {
        if (!fingerprint) {
            alert("Could not identify your browser. Please wait a moment and try again.");
            return;
        }

        try {
            await fetch('/api/votes', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    postId: post.id,
                    voteType,
                    fingerprintHash: fingerprint,
                }),
            });
            // We don't need to update the state here directly.
            // The SSE broadcast will do it for us, ensuring all clients are in sync.
        } catch (error) {
            console.error("Failed to submit vote:", error);
            alert("Failed to submit vote. Please try again.");
        }
    };

    return (
        <div className="p-4 rounded-lg my-4" style={{ backgroundColor: 'var(--card-background)' }}>
            <p className="text-white whitespace-pre-wrap">{post.content}</p>
            <div className="flex items-center justify-between text-sm text-gray-400 mt-3">
                <span className="font-mono">{timeSince(post.createdAt)}</span>
                <div className="flex items-center gap-4 font-mono">
                    <button onClick={() => handleVote(1)} className="hover:text-white transition-colors disabled:opacity-50" disabled={!fingerprint}>
                        👍 {post.stats?.upvotes ?? 0}
                    </button>
                    <button onClick={() => handleVote(-1)} className="hover:text-white transition-colors disabled:opacity-50" disabled={!fingerprint}>
                        👎 {post.stats?.downvotes ?? 0}
                    </button>
                    <span>💬 {post.stats?.replyCount ?? 0}</span>
                </div>
            </div>
        </div>
    );
}
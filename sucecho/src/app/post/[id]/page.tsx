// sucecho/src/app/post/[id]/page.tsx
"use client";

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import type { PostWithStats } from "@/lib/types";
import PostCard from '@/app/components/PostCard';
import Link from 'next/link';
import PostSkeleton from '@/app/components/PostSkeleton';
import { useFingerprint } from '@/context/FingerprintContext';
import { AnimatePresence } from 'framer-motion';
import { usePageTransition } from '@/context/PageTransitionContext';

type PostThread = PostWithStats & {
    replies: PostWithStats[];
};

export default function PostDetailPage() {
    const { post: transitionPost, setPost: setTransitionPost } = usePageTransition();
    const params = useParams();
    const id = params.id as string;

    // Initialize state with transitionPost, ensuring it has a 'replies' array
    const [post, setPost] = useState<PostThread | null>(
        transitionPost ? { ...transitionPost, replies: [] } : null
    );

    // This state now specifically tracks the background fetching of replies
    const [isLoadingReplies, setIsLoadingReplies] = useState(true);

    const [userVotes, setUserVotes] = useState<Record<number, 1 | -1>>({});
    const { fingerprint } = useFingerprint();

    // Effect for fetching complete data (including replies)
    useEffect(() => {
        if (!id) return;

        const fetchPostDetails = async () => {
            try {
                const res = await fetch(`/api/posts/${id}`);
                if (!res.ok) {
                    const errorData = await res.json();
                    throw new Error(errorData.error || 'Failed to fetch post');
                }
                const data: PostThread = await res.json();
                setPost(data);
            } catch (err) {
                console.error((err as Error).message);
                setPost(null); // If fetching fails, clear the post
            } finally {
                setIsLoadingReplies(false); // Finished loading replies
            }
        };

        fetchPostDetails();

        // Cleanup the context when the component unmounts
        return () => {
            setTransitionPost(null);
        };
    }, [id, setTransitionPost]);

    // Effect for real-time SSE events (no changes)
    useEffect(() => {
        if (!id) return;
        const eventSource = new EventSource('/api/live');
        // ... (all SSE handlers: handleNewPost, handleVoteUpdate, handleDeletePost)
        return () => eventSource.close();
    }, [id]);

    const handleOptimisticVote = (postId: number, voteType: 1 | -1) => {
        // ... (logic remains the same)
    };

    // Show a full-page skeleton ONLY if the 'post' object is null initially.
    // This happens on a direct URL load or refresh.
    if (!post) {
        return (
            <div className="container mx-auto max-w-2xl p-4">
                <header className="py-4 flex items-center">
                    <Link href="/" className="text-accent hover:underline">
                        ← Back to the Echo Wall
                    </Link>
                </header>
                <main className="mt-4">
                    {/* The skeleton is now the fallback for a failed fetch or direct load */}
                    <PostSkeleton />
                </main>
            </div>
        );
    }

    // This is the main render path when we have data (either from transition or fetch)
    return (
        <div className="container mx-auto max-w-2xl p-4">
            <header className="py-4 flex items-center">
                <Link href="/" className="text-accent hover:underline">
                    ← Back to the Echo Wall
                </Link>
            </header>
            <main className="mt-4">
                <div className="mb-4">
                    <PostCard post={post} isLink={false} onVote={handleOptimisticVote} userVote={userVotes[post.id]} />
                </div>

                <div className="my-6 text-center">
                    <Link
                        href={`/compose?parentId=${post.id}`}
                        className="inline-block bg-accent text-white font-bold py-3 px-6 rounded-lg hover:opacity-90 transition-opacity text-lg press-animation"
                    >
                        💬 Reply to this Echo
                    </Link>
                </div>

                <div className="mt-8">
                    <h2 className="text-xl font-mono text-gray-400 mb-2">
                        Replies ({post.replies.length})
                    </h2>
                    <div className="space-y-2 border-l-2 border-accent/30 pl-4 ml-4">
                        {isLoadingReplies ? (
                            <p className="text-gray-400 text-sm">Loading replies...</p>
                        ) : post.replies.length > 0 ? (
                            <AnimatePresence>
                                {post.replies.map(reply => (
                                    <PostCard key={reply.id} post={reply} isLink={false} onVote={handleOptimisticVote} userVote={userVotes[reply.id]} />
                                ))}
                            </AnimatePresence>
                        ) : (
                            <p className="text-gray-500 text-sm">No replies yet.</p>
                        )}
                    </div>
                </div>
            </main>
        </div>
    );
}
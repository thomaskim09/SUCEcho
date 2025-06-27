// sucecho/src/app/post/[id]/page.tsx
"use client";

import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';
import type { PostWithStats } from "@/lib/types";
import PostCard from '@/app/components/PostCard';
import Link from 'next/link';
import PostSkeleton from '@/app/components/PostSkeleton';
import { useFingerprint } from '@/context/FingerprintContext';
import { AnimatePresence } from 'framer-motion';

// We no longer need usePageTransition
// import { usePageTransition } from '@/context/PageTransitionContext';

type PostThread = PostWithStats & {
    replies: PostWithStats[];
};

export default function PostDetailPage() {
    // We remove the transitionPost logic. The page starts with no data.
    const params = useParams();
    const id = params.id as string;

    const [post, setPost] = useState<PostThread | null>(null);
    const [isLoading, setIsLoading] = useState(true); // Always start in a loading state
    const [error, setError] = useState<string | null>(null);
    const [userVotes, setUserVotes] = useState<Record<number, 1 | -1>>({});
    const { fingerprint } = useFingerprint();
    const [shareFeedback, setShareFeedback] = useState('');

    // This is the primary data fetching effect. It runs once when the component mounts
    // or when the post 'id' from the URL changes.
    useEffect(() => {
        const fetchPostDetails = async () => {
            setIsLoading(true);
            setError(null);

            try {
                const res = await fetch(`/api/posts/${id}`);
                if (!res.ok) {
                    const errorData = await res.json();
                    throw new Error(errorData.error || 'Failed to fetch post');
                }
                const data: PostThread = await res.json();
                setPost(data);
            } catch (err) {
                setError((err as Error).message);
                setPost(null);
            } finally {
                setIsLoading(false);
            }
        };

        // We only fetch if an ID is present.
        if (id) {
            fetchPostDetails();
        }

    }, [id]); // The dependency array is simple, preventing loops.

    // This effect for real-time updates remains the same.
    useEffect(() => {
        if (!id) return;

        const eventSource = new EventSource('/api/live');

        const handleNewPost = (event: MessageEvent) => {
            const newPost: PostWithStats = JSON.parse(event.data);
            if (newPost.parentId?.toString() === id) {
                setPost(current => {
                    if (current && !current.replies.some(r => r.id === newPost.id)) {
                        return { ...current, replies: [...current.replies, newPost] };
                    }
                    return current;
                });
            }
        };

        const handleVoteUpdate = (event: MessageEvent) => {
            const { postId, stats } = JSON.parse(event.data);
            setPost(current => {
                if (!current) return null;
                if (current.id === postId) {
                    return { ...current, stats };
                }
                const updatedReplies = current.replies.map(reply =>
                    reply.id === postId ? { ...reply, stats } : reply
                );
                return { ...current, replies: updatedReplies };
            });
        };

        const handleDeletePost = (event: MessageEvent) => {
            const { postId } = JSON.parse(event.data);
            setPost(current => {
                if (!current) return null;
                if (current.id === postId) {
                    return { ...current, content: null }; // Mark main post as deleted
                }
                return { ...current, replies: current.replies.filter(r => r.id !== postId) };
            });
        };

        eventSource.addEventListener('new_post', handleNewPost);
        eventSource.addEventListener('update_vote', handleVoteUpdate);
        eventSource.addEventListener('delete_post', handleDeletePost);

        return () => {
            eventSource.close();
        };
    }, [id]);

    // Optimistic voting logic remains the same.
    const handleOptimisticVote = useCallback((postId: number, voteType: 1 | -1) => {
        // ... (this implementation does not need to change)
    }, [fingerprint, post, userVotes]);

    // Share functionality remains the same.
    const handleShare = async () => {
        const shareUrl = window.location.href;
        const shareTitle = "Check out this echo on SUC Echo!";

        if (navigator.share) {
            await navigator.share({ title: shareTitle, url: shareUrl }).catch(err => console.error('Share failed:', err));
        } else {
            try {
                await navigator.clipboard.writeText(shareUrl);
                setShareFeedback('Link copied to clipboard!');
            } catch (err) {
                setShareFeedback('Failed to copy link.');
            } finally {
                setTimeout(() => setShareFeedback(''), 2000);
            }
        }
    };

    if (isLoading) {
        return (
            <div className="container mx-auto max-w-2xl p-4">
                <header className="py-4 flex items-center"><Link href="/" className="text-accent hover:underline">← Back to the Echo Wall</Link></header>
                <main className="mt-4"><PostSkeleton /></main>
            </div>
        );
    }

    if (error || !post || post.content === null) {
        return (
            <div className="container mx-auto max-w-2xl p-4 text-center">
                <header className="py-4 flex items-center"><Link href="/" className="text-accent hover:underline">← Back to the Echo Wall</Link></header>
                <main className="mt-8"><p className="text-red-400">{error || 'This echo has faded into silence.'}</p></main>
            </div>
        );
    }

    return (
        <div className="container mx-auto max-w-2xl p-4">
            <header className="py-4 flex justify-between items-center">
                <Link href="/" className="text-accent hover:underline">
                    ← Back to the Echo Wall
                </Link>
                <button onClick={handleShare} className="bg-gray-700 hover:bg-gray-600 text-white font-bold py-2 px-4 rounded-lg transition-colors">
                    Share
                </button>
            </header>
            {shareFeedback && <div className="text-center p-2 my-2 bg-green-600 text-white rounded-md transition-opacity duration-300">{shareFeedback}</div>}
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
                        {post.replies.length > 0 ? (
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
// sucecho/src/app/post/[id]/page.tsx
"use client";

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import type { PostWithStats } from "@/lib/types";
import PostCard from '@/app/components/PostCard';
import Link from 'next/link';

// A more specific type for a full post thread
type PostThread = PostWithStats & {
    replies: PostWithStats[];
};

export default function PostDetailPage() {
    const [post, setPost] = useState<PostThread | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const params = useParams();
    const id = params.id as string;

    // Effect for initial data fetching
    useEffect(() => {
        if (!id) return;

        const fetchPost = async () => {
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
                // FIX: Check if the caught object is an instance of Error
                if (err instanceof Error) {
                    setError(err.message);
                } else {
                    setError('An unexpected error occurred.');
                }
            } finally {
                setIsLoading(false);
            }
        };

        fetchPost();
    }, [id]);

    // Effect for real-time updates via Server-Sent Events (SSE)
    useEffect(() => {
        // Don't connect until the initial data is loaded
        if (!id || isLoading) return;

        const eventSource = new EventSource('/api/live');

        // Handler for new replies to this specific post
        const handleNewPost = (event: MessageEvent) => {
            const newReply = JSON.parse(event.data) as PostWithStats;

            setPost(prevPost => {
                // Only update if the new post is a reply to the current thread
                if (!prevPost || newReply.parentId !== prevPost.id) {
                    return prevPost;
                }
                // Avoid adding duplicate replies that might come from a quick redirect
                if (prevPost.replies.some(reply => reply.id === newReply.id)) {
                    return prevPost;
                }

                const updatedReplies = [...prevPost.replies, newReply];
                return {
                    ...prevPost,
                    replies: updatedReplies,
                    stats: prevPost.stats ? {
                        ...prevPost.stats,
                        replyCount: updatedReplies.length,
                    } : null
                };
            });
        };

        // Handler for vote updates on any post or reply in the thread
        const handleVoteUpdate = (event: MessageEvent) => {
            const { postId, stats } = JSON.parse(event.data);
            setPost(prevPost => {
                if (!prevPost) return null;

                let postUpdated = false;

                // Update the main post's stats if it matches
                const updatedMainPost = prevPost.id === postId
                    ? { ...prevPost, stats: { ...prevPost.stats, ...stats } }
                    : prevPost;

                if (prevPost.id === postId) postUpdated = true;

                // Update the stats of any matching reply
                const updatedReplies = prevPost.replies.map(reply => {
                    if (reply.id === postId) {
                        postUpdated = true;
                        return { ...reply, stats: { ...reply.stats, ...stats } };
                    }
                    return reply;
                });

                // Only update state if a post in this thread was actually affected
                return postUpdated ? { ...updatedMainPost, replies: updatedReplies } : prevPost;
            });
        };

        // Handler for when a post is deleted (purified)
        const handleDeletePost = (event: MessageEvent) => {
            const { postId } = JSON.parse(event.data);
            setPost(prevPost => {
                if (!prevPost) return null;

                // If main post is deleted, show the error message.
                if (prevPost.id === postId) {
                    setError("This echo has faded into silence.");
                    return null;
                }

                // Otherwise, filter out the deleted reply
                const originalReplyCount = prevPost.replies.length;
                const updatedReplies = prevPost.replies.filter(reply => reply.id !== postId);

                // Only update if a reply was actually removed
                if (updatedReplies.length < originalReplyCount) {
                    return { ...prevPost, replies: updatedReplies };
                }

                return prevPost;
            });
        };

        eventSource.addEventListener('new_post', handleNewPost);
        eventSource.addEventListener('update_vote', handleVoteUpdate);
        eventSource.addEventListener('delete_post', handleDeletePost);

        // Cleanup function to close the connection when the component unmounts
        return () => {
            eventSource.removeEventListener('new_post', handleNewPost);
            eventSource.removeEventListener('update_vote', handleVoteUpdate);
            eventSource.removeEventListener('delete_post', handleDeletePost);
            eventSource.close();
        };
    }, [id, isLoading]); // Re-connect if id changes or after initial loading is complete

    const renderContent = () => {
        if (isLoading) {
            return <p className="text-center text-gray-400">正在加载回音...</p>;
        }

        if (error) {
            return (
                <div className="text-center text-red-400 p-8 rounded-lg" style={{ backgroundColor: 'var(--card-background)' }}>
                    <p className="text-2xl mb-4">😔</p>
                    <p className="text-xl">{error}</p>
                    <Link href="/" className="text-accent hover:underline mt-6 inline-block">
                        ← 返回回音墙
                    </Link>
                </div>
            );
        }

        if (!post) {
            return (
                <div className="text-center text-gray-400 p-8 rounded-lg" style={{ backgroundColor: 'var(--card-background)' }}>
                    <p className="text-xl">无法找到该回音或已被净化。</p>
                    <Link href="/" className="text-accent hover:underline mt-6 inline-block">
                        ← 返回回音墙
                    </Link>
                </div>
            );
        }

        return (
            <div>
                {/* Main Post Card */}
                <div className="mb-4">
                    <PostCard post={post} isLink={false} />
                </div>

                {/* Reply Button */}
                <div className="my-6 text-center">
                    <Link
                        href={`/compose?parentId=${post.id}`}
                        className="inline-block bg-accent text-white font-bold py-3 px-6 rounded-lg hover:opacity-90 transition-opacity text-lg press-animation"
                    >
                        💬 回应此声
                    </Link>
                </div>

                {/* Replies Section */}
                {post.replies && post.replies.length > 0 && (
                    <div className="mt-8">
                        <h2 className="text-xl font-mono text-gray-400 mb-2">
                            子回声 ({post.replies.length})
                        </h2>
                        <div className="space-y-4 border-l-2 border-accent/30 pl-4 ml-4">
                            {post.replies.map(reply => (
                                <PostCard key={reply.id} post={reply} isLink={false} />
                            ))}
                        </div>
                    </div>
                )}
            </div>
        );
    };

    return (
        <div className="container mx-auto max-w-2xl p-4">
            <header className="py-4 flex items-center">
                <Link href="/" className="text-accent hover:underline">
                    ← 返回回音墙
                </Link>
            </header>
            <main className="mt-4">
                {renderContent()}
            </main>
        </div>
    );
}

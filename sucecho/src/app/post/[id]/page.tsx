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

type PostThread = PostWithStats & {
    replies: PostWithStats[];
};

export default function PostDetailPage() {
    const [post, setPost] = useState<PostThread | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [userVotes, setUserVotes] = useState<Record<number, 1 | -1>>({});
    const { fingerprint } = useFingerprint();
    const params = useParams();
    const id = params.id as string;

    useEffect(() => {
        if (!id) return;

        const fetchPost = async () => {
            setIsLoading(true);
            try {
                const res = await fetch(`/api/posts/${id}`);
                if (!res.ok) {
                    const errorData = await res.json();
                    throw new Error(errorData.error || 'Failed to fetch post');
                }
                const data: PostThread = await res.json();
                setPost(data);
            } catch (err) {
                if (err instanceof Error) {
                    console.error(err.message);
                } else {
                    console.error('An unexpected error occurred.');
                }
            } finally {
                setIsLoading(false);
            }
        };

        fetchPost();
    }, [id]);

    useEffect(() => {
        if (!id || isLoading) return;

        const eventSource = new EventSource('/api/live');

        const handleNewPost = (event: MessageEvent) => {
            const newReply = JSON.parse(event.data) as PostWithStats;
            setPost(prevPost => {
                if (!prevPost || newReply.parentId !== prevPost.id) return prevPost;
                if (prevPost.replies.some(reply => reply.id === newReply.id)) return prevPost;

                const updatedReplies = [...prevPost.replies, newReply].sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

                return {
                    ...prevPost,
                    replies: updatedReplies,
                    stats: prevPost.stats ? { ...prevPost.stats, replyCount: updatedReplies.length } : null
                };
            });
        };

        const handleVoteUpdate = (event: MessageEvent) => {
            const { postId, stats } = JSON.parse(event.data);
            setPost(prevPost => {
                if (!prevPost) return null;
                let postUpdated = false;
                const updatedMainPost = prevPost.id === postId ? { ...prevPost, stats } : prevPost;
                if (prevPost.id === postId) postUpdated = true;

                const updatedReplies = prevPost.replies.map(reply => {
                    if (reply.id === postId) {
                        postUpdated = true;
                        // Use the full stats object from the server for consistency
                        return { ...reply, stats };
                    }
                    return reply;
                });
                return postUpdated ? { ...updatedMainPost, replies: updatedReplies } : prevPost;
            });
        };

        const handleDeletePost = (event: MessageEvent) => {
            const { postId } = JSON.parse(event.data);
            setPost(prevPost => {
                if (!prevPost) return null;
                if (prevPost.id === postId) {
                    console.log("This echo has faded into silence.");
                    setPost(null); // Clear the post data
                    return null;
                }
                const updatedReplies = prevPost.replies.filter(reply => reply.id !== postId);
                if (updatedReplies.length < prevPost.replies.length) {
                    return { ...prevPost, replies: updatedReplies };
                }
                return prevPost;
            });
        };

        eventSource.addEventListener('new_post', handleNewPost);
        eventSource.addEventListener('update_vote', handleVoteUpdate);
        eventSource.addEventListener('delete_post', handleDeletePost);

        return () => {
            eventSource.removeEventListener('new_post', handleNewPost);
            eventSource.removeEventListener('update_vote', handleVoteUpdate);
            eventSource.removeEventListener('delete_post', handleDeletePost);
            eventSource.close();
        };
    }, [id, isLoading]);

    const handleOptimisticVote = (postId: number, voteType: 1 | -1) => {
        const originalPost = JSON.parse(JSON.stringify(post));
        const originalUserVotes = { ...userVotes };

        const currentVote = userVotes[postId];
        let newVoteState: 1 | -1 | undefined = voteType;

        let upvoteChange = 0;
        let downvoteChange = 0;

        if (currentVote === voteType) { // Un-voting
            newVoteState = undefined;
            if (voteType === 1) upvoteChange = -1;
            else downvoteChange = -1;
        } else if (currentVote) { // Changing vote
            if (voteType === 1) { upvoteChange = 1; downvoteChange = -1; }
            else { upvoteChange = -1; downvoteChange = 1; }
        } else { // New vote
            if (voteType === 1) upvoteChange = 1;
            else downvoteChange = 1;
        }

        setUserVotes(prev => {
            const newVotes = { ...prev };
            if (newVoteState) newVotes[postId] = newVoteState;
            else delete newVotes[postId];
            return newVotes;
        });

        setPost(prevPost => {
            if (!prevPost) return null;

            const updateStats = (p: PostWithStats) => {
                if (p.id === postId && p.stats) {
                    return { ...p, stats: { ...p.stats, upvotes: p.stats.upvotes + upvoteChange, downvotes: p.stats.downvotes + downvoteChange } };
                }
                return p;
            };

            const newMainPost = updateStats(prevPost);
            const newReplies = prevPost.replies.map(updateStats);

            return { ...newMainPost, replies: newReplies };
        });

        const sendVoteRequest = async () => {
            if (!fingerprint) {
                setPost(originalPost);
                setUserVotes(originalUserVotes);
                return;
            };
            try {
                const res = await fetch('/api/votes', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ postId, voteType, fingerprintHash: fingerprint }) });
                if (!res.ok) throw new Error("Server vote failed");
            } catch (err) { // FIX: Changed variable name from error to err
                console.error("Reverting optimistic vote:", err);
                setPost(originalPost);
                setUserVotes(originalUserVotes);
                alert("投票失败，请重试。");
            }
        };
        sendVoteRequest();
    };

    const renderContent = () => {
        if (isLoading) {
            return (
                <div>
                    <PostSkeleton />
                    <div className="my-6 h-12 bg-gray-700 rounded-lg w-40 mx-auto animate-pulse"></div>
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
                <div className="mb-4">
                    <PostCard post={post} isLink={false} onVote={handleOptimisticVote} userVote={userVotes[post.id]} />
                </div>
                <div className="my-6 text-center">
                    <Link
                        href={`/compose?parentId=${post.id}`}
                        className="inline-block bg-accent text-white font-bold py-3 px-6 rounded-lg hover:opacity-90 transition-opacity text-lg press-animation"
                    >
                        💬 回应此声
                    </Link>
                </div>
                {post.replies && post.replies.length > 0 && (
                    <div className="mt-8">
                        <h2 className="text-xl font-mono text-gray-400 mb-2">
                            子回声 ({post.replies.length})
                        </h2>
                        <div className="space-y-4 border-l-2 border-accent/30 pl-4 ml-4">
                            <AnimatePresence>
                                {post.replies.map(reply => (
                                    <PostCard key={reply.id} post={reply} isLink={false} onVote={handleOptimisticVote} userVote={userVotes[reply.id]} />
                                ))}
                            </AnimatePresence>
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
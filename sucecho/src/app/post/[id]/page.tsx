// sucecho/src/app/post/[id]/page.tsx
"use client";

import { useState, useEffect, useRef } from 'react';
import { useParams } from 'next/navigation';
import type { PostWithStats } from "@/lib/types";
import PostCard from '@/app/components/PostCard';
import Link from 'next/link';
import PostSkeleton from '@/app/components/PostSkeleton';
import { AnimatePresence } from 'framer-motion';
import { Icon } from '@/app/components/Icon';
import ReportModal from '@/app/components/ReportModal';
import { useOptimisticVote } from '@/hooks/useOptimisticVote';
import logger from '@/lib/logger';

type PostThread = PostWithStats & {
    replies: PostWithStats[];
};

export default function PostDetailPage() {
    const params = useParams();
    const id = params.id as string;

    const [post, setPost] = useState<PostThread | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [shareFeedback, setShareFeedback] = useState('');
    const [reportFeedback, setReportFeedback] = useState('');
    const [isReportModalOpen, setIsReportModalOpen] = useState(false);
    const dataFetched = useRef(false);

    const { userVotes, handleOptimisticVote } = useOptimisticVote();

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
        if (id && !dataFetched.current) {
            fetchPostDetails();
            dataFetched.current = true;
        }
    }, [id]);

    useEffect(() => {
        if (!id) return;
        const eventSource = new EventSource('/api/live');
        const handleNewPost = (event: MessageEvent) => {
            const newPost: PostWithStats = JSON.parse(event.data);
            if (newPost.parentPostId?.toString() === id) {
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
                    return { ...current, content: null };
                }
                return { ...current, replies: current.replies.filter(r => r.id !== postId) };
            });
        };
        eventSource.addEventListener('new_post', handleNewPost);
        eventSource.addEventListener('update_vote', handleVoteUpdate);
        eventSource.addEventListener('delete_post', handleDeletePost);
        return () => eventSource.close();
    }, [id]);

    const updatePostInState = (updatedPost: PostWithStats) => {
        setPost(currentThread => {
            if (!currentThread) return null;
            // Check if the updated post is the parent post
            if (currentThread.id === updatedPost.id) {
                return { ...currentThread, ...updatedPost };
            }
            // Otherwise, update the post in the replies array
            const updatedReplies = currentThread.replies.map(reply =>
                reply.id === updatedPost.id ? updatedPost : reply
            );
            return { ...currentThread, replies: updatedReplies };
        });
    };

    const handleShare = async () => {
        const shareUrl = window.location.href;
        const shareTitle = "在SUC回音壁上查看此回音！";
        if (navigator.share) {
            await navigator.share({ title: shareTitle, url: shareUrl }).catch(err => logger.error('Share failed:', err));
        } else {
            try {
                await navigator.clipboard.writeText(shareUrl);
                setShareFeedback('链接已复制到剪贴板！');
            } catch (err) {
                setShareFeedback('复制链接失败。');
            } finally {
                setTimeout(() => setShareFeedback(''), 2000);
            }
        }
    };

    const handleOpenReportModal = () => setIsReportModalOpen(true);

    const handleReportSubmit = async (reason: string) => {
        setIsReportModalOpen(false);
        try {
            const res = await fetch('/api/reports', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ postId: post?.id, fingerprintHash: "temp-fingerprint", reason }), // Replace with real fingerprint
            });
            if (!res.ok) {
                const errorData = await res.json();
                throw new Error(errorData.error || "举报失败。");
            }
            setReportFeedback('感谢您的举报，管理员将会审查。');
        } catch (err) {
            setReportFeedback((err as Error).message);
        } finally {
            setTimeout(() => setReportFeedback(''), 3000);
        }
    };

    if (isLoading) {
        return (
            <div className="container mx-auto max-w-2xl p-4">
                <header className="py-4 flex items-center"><Link href="/" className="text-accent hover:underline">← 返回回音墙</Link></header>
                <main className="mt-4"><PostSkeleton /></main>
            </div>
        );
    }

    if (error || !post || post.content === null) {
        return (
            <div className="container mx-auto max-w-2xl p-4 text-center">
                <header className="py-4 flex items-center"><Link href="/" className="text-accent hover:underline">← 返回回音墙</Link></header>
                <main className="mt-8"><p className="text-red-400">{error || 'This echo has faded into silence.'}</p></main>
            </div>
        );
    }

    return (
        <div className="container mx-auto max-w-2xl p-4">
            <ReportModal
                isOpen={isReportModalOpen}
                onClose={() => setIsReportModalOpen(false)}
                onSubmit={handleReportSubmit}
            />
            <header className="py-4 flex justify-between items-center">
                <Link href="/" className="text-accent hover:underline">← 返回回音墙</Link>
                <div className="flex items-center gap-2">
                    <button onClick={handleShare} aria-label="Share post" className="p-2 rounded-lg transition-colors icon-base icon-share"><Icon name="share" /></button>
                    <button onClick={handleOpenReportModal} aria-label="Report post" className="p-2 rounded-lg transition-colors icon-base icon-report-flag"><Icon name="report-flag" /></button>
                </div>
            </header>
            {shareFeedback && <div className="text-center p-2 my-2 bg-green-600 text-white rounded-md transition-opacity duration-300" >{shareFeedback}</div>}
            {reportFeedback && <div className="text-center p-2 my-2 bg-yellow-600 text-white rounded-md transition-opacity duration-300">{reportFeedback}</div>}
            <main className="mt-4">
                <div className="mb-4">
                    <PostCard post={post} isLink={false} onVote={(_, voteType) => handleOptimisticVote(post, voteType, updatePostInState)} userVote={userVotes[post.id]} />
                </div>
                <div className="my-6 text-center">
                    <Link href={`/compose?parentPostId=${post.id}`} className="inline-flex items-center justify-center gap-2 bg-accent text-white font-bold py-3 px-6 rounded-lg hover:opacity-90 transition-opacity text-lg press-animation">
                        <Icon name="comment" /> 回复这回音
                    </Link>
                </div>
                <div className="mt-8">
                    <h2 className="text-xl font-mono text-gray-400 mb-2">回复 ({post.replies.length})</h2>
                    <div className="space-y-2 border-l-2 border-accent/30 pl-4 ml-4">
                        {post.replies.length > 0 ? (
                            <AnimatePresence>
                                {post.replies.map(reply => (
                                    <PostCard key={reply.id} post={reply} isLink={false} onVote={(_, voteType) => handleOptimisticVote(reply, voteType, updatePostInState)} userVote={userVotes[reply.id]} />
                                ))}
                            </AnimatePresence>
                        ) : (
                            <p className="text-gray-500 text-sm">目前并没有回复.</p>
                        )}
                    </div>
                </div>
            </main>
        </div>
    );
}
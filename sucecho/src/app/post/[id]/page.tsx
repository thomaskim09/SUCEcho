// sucecho/src/app/post/[id]/page.tsx
"use client";

import { useState, useEffect, useRef } from 'react';
import { useParams } from 'next/navigation';
import type { PostWithStats } from "@/lib/types";
import { useLivePostThreadUpdates } from '@/hooks/useLivePostThreadUpdates';
import PostCard from '@/app/components/PostCard';
import Link from 'next/link';
import { AnimatePresence, motion } from 'motion/react';
import { Icon } from '@/app/components/Icon';
import ReportModal from '@/app/components/ReportModal';
import { useOptimisticVote } from '@/hooks/useOptimisticVote';
import logger from '@/lib/logger';
import { useFingerprint } from '@/context/FingerprintContext';
import { useStaggeredRender } from '@/hooks/useStaggeredRender';

type PostThread = PostWithStats & {
    replies: PostWithStats[];
};

export default function PostDetailPage() {
    const params = useParams();
    const id = params.id as string;

    const [initialPost, setInitialPost] = useState<PostThread | null>(null);
    const [post, setPost] = useLivePostThreadUpdates(initialPost);

    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [shareFeedback, setShareFeedback] = useState('');
    const [reportFeedback, setReportFeedback] = useState('');
    const [isReportModalOpen, setIsReportModalOpen] = useState(false);
    const [reportingPostId, setReportingPostId] = useState<number | null>(null);
    const dataFetched = useRef(false);

    const { userVotes, handleOptimisticVote } = useOptimisticVote();
    const { fingerprint } = useFingerprint();
    const [renderedReplies] = useStaggeredRender(post?.replies || []);

    const handleDelete = async (postId: number) => {
        if (!confirm(`您确定要删除帖子 #${postId} 吗？此操作无法撤销。`)) return;
        try {
            const res = await fetch(`/api/admin/posts/${postId}`, { method: 'DELETE' });
            if (!res.ok) {
                const errorData = await res.json();
                throw new Error(errorData.message || 'Failed to delete post');
            }
            // Optimistically update the UI to show the post is being purified
            setPost(current => {
                if (!current) return null;
                const updatedReplies = current.replies.map(p =>
                    p.id === postId ? { ...p, isPurifying: true } : p
                );
                return { ...current, replies: updatedReplies };
            });
        } catch (err: unknown) {
            alert(`Error: ${(err as Error).message}`);
        }
    };

    useEffect(() => {
        const fetchPostDetails = async () => {
            if (!id || dataFetched.current) return;
            dataFetched.current = true;
            setIsLoading(true);
            setError(null);
            try {
                const res = await fetch(`/api/posts/${id}`);
                if (!res.ok) {
                    const errorData = await res.json();
                    throw new Error(errorData.error || 'Failed to fetch post');
                }
                const data: PostThread = await res.json();
                setInitialPost(data);
            } catch (err) {
                setError((err as Error).message);
                setInitialPost(null);
            } finally {
                setIsLoading(false);
            }
        };
        fetchPostDetails();
    }, [id]);

    const updatePostInState = (updatedPost: PostWithStats) => {
        setPost(currentThread => {
            if (!currentThread) return null;
            if (currentThread.id === updatedPost.id) {
                return { ...currentThread, ...updatedPost };
            }
            const updatedReplies = currentThread.replies.map(reply =>
                reply.id === updatedPost.id ? updatedPost : reply
            );
            return { ...currentThread, replies: updatedReplies };
        });
    };

    const handlePurificationComplete = (purifiedPostId: number) => {
        setPost(current => {
            if (!current) return null;
            if (current.id === purifiedPostId) {
                setError('This echo has faded into silence.');
                return null;
            }
            return { ...current, replies: current.replies.filter(r => r.id !== purifiedPostId) };
        });
    };

    const handleShare = async () => {
        const shareUrl = window.location.href;
        const shareTitle = "在SUC回音壁上查看此回音！";
        if (navigator.share) {
            try {
                await navigator.share({ title: shareTitle, url: shareUrl });
            } catch (err) {
                logger.error('Share failed:', err);
            }
        } else {
            try {
                await navigator.clipboard.writeText(shareUrl);
                setShareFeedback('链接已复制到剪贴板！');
            } catch {
                setShareFeedback('复制链接失败。');
            } finally {
                setTimeout(() => setShareFeedback(''), 2000);
            }
        }
    };

    const handleOpenReportModal = (postId: number) => {
        setReportingPostId(postId);
        setIsReportModalOpen(true);
    };

    const handleReportSubmit = async (reason: string) => {
        setIsReportModalOpen(false);
        if (!reportingPostId || !fingerprint) {
            setReportFeedback("无法提交举报：缺少必要信息。");
            setTimeout(() => setReportFeedback(''), 3000);
            return;
        }

        try {
            const res = await fetch('/api/reports', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ postId: reportingPostId, fingerprintHash: fingerprint, reason }),
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
            setReportingPostId(null);
        }
    };

    if (isLoading) {
        return (
            <div className="container mx-auto max-w-2xl p-4 text-center">
                <header className="py-4 flex items-center">
                    <Link href="/" className="text-accent hover:underline">← 返回回音墙</Link>
                </header>
                <main className="mt-8">
                    <p>加载回音...</p>
                </main>
            </div>
        );
    }

    if (error || !post) {
        return (
            <div className="container mx-auto max-w-2xl p-4 text-center">
                <header className="py-4 flex items-center">
                    <Link href="/" className="text-accent hover:underline">← 返回回音墙</Link>
                </header>
                <main className="mt-8">
                    <p className="text-red-400">{error || 'This echo has faded into silence.'}</p>
                </main>
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
                    <button onClick={handleShare} aria-label="Share post" className="p-2 rounded-lg transition-colors icon-base icon-share">
                        <Icon name="share" />
                    </button>
                    <button onClick={() => handleOpenReportModal(post.id)} aria-label="Report post" className="p-2 rounded-lg transition-colors icon-base icon-report-flag">
                        <Icon name="report-flag" />
                    </button>
                </div>
            </header>
            {shareFeedback && <div className="text-center p-2 my-2 bg-green-600 text-white rounded-md transition-opacity duration-300">{shareFeedback}</div>}
            {reportFeedback && <div className="text-center p-2 my-2 bg-yellow-600 text-white rounded-md transition-opacity duration-300">{reportFeedback}</div>}
            <main className="mt-4">
                <div className="mb-4">
                    <PostCard
                        post={post}
                        isLink={false}
                        onVote={(_, voteType) => handleOptimisticVote(post, voteType, updatePostInState, handlePurificationComplete)}
                        userVote={userVotes[post.id]}
                        onPurificationComplete={handlePurificationComplete}
                        isPurifying={post.isPurifying}
                        onDelete={handleDelete}
                    />
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
                                {renderedReplies.map(reply => (
                                    <motion.div
                                        key={reply.id}
                                        layout
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0, transition: { ease: "easeOut", duration: 0.8 } }}
                                        exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
                                    >
                                        <PostCard
                                            post={reply}
                                            isLink={false}
                                            onVote={(_, voteType) => handleOptimisticVote(reply, voteType, updatePostInState, handlePurificationComplete)}
                                            userVote={userVotes[reply.id]}
                                            onReport={handleOpenReportModal}
                                            onPurificationComplete={handlePurificationComplete}
                                            isPurifying={reply.isPurifying}
                                            onDelete={handleDelete}
                                        />
                                    </motion.div>
                                ))}
                            </AnimatePresence>
                        ) : (
                            !isLoading && <p className="text-gray-500 text-sm">目前并没有回复.</p>
                        )}
                    </div>
                </div>
            </main>
        </div>
    );
}
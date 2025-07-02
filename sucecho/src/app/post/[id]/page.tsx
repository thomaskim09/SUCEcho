// sucecho/src/app/post/[id]/page.tsx
"use client";

import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import type { PostWithStats } from "@/lib/types";
import { useLivePostThreadUpdates } from '@/hooks/useLivePostThreadUpdates';
import PostCard from '@/app/components/PostCard';
import Link from 'next/link';
import { AnimatePresence, motion } from 'framer-motion';
import { Icon } from '@/app/components/Icon';
import ReportModal from '@/app/components/ReportModal';
import { useOptimisticVote } from '@/hooks/useOptimisticVote';
import logger from '@/lib/logger';
import { useFingerprint } from '@/context/FingerprintContext';
import { usePageVisibility } from '@/hooks/usePageVisibility';
import LoadingSpinner from '@/app/components/LoadingVideo';
import LoadingVideo from '@/app/components/LoadingVideo';

type PostThread = PostWithStats & {
    replies: PostWithStats[];
};

const ExpiredPostMessage = () => {
    const router = useRouter();

    const handleBackClick = () => {
        if (typeof document !== 'undefined' && document.referrer.includes('/compose')) {
            router.push('/');
        } else {
            router.back();
        }
    };

    return (
        <motion.div
            key="expired"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            className="text-center text-gray-400 p-8 rounded-lg"
            style={{ backgroundColor: 'var(--card-background)' }}
        >
            <div className="flex justify-center">
                <Icon name="timer" className="text-3xl mb-4" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">此回音已消逝</h2>
            <p className="text-lg text-gray-400">它已完成了自己的使命，化作了数字尘埃。</p>
            <button
                onClick={handleBackClick}
                className="mt-6 bg-accent text-white font-bold py-2 px-6 rounded-lg hover:opacity-90 transition-opacity"
            >
                返回
            </button>
        </motion.div>
    );
};


export default function PostDetailPage() {
    const params = useParams();
    const router = useRouter();
    const id = params.id as string;

    const [initialPost, setInitialPost] = useState<PostThread | null>(null);
    const [post, setPost] = useLivePostThreadUpdates(initialPost);

    const [showFinalMessage, setShowFinalMessage] = useState(false);

    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [shareFeedback, setShareFeedback] = useState('');
    const [reportFeedback, setReportFeedback] = useState('');
    const [isReportModalOpen, setIsReportModalOpen] = useState(false);
    const [reportingPostId, setReportingPostId] = useState<number | null>(null);
    const dataFetched = useRef(false);

    const { userVotes, handleOptimisticVote } = useOptimisticVote();
    const { fingerprint } = useFingerprint();
    const isVisible = usePageVisibility();

    const handleBackClick = () => {
        if (typeof document !== 'undefined' && document.referrer.includes('/compose')) {
            router.push('/');
        } else {
            router.back();
        }
    };

    const fetchPostDetails = useCallback(async (isRefreshing = false) => {
        if (!id) return;
        if (!isRefreshing) {
            if (dataFetched.current) return;
            dataFetched.current = true;
            setIsLoading(true);
        }

        setError(null);
        try {
            const res = await fetch(`/api/posts/${id}`);
            if (!res.ok) {
                const errorData = await res.json();
                if (res.status === 404 || res.status === 410) {
                    setShowFinalMessage(true);
                }
                throw new Error(errorData.error || 'Failed to fetch post');
            }
            const data: PostThread = await res.json();
            setInitialPost(data);

        } catch (err) {
            if (!showFinalMessage) {
                setError((err as Error).message);
            }
            if (!isRefreshing) setInitialPost(null);
        } finally {
            if (!isRefreshing) setIsLoading(false);
        }
    }, [id, showFinalMessage]);

    useEffect(() => {
        fetchPostDetails(false);
    }, [id, fetchPostDetails]);

    useEffect(() => {
        if (isVisible && !isLoading) {
            fetchPostDetails(true);
        }
    }, [isVisible, isLoading, fetchPostDetails]);


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

    const handlePurification = (postIdToPurify: number) => {
        logger.log(`Purification process starting for post ${postIdToPurify}`);
        setPost(currentThread => {
            if (!currentThread) return null;
            if (currentThread.id === postIdToPurify) {
                return { ...currentThread, isPurifying: true };
            }
            const updatedReplies = currentThread.replies.map(reply =>
                reply.id === postIdToPurify ? { ...reply, isPurifying: true } : reply
            );
            return { ...currentThread, replies: updatedReplies };
        });
    };

    const handleAnimationEnd = (postId: number) => {
        logger.log(`Animation finished for post ${postId}. Showing final message.`);
        setShowFinalMessage(true);
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

    const handleDelete = async (postId: number) => {
        if (!confirm(`您确定要删除帖子 #${postId} 吗？此操作无法撤销。`)) return;
        try {
            const res = await fetch(`/api/admin/posts/${postId}`, { method: 'DELETE' });
            if (!res.ok) {
                const errorData = await res.json();
                throw new Error(errorData.message || 'Failed to delete post');
            }
            setPost(current => {
                if (!current) return null;
                if (current.id === postId) {
                    return { ...current, isDeleting: true };
                }
                const updatedReplies = current.replies.map(p =>
                    p.id === postId ? { ...p, isDeleting: true } : p
                );
                return { ...current, replies: updatedReplies };
            });
        } catch (err: unknown) {
            alert(`Error: ${(err as Error).message}`);
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

    const renderMainContent = () => {
        if (showFinalMessage) {
            return <ExpiredPostMessage />;
        }

        if (error) {
            return <p className="text-red-400 text-center p-8">{error}</p>;
        }

        if (!post) {
            return <p className="text-gray-400 text-center p-8">这回音已消散.</p>;
        }

        return (
            <motion.div
                key="content"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.5, ease: "easeOut" }}
            >
                <div className="mb-4">
                    <PostCard
                        post={post}
                        isLink={false}
                        onVote={(_, voteType) => handleOptimisticVote(post, voteType, updatePostInState, handlePurification)}
                        userVote={userVotes[post.id]}
                        isPurifying={post.isPurifying}
                        onPurificationComplete={() => handleAnimationEnd(post.id)}
                        onFaded={() => handleAnimationEnd(post.id)}
                        onDelete={handleDelete}
                        onDeletionComplete={() => handleAnimationEnd(post.id)}
                    />
                </div>
                {(!post.isPurifying && !post.isDeleting) && (
                    <>
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
                                                    onVote={(_, voteType) => handleOptimisticVote(reply, voteType, updatePostInState, handlePurification)}
                                                    userVote={userVotes[reply.id]}
                                                    onReport={handleOpenReportModal}
                                                    onPurificationComplete={() => handleAnimationEnd(reply.id)}
                                                    onFaded={() => handleAnimationEnd(reply.id)}
                                                    isPurifying={reply.isPurifying}
                                                    onDelete={handleDelete}
                                                    onDeletionComplete={() => handleAnimationEnd(reply.id)}
                                                />
                                            </motion.div>
                                        ))}
                                    </AnimatePresence>
                                ) : (
                                    <p className="text-gray-500 text-sm">目前并没有回复.</p>
                                )}
                            </div>
                        </div>
                    </>
                )}
            </motion.div>
        )
    }

    return (
        <div className="container mx-auto max-w-2xl p-4">
            <ReportModal
                isOpen={isReportModalOpen}
                onClose={() => setIsReportModalOpen(false)}
                onSubmit={handleReportSubmit}
            />
            <header className="py-4 flex justify-between items-center">
                <button onClick={handleBackClick} className="p-2 rounded-lg text-accent hover:underline">
                    ← 返回
                </button>

                <div className={`flex items-center gap-2 transition-opacity duration-300 ${(!isLoading && post && !showFinalMessage) ? 'opacity-100' : 'opacity-0'}`}>
                    <button
                        onClick={handleShare}
                        aria-label="Share post"
                        className="p-2 rounded-lg transition-colors icon-base icon-share"
                        disabled={isLoading || !post || showFinalMessage}
                    >
                        <Icon name="share" />
                    </button>
                    <button
                        onClick={() => post && handleOpenReportModal(post.id)}
                        aria-label="Report post"
                        className="p-2 rounded-lg transition-colors icon-base icon-report-flag"
                        disabled={isLoading || !post || showFinalMessage}
                    >
                        <Icon name="report-flag" />
                    </button>
                </div>
            </header>

            {shareFeedback && <div className="text-center p-2 my-2 bg-green-600 text-white rounded-md transition-opacity duration-300">{shareFeedback}</div>}
            {reportFeedback && <div className="text-center p-2 my-2 bg-yellow-600 text-white rounded-md transition-opacity duration-300">{reportFeedback}</div>}

            <main className="mt-4">
                {isLoading ? (
                    <LoadingVideo label="加载回音..." />
                ) : (
                    renderMainContent()
                )}
            </main>
        </div>
    );
}
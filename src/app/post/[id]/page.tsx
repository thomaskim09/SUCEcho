"use client";

import { useState, useEffect, useRef, useCallback, useLayoutEffect } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import type { PostWithStats, PostWithReplies } from "@/lib/types";
import { useLivePostThreadUpdates } from '@/hooks/useLivePostThreadUpdates';
import PostCard from '@/app/components/PostCard';
import { AnimatePresence, motion } from 'framer-motion';
import { Icon } from '@/app/components/Icon';
import dynamic from 'next/dynamic';
import ReplyThread from '@/app/components/ReplyThread';

const ReportModal = dynamic(() => import('@/app/components/ReportModal'), {
    ssr: false
});
import { useOptimisticVote } from '@/hooks/useOptimisticVote';
import logger from '@/lib/logger';
import { useFingerprint } from '@/context/FingerprintContext';
import { usePageVisibility } from '@/hooks/usePageVisibility';
import LoadingSpinner from '@/app/components/LoadingSpinner';
import { getPurifiedPostIds, addPurifiedPostId } from '@/lib/purifiedStore';
import Poll from '@/app/components/Poll';
import LinkPreviewCard from '@/app/components/LinkPreviewCard';
import StarRating from '@/app/components/StarRating';
import ContactCard from '@/app/components/ContactCard';

type PostThread = PostWithReplies & {
    replies: PostWithReplies[];
};

const ExpiredPostMessage = () => {
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
        </motion.div>
    );
};

// Helper function to find all parent IDs for a given reply ID
const findParentIds = (idMap: Map<number, number | null>, childId: number): number[] => {
    const parentId = idMap.get(childId);
    if (!parentId) return [];
    return [parentId, ...findParentIds(idMap, parentId)];
};

const buildIdMap = (replies: PostWithReplies[]): Map<number, number | null> => {
    const map = new Map<number, number | null>();
    const stack: PostWithReplies[] = [...replies];
    while (stack.length > 0) {
        const current = stack.pop()!;
        if (current.replies) {
            for (const reply of current.replies) {
                map.set(reply.id, current.id);
                stack.push(reply);
            }
        }
    }
    return map;
};


export default function PostDetailPage() {
    const params = useParams();
    const router = useRouter();
    const searchParams = useSearchParams();
    const id = params.id as string;
    const feedType = searchParams.get('feedType') as 'JOB' | 'PERMANENT' | 'EPHEMERAL' | 'ALL' | null;

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
    const [purifiedPostIds, setPurifiedPostIds] = useState<Set<number>>(new Set());
    const [isSubmittingRating, setIsSubmittingRating] = useState(false);
    const { userVotes, handleOptimisticVote } = useOptimisticVote();
    const { fingerprint } = useFingerprint();
    const isVisible = usePageVisibility();
    const [averageRating, setAverageRating] = useState<number | null>(null);
    const [expandedReplyIds, setExpandedReplyIds] = useState<Set<number>>(new Set());

    useEffect(() => {
        if (post?.stats?.averageRating !== undefined) setAverageRating(post.stats.averageRating);
    }, [post?.stats?.averageRating]);

    useLayoutEffect(() => {
        const rootElement = document.documentElement;
        rootElement.classList.remove('jobs-bg', 'permanent-bg');
        if (feedType === 'JOB') rootElement.classList.add('jobs-bg');
        else if (feedType === 'PERMANENT') rootElement.classList.add('permanent-bg');
        return () => rootElement.classList.remove('jobs-bg', 'permanent-bg');
    }, [feedType]);

    useEffect(() => {
        if (post) {
            const fabLink = document.querySelector('a[aria-label="回复此回音"]');
            if (fabLink) fabLink.setAttribute('href', `/compose?parentPostId=${post.id}&feedType=${post.feed}`);
        }
    }, [post]);

    useEffect(() => {
        if (post && sessionStorage.getItem('postFeedReturnExpected') === 'true') {
            try {
                const { ...postWithoutReplies } = post;
                sessionStorage.setItem('updatedPostDetails', JSON.stringify(postWithoutReplies));
            } catch (e) {
                logger.error('Failed to save updated post details to sessionStorage', e);
            }
        }
    }, [post]);

    useEffect(() => {
        setPurifiedPostIds(getPurifiedPostIds());
        const postId = parseInt(id, 10);
        if (!isNaN(postId) && getPurifiedPostIds().has(postId)) {
            setShowFinalMessage(true);
            setIsLoading(false);
        }
    }, [id]);

    const handleBackClick = () => router.back();

    const fetchPostDetails = useCallback(async (isRefreshing = false) => {
        if (showFinalMessage || !id) return;
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
                if (res.status === 404 || res.status === 410) setShowFinalMessage(true);
                throw new Error(errorData.error || 'Failed to fetch post');
            }
            const data = await res.json();
            setInitialPost(data);
        } catch (err) {
            if (!showFinalMessage) setError((err as Error).message);
            if (!isRefreshing) setInitialPost(null);
        } finally {
            if (!isRefreshing) setIsLoading(false);
        }
    }, [id, showFinalMessage]);

    useEffect(() => {
        if (!showFinalMessage) fetchPostDetails(false);
    }, [id, showFinalMessage, fetchPostDetails]);

    useEffect(() => {
        if (isVisible && !isLoading) fetchPostDetails(true);
    }, [isVisible, isLoading, fetchPostDetails]);

    const toggleExpandReply = (id: number) => {
        setExpandedReplyIds(prev => {
            const newSet = new Set(prev);
            if (newSet.has(id)) newSet.delete(id);
            else newSet.add(id);
            return newSet;
        });
    };

    useEffect(() => {
        const replyToIdStr = sessionStorage.getItem('expandReplyId');
        if (replyToIdStr && post) {
            const replyToId = Number(replyToIdStr);
            const idMap = buildIdMap(post.replies);
            const allParentIds = findParentIds(idMap, replyToId);
            setExpandedReplyIds(prev => new Set([...prev, replyToId, ...allParentIds]));
            sessionStorage.removeItem('expandReplyId');
        }
    }, [post]);

    const updatePostInState = (updatedPost: PostWithStats) => {
        setPost(currentThread => {
            if (!currentThread) return null;
            const updateRepliesRecursively = (replies: PostWithReplies[]): PostWithReplies[] =>
                replies.map(reply => {
                    if (reply.id === updatedPost.id) return { ...reply, ...updatedPost };
                    if (reply.replies?.length) return { ...reply, replies: updateRepliesRecursively(reply.replies) };
                    return reply;
                });
            if (currentThread.id === updatedPost.id) {
                const updatedThread = { ...currentThread, ...updatedPost };
                return { ...updatedThread, replies: updateRepliesRecursively(currentThread.replies) };
            }
            return { ...currentThread, replies: updateRepliesRecursively(currentThread.replies) };
        });
    };

    const updatePostPurifyingState = (postId: number, isPurifying: boolean) => {
        setPost(currentThread => {
            if (!currentThread) return null;
            const updateRecursively = (replies: PostWithReplies[]): PostWithReplies[] =>
                replies.map(reply => {
                    if (reply.id === postId) return { ...reply, isPurifying };
                    if (reply.replies?.length) return { ...reply, replies: updateRecursively(reply.replies) };
                    return reply;
                });
            if (currentThread.id === postId) return { ...currentThread, isPurifying };
            return { ...currentThread, replies: updateRecursively(currentThread.replies) };
        });
    };

    const handleAutoPurify = (postId: number) => updatePostPurifyingState(postId, true);
    const handlePurification = (postId: number) => updatePostPurifyingState(postId, true);

    const handleAnimationEnd = (postId: number) => {
        addPurifiedPostId(postId);
        setPurifiedPostIds(prev => new Set([...prev, postId]));
        if (post?.id === postId) {
            setShowFinalMessage(true);
        } else {
            setPost(current => {
                if (!current) return null;
                const filterRepliesRecursively = (replies: PostWithReplies[]): PostWithReplies[] =>
                    replies
                        .filter(reply => reply.id !== postId)
                        .map(reply => ({ ...reply, replies: filterRepliesRecursively(reply.replies || []) }));
                return { ...current, replies: filterRepliesRecursively(current.replies || []) };
            });
        }
    };

    const handleShare = async () => {
        try {
            await navigator.share({ title: "在SUC回音壁上查看此回音！", url: window.location.href });
        } catch {
            try {
                await navigator.clipboard.writeText(window.location.href);
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
            if (!res.ok) throw new Error((await res.json()).message || 'Failed to delete post');
        } catch (err) {
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
            if (!res.ok) throw new Error((await res.json()).error || "举报失败。");
            setReportFeedback('感谢您的举报，管理员将会审查。');
        } catch (err) {
            setReportFeedback((err as Error).message);
        } finally {
            setTimeout(() => setReportFeedback(''), 3000);
            setReportingPostId(null);
        }
    };

    const handlePostVanished = (postId: number) => {
        logger.log(`Vote failed because post ${postId} has vanished. Showing final message.`);
        setShowFinalMessage(true);
    };

    const handleReplyToComment = (parentPostId: number, replyToId: number) => {
        router.replace(`/compose?parentPostId=${parentPostId}&parentReplyId=${replyToId}&feedType=${post?.feed}`);
    };

    const handleRatingSubmit = async (rating: number) => {
        if (!fingerprint || !post || post.feed !== 'JOB') return;
        setIsSubmittingRating(true);
        try {
            const res = await fetch(`/api/jobs/${post.id}/rate`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ rating, fingerprintHash: fingerprint }),
            });
            if (!res.ok) throw new Error((await res.json()).error || 'Failed to submit rating');
            const updatedStats = await res.json();
            setPost(p => p ? { ...p, stats: { ...p.stats!, averageRating: updatedStats.averageRating, ratingCount: updatedStats.ratingCount } } : null);
        } catch (error) {
            logger.error('Rating submission failed:', error);
            setError((error as Error).message);
        } finally {
            setIsSubmittingRating(false);
        }
    };

    const renderMainContent = () => {
        if (showFinalMessage) return <ExpiredPostMessage />;
        if (error && !post) return <p className="text-red-400 text-center p-8">{error}</p>;
        if (!post) return <p className="text-gray-400 text-center p-8">这回音已消散.</p>;

        const isPoll = post.contentType === 'POLL' && post.pollOptions?.length;
        const isLinkPost = post.contentType === 'LINK' && post.url;
        const isJobPost = post.feed === 'JOB';

        const filterRepliesRecursively = (replies: PostWithReplies[]): PostWithReplies[] => {
            return replies
                .filter(reply => !purifiedPostIds.has(reply.id))
                .map(reply => ({ ...reply, replies: filterRepliesRecursively(reply.replies || []) }));
        };
        const filteredReplies = post.replies ? filterRepliesRecursively(post.replies) : [];

        return (
            <motion.div key="content" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5, ease: "easeOut" }}>
                <div className="mb-4">
                    <PostCard
                        post={post}
                        isLink={false}
                        onVote={(_, voteType) => handleOptimisticVote(post, voteType, updatePostInState, handlePurification, handlePostVanished)}
                        userVote={userVotes[post.id]}
                        isPurifying={post.isPurifying}
                        onPurificationComplete={() => handleAnimationEnd(post.id)}
                        onFaded={() => handleAnimationEnd(post.id)}
                        onDelete={handleDelete}
                        onDeletionComplete={() => handleAnimationEnd(post.id)}
                        onAutoPurify={handleAutoPurify}
                        onReplyClick={handleReplyToComment}
                    />
                    {isJobPost && <p className="text-xs text-center text-gray-500 pt-2">温馨提醒：请对招聘内容进行独立核实，谨防诈骗。</p>}
                </div>
                <ContactCard content={post.content || ''} />
                {isLinkPost && <div className="my-6"><LinkPreviewCard url={post.url} /></div>}
                {isPoll && <div className="mb-6"><Poll postId={post.id} options={post.pollOptions!} /></div>}
                {isJobPost && (
                    <div className="my-6">
                        <StarRating
                            postId={post.id}
                            onRating={handleRatingSubmit}
                            isSubmitting={isSubmittingRating}
                            averageRating={averageRating || 0}
                            userRating={null}
                            isFetchingRating={false}
                        />
                        <p className="text-center text-xs text-gray-500 pt-2">共 {post.stats?.ratingCount || 0} 评价</p>
                    </div>
                )}
                {(!post.isPurifying && !post.isDeleting) && (
                    <>
                        <div className="mt-8">
                            <h2 className="text-xl font-mono text-gray-400 mb-2">回复 ({post.stats?.replyCount ?? 0})</h2>
                            {filteredReplies.length > 0 ? (
                                <div className="space-y-2">
                                    <ReplyThread
                                        replies={filteredReplies}
                                        depth={1}
                                        expandedReplyIds={expandedReplyIds}
                                        toggleExpandReply={toggleExpandReply}
                                        parentFingerprintHash={post.fingerprintHash}
                                        userVotes={userVotes}
                                        handleOptimisticVote={handleOptimisticVote}
                                        handleDelete={handleDelete}
                                        handleOpenReportModal={handleOpenReportModal}
                                        handleReplyToComment={handleReplyToComment}
                                        handleAnimationEnd={handleAnimationEnd}
                                        handleAutoPurify={handleAutoPurify}
                                        updatePostInState={updatePostInState}
                                        handlePurification={handlePurification}
                                        handlePostVanished={handlePostVanished}
                                    />
                                </div>
                            ) : (
                                <p className="text-gray-500 text-sm ml-4 pl-4 border-l-2 border-accent/30">目前并没有回复.</p>
                            )}
                        </div>
                        <div className="h-24" />
                    </>
                )}
            </motion.div>
        );
    };

    return (
        <div className="container mx-auto max-w-2xl p-4">
            <ReportModal isOpen={isReportModalOpen} onClose={() => setIsReportModalOpen(false)} onSubmit={handleReportSubmit} />
            <header className="py-4 flex justify-between items-center">
                <button onClick={handleBackClick} className="p-2 rounded-lg text-accent hover:underline flex items-center gap-2">
                    <Icon name="arrow-left" />
                    <span>返回</span>
                </button>
                <div className={`flex items-center gap-2 transition-opacity duration-300 ${(!isLoading && post && !showFinalMessage) ? 'opacity-100' : 'opacity-0'}`}>
                    <button onClick={handleShare} aria-label="Share post" className="p-2 rounded-lg transition-colors icon-base icon-share" disabled={isLoading || !post || showFinalMessage}>
                        <Icon name="share" />
                    </button>
                    <button onClick={() => post && handleOpenReportModal(post.id)} aria-label="Report post" className="p-2 rounded-lg transition-colors icon-base icon-report-flag" disabled={isLoading || !post || showFinalMessage}>
                        <Icon name="report-flag" />
                    </button>
                </div>
            </header>
            <AnimatePresence>
                {shareFeedback && <motion.div key="share-feedback" initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.3 }} className="text-center p-2 my-2 bg-green-600 text-white rounded-md" style={{ position: 'relative', zIndex: 10 }}>{shareFeedback}</motion.div>}
                {reportFeedback && <motion.div key="report-feedback" initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.3 }} className="text-center p-2 my-2 bg-yellow-600 text-white rounded-md" style={{ position: 'relative', zIndex: 10 }}>{reportFeedback}</motion.div>}
            </AnimatePresence>
            <main className="mt-4">
                {isLoading ? <LoadingSpinner label="加载回音..." /> : renderMainContent()}
            </main>
        </div>
    );
}
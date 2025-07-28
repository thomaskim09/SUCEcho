"use client";

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import PostCard from './PostCard';
import type { PostWithStats, PostWithReplies } from '@/lib/types';
import { Icon } from './Icon';

interface ReplyThreadProps {
    replies: PostWithReplies[];
    depth?: number;
    parentFingerprintHash: string;
    expandedReplyIds: Set<number>;
    toggleExpandReply: (id: number) => void;
    userVotes: Record<number, 1 | -1>;
    handleOptimisticVote: (post: PostWithStats, voteType: 1 | -1, updateStateCallback: (updatedPost: PostWithStats) => void, onPurifyCallback: (postId: number) => void, onPostVanished: (postId: number) => void) => void;
    handleDelete: (postId: number) => void;
    handleOpenReportModal: (postId: number) => void;
    handleReplyToComment: (parentPostId: number, replyToId: number) => void;
    handleAnimationEnd: (postId: number) => void;
    handleAutoPurify: (postId: number) => void;
    updatePostInState: (updatedPost: PostWithStats) => void;
    handlePurification: (postId: number) => void;
    handlePostVanished: (postId: number) => void;
}

const flattenReplies = (replies: PostWithReplies[]): PostWithReplies[] => {
    return replies.flatMap(reply => [reply, ...(reply.replies ? flattenReplies(reply.replies) : [])]);
};

export default function ReplyThread({ replies, depth = 1, expandedReplyIds, toggleExpandReply, ...rest }: ReplyThreadProps) {
    if (!replies || replies.length === 0) {
        return null;
    }

    const MAX_DEPTH = parseInt(process.env.NEXT_PUBLIC_MAX_REPLY_DEPTH || '3', 10);

    return (
        <div className="space-y-2 border-l-2 border-accent/30 pl-4 ml-4">
            {replies.map(reply => {
                const isExpanded = expandedReplyIds.has(reply.id);
                const hasChildren = reply.replies && reply.replies.length > 0;

                return (
                    <motion.div key={reply.id} layout="position" transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}>
                        <PostCard
                            post={reply}
                            isLink={false}
                            onVote={(_, voteType) => rest.handleOptimisticVote(reply, voteType, rest.updatePostInState, rest.handlePurification, rest.handlePostVanished)}
                            onDelete={() => rest.handleDelete(reply.id)}
                            userVote={rest.userVotes[reply.id]}
                            onReport={() => rest.handleOpenReportModal(reply.id)}
                            onPurificationComplete={() => rest.handleAnimationEnd(reply.id)}
                            onFaded={() => rest.handleAnimationEnd(reply.id)}
                            isPurifying={reply.isPurifying}
                            onDeletionComplete={() => rest.handleAnimationEnd(reply.id)}
                            onAutoPurify={() => rest.handleAutoPurify(reply.id)}
                            onReplyClick={rest.handleReplyToComment}
                            parentFingerprintHash={rest.parentFingerprintHash}
                        />

                        {hasChildren && (
                            <div className="mt-2 ml-4">
                                <AnimatePresence initial={false}>
                                    {isExpanded ? (
                                        <motion.div
                                            key="content"
                                            initial="collapsed"
                                            animate="open"
                                            exit="collapsed"
                                            variants={{
                                                open: { opacity: 1, height: 'auto', y: 0 },
                                                collapsed: { opacity: 0, height: 0, y: -10 }
                                            }}
                                            transition={{ duration: 0.4, ease: [0.04, 0.62, 0.23, 0.98] }}
                                        >
                                            <button onClick={() => toggleExpandReply(reply.id)} className="text-sm font-bold text-accent hover:underline flex items-center gap-1 mb-2">
                                                <Icon name="comment" className="w-4 h-4" />
                                                收起回覆
                                            </button>
                                            {depth < MAX_DEPTH ? (
                                                <ReplyThread replies={reply.replies} depth={depth + 1} expandedReplyIds={expandedReplyIds} toggleExpandReply={toggleExpandReply} {...rest} />
                                            ) : (
                                                <div className="space-y-2 border-l-2 border-accent/30 pl-4 ml-4">
                                                    {flattenReplies(reply.replies).map(flatReply => (
                                                        <PostCard
                                                            key={flatReply.id}
                                                            post={flatReply}
                                                            isLink={false}
                                                            onVote={(_, voteType) => rest.handleOptimisticVote(flatReply, voteType, rest.updatePostInState, rest.handlePurification, rest.handlePostVanished)}
                                                            onDelete={() => rest.handleDelete(flatReply.id)}
                                                            userVote={rest.userVotes[flatReply.id]}
                                                            onReport={() => rest.handleOpenReportModal(flatReply.id)}
                                                            onPurificationComplete={() => rest.handleAnimationEnd(flatReply.id)}
                                                            onFaded={() => rest.handleAnimationEnd(flatReply.id)}
                                                            isPurifying={flatReply.isPurifying}
                                                            onDeletionComplete={() => rest.handleAnimationEnd(flatReply.id)}
                                                            onAutoPurify={() => rest.handleAutoPurify(flatReply.id)}
                                                            onReplyClick={rest.handleReplyToComment}
                                                            parentFingerprintHash={rest.parentFingerprintHash}
                                                        />
                                                    ))}
                                                </div>
                                            )}
                                        </motion.div>
                                    ) : (
                                        <button onClick={() => toggleExpandReply(reply.id)} className="text-sm font-bold text-accent hover:underline flex items-center gap-1">
                                            <Icon name="comment" className="w-4 h-4" />
                                            显示 {flattenReplies(reply.replies).length} 个回覆
                                        </button>
                                    )}
                                </AnimatePresence>
                            </div>
                        )}
                    </motion.div>
                );
            })}
        </div>
    );
}
// sucecho/src/app/admin/reports/page.tsx
"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import type { PostWithStats } from '@/lib/types';
import PostCard from '@/app/components/PostCard';
import logger from '@/lib/logger';

interface Report {
    id: number;
    fingerprintHash: string;
    reason: string | null;
    createdAt: string;
    reporterCodename: string;
}

interface ReportedPost extends PostWithStats {
    reports: Report[];
    _count: {
        reports: number;
    };
}

export default function AdminReportsPage() {
    const [reportedPosts, setReportedPosts] = useState<ReportedPost[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchReports = async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await fetch('/api/admin/reports');
            if (!res.ok) throw new Error('Failed to fetch reports');
            const data = await res.json();
            setReportedPosts(data);
        } catch (e) {
            setError((e as Error).message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchReports();
    }, []);

    const handlePostRemovedFromUI = (deletedPostId: number) => {
        setReportedPosts(currentPosts =>
            currentPosts.filter(post => post.id !== deletedPostId)
        );
    };

    const handleDeletePost = async (postId: number) => {
        if (!confirm(`您确定要删除帖子 #${postId} 吗？此操作无法撤销。`)) {
            return;
        }
        try {
            const res = await fetch(`/api/admin/posts/${postId}`, {
                method: 'DELETE',
            });
            if (!res.ok) {
                const errorData = await res.json();
                throw new Error(errorData.message || 'Failed to delete post');
            }
            handlePostRemovedFromUI(postId);
            logger.log(`Admin successfully deleted post #${postId} from the reports page.`);
        } catch (err) {
            alert(`Error deleting post: ${(err as Error).message}`);
        }
    };

    const handleDismissReport = async (reportId: number) => {
        if (!confirm(`您确定要移除这条举报吗？`)) {
            return;
        }
        try {
            const res = await fetch(`/api/admin/reports/${reportId}`, {
                method: 'DELETE',
            });
            if (!res.ok) {
                const errorData = await res.json();
                throw new Error(errorData.message || 'Failed to dismiss report');
            }
            // Re-fetch reports to update the UI
            fetchReports();
        } catch (err) {
            alert(`Error dismissing report: ${(err as Error).message}`);
        }
    };

    const handleDummyVote = () => { };

    const renderContent = () => {
        if (loading) return <p className="text-center p-8">正在加载举报列表...</p>;
        if (error) return <p className="text-center p-8 text-red-500">Error: {error}</p>;
        if (reportedPosts.length === 0) return <p className="text-center p-8">太棒了！没有待处理的举报。</p>;

        return (
            <div className="space-y-8">
                {reportedPosts.map(post => {
                    const isReply = !!post.parentPostId;
                    const wrapperClass = isReply ? "border-l-2 border-accent/30 pl-4 ml-4" : "";

                    return (
                        <div key={post.id} className={wrapperClass}>
                            <div className="p-4 rounded-lg bg-red-900/20 border border-red-700/50">
                                <PostCard
                                    post={post}
                                    onVote={handleDummyVote}
                                    onDelete={() => handleDeletePost(post.id)}
                                    onPurificationComplete={() => handlePostRemovedFromUI(post.id)}
                                    isLink={!isReply}
                                    onAutoPurify={() => { }}
                                />
                                <div className="mt-4 border-t border-red-700/50 pt-4">
                                    <h4 className="font-bold text-sm mb-2 text-red-300">
                                        举报详情:
                                    </h4>
                                    <ul className="space-y-2 text-sm text-gray-300">
                                        {post.reports.map((report) => (
                                            <li key={report.id} className="flex justify-between items-center p-2 bg-gray-800/50 rounded-md">
                                                <div>
                                                    <p>{report.reason || <i className="opacity-60">未提供理由</i>}</p>
                                                    <p className="text-xs text-gray-500 mt-1">
                                                        举报来自: <span className="font-mono">{report.reporterCodename}</span>
                                                        <span className="mx-2">|</span>
                                                        {new Date(report.createdAt).toLocaleString()}
                                                    </p>
                                                </div>
                                                <button onClick={() => handleDismissReport(report.id)} className="bg-gray-600 hover:bg-gray-500 text-white font-bold py-1 px-2 rounded-lg text-xs">
                                                    跳过
                                                </button>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        );
    }

    return (
        <div className="container mx-auto max-w-4xl p-4 text-white">
            <header className="py-4">
                <Link href="/admin/dashboard" className="text-accent hover:underline mb-4 block">
                    &larr; 回到主控室
                </Link>
                <h1 className="text-3xl font-bold font-mono text-accent">紧急举报队列</h1>
            </header>
            <main className="mt-4">
                {renderContent()}
            </main>
        </div>
    );
}
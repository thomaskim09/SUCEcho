// sucecho/src/app/admin/reports/page.tsx
"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import type { PostWithStats } from '@/lib/types';
import PostCard from '@/app/components/PostCard';
import logger from '@/lib/logger';

interface Report {
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

    // This function now ONLY updates the UI after a successful deletion
    const handlePostRemovedFromUI = (deletedPostId: number) => {
        setReportedPosts(currentPosts =>
            currentPosts.filter(post => post.id !== deletedPostId)
        );
    };

    // NEW: The actual delete handler that calls the API
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
            // On successful API call, remove the post from the local UI
            handlePostRemovedFromUI(postId);
            logger.log(`Admin successfully deleted post #${postId} from the reports page.`);
        } catch (err) {
            alert(`Error deleting post: ${(err as Error).message}`);
        }
    };

    // A dummy handler since voting isn't a primary action here
    const handleDummyVote = () => { };

    const renderContent = () => {
        if (loading) return <p className="text-center p-8">正在加载举报列表...</p>;
        if (error) return <p className="text-center p-8 text-red-500">Error: {error}</p>;
        if (reportedPosts.length === 0) return <p className="text-center p-8">太棒了！没有待处理的举报。</p>;

        return (
            <div className="space-y-8">
                {reportedPosts.map(post => (
                    <div key={post.id} className="p-4 rounded-lg bg-red-900/20 border border-red-700/50">
                        <PostCard
                            post={post}
                            onVote={handleDummyVote}
                            onDelete={() => handleDeletePost(post.id)} // Pass the new handler
                            onPurificationComplete={() => handlePostRemovedFromUI(post.id)} // Also remove from UI if purified elsewhere
                            isLink={true}
                        />
                        <div className="mt-4 border-t border-red-700/50 pt-4">
                            <h4 className="font-bold text-sm mb-2 text-red-300">
                                {post._count.reports} 条举报:
                            </h4>
                            <ul className="space-y-2 text-sm text-gray-300">
                                {post.reports.map((report, index) => (
                                    <li key={index} className="p-2 bg-gray-800/50 rounded-md">
                                        <p>{report.reason || <i className="opacity-60">未提供理由</i>}</p>
                                        <p className="text-xs text-gray-500 mt-1">
                                            举报来自: <span className="font-mono">{report.reporterCodename}</span>
                                            <span className="mx-2">|</span>
                                            {new Date(report.createdAt).toLocaleString()}
                                        </p>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>
                ))}
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
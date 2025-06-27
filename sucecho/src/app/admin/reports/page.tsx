// sucecho/src/app/admin/reports/page.tsx
"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import type { PostWithStats } from '@/lib/types';
import PostCard from '@/app/components/PostCard';

interface ReportedPost extends PostWithStats {
    reports: {
        fingerprintHash: string;
        reason: string | null;
        createdAt: string;
    }[];
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

    const handlePostDeleted = (deletedPostId: number) => {
        // This provides an instant UI update by filtering the deleted post out of the state
        setReportedPosts(currentPosts =>
            currentPosts.filter(post => post.id !== deletedPostId)
        );
    };

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
                            onDelete={handlePostDeleted}
                            isLink={true}
                            isStacked={true}
                        />
                        <div className="mt-4 border-t border-red-700/50 pt-4">
                            {/* MODIFICATION: Removed the report count from the heading */}
                            <h4 className="font-bold text-sm mb-2 text-red-300">举报理由:</h4>
                            <ul className="space-y-2 text-sm text-gray-300">
                                {post.reports.map((report, index) => (
                                    <li key={index} className="p-2 bg-gray-800/50 rounded-md">
                                        <p>{report.reason || <i>未提供理由</i>}</p>
                                        <p className="text-xs text-gray-500 mt-1">举报于: {new Date(report.createdAt).toLocaleString()}</p>
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
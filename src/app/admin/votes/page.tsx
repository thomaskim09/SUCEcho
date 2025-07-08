// SUCEcho_packaged/src/app/admin/votes/page.tsx
"use client";

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import logger from '@/lib/logger';

interface UserVoteStats {
    fingerprintHash: string;
    codename: string;
    upvotes: number;
    downvotes: number;
}

type SortKey = 'codename' | 'upvotes' | 'downvotes';

export default function AdminVoteManagementPage() {
    const [stats, setStats] = useState<UserVoteStats[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [sortKey, setSortKey] = useState<SortKey>('downvotes');
    const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

    useEffect(() => {
        const fetchVoteStats = async () => {
            setLoading(true);
            setError(null);
            try {
                const response = await fetch('/api/admin/votes/summary');
                if (!response.ok) {
                    const errorData = await response.json();
                    throw new Error(errorData.message || 'Failed to fetch vote stats');
                }
                const data: UserVoteStats[] = await response.json();
                setStats(data);
            } catch (e: unknown) {
                const errorMessage = e instanceof Error ? e.message : 'An unknown error occurred';
                setError(errorMessage);
                logger.error("Error fetching vote stats:", e);
            } finally {
                setLoading(false);
            }
        };
        fetchVoteStats();
    }, []);

    const sortedStats = useMemo(() => {
        return [...stats].sort((a, b) => {
            const valA = a[sortKey];
            const valB = b[sortKey];

            let comparison = 0;
            if (valA > valB) {
                comparison = 1;
            } else if (valA < valB) {
                comparison = -1;
            }

            return sortDirection === 'desc' ? -comparison : comparison;
        });
    }, [stats, sortKey, sortDirection]);

    const handleSort = (key: SortKey) => {
        if (sortKey === key) {
            setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
        } else {
            setSortKey(key);
            setSortDirection('desc');
        }
    };

    const SortableHeader = ({ tkey, label }: { tkey: SortKey; label: string }) => (
        <th className="p-4 cursor-pointer hover:text-white" onClick={() => handleSort(tkey)}>
            {label}
            {sortKey === tkey && (sortDirection === 'desc' ? ' ↓' : ' ↑')}
        </th>
    );

    const renderContent = () => {
        if (loading) return <div className="text-white text-center mt-8">正在加载投票数据...</div>;
        if (error) return <div className="text-red-500 text-center mt-8">错误: {error}</div>;
        if (sortedStats.length === 0) return <p className="text-center text-gray-400">没有投票数据可显示。</p>;

        return (
            <div className="overflow-x-auto">
                <table className="min-w-full rounded-lg" style={{ backgroundColor: 'var(--card-background)' }}>
                    <thead>
                        <tr className="text-left text-gray-400 font-mono border-b border-gray-700">
                            <SortableHeader tkey="codename" label="代号" />
                            <SortableHeader tkey="downvotes" label="总倒赞" />
                            <SortableHeader tkey="upvotes" label="总赞同" />
                            <th className="p-4">操作</th>
                        </tr>
                    </thead>
                    <tbody>
                        {sortedStats.map((user) => (
                            <tr key={user.fingerprintHash} className="border-b border-gray-800 hover:bg-gray-800/50">
                                <td className="p-4 font-mono">{user.codename}</td>
                                <td className="p-4 font-bold text-red-400">{user.downvotes}</td>
                                <td className="p-4 font-bold text-green-400">{user.upvotes}</td>
                                <td className="p-4">
                                    <Link
                                        href={`/admin/users/${user.fingerprintHash}`}
                                        className="bg-blue-600 text-white py-1 px-3 rounded-lg hover:bg-blue-700 transition-colors text-sm whitespace-nowrap"
                                        style={{ minWidth: 0, maxWidth: '100%', display: 'inline-block', textAlign: 'center' }}
                                    >
                                        查看
                                    </Link>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        );
    };

    return (
        <div className="container mx-auto max-w-6xl p-4 text-white">
            <header className="py-4">
                <Link href="/admin/dashboard" className="text-accent hover:underline mb-4 block">
                    &larr; 回到主控室
                </Link>
                <h1 className="text-3xl font-bold font-mono text-accent">用户投票管理</h1>
                <p className="mt-2 text-gray-400">查看用户的投票历史，识别潜在的恶意行为。点击表头可进行排序。</p>
            </header>
            <main className="mt-4">
                {renderContent()}
            </main>
        </div>
    );
}
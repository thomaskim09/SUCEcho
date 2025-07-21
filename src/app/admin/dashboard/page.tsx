// sucecho/src/app/admin/dashboard/page.tsx
"use client";

import { useAdmin } from '@/context/AdminContext';
import { useRouter } from 'next/navigation';
import { useState, useEffect, FormEvent } from 'react';
import Link from 'next/link';
import logger from '@/lib/logger';
import LocalStorageManager from '@/app/components/LocalStorageManager';

interface AdminStats {
    totalUsers: number;
    activeUsers24h: number;
    totalPosts: number;
    postsWithin24h: number;
    expiredPostsCount: number;
    totalVotes: number;
    totalUpvotes: number;
    totalDownvotes: number;
}

export default function AdminDashboardPage() {
    const { logout } = useAdmin();
    const router = useRouter();
    const [stats, setStats] = useState<AdminStats | null>(null);
    const [reportCount, setReportCount] = useState<number | null>(null);
    const [isCronRunning, setIsCronRunning] = useState(false);
    const [isDeepCleaning, setIsDeepCleaning] = useState(false);
    const [specialPostContent, setSpecialPostContent] = useState('');
    const [contentType, setContentType] = useState<'ANNOUNCEMENT' | 'ADVERTISEMENT'>('ANNOUNCEMENT');
    const [feedType, setFeedType] = useState<'EPHEMERAL' | 'PERMANENT' | 'JOB'>('EPHEMERAL');
    const [adUrl, setAdUrl] = useState('');
    const [isCreatingPost, setIsCreatingPost] = useState(false);

    const fetchDashboardData = async () => {
        try {
            const [statsResponse, reportsResponse] = await Promise.all([
                fetch('/api/admin/stats'),
                fetch('/api/admin/reports'),
            ]);

            if (statsResponse.ok) {
                setStats(await statsResponse.json());
            } else {
                logger.warn("Could not fetch admin stats");
                setStats(null);
            }

            if (reportsResponse.ok) {
                const reportsData = await reportsResponse.json();
                setReportCount(reportsData.length);
            } else {
                logger.warn("Could not fetch report count");
                setReportCount(0);
            }
        } catch (e) {
            logger.error("Error fetching dashboard data:", e);
            setReportCount(0);
            setStats(null);
        }
    };

    useEffect(() => {
        fetchDashboardData();
    }, []);

    const handleRunCron = async () => {
        const survivalHours = process.env.NEXT_PUBLIC_POST_SURVIVAL_HOURS || 24;
        if (!confirm(`你确定要手动清理所有 ${survivalHours} 小时前的内容吗？`)) {
            return;
        }

        setIsCronRunning(true);
        try {
            const res = await fetch('/api/admin/manual-cron', { method: 'POST' });
            const data = await res.json();
            alert(data.message);
            await fetchDashboardData();
        } catch (err) {
            alert(`运行清理任务时出错: ${(err as Error).message}`);
        } finally {
            setIsCronRunning(false);
        }
    };

    const handleDeepClean = async () => {
        const maxLifetimeDays = process.env.NEXT_PUBLIC_POST_MAX_LIFETIME_DAYS || 180;
        const confirmationText = `这是一个非常危险的操作，将永久删除所有超过 ${maxLifetimeDays} 天的帖子、投票和举报记录。数据将无法恢复。\n\n您确定要继续吗？`;

        if (!confirm(confirmationText)) {
            return;
        }
        setIsDeepCleaning(true);
        try {
            const res = await fetch('/api/admin/manual-deep-clean', { method: 'POST' });
            const data = await res.json();
            alert(data.message);
            await fetchDashboardData();
        } catch (err) {
            alert(`运行深度清理时出错: ${(err as Error).message}`);
        } finally {
            setIsDeepCleaning(false);
        }
    };

    const handleLogout = async () => {
        await logout();
        router.push('/');
    };

    const handleCreateSpecialPost = async (e: FormEvent) => {
        e.preventDefault();
        setIsCreatingPost(true);
        try {
            const res = await fetch('/api/admin/posts/create-special', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    content: specialPostContent,
                    contentType: contentType,
                    feed: feedType,
                    url: contentType === 'ADVERTISEMENT' ? adUrl : null,
                }),
            });
            if (!res.ok) {
                const error = await res.json();
                throw new Error(error.error || 'Failed to create post');
            }
            alert('特别帖子发布成功！');
            setSpecialPostContent('');
            setAdUrl('');
        } catch (err) {
            alert(`创建帖子时出错: ${(err as Error).message}`);
        } finally {
            setIsCreatingPost(false);
        }
    };

    return (
        <div className="container mx-auto max-w-6xl p-4 text-white">
            <header className="py-4 flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold font-mono text-accent mb-2">管理员仪表板</h1>
                    <p>欢迎，守护者。这是您的指挥中心。</p>
                </div>
                <button
                    onClick={handleLogout}
                    className="bg-red-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-red-700 transition-colors"
                >
                    登出
                </button>
            </header>

            {/* Special Post Section */}
            <section
                className="mt-8 p-6 rounded-lg"
                style={{
                    backgroundColor: 'var(--card-background)',
                    border: '1px solid #a78bfa'
                }}
            >
                <h2 className="text-2xl font-bold text-purple-400 mb-4">发布特别帖子</h2>
                <form onSubmit={handleCreateSpecialPost} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-gray-300 mb-2">帖子类型</label>
                            <select
                                value={contentType}
                                onChange={(e) => setContentType(e.target.value as 'ANNOUNCEMENT' | 'ADVERTISEMENT')}
                                className="w-full bg-gray-800 border border-gray-600 rounded-lg p-2 focus:outline-none focus:border-accent"
                            >
                                <option value="ANNOUNCEMENT">系统公告</option>
                                <option value="ADVERTISEMENT">特约赞助</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-gray-300 mb-2">发布频道</label>
                            <select
                                value={feedType}
                                onChange={(e) => setFeedType(e.target.value as 'EPHEMERAL' | 'PERMANENT' | 'JOB')}
                                className="w-full bg-gray-800 border border-gray-600 rounded-lg p-2 focus:outline-none focus:border-accent"
                            >
                                <option value="EPHEMERAL">回音壁 (24小时)</option>
                                <option value="PERMANENT">时光档案 (永久)</option>
                                <option value="JOB">谋生墙 (永久)</option>
                            </select>
                        </div>
                    </div>
                    <div>
                        <label htmlFor="special-content" className="block text-gray-300 mb-2">内容</label>
                        <textarea
                            id="special-content"
                            value={specialPostContent}
                            onChange={(e) => setSpecialPostContent(e.target.value)}
                            className="w-full bg-gray-800 border border-gray-600 rounded-lg p-2 focus:outline-none focus:border-accent"
                            rows={4}
                            required
                        />
                    </div>
                    {contentType === 'ADVERTISEMENT' && (
                        <div>
                            <label htmlFor="ad-url" className="block text-gray-300 mb-2">广告链接 (URL)</label>
                            <input
                                type="url"
                                id="ad-url"
                                value={adUrl}
                                onChange={(e) => setAdUrl(e.target.value)}
                                className="w-full bg-gray-800 border border-gray-600 rounded-lg p-2 focus:outline-none focus:border-accent"
                                placeholder="https://example.com"
                                required
                            />
                        </div>
                    )}
                    <button
                        type="submit"
                        className="w-full bg-purple-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50"
                        disabled={isCreatingPost}
                    >
                        {isCreatingPost ? '发布中...' : '发布帖子'}
                    </button>
                </form>
            </section>

            {/* Stats Grid */}
            <section className="mt-8">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {/* Reports Card */}
                    <div className="p-6 rounded-lg flex flex-col justify-between" style={{ backgroundColor: 'var(--card-background)', border: `1px solid ${reportCount && reportCount > 0 ? '#ef4444' : '#22c55e'}` }}>
                        <div>
                            <h2 className={`text-2xl font-bold ${reportCount && reportCount > 0 ? 'text-red-400' : 'text-green-400'}`}>
                                {reportCount && reportCount > 0 ? '待处理举报' : '举报队列清空'}
                            </h2>
                            {reportCount !== null ? (
                                <div className="mt-2">
                                    <p className="text-5xl font-mono mt-2">{reportCount}</p>
                                    <p className="text-sm text-gray-400">{reportCount === 0 ? '太好了，环境不错！' : '有新的举报'}</p>
                                </div>
                            ) : (
                                <p className="text-lg text-gray-500 mt-2">加载中...</p>
                            )}
                        </div>
                        <Link href="/admin/reports" className="mt-4 block text-center bg-gray-700 text-white font-bold py-2 px-4 rounded-lg hover:bg-gray-600 transition-colors">
                            前往处理
                        </Link>
                    </div>

                    {/* User Stats Card */}
                    <div className="p-6 rounded-lg flex flex-col justify-between" style={{ backgroundColor: 'var(--card-background)', border: '1px solid #3b82f6' }}>
                        <div>
                            <h2 className="text-2xl font-bold text-blue-400">用户统计</h2>
                            <p className="text-sm text-gray-400 mt-1 mb-4">查看社区用户增长和活跃度。</p>
                            {stats ? (
                                <div className="space-y-2 font-mono">
                                    <p>24小时活跃: <span className="font-bold text-xl text-green-400">{stats.activeUsers24h}</span></p>
                                    <p>历史总用户: <span className="font-bold text-xl text-white">{stats.totalUsers}</span></p>
                                </div>
                            ) : (
                                <p className="text-lg text-gray-500 mt-2">加载中...</p>
                            )}
                        </div>
                        <Link href="/admin/users" className="mt-4 block text-center bg-gray-700 text-white font-bold py-2 px-4 rounded-lg hover:bg-gray-600 transition-colors">
                            管理用户
                        </Link>
                    </div>

                    {/* Vote Management Card */}
                    <div className="p-6 rounded-lg flex flex-col justify-between" style={{ backgroundColor: 'var(--card-background)', border: '1px solid #a78bfa' }}>
                        <div>
                            <h2 className="text-2xl font-bold text-purple-400">投票统计</h2>
                            <p className="text-sm text-gray-400 mt-1 mb-4">审查用户投票行为，维护社区平衡。</p>
                            {stats ? (
                                <div className="space-y-2 font-mono">
                                    <p>总赞同: <span className="font-bold text-xl text-green-400">{stats.totalUpvotes}</span></p>
                                    <p>总倒赞: <span className="font-bold text-xl text-red-400">{stats.totalDownvotes}</span></p>
                                </div>
                            ) : (
                                <p className="text-lg text-gray-500 mt-2">加载中...</p>
                            )}
                        </div>
                        <Link href="/admin/votes" className="mt-4 block text-center bg-gray-700 text-white font-bold py-2 px-4 rounded-lg hover:bg-gray-600 transition-colors">
                            审查投票
                        </Link>
                    </div>

                    {/* Echo Management Card */}
                    <div className="p-6 rounded-lg flex flex-col justify-between" style={{ backgroundColor: 'var(--card-background)', border: '1px solid #f97316' }}>
                        <div>
                            <h2 className="text-2xl font-bold text-orange-400">回音管理</h2>
                            <p className="text-sm text-gray-400 mt-1 mb-4">手动运行日常或深度数据清理任务。</p>
                            {stats ? (
                                <div className="space-y-2 font-mono">
                                    <p>24小时内: <span className="font-bold text-xl text-green-400">{stats.postsWithin24h}</span></p>
                                    <p>已过期: <span className="font-bold text-xl text-yellow-400">{stats.expiredPostsCount}</span></p>
                                    <p>总数: <span className="font-bold text-xl text-white">{stats.totalPosts}</span></p>
                                </div>
                            ) : (
                                <p className="text-lg text-gray-500 mt-2">加载中...</p>
                            )}
                        </div>
                        <div className="flex gap-2 mt-4">
                            <button onClick={handleRunCron} disabled={isCronRunning} className="bg-blue-600 w-full text-white font-bold py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50">
                                {isCronRunning ? '...' : '清理过期'}
                            </button>
                            <button onClick={handleDeepClean} disabled={isDeepCleaning} className="bg-orange-600 w-full text-white font-bold py-2 px-4 rounded-lg hover:bg-orange-700 transition-colors disabled:opacity-50">
                                {isDeepCleaning ? '...' : '深度清理'}
                            </button>
                        </div>
                    </div>
                </div>
            </section>

            {/* Local Storage Manager */}
            <section
                className="mt-8 p-6 rounded-lg"
                style={{
                    backgroundColor: 'var(--card-background)',
                    border: '1px solid #14b8a6'
                }}
            >
                <h2 className="text-2xl font-bold text-teal-400 mb-4">本地存储管理</h2>
                <LocalStorageManager />
            </section>
        </div>
    );
}

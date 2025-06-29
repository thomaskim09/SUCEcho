// sucecho/src/app/admin/dashboard/page.tsx
"use client";

import { useAdmin } from '@/context/AdminContext';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import logger from '@/lib/logger';

interface AdminStats {
    totalUsers: number;
    totalPosts: number;
    postsWithin24h: number;
    expiredPostsCount: number;
}

export default function AdminDashboardPage() {
    const { logout } = useAdmin();
    const router = useRouter();
    const [stats, setStats] = useState<AdminStats | null>(null);
    const [reportCount, setReportCount] = useState<number | null>(null);
    const [isCronRunning, setIsCronRunning] = useState(false);
    const [isDeepCleaning, setIsDeepCleaning] = useState(false);

    const fetchDashboardData = async () => {
        try {
            const statsResponse = await fetch('/api/admin/stats');
            if (statsResponse.ok) {
                setStats(await statsResponse.json());
            } else {
                logger.warn("Could not fetch admin stats");
                setStats(null);
            }

            const reportsResponse = await fetch('/api/admin/reports');
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

            <section className="mt-8">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {/* Report Card */}
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

                    {/* Total Users Card */}
                    <div className="p-6 rounded-lg flex flex-col justify-between" style={{ backgroundColor: 'var(--card-background)', border: '1px solid #3b82f6' }}>
                        <div>
                            <h2 className="text-2xl font-bold text-blue-400">用户总数</h2>
                            {stats ? (
                                <div className="mt-2">
                                    <p className="text-5xl font-mono">{stats.totalUsers}</p>
                                    <p className="text-sm text-gray-400">位用户曾来过这里</p>
                                </div>
                            ) : (
                                <p className="text-lg text-gray-500 mt-2">加载中...</p>
                            )}
                        </div>
                        <Link href="/admin/users" className="mt-4 block text-center bg-gray-700 text-white font-bold py-2 px-4 rounded-lg hover:bg-gray-600 transition-colors">
                            管理用户
                        </Link>
                    </div>

                    {/* Echo Management Card */}
                    <div className="p-6 rounded-lg flex flex-col justify-between" style={{ backgroundColor: 'var(--card-background)', border: '1px solid #f97316' }}>
                        <div>
                            <h2 className="text-2xl font-bold text-orange-400">回音管理</h2>
                            <p className="text-sm text-gray-400 mt-1 mb-4">手动运行日常或深度数据清理任务。</p>
                            {stats ? (
                                <div className="space-y-2 font-mono">
                                    <p>总数: <span className="font-bold text-xl text-white">{stats.totalPosts}</span></p>
                                    <p>24小时内: <span className="font-bold text-xl text-green-400">{stats.postsWithin24h}</span></p>
                                    <p>已过期: <span className="font-bold text-xl text-yellow-400">{stats.expiredPostsCount}</span></p>
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
        </div>
    );
}
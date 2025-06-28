// sucecho/src/app/admin/dashboard/page.tsx
"use client";

import { useAdmin } from '@/context/AdminContext';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import logger from '@/lib/logger';

interface AdminStats {
    totalUsers: number;
    expiredPostsCount: number; // Add this to the interface
}

export default function AdminDashboardPage() {
    const { logout } = useAdmin();
    const router = useRouter();
    const [stats, setStats] = useState<AdminStats | null>(null);
    const [reportCount, setReportCount] = useState<number | null>(null); // Set initial state to null for loading
    const [isCronRunning, setIsCronRunning] = useState(false);
    const [isDeepCleaning, setIsDeepCleaning] = useState(false);

    useEffect(() => {
        const fetchDashboardData = async () => {
            try {
                // Fetch stats, which now includes the expired posts count
                const statsResponse = await fetch('/api/admin/stats');
                if (statsResponse.ok) {
                    setStats(await statsResponse.json());
                } else {
                    logger.warn("Could not fetch admin stats");
                }

                // Fetch report count
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
            }
        };
        fetchDashboardData();
    }, []);

    const handleRunCron = async () => {
        if (!confirm('你确定要手动清理所有24小时前的内容吗？')) {
            return;
        }
        setIsCronRunning(true);
        try {
            const res = await fetch('/api/admin/manual-cron', { method: 'POST' });
            const data = await res.json();
            alert(`清理完成！${data.message}`);
        } catch (err) {
            alert(`运行清理任务时出错: ${(err as Error).message}`);
        } finally {
            setIsCronRunning(false);
        }
    };

    const handleDeepClean = async () => {
        const confirmationText = "这是一个非常危险的操作，将永久删除所有超过180天的帖子、投票和举报记录。数据将无法恢复。\n\n您确定要继续吗？";
        if (!confirm(confirmationText)) {
            return;
        }
        setIsDeepCleaning(true);
        try {
            const res = await fetch('/api/admin/manual-deep-clean', { method: 'POST' });
            const data = await res.json();
            alert(`深度清理完成！${data.message}`);
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

                    {/* Cleanup Card */}
                    <div className="p-6 rounded-lg flex flex-col justify-between" style={{ backgroundColor: 'var(--card-background)', border: '1px solid #f97316' }}>
                        <div>
                            <h2 className="text-2xl font-bold text-orange-400">数据清理</h2>
                            <p className="text-sm text-gray-400 mt-1 mb-4">手动运行日常或深度数据清理任务。</p>
                            {stats ? (
                                <p className="text-lg font-mono">
                                    <span className="font-bold text-xl text-yellow-400">{stats.expiredPostsCount}</span> 篇回音已过期
                                </p>
                            ) : (
                                <p className="text-lg text-gray-500 mt-2">加载中...</p>
                            )}
                        </div>
                        <div className="flex gap-2 mt-4">
                            <button onClick={handleRunCron} disabled={isCronRunning} className="bg-blue-600 w-full text-white font-bold py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50">
                                {isCronRunning ? '...' : '清理24小时前'}
                            </button>
                            <button onClick={handleDeepClean} disabled={isDeepCleaning} className="bg-orange-600 w-full text-white font-bold py-2 px-4 rounded-lg hover:bg-orange-700 transition-colors disabled:opacity-50">
                                {isDeepCleaning ? '...' : '清理180天前'}
                            </button>
                        </div>
                    </div>
                </div>
            </section>
        </div>
    );
}
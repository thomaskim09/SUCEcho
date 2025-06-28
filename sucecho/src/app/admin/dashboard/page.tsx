// sucecho/src/app/admin/dashboard/page.tsx
"use client";

import { useAdmin } from '@/context/AdminContext';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import Link from 'next/link'; // Import Link for navigation
import logger from '@/lib/logger';

// Define a type for our user object based on the schema
interface UserProfile {
    fingerprintHash: string;
    codename: string;
    purifiedPostCount: number;
    isBanned: boolean;
    banExpiresAt: Date | null;
    firstSeenAt: string;
    lastSeenAt: string;
}

export default function AdminDashboardPage() {
    const { logout } = useAdmin();
    const router = useRouter();
    const [users, setUsers] = useState<UserProfile[]>([]);
    const [loadingUsers, setLoadingUsers] = useState(true);
    const [errorUsers, setErrorUsers] = useState<string | null>(null);
    const [reportCount, setReportCount] = useState(0);

    useEffect(() => {
        const fetchUsers = async () => {
            setLoadingUsers(true);
            setErrorUsers(null);
            // Fetch users
            try {
                const response = await fetch('/api/admin/users');
                if (!response.ok) {
                    const errorData = await response.json();
                    throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
                }
                const data: UserProfile[] = await response.json();
                setUsers(data);
            } catch (e: unknown) {
                if (e instanceof Error) {
                    setErrorUsers(e.message);
                } else {
                    setErrorUsers('An unknown error occurred');
                }
            } finally {
                setLoadingUsers(false);
            }

            // Fetch report count
            try {
                const reportsResponse = await fetch('/api/admin/reports');
                if (reportsResponse.ok) {
                    const reportsData = await reportsResponse.json();
                    setReportCount(reportsData.length);
                }
            } catch (e) {
                logger.error("Could not fetch report count", e);
            }
        };
        fetchUsers();
    }, []);

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

            {/* NEW: High-priority reports card */}
            <section className="mt-8">
                {reportCount > 0 ? (
                    <Link href="/admin/reports" className="block p-6 rounded-lg hover:bg-red-800/50 transition-colors" style={{ backgroundColor: 'var(--card-background)', border: '1px solid #ef4444' }}>
                        <h2 className="text-2xl font-bold text-red-400">待处理举报</h2>
                        <p className="text-5xl font-mono mt-2">{reportCount}</p>
                        <p className="text-sm text-gray-400 mt-1">点击此处进行审查</p>
                    </Link>
                ) : (
                    <div className="block p-6 rounded-lg" style={{ backgroundColor: 'var(--card-background)', border: '1px solid #22c55e' }}>
                        <h2 className="text-2xl font-bold text-green-400">举报队列清空</h2>
                        <p className="text-5xl font-mono mt-2">{reportCount}</p>
                        <p className="text-sm text-gray-400 mt-1">太棒了！没有待处理的举报。</p>
                    </div>
                )}
            </section>

            <section className="mt-8">
                <h2 className="text-2xl font-bold mb-4">用户管理</h2>
                {loadingUsers ? (
                    <div className="text-white text-center mt-8">正在加载用户...</div>
                ) : errorUsers ? (
                    <div className="text-red-500 text-center mt-8">错误: {errorUsers}</div>
                ) : users.length === 0 ? (
                    <p>没有用户可显示。</p>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="min-w-full rounded-lg" style={{ backgroundColor: 'var(--card-background)' }}>
                            <thead>
                                <tr className="text-left text-gray-400 font-mono border-b border-gray-700">
                                    <th className="p-4">代号</th>
                                    <th className="p-4">状态</th>
                                    <th className="p-4">净化帖子</th>
                                    <th className="p-4">上次活跃</th>
                                    <th className="p-4">操作</th>
                                </tr>
                            </thead>
                            <tbody>
                                {users.map((user) => (
                                    <tr key={user.fingerprintHash} className="border-b border-gray-800 hover:bg-gray-800/50">
                                        <td className="p-4 font-mono">{user.codename}</td>
                                        <td className="p-4">
                                            {user.isBanned ? (
                                                <span className="text-red-400">Banned</span>
                                            ) : (
                                                <span className="text-green-400">Active</span>
                                            )}
                                        </td>
                                        <td className="p-4">{user.purifiedPostCount}</td>
                                        <td className="p-4">{new Date(user.lastSeenAt).toLocaleString()}</td>
                                        <td className="p-4">
                                            <Link
                                                href={`/admin/users/${user.fingerprintHash}`}
                                                className="bg-blue-600 text-white py-1 px-3 rounded-lg hover:bg-blue-700 transition-colors text-sm"
                                            >
                                                View Profile
                                            </Link>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </section>
        </div>
    );
}
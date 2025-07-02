// sucecho/src/app/admin/users/page.tsx
"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import logger from '@/lib/logger';
import { timeSince } from '@/lib/time-helpers';

interface UserProfile {
    fingerprintHash: string;
    codename: string;
    purifiedPostCount: number;
    isBanned: boolean;
    banExpiresAt: Date | null;
    firstSeenAt: string;
    lastSeenAt: string;
}

export default function AdminUsersPage() {
    const [users, setUsers] = useState<UserProfile[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchUsers = async () => {
            setLoading(true);
            setError(null);
            try {
                const response = await fetch('/api/admin/users');
                if (!response.ok) {
                    const errorData = await response.json();
                    throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
                }
                const data: UserProfile[] = await response.json();
                setUsers(data);
            } catch (e: unknown) {
                const errorMessage = e instanceof Error ? e.message : 'An unknown error occurred';
                setError(errorMessage);
                logger.error("Error fetching users:", e);
            } finally {
                setLoading(false);
            }
        };
        fetchUsers();
    }, []);

    const renderContent = () => {
        if (loading) {
            return <div className="text-white text-center mt-8">正在加载用户列表...</div>;
        }
        if (error) {
            return <div className="text-red-500 text-center mt-8">错误: {error}</div>;
        }
        if (users.length === 0) {
            return <p className="text-center text-gray-400">没有用户可显示。</p>;
        }
        return (
            <>
                {/* --- MOBILE VIEW --- */}
                <div className="md:hidden space-y-3">
                    {users.map((user) => (
                        <div key={user.fingerprintHash} className="p-4 rounded-lg" style={{ backgroundColor: 'var(--card-background)' }}>
                            <div className="flex justify-between items-start gap-4">
                                <div className="flex-grow">
                                    <div className="flex items-center gap-2 flex-wrap">
                                        <p className="font-mono font-bold break-all">{user.codename}</p>
                                        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${user.isBanned ? 'bg-red-600 text-red-100' : 'bg-green-600 text-green-100'}`}>
                                            {user.isBanned ? 'Banned' : 'Active'}
                                        </span>
                                    </div>
                                </div>
                                <Link href={`/admin/users/${user.fingerprintHash}`} className="bg-blue-600 text-white py-1 px-3 rounded-lg hover:bg-blue-700 transition-colors text-sm flex-shrink-0">
                                    查看
                                </Link>
                            </div>
                            <div className="mt-3 pt-3 border-t border-gray-700 text-sm flex justify-between">
                                <span><span className="font-semibold text-gray-400">净化:</span> {user.purifiedPostCount}</span>
                                <span><span className="font-semibold text-gray-400">活跃:</span> {timeSince(new Date(user.lastSeenAt))}</span>
                            </div>
                        </div>
                    ))}
                </div>

                {/* --- DESKTOP VIEW --- */}
                <div className="hidden md:block overflow-x-auto">
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
                                        <span className={`px-2 py-1 text-xs font-semibold rounded-full ${user.isBanned ? 'bg-red-600 text-red-100' : 'bg-green-600 text-green-100'}`}>
                                            {user.isBanned ? 'Banned' : 'Active'}
                                        </span>
                                    </td>
                                    <td className="p-4">{user.purifiedPostCount}</td>
                                    <td className="p-4">{timeSince(new Date(user.lastSeenAt))}</td>
                                    <td className="p-4">
                                        <Link href={`/admin/users/${user.fingerprintHash}`} className="bg-blue-600 text-white py-1 px-3 rounded-lg hover:bg-blue-700 transition-colors text-sm">
                                            View Profile
                                        </Link>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </>
        );
    };

    return (
        <div className="container mx-auto max-w-6xl p-4 text-white">
            <header className="py-4">
                <Link href="/admin/dashboard" className="text-accent hover:underline mb-4 block">
                    &larr; 回到主控室
                </Link>
                <h1 className="text-3xl font-bold font-mono text-accent">用户管理</h1>
            </header>
            <main className="mt-4">
                {renderContent()}
            </main>
        </div>
    );
}
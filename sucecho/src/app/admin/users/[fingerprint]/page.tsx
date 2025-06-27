"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';

interface UserProfile {
    fingerprintHash: string;
    codename: string;
    purifiedPostCount: number;
    isBanned: boolean;
    banExpiresAt: string | null;
    firstSeenAt: string;
    lastSeenAt: string;
}

interface AdminLogEntry {
    id: number;
    action: string;
    reason: string | null;
    adminId: string;
    createdAt: string;
    isAcknowledged: boolean;
}

export default function UserProfilePage() {
    const params = useParams();
    const fingerprint = params.fingerprint as string;

    const [user, setUser] = useState<UserProfile | null>(null);
    const [logs, setLogs] = useState<AdminLogEntry[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        if (!fingerprint) return;

        const fetchAllData = async () => {
            setLoading(true);
            setError(null);
            try {
                const [userRes, logsRes] = await Promise.all([
                    fetch(`/api/admin/users/${fingerprint}`),
                    fetch(`/api/admin/users/${fingerprint}/logs`)
                ]);

                if (!userRes.ok) throw new Error('Failed to fetch user profile');
                if (!logsRes.ok) throw new Error('Failed to fetch moderation logs');

                setUser(await userRes.json());
                setLogs(await logsRes.json());
            } catch (e) {
                setError((e as Error).message);
            } finally {
                setLoading(false);
            }
        };

        fetchAllData();
    }, [fingerprint]);

    // Consolidated handler for all admin actions
    const handleAdminAction = async (action: 'BAN' | 'UNBAN' | 'WARN', durationDays: number | null = null) => {
        // For warns and bans, a reason is highly recommended but can be optional
        const reason = prompt(`Optional: Provide a reason for this ${action} action.`);

        if (action !== 'UNBAN' && !confirm(`Are you sure you want to ${action} this user?`)) return;
        if (action === 'UNBAN' && !confirm(`Are you sure you want to UNBAN this user?`)) return;

        setIsSubmitting(true);
        try {
            let url: string;
            let method: string;

            if (action === 'WARN') {
                url = `/api/admin/users/${fingerprint}/warn`;
                method = 'POST';
            } else {
                url = `/api/admin/users/${fingerprint}/ban`;
                method = action === 'BAN' ? 'POST' : 'DELETE';
            }

            const res = await fetch(url, {
                method: method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ reason, durationDays }),
            });

            if (!res.ok) {
                const errorData = await res.json();
                throw new Error(errorData.message || `Failed to perform ${action}`);
            }

            // Refetch all data to ensure UI is perfectly in sync
            const userRes = await fetch(`/api/admin/users/${fingerprint}`);
            const logsRes = await fetch(`/api/admin/users/${fingerprint}/logs`);
            setUser(await userRes.json());
            setLogs(await logsRes.json());

            alert(`${action} action successful.`);

        } catch (err) {
            alert((err as Error).message);
        } finally {
            setIsSubmitting(false);
        }
    };

    const renderBanStatus = () => {
        if (!user) return null;
        if (user.isBanned) {
            const expiry = user.banExpiresAt ? new Date(user.banExpiresAt).toLocaleString() : 'Permanent';
            return <span className="px-2 py-1 text-xs font-semibold text-red-100 bg-red-600 rounded-full">Banned (Expires: {expiry})</span>;
        }
        return <span className="px-2 py-1 text-xs font-semibold text-green-100 bg-green-600 rounded-full">Active</span>;
    };

    const renderContent = () => {
        if (loading) {
            return <div className="text-center p-8">Loading user profile...</div>;
        }
        if (error) {
            return <div className="text-center p-8 text-red-500">Error: {error}</div>;
        }
        if (!user) {
            return <div className="text-center p-8">User not found.</div>;
        }

        return (
            <>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6 rounded-lg" style={{ backgroundColor: 'var(--card-background)' }}>
                    <div>
                        <h2 className="text-lg font-bold text-gray-400">Codename</h2>
                        <p className="text-2xl font-mono">{user.codename}</p>
                    </div>
                    <div>
                        <h2 className="text-lg font-bold text-gray-400">Status</h2>
                        <p className="text-2xl">{renderBanStatus()}</p>
                    </div>
                    <div>
                        <h2 className="text-lg font-bold text-gray-400">Community Reputation</h2>
                        <p className="text-2xl">{user.purifiedPostCount} purified posts</p>
                    </div>
                    <div>
                        <h2 className="text-lg font-bold text-gray-400">Last Seen</h2>
                        <p className="text-xl">{new Date(user.lastSeenAt).toLocaleString()}</p>
                    </div>
                    <div>
                        <h2 className="text-lg font-bold text-gray-400">First Seen</h2>
                        <p className="text-xl">{new Date(user.firstSeenAt).toLocaleString()}</p>
                    </div>
                </div>

                {/* Moderation Actions (now use single handler) */}
                <div className="mt-8 p-6 rounded-lg" style={{ backgroundColor: 'var(--card-background)' }}>
                    <h2 className="text-xl font-bold mb-4">Moderation Actions</h2>
                    <div className="flex flex-wrap gap-4">
                        <button onClick={() => handleAdminAction('WARN')} disabled={isSubmitting} className="bg-yellow-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-yellow-700 transition-colors">Warn User</button>
                        <button onClick={() => handleAdminAction('BAN', 1)} disabled={isSubmitting || user.isBanned} className="bg-red-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50">Ban for 24h</button>
                        <button onClick={() => handleAdminAction('BAN', 7)} disabled={isSubmitting || user.isBanned} className="bg-red-700 text-white font-bold py-2 px-4 rounded-lg hover:bg-red-800 transition-colors disabled:opacity-50">Ban for 7d</button>
                        <button onClick={() => handleAdminAction('BAN', null)} disabled={isSubmitting || user.isBanned} className="bg-red-800 text-white font-bold py-2 px-4 rounded-lg hover:bg-red-900 transition-colors disabled:opacity-50">Permanent Ban</button>
                        <button onClick={() => handleAdminAction('UNBAN')} disabled={isSubmitting || !user.isBanned} className="bg-green-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50">Unban</button>
                    </div>
                </div>

                {/* Moderation History */}
                <div className="mt-8 p-6 rounded-lg" style={{ backgroundColor: 'var(--card-background)' }}>
                    <h2 className="text-xl font-bold mb-4">Moderation History</h2>
                    {logs.length > 0 ? (
                        <ul className="space-y-3">
                            {logs.map(log => (
                                <li key={log.id} className="text-sm p-3 bg-gray-800 rounded-md">
                                    <div className="flex justify-between items-start">
                                        <div className="flex items-center gap-2">
                                            <span className={`font-bold ${log.action === 'WARN' ? 'text-yellow-400' :
                                                    log.action === 'BAN' ? 'text-red-400' : 'text-green-400'
                                                }`}>
                                                {log.action}
                                            </span>
                                            {/* --- FIX: Correctly placed badge --- */}
                                            {log.action === 'WARN' && log.isAcknowledged && (
                                                <span className="px-2 py-0.5 text-xs font-semibold text-gray-800 bg-gray-300 rounded-full">
                                                    Acknowledged
                                                </span>
                                            )}
                                        </div>
                                        <span className="text-xs text-gray-500 flex-shrink-0">{new Date(log.createdAt).toLocaleString()}</span>
                                    </div>
                                    <p className="mt-2 text-gray-300">Reason: {log.reason || <span className="italic text-gray-500">No reason provided.</span>}</p>
                                    <p className="text-xs text-gray-500 mt-1">Admin: {log.adminId}</p>
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <p className="text-gray-400">No moderation history for this user.</p>
                    )}
                </div>
            </>
        );
    };

    return (
        <div className="container mx-auto max-w-4xl p-4 text-white">
            <header className="py-4">
                <Link href="/admin/dashboard" className="text-accent hover:underline mb-4 block">
                    &larr; Back to Dashboard
                </Link>
                <h1 className="text-2xl font-bold font-mono text-accent mb-2">User Anonymous Profile</h1>
                <p className="font-mono text-sm opacity-70 break-all">Fingerprint: {fingerprint}</p>
            </header>
            <main className="mt-4">
                {renderContent()}
            </main>
        </div>
    );
}
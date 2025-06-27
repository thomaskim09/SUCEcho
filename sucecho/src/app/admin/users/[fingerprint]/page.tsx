// sucecho/src/app/admin/users/[fingerprint]/page.tsx
"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';

// Define a type for the user profile, which should match your Prisma schema
interface UserProfile {
    fingerprintHash: string;
    codename: string;
    purifiedPostCount: number;
    isBanned: boolean;
    banExpiresAt: string | null;
    firstSeenAt: string;
    lastSeenAt: string;
}

export default function UserProfilePage() {
    const params = useParams();
    const fingerprint = params.fingerprint as string;

    const [user, setUser] = useState<UserProfile | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!fingerprint) return;

        const fetchUserProfile = async () => {
            setLoading(true);
            setError(null);
            try {
                const response = await fetch(`/api/admin/users/${fingerprint}`);
                if (!response.ok) {
                    const errorData = await response.json();
                    throw new Error(errorData.message || 'Failed to fetch user profile');
                }
                const data = await response.json();
                setUser(data);
            } catch (e: unknown) {
                if (e instanceof Error) {
                    setError(e.message);
                } else {
                    setError('An unknown error occurred');
                }
            } finally {
                setLoading(false);
            }
        };

        fetchUserProfile();
    }, [fingerprint]);

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

                <div className="mt-8 p-6 rounded-lg" style={{ backgroundColor: 'var(--card-background)' }}>
                    <h2 className="text-xl font-bold mb-4">Moderation Actions</h2>
                    <div className="flex flex-wrap gap-4">
                        <button className="bg-yellow-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-yellow-700 transition-colors disabled:opacity-50" disabled>Warn User</button>
                        <button className="bg-red-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50">Ban for 24h</button>
                        <button className="bg-red-700 text-white font-bold py-2 px-4 rounded-lg hover:bg-red-800 transition-colors disabled:opacity-50">Ban for 7d</button>
                        <button className="bg-red-800 text-white font-bold py-2 px-4 rounded-lg hover:bg-red-900 transition-colors disabled:opacity-50">Permanent Ban</button>
                        <button className="bg-green-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50" disabled={!user.isBanned}>Unban</button>
                    </div>
                    <p className="text-xs text-gray-500 mt-4">Note: Ban functionality is not yet implemented.</p>
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
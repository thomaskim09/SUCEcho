// sucecho/src/app/components/UserStatusBanner.tsx
"use client";

import { useState, useEffect } from 'react';
import { useFingerprint } from '@/context/FingerprintContext';
import logger from '@/lib/logger';

interface AdminLogEntry {
    action: 'WARN' | 'BAN' | 'UNBAN';
    reason: string | null;
    createdAt: string;
}

export default function UserStatusBanner() {
    const { fingerprint, isLoading } = useFingerprint();
    const [notification, setNotification] = useState<AdminLogEntry | null>(null);
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        if (fingerprint && !isLoading) {
            const checkStatus = async () => {
                try {
                    const res = await fetch('/api/users/status', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ fingerprintHash: fingerprint }),
                    });
                    if (res.ok) {
                        const data = await res.json();
                        if (data.notification) {
                            setNotification(data.notification);
                            setIsVisible(true);
                        }
                    }
                } catch (error) {
                    logger.error("Failed to fetch user status:", error);
                }
            };
            checkStatus();
        }
    }, [fingerprint, isLoading]);

    const handleDismiss = async () => {
        if (!fingerprint) return;
        setIsVisible(false);
        try {
            await fetch('/api/admin/users/acknowledge-warning', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ fingerprintHash: fingerprint }),
            });
        } catch (error) {
            logger.error("Failed to dismiss notification:", error);
            setIsVisible(true);
        }
    };

    if (!isVisible || !notification) {
        return null;
    }

    const getBannerStyle = () => {
        switch (notification.action) {
            case 'BAN':
                return { bg: 'bg-red-600', hoverBg: 'bg-red-700', text: '管理员封禁' };
            case 'UNBAN':
                return { bg: 'bg-green-600', hoverBg: 'bg-green-700', text: '管理员解封' };
            case 'WARN':
            default:
                return { bg: 'bg-yellow-600', hoverBg: 'bg-yellow-700', text: '管理员警告' };
        }
    };

    const { bg, hoverBg, text } = getBannerStyle();

    return (
        <div className={`${bg} text-white p-3 font-mono relative`}>
            <div className="container mx-auto text-center">
                <p>
                    <strong>
                        {text}
                        {notification.reason ? ':' : ''}
                    </strong>
                    {notification.reason ? ` ${notification.reason}` : ''}
                </p>
                <p className="text-xs opacity-80">发布于: {new Date(notification.createdAt).toLocaleString()}</p>
            </div>
            <button
                onClick={handleDismiss}
                className={`absolute top-1/2 right-4 -translate-y-1/2 ${hoverBg} rounded-full p-2 text-xs`}
                aria-label="关闭通知"
            >
                关闭
            </button>
        </div>
    );
}
// sucecho/src/app/components/UserStatusBanner.tsx
"use client";

import { useState, useEffect } from 'react';
import { useFingerprint } from '@/context/FingerprintContext';
import logger from '@/lib/logger';

interface AdminLogEntry {
    action: string;
    reason: string | null;
    createdAt: string;
}

export default function UserStatusBanner() {
    const { fingerprint, isLoading } = useFingerprint();
    const [warning, setWarning] = useState<AdminLogEntry | null>(null);
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        if (fingerprint && !isLoading) {
            const checkStatus = async () => {
                const res = await fetch('/api/users/status', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ fingerprintHash: fingerprint }),
                });
                if (res.ok) {
                    const data = await res.json();
                    if (data.warning) {
                        setWarning(data.warning);
                        setIsVisible(true);
                    }
                }
            };
            checkStatus();
        }
    }, [fingerprint, isLoading]);

    const handleDismiss = async () => {
        if (!fingerprint) return;
        setIsVisible(false); // Hide immediately for better UX
        try {
            // FIX: The URL was pointing to the old, non-existent endpoint.
            // It should point to the correct admin route.
            await fetch('/api/admin/users/acknowledge-warning', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ fingerprintHash: fingerprint }),
            });
        } catch (error) {
            logger.error("Failed to dismiss warning:", error);
            setIsVisible(true); // Re-show if API call fails
        }
    };

    if (!isVisible || !warning) {
        return null;
    }

    return (
        <div className="bg-yellow-600 text-white p-3 font-mono relative">
            <div className="container mx-auto text-center">
                <p><strong>管理员警告:</strong> {warning.reason || "未提供理由。"}</p>
                <p className="text-xs opacity-80">发布于: {new Date(warning.createdAt).toLocaleString()}</p>
            </div>
            <button
                onClick={handleDismiss}
                className="absolute top-1/2 right-4 -translate-y-1/2 bg-yellow-700 hover:bg-yellow-800 rounded-full p-2 text-xs"
                aria-label="解除警告"
            >
                解除
            </button>
        </div>
    );
}
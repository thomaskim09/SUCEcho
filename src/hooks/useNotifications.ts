// SUCEcho_packaged/src/hooks/useNotifications.ts
'use client';

import { useState, useEffect, useCallback } from 'react';
import { useFingerprint } from '@/context/FingerprintContext';
import logger from '@/lib/logger';
import { usePageVisibility } from './usePageVisibility';

export interface Notification {
    id: number;
    type: 'REPLY_TO_POST' | 'REPLY_TO_REPLY';
    count: number;
    post: {
        id: number;
        content: string | null;
        feed: 'EPHEMERAL' | 'PERMANENT' | 'JOB';
    };
    updatedAt: string;
    repliedToContent?: string | null;
}

export const useNotifications = () => {
    const { fingerprint } = useFingerprint();
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [isLoading, setIsLoading] = useState(true);
    const isVisible = usePageVisibility();

    const fetchNotifications = useCallback(async () => {
        if (!fingerprint) return;

        setIsLoading(true);
        try {
            const res = await fetch(
                `/api/notifications?fingerprintHash=${fingerprint}`
            );
            if (res.ok) {
                const data: Notification[] = await res.json();
                setNotifications(data);
                setUnreadCount(data.length);
            }
        } catch (error) {
            logger.error('Failed to fetch notifications:', error);
        } finally {
            setIsLoading(false);
        }
    }, [fingerprint]);

    useEffect(() => {
        fetchNotifications();
    }, [fetchNotifications]);

    useEffect(() => {
        if (isVisible) {
            logger.log('Tab is visible, refetching notifications.');
            fetchNotifications();
        }
    }, [isVisible, fetchNotifications]);

    const markAsRead = async (notificationId: number) => {
        try {
            await fetch(`/api/notifications/${notificationId}/mark-as-read`, {
                method: 'POST',
            });
            setNotifications((prev) =>
                prev.filter((n) => n.id !== notificationId)
            );
            setUnreadCount((prev) => prev - 1);
        } catch (error) {
            logger.error('Failed to mark notification as read:', error);
        }
    };

    const markAllAsRead = async () => {
        if (!fingerprint) return;

        try {
            await fetch('/api/notifications/mark-all-as-read', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ fingerprintHash: fingerprint }),
            });
            setNotifications([]);
            setUnreadCount(0);
        } catch (error) {
            logger.error('Failed to mark all notifications as read:', error);
        }
    };

    return {
        notifications,
        unreadCount,
        isLoading,
        markAsRead,
        markAllAsRead,
        refetch: fetchNotifications,
    };
};

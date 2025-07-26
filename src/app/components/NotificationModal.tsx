// SUCEcho_packaged/src/app/components/NotificationModal.tsx
"use client";

import { motion, AnimatePresence } from 'framer-motion';
import Portal from './Portal';
import { Notification } from '@/hooks/useNotifications';
import { useParams, useRouter } from 'next/navigation';
import { Icon } from './Icon';
import { timeSince } from '@/lib/time-helpers';
import { useRef, useState } from 'react';

interface NotificationModalProps {
    isOpen: boolean;
    onClose: () => void;
    notifications: Notification[];
    markAsRead: (id: number) => void;
    markAllAsRead: () => void;
}

interface Ripple {
    id: number;
    x: number;
    y: number;
    size: number;
}

// NotificationItem has been redesigned as a self-contained card.
const NotificationItem = ({ notification, onSelect }: { notification: Notification, onSelect: (event: React.MouseEvent) => void }) => {
    const [ripples, setRipples] = useState<Ripple[]>([]);
    const cardRef = useRef<HTMLDivElement>(null);

    const truncate = (text: string | null, length: number) => {
        if (!text) return '一条已消逝的回音';
        if (text.length <= length) return text;
        return text.substring(0, length) + '...';
    };

    const createRipple = (event: React.MouseEvent) => {
        const card = cardRef.current;
        if (card) {
            const rect = card.getBoundingClientRect();
            const size = Math.max(rect.width, rect.height);
            const x = event.clientX - rect.left - size / 2;
            const y = event.clientY - rect.top - size / 2;
            const newRipple = { id: Date.now(), x, y, size };

            setRipples([...ripples, newRipple]);
            setTimeout(() => {
                setRipples(prev => prev.filter(r => r.id !== newRipple.id));
            }, 800);
        }
    };

    const handleCardClick = (event: React.MouseEvent) => {
        createRipple(event);
        onSelect(event);
    };

    const notificationText = notification.type === 'REPLY_TO_POST'
        ? `你的回音 "${truncate(notification.post.content, 25)}"`
        : `你的留言 "${truncate(notification.repliedToContent || null, 25)}"`;

    return (
        <motion.div
            ref={cardRef}
            layout
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 30, transition: { duration: 0.3 } }}
            transition={{ type: 'spring', stiffness: 300, damping: 25 }}
            onClick={handleCardClick}
            className="glass-card p-4 rounded-lg hover:bg-gray-700/50 cursor-pointer transition-colors border border-transparent hover:border-accent relative overflow-hidden"
        >
            <div className="flex items-start gap-4 relative z-10">
                <Icon name="comment" className="w-6 h-6 text-accent flex-shrink-0 mt-1" />
                <div className="flex-grow">
                    <p className="text-gray-200">
                        {notificationText} 收到了 <span className="font-bold text-accent">{notification.count}</span> 个新的回应。
                    </p>
                    <p className="text-xs text-gray-500 mt-2">
                        {timeSince(new Date(notification.updatedAt))}
                    </p>
                </div>
            </div>
            <div className="ripple-container">
                {ripples.map(ripple => (
                    <span
                        key={ripple.id}
                        className="ripple"
                        style={{
                            top: ripple.y,
                            left: ripple.x,
                            width: ripple.size,
                            height: ripple.size,
                        }}
                    />
                ))}
            </div>
        </motion.div>
    );
};

export default function NotificationModal({ isOpen, onClose, notifications, markAsRead, markAllAsRead }: NotificationModalProps) {
    const router = useRouter();
    const params = useParams();

    const handleSelect = (notification: Notification) => {
        markAsRead(notification.id);
        const currentPostId = params.id ? parseInt(params.id as string, 10) : null;
        if (currentPostId !== notification.post.id) {
            router.push(`/post/${notification.post.id}?feedType=${notification.post.feed}`);
        }

        onClose();
    };

    return (
        <Portal>
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4"
                        onClick={onClose}
                    >
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            className="p-6 rounded-lg shadow-xl w-full max-w-md glass-card"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className="flex justify-between items-center mb-4">
                                <h2 className="text-xl font-bold font-mono text-accent flex items-center gap-2">
                                    <Icon name="bell" className="w-6 h-6" />
                                    新的回响
                                </h2>
                                {notifications.length > 0 && (
                                    <button onClick={markAllAsRead} className="text-sm text-gray-400 hover:underline">标记全部已读</button>
                                )}
                            </div>
                            <div className="space-y-3 max-h-96 overflow-y-auto pr-2">
                                {notifications.length > 0 ? (
                                    <AnimatePresence>
                                        {notifications.map(n => (
                                            <NotificationItem key={n.id} notification={n} onSelect={() => handleSelect(n)} />
                                        ))}
                                    </AnimatePresence>
                                ) : (
                                    <div className="text-center text-gray-400 p-8">
                                        <p className="font-mono text-lg">寂静无声。</p>
                                        <p className="text-sm mt-2">暂时没有新的回响。</p>
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </Portal>
    );
}
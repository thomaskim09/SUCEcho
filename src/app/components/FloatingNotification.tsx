// src/app/components/FloatingNotification.tsx
"use client";

import { motion } from 'framer-motion';
import { Icon } from './Icon';
import Portal from './Portal'; // Import the Portal component

interface FloatingNotificationProps {
    count: number;
    onClick: () => void;
}

export default function FloatingNotification({
    count,
    onClick,
}: FloatingNotificationProps) {
    return (
        <Portal> {/* Wrap the component with Portal */}
            <motion.div
                initial={{ y: -100, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: -100, opacity: 0 }}
                transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                className="fixed top-4 left-1/2 -translate-x-1/2 z-50"
            >
                <button
                    onClick={onClick}
                    className="bg-gradient-to-r from-purple-500 to-indigo-600 text-white font-bold py-3 px-6 rounded-full shadow-lg flex items-center justify-center gap-2 press-animation"
                    aria-label={`Show ${count} new posts`}
                >
                    <Icon name="zap" className="w-5 h-5" />
                    <span>有 {count} 个新回音</span>
                </button>
            </motion.div>
        </Portal>
    );
}
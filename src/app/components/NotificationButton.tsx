// SUCEcho_packaged/src/app/components/NotificationButton.tsx
"use client";

import { motion } from 'framer-motion';
import { Icon } from './Icon';

interface NotificationButtonProps {
    count: number;
    onClick: () => void;
}

export default function NotificationButton({ count, onClick }: NotificationButtonProps) {
    return (
        <motion.div
            initial={{ scale: 0, y: 50 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0, y: 50, opacity: 0 }} // Add this exit animation
            transition={{ type: 'spring', stiffness: 260, damping: 20 }}
        >
            <button
                onClick={onClick}
                className="relative bg-gradient-to-br from-indigo-500 to-blue-600 text-white rounded-full p-3 shadow-lg hover:shadow-xl w-12 h-12 flex items-center justify-center press-animation"
                aria-label="View notifications"
            >
                <Icon name="bell" className="w-6 h-6" />
                {count > 0 && (
                    <motion.span
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center border-2 border-indigo-500"
                    >
                        {count}
                    </motion.span>
                )}
            </button>
        </motion.div>
    );
}
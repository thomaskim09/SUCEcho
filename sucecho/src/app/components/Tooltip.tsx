// sucecho/src/app/components/Tooltip.tsx
"use client";

import { motion, AnimatePresence } from 'framer-motion';

interface TooltipProps {
    content: string;
    isVisible: boolean;
    onClose: () => void;
}

export default function Tooltip({ content, isVisible, onClose }: TooltipProps) {
    const handleClose = (e: React.MouseEvent) => {
        e.stopPropagation();
        onClose();
    };

    return (
        <AnimatePresence>
            {isVisible && (
                <motion.div
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    transition={{ duration: 0.2, ease: "easeOut" }}
                    className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-max max-w-xs p-3 rounded-lg shadow-xl z-20 cursor-pointer"
                    style={{ backgroundColor: 'var(--accent)', color: 'white' }}
                    onClick={handleClose}
                >
                    <p className="text-sm text-center whitespace-pre-line">{content}</p>
                    <div className="absolute top-full left-1/2 -translate-x-1/2 w-0 h-0 border-x-8 border-x-transparent border-t-8" style={{ borderTopColor: 'var(--accent)' }}></div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
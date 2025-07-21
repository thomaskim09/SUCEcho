// SUCEcho_packaged/src/app/components/InfoModal.tsx
"use client";

import { motion, AnimatePresence } from 'framer-motion';
import { Icon } from './Icon';
import Portal from './Portal';
import { useEffect } from 'react';

interface InfoModalProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    iconName: React.ComponentProps<typeof Icon>['name'];
    children: React.ReactNode;
}

export default function InfoModal({ isOpen, onClose, title, iconName, children }: InfoModalProps) {
    useEffect(() => {
        const handleEsc = (event: KeyboardEvent) => {
            if (event.key === 'Escape') {
                onClose();
            }
        };
        window.addEventListener('keydown', handleEsc);
        return () => {
            window.removeEventListener('keydown', handleEsc);
        };
    }, [onClose]);

    return (
        <Portal>
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.5, ease: "easeInOut" }}
                        onClick={onClose}
                    >
                        <motion.div
                            className="glass-card p-8 rounded-lg shadow-xl w-full max-w-md text-center relative"
                            initial={{ scale: 0.95, opacity: 0, y: 20 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.95, opacity: 0, y: 20 }}
                            transition={{
                                type: "spring",
                                stiffness: 200,
                                damping: 25,
                                mass: 0.7
                            }}
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className="flex flex-col items-center mb-4">
                                <div className="w-16 h-16 mb-4 flex items-center justify-center rounded-full bg-accent/20 text-accent">
                                    <Icon name={iconName} className="w-8 h-8" />
                                </div>
                                <h3 className="text-2xl font-bold font-mono">{title}</h3>
                            </div>
                            <div className="text-gray-300 mb-6 text-lg">
                                {children}
                            </div>
                            <button
                                onClick={onClose}
                                className="bg-accent text-white w-full font-bold py-3 px-4 rounded-lg transition-all duration-300 ease-in-out transform hover:scale-105"
                            >
                                我知道了
                            </button>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </Portal>
    );
}
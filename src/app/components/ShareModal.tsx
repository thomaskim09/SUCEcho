"use client";

import { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Icon } from './Icon';
import Portal from './Portal';

interface ShareModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export default function ShareModal({ isOpen, onClose }: ShareModalProps) {
    const handleShare = async () => {
        if (navigator.share) {
            try {
                await navigator.share({
                    title: 'SUC Echo | 南方回音壁',
                    text: '发现一个神秘的地方，所有声音只存在一天。',
                    url: 'https://sucecho.vercel.app',
                });
            } catch {
                // Handle share cancellation or error if needed
            }
        } else {
            navigator.clipboard.writeText('https://sucecho.vercel.app');
            alert('网站链接已复制！快去分享吧！');
        }
    };

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
                        transition={{ duration: 1, ease: "easeInOut" }}
                        onClick={onClose}
                    >
                        <motion.div
                            className="share-modal-card p-8 rounded-lg shadow-xl w-full max-w-md text-center relative"
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
                            <button
                                onClick={onClose}
                                className="absolute top-3 right-3 text-gray-400 hover:text-white transition-colors"
                                aria-label="关闭"
                            >
                                <Icon name="plus" className="w-6 h-6 transform rotate-45" />
                            </button>
                            <h3 className="text-2xl font-bold mb-4">嘘... 有个秘密要告诉你。</h3>
                            <p className="text-gray-300 mb-6">
                                你已经发现了这个可以卸下伪装的秘密角落。但还有很多人，仍在充满人设和审视的广场上徘徊。
                                <br /><br />
                                把这个秘密通道，悄悄地递给你身边那个需要安全感的校内朋友吧。有些话，只适合在这里说给懂的人听。
                            </p>
                            <button
                                onClick={handleShare}
                                className="share-button w-full font-bold py-3 px-4 rounded-lg transition-all duration-300 ease-in-out"
                            >
                                分享这个秘密通道
                            </button>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </Portal>
    );
}
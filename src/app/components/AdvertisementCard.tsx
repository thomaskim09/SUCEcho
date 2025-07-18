// src/app/components/AdvertisementCard.tsx
"use client";

import type { PostWithStats } from "@/lib/types";
import { useCountdown } from '@/hooks/useCountdown';
import { Icon } from './Icon';
import { motion, AnimatePresence } from 'motion/react';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { useAdminSession } from '@/hooks/useAdminSession';

interface AdCardProps {
    post: PostWithStats;
    onFaded?: (postId: number) => void;
    onDelete?: (postId: number) => void;
    onDeletionComplete?: (postId: number) => void;
}

export default function AdvertisementCard({ post, onFaded, onDelete, onDeletionComplete }: AdCardProps) {
    const isAdmin = useAdminSession();
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const { countdownText, colorClass, isExpired } = useCountdown(new Date(post.createdAt));
    const [isCharging, setIsCharging] = useState(false);
    const [isGlitching, setIsGlitching] = useState(false);
    const [isEnlarged, setIsEnlarged] = useState(false);

    const cardVariants = {
        visible: { opacity: 1, scale: 1, x: 0, y: 0, filter: 'blur(0px)', transition: { ease: "easeOut" as const, duration: 0.6 } },
        enlarged: { scale: 1.05, transition: { duration: 0.18 } },
        deleting: { opacity: 0, scale: 0.8, transition: { duration: 0.4 } },
        glitching: { opacity: 0, scale: 0.8, filter: 'blur(20px)', transition: { duration: 1.0, ease: "easeOut" as const } }
    };

    useEffect(() => {
        if (isExpired) {
            setIsCharging(true);
            const chargeTimer = setTimeout(() => {
                setIsGlitching(true);
            }, 3000);
            return () => clearTimeout(chargeTimer);
        }
    }, [isExpired]);

    if (!post.url) return null;

    const handleToggleMenu = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsMenuOpen(!isMenuOpen);
    };

    const handleDeleteClick = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (onDelete) {
            onDelete(post.id);
        }
        setIsMenuOpen(false);
    };

    const getAnimationState = (): keyof typeof cardVariants => {
        if (isEnlarged) return 'enlarged';
        if (post.isDeleting) return 'deleting';
        if (isGlitching) return 'glitching';
        return 'visible';
    };

    return (
        <AnimatePresence>
            <motion.div
                layout
                variants={cardVariants}
                initial={{ opacity: 0, y: 20 }}
                animate={getAnimationState()}
                exit={{ opacity: 0, scale: 0.8, filter: 'blur(10px)' }}
                onAnimationComplete={(variant) => {
                    if (variant === 'glitching' && onFaded) onFaded(post.id);
                    if (variant === 'deleting' && onDeletionComplete) onDeletionComplete(post.id);
                    if (variant === 'enlarged') setIsEnlarged(false);
                }}
                className={`relative ${isCharging ? 'charge-up' : ''} ${isGlitching ? 'glitch' : ''}`}
                onClick={(e) => {
                    if ((e.target as HTMLElement).closest('button, a')) return;
                    setIsEnlarged(true);
                    setTimeout(() => {
                        if (typeof post.url === 'string') {
                            window.open(post.url, '_blank', 'noopener,noreferrer');
                        }
                    }, 180);
                }}
            >
                <div className="ad-card-wrapper p-1 rounded-lg">
                    <div className="relative block p-4 rounded-md ad-card-content">
                        {isAdmin && (
                            <div className="absolute top-2 right-2 z-10">
                                <button onClick={handleToggleMenu} className="p-2 rounded-full hover:bg-gray-700">
                                    <Icon name="menu" className="w-4 h-4" />
                                </button>
                            </div>
                        )}

                        <Link href={post.url} target="_blank" rel="noopener noreferrer">
                            <div className="flex justify-between items-center mb-3">
                                <span className="text-sm font-mono text-yellow-400">特约赞助</span>
                            </div>

                            <p className="text-white text-base mb-4">{post.content}</p>

                            <div className="flex justify-between items-center mt-4">
                                <span className={`font-mono text-sm ${colorClass}`}>
                                    {countdownText}
                                </span>
                                <div className="flex items-center gap-2 text-accent text-sm font-bold">
                                    <span>了解更多</span>
                                    <Icon name="share" className="w-4 h-4" />
                                </div>
                            </div>
                        </Link>

                        {isMenuOpen && (
                            <div className="absolute top-12 right-2 bg-gray-900 rounded-lg shadow-lg p-2 z-20 w-48">
                                <ul>
                                    <li>
                                        <button onClick={handleDeleteClick} className="w-full text-left p-2 rounded hover:bg-red-800/50 flex items-center gap-2">
                                            🗑️ 立即删除
                                        </button>
                                    </li>
                                </ul>
                            </div>
                        )}
                    </div>
                </div>
            </motion.div>
        </AnimatePresence>
    );
}

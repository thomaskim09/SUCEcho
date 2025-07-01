// sucecho/src/app/components/AdvertisementCard.tsx
"use client";

import type { PostWithStats } from "@/lib/types";
import { useCountdown } from '@/hooks/useCountdown';
import { Icon } from './Icon';
import { motion } from 'motion/react';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { useAdminSession } from '@/hooks/useAdminSession';

interface AdCardProps {
    post: PostWithStats;
    onFaded?: (postId: number) => void;
    onDelete?: (postId: number) => void;
    onDeletionComplete?: (postId: number) => void; // Add this callback
}

export default function AdvertisementCard({ post, onFaded, onDelete, onDeletionComplete }: AdCardProps) {
    if (!post.advertisementUrl) return null;

    const isAdmin = useAdminSession();
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const { countdownText, colorClass, isExpired } = useCountdown(new Date(post.createdAt));
    const [isCharging, setIsCharging] = useState(false);
    const [isGlitching, setIsGlitching] = useState(false);

    useEffect(() => {
        if (isExpired) {
            setIsCharging(true);
            const chargeTimer = setTimeout(() => {
                setIsGlitching(true);
            }, 3000);
            return () => clearTimeout(chargeTimer);
        }
    }, [isExpired]);

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

    const getAnimationState = () => {
        if (post.isDeleting) return 'deleting'; // <-- Add this line
        if (isGlitching) return 'glitching';
        return 'visible';
    };

    return (
        <motion.div
            layout
            variants={{
                visible: { opacity: 1, scale: 1, filter: 'blur(0px)' },
                glitching: { opacity: 0, scale: 0.8, filter: 'blur(20px)', transition: { duration: 1.0, ease: "easeOut" } },
                deleting: { opacity: 0, scale: 0.8, transition: { duration: 0.4 } } // <-- Add this variant
            }}
            initial="visible"
            animate={getAnimationState()}
            onAnimationComplete={(variant) => {
                if (variant === 'glitching' && onFaded) onFaded(post.id);
                if (variant === 'deleting' && onDeletionComplete) onDeletionComplete(post.id); // <-- Add this line
            }}
            className={`relative ${isCharging ? 'charge-up' : ''} ${isGlitching ? 'glitch' : ''}`}
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

                    <Link href={post.advertisementUrl} target="_blank" rel="noopener noreferrer">
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
    );
}
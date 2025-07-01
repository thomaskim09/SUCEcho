// sucecho/src/app/components/AdvertisementCard.tsx
"use client";

import type { PostWithStats } from "@/lib/types";
import { timeSince } from "@/lib/time-helpers";
import { Icon } from './Icon';
import { motion } from 'motion/react';
import Link from 'next/link';

interface AdCardProps {
    post: PostWithStats;
}

export default function AdvertisementCard({ post }: AdCardProps) {
    if (!post.advertisementUrl) return null;

    return (
        <motion.div
            layout
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0, transition: { ease: "easeOut", duration: 0.8 } }}
            exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
        >
            <div className="ad-card-wrapper p-1 rounded-lg">
                <Link href={post.advertisementUrl} target="_blank" rel="noopener noreferrer" className="block p-4 rounded-md ad-card-content">
                    <div className="flex justify-between items-center mb-3">
                        <span className="text-sm font-mono text-green-400">特约赞助</span>
                        <span className="text-xs text-gray-400">{timeSince(new Date(post.createdAt))}</span>
                    </div>
                    <p className="text-white text-base mb-4">{post.content}</p>
                    <div className="flex items-center gap-2 text-accent text-sm font-bold">
                        <span>了解更多</span>
                        <Icon name="share" className="w-4 h-4" />
                    </div>
                </Link>
            </div>
        </motion.div>
    );
}
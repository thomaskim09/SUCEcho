// src/app/components/JobSearchFeed.tsx
"use client";

import { useState, useEffect, useCallback, useRef } from 'react';
import type { PostWithStats } from '@/lib/types';
import PostCard from './PostCard';
import { AnimatePresence, motion } from 'framer-motion';
import LoadingSpinner from './LoadingSpinner';
import { useRouter } from 'next/navigation';

const POST_FEED_LIMIT = 10;

interface JobSearchFeedProps {
    searchTerm: string;
    minRating: number;
    dateFilter: string;
}

export default function JobSearchFeed({ searchTerm, minRating, dateFilter }: JobSearchFeedProps) {
    const [posts, setPosts] = useState<PostWithStats[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isFetchingMore, setIsFetchingMore] = useState(false);
    const [nextCursor, setNextCursor] = useState<number | null>(null);
    const observer = useRef<IntersectionObserver | null>(null);
    const router = useRouter();

    const fetchPosts = useCallback(async (cursor: number | null = null) => {
        if (cursor) {
            setIsFetchingMore(true);
        } else {
            setIsLoading(true);
        }

        const query = new URLSearchParams({
            searchTerm,
            minRating: String(minRating),
            dateFilter,
            limit: String(POST_FEED_LIMIT),
            ...(cursor && { cursor: String(cursor) }),
        }).toString();

        try {
            const res = await fetch(`/api/jobs/search?${query}`);
            if (!res.ok) throw new Error('Failed to fetch posts');
            const { posts: fetchedPosts, nextCursor: newNextCursor } = await res.json();

            setPosts(prev => cursor ? [...prev, ...fetchedPosts] : fetchedPosts);
            setNextCursor(newNextCursor);
        } catch (error) {
            console.error('Error fetching posts:', error);
        } finally {
            setIsLoading(false);
            setIsFetchingMore(false);
        }
    }, [searchTerm, minRating, dateFilter]);

    useEffect(() => {
        setPosts([]);
        setNextCursor(null);
        fetchPosts();
    }, [fetchPosts]);

    const sentinelRef = useCallback(
        (node: HTMLDivElement | null) => {
            if (isLoading) return;
            if (observer.current) observer.current.disconnect();
            observer.current = new IntersectionObserver((entries) => {
                if (entries[0].isIntersecting && nextCursor) {
                    fetchPosts(nextCursor);
                }
            });
            if (node) observer.current.observe(node);
        },
        [isLoading, nextCursor, fetchPosts]
    );

    const handlePostClick = useCallback((postId: number) => {
        router.push(`/post/${postId}?feedType=JOB`);
    }, [router]);


    if (isLoading) return <LoadingSpinner label="加载搜索结果..." />;

    return (
        <div className="flex flex-col gap-4 pb-24">
            <AnimatePresence>
                {posts.map((post) => (
                    <motion.div
                        key={post.id}
                        layout
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        onClick={() => handlePostClick(post.id)}
                        style={{ cursor: 'pointer' }}
                    >
                        <PostCard
                            post={post}
                            isLink={true}
                            onVote={() => { }}
                            onAutoPurify={() => { }}
                        />
                    </motion.div>
                ))}
            </AnimatePresence>

            {nextCursor && <div ref={sentinelRef} className="h-10" />}
            {isFetchingMore && <p className="text-center text-gray-400 py-4">正在加载更多...</p>}
            {!isLoading && !isFetchingMore && !nextCursor && posts.length > 0 && (
                <p className="text-center text-gray-500 py-8">--- 已加载全部结果 ---</p>
            )}
            {!isLoading && posts.length === 0 && (
                <p className="text-center text-gray-400 py-4">
                    没有找到匹配的结果。
                </p>
            )}
        </div>
    );
}
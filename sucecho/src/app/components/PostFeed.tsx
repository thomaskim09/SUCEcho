// sucecho/src/app/components/PostFeed.tsx
"use client";

import { useState, useEffect } from 'react';
import type { PostWithStats } from '@/lib/types';
import PostCard from './PostCard';

interface PostFeedProps {
    initialPosts: PostWithStats[];
}

export default function PostFeed({ initialPosts }: PostFeedProps) {
    const [posts, setPosts] = useState<PostWithStats[]>(initialPosts);

    useEffect(() => {
        const eventSource = new EventSource('/api/live');

        const handleNewPost = (event: MessageEvent) => {
            const newPost = JSON.parse(event.data);
            setPosts(prevPosts => [newPost, ...prevPosts]);
        };

        // NEW: Handler for vote updates
        const handleVoteUpdate = (event: MessageEvent) => {
            const { postId, stats } = JSON.parse(event.data);
            setPosts(prevPosts =>
                prevPosts.map(post =>
                    post.id === postId ? { ...post, stats: { ...post.stats, ...stats } } : post
                )
            );
        };

        eventSource.addEventListener('new_post', handleNewPost);
        eventSource.addEventListener('update_vote', handleVoteUpdate); // Add listener for votes

        return () => {
            eventSource.removeEventListener('new_post', handleNewPost);
            eventSource.removeEventListener('update_vote', handleVoteUpdate); // Cleanup vote listener
            eventSource.close();
        };
    }, []);

    return (
        <div>
            {posts.length > 0 ? (
                posts.map((post) => (
                    <PostCard key={post.id} post={post} />
                ))
            ) : (
                <p className="text-center text-gray-400">No echoes yet. Be the first!</p>
            )}
        </div>
    );
}
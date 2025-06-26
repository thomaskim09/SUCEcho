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
        // Establish a connection to our SSE endpoint
        const eventSource = new EventSource('/api/live');

        // This handler will be called for 'new_post' events
        const handleNewPost = (event: MessageEvent) => {
            const newPost = JSON.parse(event.data);
            // Add the new post to the top of the feed
            setPosts(prevPosts => [newPost, ...prevPosts]);
        };

        // Add the event listener for 'new_post' events
        eventSource.addEventListener('new_post', handleNewPost);

        // This is the cleanup function that will be called when the component unmounts.
        // It's crucial to close the connection to prevent memory leaks.
        return () => {
            eventSource.removeEventListener('new_post', handleNewPost);
            eventSource.close();
        };
    }, []); // The empty dependency array means this effect runs only once on mount

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
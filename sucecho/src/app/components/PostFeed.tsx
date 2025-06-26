// sucecho/src/app/components/PostFeed.tsx
"use client";

import { useState, useEffect } from 'react';
import type { PostWithStats } from '@/lib/types';
import PostCard from './PostCard';
import { motion, AnimatePresence } from 'framer-motion';

export default function PostFeed() {
    const [posts, setPosts] = useState<PostWithStats[]>([]);
    const [isLoading, setIsLoading] = useState(true); // Add loading state

    useEffect(() => {
        // Function to fetch the initial set of posts
        const fetchInitialPosts = async () => {
            try {
                const res = await fetch('/api/posts');
                if (!res.ok) {
                    throw new Error('Failed to fetch posts');
                }
                const initialPosts = await res.json();
                setPosts(initialPosts);
            } catch (error) {
                console.error("Error fetching initial posts:", error);
                // Optionally set an error state here to show in the UI
            } finally {
                setIsLoading(false); // Stop loading once done
            }
        };

        // Fetch the posts when the component mounts
        fetchInitialPosts();

        // Set up the real-time event source
        const eventSource = new EventSource('/api/live');

        const handleNewPost = (event: MessageEvent) => {
            const newPost = JSON.parse(event.data);
            // Add the new post to the top of the list
            setPosts(prevPosts => [newPost, ...prevPosts]);
        };

        const handleVoteUpdate = (event: MessageEvent) => {
            const { postId, stats } = JSON.parse(event.data);
            setPosts(prevPosts =>
                prevPosts.map(post =>
                    post.id === postId ? { ...post, stats: { ...post.stats, ...stats } } : post
                )
            );
        };

        // Handler for when a post is purified
        const handleDeletePost = (event: MessageEvent) => {
            const { postId } = JSON.parse(event.data);
            setPosts(prevPosts => prevPosts.filter(post => post.id !== postId));
        };

        eventSource.addEventListener('new_post', handleNewPost);
        eventSource.addEventListener('update_vote', handleVoteUpdate);
        eventSource.addEventListener('delete_post', handleDeletePost); // Listen for deletions

        // Cleanup function to close the connection when the component unmounts
        return () => {
            eventSource.removeEventListener('new_post', handleNewPost);
            eventSource.removeEventListener('update_vote', handleVoteUpdate);
            eventSource.removeEventListener('delete_post', handleDeletePost);
            eventSource.close();
        };
    }, []); // The empty dependency array ensures this runs only once on mount

    if (isLoading) {
        return <p className="text-center text-gray-400">正在加载回音...</p>;
    }

    return (
        <div>
            <AnimatePresence>
                {posts.length > 0 ? (
                    posts.map((post) => (
                        <PostCard key={post.id} post={post} />
                    ))
                ) : (
                    <p className="text-center text-gray-400">暂无回音，快来发表第一条吧！</p>
                )}
            </AnimatePresence>
        </div>
    );
}
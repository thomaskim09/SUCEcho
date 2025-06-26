// sucecho/src/app/post/[id]/page.tsx
"use client";

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import type { PostWithStats } from "@/lib/types";
import PostCard from '@/app/components/PostCard';
import Link from 'next/link';

// A custom type for the post thread to include replies
type PostThread = PostWithStats & {
    replies: PostWithStats[];
};

export default function PostDetailPage() {
    const [post, setPost] = useState<PostThread | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const params = useParams();
    const { id } = params;

    useEffect(() => {
        if (!id) return;

        const fetchPost = async () => {
            setIsLoading(true);
            setError(null);
            try {
                const res = await fetch(`/api/posts/${id}`);
                if (!res.ok) {
                    const errorData = await res.json();
                    throw new Error(errorData.error || 'Failed to fetch post');
                }
                const data = await res.json();
                setPost(data);
            } catch (err: any) {
                setError(err.message);
            } finally {
                setIsLoading(false);
            }
        };

        fetchPost();
    }, [id]);

    const renderContent = () => {
        if (isLoading) {
            return <p className="text-center text-gray-400">正在加载回音...</p>;
        }

        if (error) {
            return (
                <div className="text-center text-red-400 p-8 rounded-lg" style={{ backgroundColor: 'var(--card-background)' }}>
                    <p className="text-2xl mb-4">😔</p>
                    <p className="text-xl">{error}</p>
                    <Link href="/" className="text-accent hover:underline mt-6 inline-block">
                        ← 返回回音墙
                    </Link>
                </div>
            );
        }

        if (!post) {
            return null; // Should be handled by loading/error states
        }

        return (
            <div>
                {/* Main Post */}
                <div className="mb-4">
                    <PostCard post={post} isLink={false} />
                </div>

                {/* Reply Button */}
                <div className="my-6 text-center">
                    <Link
                        href={`/compose?parentId=${post.id}`}
                        className="inline-block bg-accent text-white font-bold py-3 px-6 rounded-lg hover:opacity-90 transition-opacity text-lg press-animation"
                    >
                        💬 回应此声
                    </Link>
                </div>


                {/* Replies */}
                {post.replies && post.replies.length > 0 && (
                    <div className="mt-8">
                        <h2 className="text-xl font-mono text-gray-400 mb-2">
                            子回声 ({post.replies.length})
                        </h2>
                        <div className="space-y-4 border-l-2 border-accent/30 pl-4 ml-4">
                            {post.replies.map(reply => (
                                <PostCard key={reply.id} post={reply} isLink={false} />
                            ))}
                        </div>
                    </div>
                )}
            </div>
        );
    };

    return (
        <div className="container mx-auto max-w-2xl p-4">
            <header className="py-4 flex items-center">
                <Link href="/" className="text-accent hover:underline">
                    ← 返回回音墙
                </Link>
            </header>
            <main className="mt-4">
                {renderContent()}
            </main>
        </div>
    );
}
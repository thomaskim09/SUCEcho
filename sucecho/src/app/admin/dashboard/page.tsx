// sucecho/src/app/admin/dashboard/page.tsx
"use client";

import { useAdmin } from '@/context/AdminContext';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import PostCard from '@/app/components/PostCard'; // Assuming PostCard is in this path

interface Post {
    id: string;
    message: string;
    codename: string;
    createdAt: string;
    votes: number;
}

interface User {
    fingerprint: string;
    createdAt: string;
    _count: {
        posts: number;
        votes: number;
    };
}

interface UserDetails extends User {
    posts: Post[];
    votes: any[]; // You might want to define a more specific type for votes
}

export default function AdminDashboardPage() {
    const { logout } = useAdmin();
    const router = useRouter();
    const [posts, setPosts] = useState<Post[]>([]);
    const [users, setUsers] = useState<User[]>([]);
    const [selectedUser, setSelectedUser] = useState<UserDetails | null>(null);
    const [loadingPosts, setLoadingPosts] = useState(true);
    const [loadingUsers, setLoadingUsers] = useState(true);
    const [errorPosts, setErrorPosts] = useState<string | null>(null);
    const [errorUsers, setErrorUsers] = useState<string | null>(null);

    useEffect(() => {
        const fetchPosts = async () => {
            try {
                const response = await fetch('/api/posts');
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                const data = await response.json();
                setPosts(data);
            } catch (e: any) {
                setErrorPosts(e.message);
            } finally {
                setLoadingPosts(false);
            }
        };
        fetchPosts();

        const fetchUsers = async () => {
            try {
                const response = await fetch('/api/admin/users');
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                const data = await response.json();
                setUsers(data);
            } catch (e: any) {
                setErrorUsers(e.message);
            } finally {
                setLoadingUsers(false);
            }
        };
        fetchUsers();
    }, []);

    const handleLogout = async () => {
        await logout();
        router.push('/');
    };

    const handleDeletePost = async (postId: string) => {
        if (window.confirm('Are you sure you want to delete this post?')) {
            try {
                const response = await fetch(`/api/admin/posts/${postId}`, {
                    method: 'DELETE',
                });
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                setPosts(posts.filter(post => post.id !== postId));
            } catch (e: any) {
                alert(`Failed to delete post: ${e.message}`);
            }
        }
    };

    const handleViewUserDetails = async (fingerprint: string) => {
        try {
            const response = await fetch(`/api/admin/users/${fingerprint}`);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const data = await response.json();
            setSelectedUser(data);
        } catch (e: any) {
            alert(`Failed to fetch user details: ${e.message}`);
            setSelectedUser(null);
        }
    };

    return (
        <div className="container mx-auto max-w-4xl p-4 text-white">
            <header className="py-4">
                <h1 className="text-3xl font-bold font-mono text-accent mb-4">Admin Dashboard</h1>
                <p>Welcome, Guardian. This is your command center.</p>
            </header>

            <section className="mt-8">
                <h2 className="text-2xl font-bold mb-4">Manage Posts</h2>
                {loadingPosts ? (
                    <div className="text-white text-center mt-8">Loading posts...</div>
                ) : errorPosts ? (
                    <div className="text-red-500 text-center mt-8">Error: {errorPosts}</div>
                ) : posts.length === 0 ? (
                    <p>No posts to display.</p>
                ) : (
                    <div className="space-y-4">
                        {posts.map((post) => (
                            <div key={post.id} className="border border-gray-700 p-4 rounded-lg flex justify-between items-center">
                                <PostCard post={post} />
                                <button
                                    onClick={() => handleDeletePost(post.id)}
                                    className="bg-red-600 text-white py-1 px-3 rounded-lg hover:bg-red-700 transition-colors"
                                >
                                    Delete
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </section>

            <section className="mt-8">
                <h2 className="text-2xl font-bold mb-4">Manage Users</h2>
                {loadingUsers ? (
                    <div className="text-white text-center mt-8">Loading users...</div>
                ) : errorUsers ? (
                    <div className="text-red-500 text-center mt-8">Error: {errorUsers}</div>
                ) : users.length === 0 ? (
                    <p>No users to display.</p>
                ) : (
                    <div className="space-y-4">
                        {users.map((user) => (
                            <div key={user.fingerprint} className="border border-gray-700 p-4 rounded-lg flex justify-between items-center">
                                <div>
                                    <p><strong>Fingerprint:</strong> {user.fingerprint}</p>
                                    <p><strong>Created At:</strong> {new Date(user.createdAt).toLocaleString()}</p>
                                    <p><strong>Posts:</strong> {user._count.posts}</p>
                                    <p><strong>Votes:</strong> {user._count.votes}</p>
                                </div>
                                <button
                                    onClick={() => handleViewUserDetails(user.fingerprint)}
                                    className="bg-blue-600 text-white py-1 px-3 rounded-lg hover:bg-blue-700 transition-colors"
                                >
                                    View Details
                                </button>
                            </div>
                        ))}
                    </div>
                )}

                {selectedUser && (
                    <div className="mt-8 p-4 border border-gray-600 rounded-lg">
                        <h3 className="text-xl font-bold mb-4">Details for {selectedUser.fingerprint}</h3>
                        <p><strong>Created At:</strong> {new Date(selectedUser.createdAt).toLocaleString()}</p>
                        <p><strong>Total Posts:</strong> {selectedUser.posts.length}</p>
                        <p><strong>Total Votes:</strong> {selectedUser.votes.length}</p>

                        <h4 className="text-lg font-bold mt-4 mb-2">User's Posts:</h4>
                        {selectedUser.posts.length === 0 ? (
                            <p>No posts from this user.</p>
                        ) : (
                            <div className="space-y-2">
                                {selectedUser.posts.map((post) => (
                                    <div key={post.id} className="border border-gray-700 p-3 rounded-lg">
                                        <p><strong>Message:</strong> {post.message}</p>
                                        <p><strong>Codename:</strong> {post.codename}</p>
                                        <p><strong>Created At:</strong> {new Date(post.createdAt).toLocaleString()}</p>
                                        <p><strong>Votes:</strong> {post.votes}</p>
                                    </div>
                                ))}
                            </div>
                        )}

                        <button
                            onClick={() => setSelectedUser(null)}
                            className="mt-4 bg-gray-600 text-white py-1 px-3 rounded-lg hover:bg-gray-700 transition-colors"
                        >
                            Close Details
                        </button>
                    </div>
                )}
            </section>

            <div className="mt-12">
                <button
                    onClick={handleLogout}
                    className="bg-red-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-red-700 transition-colors"
                >
                    Logout
                </button>
            </div>
        </div>
    );
}
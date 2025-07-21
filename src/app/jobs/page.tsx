"use client";
import { useEffect } from 'react';
import PostFeed from "../components/PostFeed";

export default function JobsPage() {
    useEffect(() => {
        document.body.classList.add('jobs-bg');
        return () => {
            document.body.classList.remove('jobs-bg');
        };
    }, []);

    return (
        <div className="container mx-auto max-w-2xl p-4">
            <main className="mt-4">
                <PostFeed feedType="JOB" />
            </main>
        </div>
    );
}
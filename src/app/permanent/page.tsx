"use client";
import { useEffect } from 'react';
import PostFeed from "../components/PostFeed";

export default function PermanentPage() {
    useEffect(() => {
        const rootElement = document.documentElement;
        rootElement.classList.add('permanent-bg');
        return () => {
            rootElement.classList.remove('permanent-bg');
        };
    }, []);

    return (
        <div className="container mx-auto max-w-2xl p-4">
            <main className="mt-4">
                <PostFeed feedType="PERMANENT" />
            </main>
        </div>
    );
}
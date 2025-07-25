// sucecho/src/app/my-echoes/page.tsx
"use client";

import { Icon } from '../components/Icon';
import PostFeed from '../components/PostFeed';
import Link from 'next/link';

export default function MyEchoesPage() {
    return (
        <div className="container mx-auto max-w-2xl p-4">
            <header className="py-4 flex justify-between items-center">
                <h1 className="text-2xl font-bold font-mono">我的回音</h1>
                <Link href="/" className="text-accent hover:underline text-lg flex items-center gap-2">
                    <Icon name="arrow-left" />
                    <span>返回回音壁</span>
                </Link>
            </header>
            <main className="mt-4">
                <PostFeed feedType="ALL" fetchMode="my-echoes" />
            </main>
        </div>
    );
}
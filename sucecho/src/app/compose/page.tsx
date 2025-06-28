// sucecho/src/app/compose/page.tsx
"use client";

import CreatePostForm from "../components/CreatePostForm";
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';

export default function ComposePage() {
    const searchParams = useSearchParams();
    const parentPostId = searchParams.get('parentPostId');

    return (
        <div className="container mx-auto max-w-2xl p-4">
            <header className="py-4 flex justify-between items-center">
                <h1 className="text-2xl font-bold font-mono">
                    {parentPostId ? '撰写子回声' : '发布新回音'}
                </h1>
                <Link href={parentPostId ? `/post/${parentPostId}` : '/'} className="text-accent hover:underline">
                    取消
                </Link>
            </header>
            <main className="mt-4">
                <CreatePostForm parentPostId={parentPostId ? parseInt(parentPostId) : undefined} />
            </main>
        </div>
    );
}
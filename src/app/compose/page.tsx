// sucecho/src/app/compose/page.tsx
"use client";

import CreatePostForm from "../components/CreatePostForm";
import { useSearchParams, useRouter } from 'next/navigation';

export default function ComposePage() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const parentPostId = searchParams.get('parentPostId');
    const parentReplyId = searchParams.get('parentReplyId');

    const pageTitle = parentReplyId
        ? '回复评论'
        : parentPostId
            ? '撰写子回声'
            : '发布新回音';

    return (
        <div className="container mx-auto max-w-2xl p-4">
            <header className="py-4 flex justify-between items-center">
                <h1 className="text-2xl font-bold font-mono">
                    {pageTitle}
                </h1>
                <button onClick={() => router.back()} className="text-accent hover:underline">
                    取消
                </button>
            </header>
            <main className="mt-4">
                <CreatePostForm
                    parentPostId={parentPostId ? parseInt(parentPostId) : undefined}
                    parentReplyId={parentReplyId ? parseInt(parentReplyId) : undefined}
                />
            </main>
        </div>
    );
}
// sucecho/src/app/compose/page.tsx
"use client";

import CreatePostForm from "../components/CreatePostForm";
import { useSearchParams, useRouter } from 'next/navigation';
import { useLayoutEffect } from 'react';

export default function ComposePage() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const parentPostId = searchParams.get('parentPostId');
    const parentReplyId = searchParams.get('parentReplyId');
    const feedType = searchParams.get('feedType') as 'JOB' | 'PERMANENT' | 'EPHEMERAL' | null;
    const isPermanent = feedType === 'PERMANENT' || feedType === 'JOB';

    useLayoutEffect(() => {
        const rootElement = document.documentElement;
        rootElement.classList.remove("jobs-bg", "permanent-bg");

        if (feedType === 'JOB') {
            rootElement.classList.add("jobs-bg");
        } else if (feedType === 'PERMANENT') {
            rootElement.classList.add("permanent-bg");
        }

        return () => {
            rootElement.classList.remove("jobs-bg", "permanent-bg");
        };
    }, [feedType]);

    const pageTitle = parentReplyId
        ? '回复评论'
        : parentPostId
            ? '撰写子回声'
            : '发布新回音';

    const postLifespan = isPermanent ? '这篇回音将永久保存' : '这篇回音将在24小时后消失';


    return (
        <div className="container mx-auto max-w-2xl p-4">
            <header className="py-4 flex justify-between items-center">
                <div className="flex items-center gap-4">
                    <h1 className="text-2xl font-bold font-mono">
                        {pageTitle}
                    </h1>
                </div>
                <button onClick={() => router.back()} className="text-accent hover:underline">
                    取消
                </button>
            </header>
            <main className="mt-4">
                <CreatePostForm
                    parentPostId={parentPostId ? parseInt(parentPostId) : undefined}
                    parentReplyId={parentReplyId ? parseInt(parentReplyId) : undefined}
                    feedType={feedType}
                    isPermanent={isPermanent}
                />
                {!parentPostId && (
                    <p className="text-center text-sm text-gray-400 mt-4">
                        {postLifespan}
                    </p>
                )}
            </main>
        </div>
    );
}
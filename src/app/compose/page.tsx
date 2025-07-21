// sucecho/src/app/compose/page.tsx
"use client";

import CreatePostForm from "../components/CreatePostForm";
import { useSearchParams, useRouter } from 'next/navigation';
import { useEffect, useState, useLayoutEffect } from 'react';

export default function ComposePage() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const parentPostId = searchParams.get('parentPostId');
    const parentReplyId = searchParams.get('parentReplyId');
    const feedTypeFromParams = searchParams.get('feedType') as 'JOB' | 'PERMANENT' | 'EPHEMERAL' | null;

    const [currentFeedType, setCurrentFeedType] = useState<'JOB' | 'PERMANENT' | 'EPHEMERAL' | null>(feedTypeFromParams);
    const [isPermanent, setIsPermanent] = useState(feedTypeFromParams === 'PERMANENT' || feedTypeFromParams === 'JOB');

    // Use useLayoutEffect for immediate background change to avoid flickering
    useLayoutEffect(() => {
        if (currentFeedType === 'JOB') {
            document.body.classList.add("jobs-bg");
        } else if (currentFeedType === 'PERMANENT') {
            document.body.classList.add("permanent-bg");
        } else {
            document.body.classList.remove("jobs-bg", "permanent-bg");
        }

        return () => {
            document.body.classList.remove("jobs-bg", "permanent-bg");
        };
    }, [currentFeedType]);

    useEffect(() => {
        // Only fetch if we are replying and don't have the feed type from params
        if (parentPostId && !feedTypeFromParams) {
            const fetchAndSetParentFeedType = async () => {
                try {
                    const res = await fetch(`/api/posts/${parentPostId}`);
                    if (res.ok) {
                        const parentPost = await res.json();
                        setCurrentFeedType(parentPost.feed);
                        if (parentPost.feed === 'JOB' || parentPost.feed === 'PERMANENT') {
                            setIsPermanent(true);
                        }
                    }
                } catch (error) {
                    console.error("Failed to fetch parent post", error);
                }
            };

            fetchAndSetParentFeedType();
        }
    }, [parentPostId, feedTypeFromParams]);


    const pageTitle = parentReplyId
        ? '回复评论'
        : parentPostId
            ? '撰写子回声'
            : '发布新回音';

    const isToggleDisabled = currentFeedType === 'JOB';

    return (
        <div className="container mx-auto max-w-2xl p-4">
            <header className="py-4 flex justify-between items-center">
                <div className="flex items-center gap-4">
                    <h1 className="text-2xl font-bold font-mono">
                        {pageTitle}
                    </h1>
                    {!parentPostId && (
                        <label className="flex items-center cursor-pointer p-2">
                            <span className="mr-2 text-sm font-semibold text-gray-400">永久保存</span>
                            <div className="relative">
                                <input
                                    type="checkbox"
                                    checked={isPermanent}
                                    onChange={() => !isToggleDisabled && setIsPermanent(!isPermanent)}
                                    className="sr-only"
                                    disabled={isToggleDisabled}
                                />
                                <div className={`block w-12 h-6 rounded-full transition ${isPermanent ? 'bg-accent' : 'bg-gray-600'} ${isToggleDisabled ? 'cursor-not-allowed opacity-50' : ''}`}></div>
                                <div className={`dot absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform ${isPermanent ? 'transform translate-x-6' : ''}`}></div>
                            </div>
                        </label>
                    )}
                </div>
                <button onClick={() => router.back()} className="text-accent hover:underline">
                    取消
                </button>
            </header>
            <main className="mt-4">
                <CreatePostForm
                    parentPostId={parentPostId ? parseInt(parentPostId) : undefined}
                    parentReplyId={parentReplyId ? parseInt(parentReplyId) : undefined}
                    feedType={currentFeedType}
                    isPermanent={isPermanent}
                />
            </main>
        </div>
    );
}

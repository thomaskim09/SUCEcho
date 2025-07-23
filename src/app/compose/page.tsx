"use client";

import CreatePostForm from "../components/CreatePostForm";
import { useSearchParams, useRouter } from 'next/navigation';
import { useLayoutEffect, Suspense, useState } from 'react';
import ContactCard from '../components/ContactCard';
import { AnimatePresence, motion } from 'framer-motion';

function ComposePageContent() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const parentPostId = searchParams.get('parentPostId');
    const parentReplyId = searchParams.get('parentReplyId');
    const feedType = searchParams.get('feedType') as 'JOB' | 'PERMANENT' | 'EPHEMERAL' | null;
    const isPermanent = feedType === 'PERMANENT' || feedType === 'JOB';
    const [content, setContent] = useState("");
    const [isSent, setIsSent] = useState(false);

    useLayoutEffect(() => {
        const rootElement = document.documentElement;
        rootElement.classList.remove("jobs-bg", "permanent-bg");

        if (feedType === 'JOB') {
            rootElement.classList.add("jobs-bg");
        } else if (feedType === 'PERMANENT') {
            rootElement.classList.add("permanent-bg");
        } else {
            rootElement.classList.add("ephemeral-bg");
        }

        return () => {
            rootElement.classList.remove("ephemeral-bg", "jobs-bg", "permanent-bg");
        };
    }, [feedType]);

    const getFeedName = () => {
        switch (feedType) {
            case 'JOB':
                return '谋生墙';
            case 'PERMANENT':
                return '时光档';
            default:
                return '回音壁';
        }
    };

    const pageTitle = parentReplyId
        ? `回复评论`
        : parentPostId
            ? `撰写子回声 - ${getFeedName()}`
            : `发布新回音 - ${getFeedName()}`;

    const postLifespan = isPermanent ? '这篇回音将不会过期消散' : '这篇回音将在24小时后消失';

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
                <AnimatePresence>
                    {!isSent && (
                        <motion.div
                            exit={{
                                y: [0, 20, -250],
                                opacity: [1, 1, 0],
                                scale: [1, 0.98, 0.8],
                            }}
                            transition={{
                                duration: 0.6,
                                ease: "easeInOut",
                                times: [0, 0.4, 1]
                            }}
                        >
                            <CreatePostForm
                                parentPostId={parentPostId ? parseInt(parentPostId) : undefined}
                                parentReplyId={parentReplyId ? parseInt(parentReplyId) : undefined}
                                feedType={feedType}
                                isPermanent={isPermanent}
                                onContentChange={setContent}
                                isSent={isSent}
                                onSuccess={() => setIsSent(true)}
                            />
                            {!parentPostId && <ContactCard content={content} />}
                        </motion.div>
                    )}
                </AnimatePresence>
                {!parentPostId && (
                    <p className="text-center text-sm text-gray-400 mt-4">
                        {postLifespan}
                    </p>
                )}
            </main>
        </div>
    );
}

export default function ComposePage() {
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <ComposePageContent />
        </Suspense>
    );
}
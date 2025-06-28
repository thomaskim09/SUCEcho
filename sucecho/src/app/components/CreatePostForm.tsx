// sucecho/src/app/components/CreatePostForm.tsx
"use client";

import { useState } from "react";
import { useRouter } from 'next/navigation';
import { useFingerprint } from '@/context/FingerprintContext';
import { addMyEcho } from '@/hooks/useMyEchoes'; // Import the new hook

interface CreatePostFormProps {
    parentPostId?: number;
}

export default function CreatePostForm({ parentPostId }: CreatePostFormProps) {
    const [content, setContent] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const { fingerprint, isLoading: isFingerprintLoading } = useFingerprint();
    const router = useRouter();
    const charLimit = 400;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (isFingerprintLoading || !fingerprint) {
            setError("指纹尚未准备好，请稍后再试。");
            return;
        }

        setIsSubmitting(true);
        setError(null);

        try {
            const response = await fetch('/api/posts', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ content, fingerprintHash: fingerprint, parentPostId: parentPostId }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || "发布失败");
            }

            // Get the newly created post from the response
            const newPost = await response.json();

            // *** ADD THE POST ID TO LOCALSTORAGE ***
            if (newPost && newPost.id) {
                addMyEcho(newPost.id);
            }

            setContent("");
            router.push(parentPostId ? `/post/${parentPostId}` : '/');

        } catch (err: unknown) {
            if (err instanceof Error) {
                // This will now display the detailed ban message from the API
                setError(err.message);
            } else {
                setError('发生未知错误');
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="p-4 rounded-lg" style={{ backgroundColor: 'var(--card-background)' }}>
            <form onSubmit={handleSubmit}>
                <textarea
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    className="w-full bg-transparent border-b border-gray-600 focus:outline-none focus:border-accent p-2"
                    placeholder={parentPostId ? "写下你的回应..." : "此刻你想说什么？"}
                    rows={5}
                    maxLength={charLimit}
                    autoFocus
                />
                <div className="flex justify-between items-center mt-3">
                    <span className="text-sm text-gray-400 font-mono">
                        还可输入 {charLimit - content.length} 字
                    </span>
                    <button
                        type="submit"
                        className="bg-accent text-white font-bold py-2 px-4 rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50"
                        disabled={!content.trim() || isSubmitting || isFingerprintLoading || !fingerprint}
                    >
                        {isSubmitting ? "发布中..." : (parentPostId ? "发布回应" : "发布回音")}
                    </button>
                </div>
                {error && <p className="text-red-500 mt-2">{error}</p>}
                {isFingerprintLoading && !error && <p className="text-gray-400 mt-2">初始化中...</p>}
            </form>
        </div>
    );
}

// sucecho/src/app/components/CreatePostForm.tsx
"use client";

import { useState, useEffect } from "react";
import { useRouter } from 'next/navigation';
import FingerprintJS from '@fingerprintjs/fingerprintjs';

interface CreatePostFormProps {
    parentId?: number;
}

export default function CreatePostForm({ parentId }: CreatePostFormProps) {
    const [content, setContent] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [fingerprint, setFingerprint] = useState<string | null>(null);
    const router = useRouter();
    const charLimit = 400;

    useEffect(() => {
        const getFingerprint = async () => {
            const fp = await FingerprintJS.load();
            const result = await fp.get();
            setFingerprint(result.visitorId);
        };
        getFingerprint();
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!fingerprint) {
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
                // Include parentId if it exists
                body: JSON.stringify({ content, fingerprintHash: fingerprint, parentId }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || "发布失败");
            }

            // Redirect to the parent post if it's a reply, otherwise to the homepage
            router.push(parentId ? `/post/${parentId}` : '/');

        } catch (err: any) {
            setError(err.message);
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
                    placeholder={parentId ? "写下你的回应..." : "此刻你想说什么？"}
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
                        disabled={!content.trim() || isSubmitting || !fingerprint}
                    >
                        {isSubmitting ? "发布中..." : (parentId ? "发布回应" : "发布回音")}
                    </button>
                </div>
                {error && <p className="text-red-500 mt-2">{error}</p>}
                {!fingerprint && !error && <p className="text-gray-400 mt-2">初始化中...</p>}
            </form>
        </div>
    );
}
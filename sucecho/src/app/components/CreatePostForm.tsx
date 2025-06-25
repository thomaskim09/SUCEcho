// sucecho/src/app/components/CreatePostForm.tsx
"use client";

import { useState, useEffect } from "react";
import { useRouter } from 'next/navigation';
import FingerprintJS from '@fingerprintjs/fingerprintjs';

export default function CreatePostForm() {
    const [content, setContent] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const router = useRouter();
    const charLimit = 400;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        setError(null);

        try {
            // Get the unique browser fingerprint
            const fp = await FingerprintJS.load();
            const result = await fp.get();
            const fingerprintHash = result.visitorId;

            const response = await fetch('/api/posts', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ content, fingerprintHash }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || "Failed to submit post");
            }

            // Redirect to homepage after successful submission
            router.push('/');

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
                    placeholder="What's on your mind?"
                    rows={5}
                    maxLength={charLimit}
                />
                <div className="flex justify-between items-center mt-3">
                    <span className="text-sm text-gray-400 font-mono">
                        {charLimit - content.length} characters remaining
                    </span>
                    <button
                        type="submit"
                        className="bg-accent text-white font-bold py-2 px-4 rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50"
                        disabled={!content.trim() || isSubmitting}
                    >
                        {isSubmitting ? "Echoing..." : "Echo"}
                    </button>
                </div>
                {error && <p className="text-red-500 mt-2">{error}</p>}
            </form>
        </div>
    );
}
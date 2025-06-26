// sucecho/src/app/components/CreatePostForm.tsx
"use client";

import { useState, useEffect } from "react";
import { useRouter } from 'next/navigation';
import FingerprintJS from '@fingerprintjs/fingerprintjs';

export default function CreatePostForm() {
    const [content, setContent] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [fingerprint, setFingerprint] = useState<string | null>(null);
    const router = useRouter();
    const charLimit = 400;

    useEffect(() => {
        // Load the fingerprint in the background after the component mounts
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
            setError("Fingerprint is not ready yet, please try again in a moment.");
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
                body: JSON.stringify({ content, fingerprintHash: fingerprint }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || "Failed to submit post");
            }

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
                        disabled={!content.trim() || isSubmitting || !fingerprint}
                    >
                        {isSubmitting ? "Echoing..." : "Echo"}
                    </button>
                </div>
                {error && <p className="text-red-500 mt-2">{error}</p>}
                {!fingerprint && !error && <p className="text-gray-400 mt-2">Initializing...</p>}
            </form>
        </div>
    );
}
// src/app/components/Poll.tsx
"use client";

import { useState, useEffect, useRef } from 'react';
import { motion, useAnimation } from 'framer-motion';
import { useFingerprint } from '@/context/FingerprintContext';
import logger from '@/lib/logger';
import { getStoredPollVotes, storePollVote } from '@/lib/pollVoteStore'; // We will use our new store

interface PollOption {
    id: number;
    text: string;
    votes: number;
    postId: number;
}

interface PollProps {
    postId: number;
    options: PollOption[];
}

export default function Poll({ postId, options: initialOptions }: PollProps) {
    const { fingerprint } = useFingerprint();
    const [votedOptionId, setVotedOptionId] = useState<number | null>(null);
    const [options, setOptions] = useState(initialOptions);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [ripples, setRipples] = useState<{ id: number, x: number, y: number, optionId: number, width: number, height: number }[]>([]);
    const optionRefs = useRef<{ [key: number]: HTMLButtonElement | null }>({});
    const controls = useAnimation();

    useEffect(() => {
        const checkVoteStatus = async () => {
            // 1. Check local storage first for an immediate UI update.
            const storedVotes = getStoredPollVotes();
            const localVote = storedVotes[postId];

            if (localVote) {
                setVotedOptionId(localVote.optionId);
            } else {
                // 2. If not in local storage, fetch from the server.
                if (fingerprint) {
                    try {
                        const res = await fetch(`/api/polls/${postId}/my_vote`, {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ fingerprintHash: fingerprint }),
                        });
                        if (res.ok) {
                            const data = await res.json();
                            if (data.votedOptionId) {
                                // 3. Set state and save the fetched vote to local storage for next time.
                                setVotedOptionId(data.votedOptionId);
                                storePollVote(postId, data.votedOptionId);
                            }
                        }
                    } catch (err) {
                        logger.error("Failed to fetch user's poll vote", err);
                    }
                }
            }
        };

        checkVoteStatus();
    }, [postId, fingerprint]);


    const totalVotes = options.reduce((sum, opt) => sum + opt.votes, 0);

    useEffect(() => {
        const runAnimation = async () => {
            await controls.set({ width: "0%" });
            await controls.start((i) => ({
                width: `${totalVotes > 0 ? (options[i].votes / totalVotes) * 100 : 0}%`,
                transition: { duration: 1.5, ease: 'easeInOut' }
            }));
        };
        if (votedOptionId !== null) {
            runAnimation();
        }
    }, [options, totalVotes, votedOptionId, controls]);

    const handleVote = async (optionId: number, e?: React.MouseEvent) => {
        if (votedOptionId || !fingerprint || isSubmitting) return;

        if (e && optionRefs.current[optionId]) {
            const btn = optionRefs.current[optionId];
            if (btn) {
                const rect = btn.getBoundingClientRect();
                const x = e.clientX - rect.left;
                const y = e.clientY - rect.top;
                const width = rect.width;
                const height = rect.height;
                const rippleId = Date.now() + Math.random();
                setRipples((prev) => [...prev, { id: rippleId, x, y, optionId, width, height }]);
                setTimeout(() => {
                    setRipples((prev) => prev.filter(r => r.id !== rippleId));
                }, 900);
            }
        }

        setIsSubmitting(true);
        setError(null);

        // Optimistic UI Update and cache locally
        setVotedOptionId(optionId);
        storePollVote(postId, optionId);

        try {
            const res = await fetch(`/api/polls/${postId}/vote`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ pollOptionId: optionId, fingerprintHash: fingerprint }),
            });

            if (!res.ok) {
                const errorData = await res.json();
                // Revert optimistic update on failure
                setVotedOptionId(null);
                storePollVote(postId, null);
                throw new Error(errorData.error || '投票失败');
            }

            const updatedOptions: PollOption[] = await res.json();
            setOptions(updatedOptions);

        } catch (err) {
            logger.error("Vote submission error:", err);
            setError((err as Error).message);
            // Revert on error
            setVotedOptionId(null);
            storePollVote(postId, null);
            setTimeout(() => setError(null), 3000);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="mt-4 space-y-3">
            {error && <p className="text-red-500 text-sm text-center mb-2">{error}</p>}
            {options.map((option, index) => {
                const percentage = totalVotes > 0 ? (option.votes / totalVotes) * 100 : 0;
                const isMyVote = option.id === votedOptionId;

                return (
                    <div key={option.id} className="relative">
                        <button
                            ref={el => { optionRefs.current[option.id] = el; }}
                            onClick={(e) => handleVote(option.id, e)}
                            disabled={!!votedOptionId || isSubmitting}
                            className={`w-full text-left p-3 rounded-lg border-2 transition-all duration-300 ease-in-out overflow-hidden relative
                                ${isMyVote ? 'border-accent' : 'border-gray-600 hover:border-accent'}
                                ${votedOptionId && !isMyVote ? 'opacity-80' : ''}
                                ${isSubmitting ? 'cursor-wait' : 'cursor-pointer'}
                                ${!votedOptionId ? 'bg-gray-800/50' : 'bg-transparent'}`
                            }
                        >
                            {/* Progress background bar */}
                            {votedOptionId &&
                                <motion.div
                                    custom={index}
                                    animate={controls}
                                    className={`absolute top-0 left-0 h-full rounded-md z-0 ${isMyVote ? 'bg-accent/30' : 'bg-gray-700/50'}`}
                                />
                            }

                            {/* Ripple effect */}
                            <span className="ripple-container">
                                {ripples.filter(r => r.optionId === option.id).map(ripple => {
                                    const dx = Math.max(ripple.x, ripple.width - ripple.x);
                                    const dy = Math.max(ripple.y, ripple.height - ripple.y);
                                    const radius = Math.sqrt(dx * dx + dy * dy);
                                    const size = radius * 2;
                                    return (
                                        <span
                                            key={ripple.id}
                                            className="poll-ripple"
                                            style={{
                                                left: ripple.x - size / 2,
                                                top: ripple.y - size / 2,
                                                width: size,
                                                height: size,
                                            }}
                                        />
                                    );
                                })}
                            </span>

                            <div className="relative z-20 flex justify-between items-center">
                                <span className="font-semibold">{option.text}</span>
                                {votedOptionId && (
                                    <span className="font-mono text-sm">{Math.round(percentage)}% ({option.votes})</span>
                                )}
                            </div>
                        </button>
                    </div>
                );
            })}
            <p className="text-xs text-center text-gray-500 pt-2">共 {totalVotes} 票</p>
            <style jsx global>{`
                @keyframes poll-ripple-strong {
                    0% { transform: scale(0); opacity: 0.9; }
                    60% { transform: scale(1); opacity: 0.5; }
                    100% { transform: scale(1.4); opacity: 0; }
                }
            `}</style>
        </div>
    );
}
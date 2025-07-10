// src/app/components/Poll.tsx
"use client";

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useFingerprint } from '@/context/FingerprintContext';
import logger from '@/lib/logger';
import { Icon } from './Icon';

// This should match the type inferred from your Prisma schema
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

const POLL_VOTES_KEY = 'poll_votes';

export default function Poll({ postId, options: initialOptions }: PollProps) {
    const { fingerprint } = useFingerprint();
    const [votedOptionId, setVotedOptionId] = useState<number | null>(null);
    const [options, setOptions] = useState(initialOptions);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [ripples, setRipples] = useState<{ id: number, x: number, y: number, optionId: number }[]>([]);
    const optionRefs = useRef<{ [key: number]: HTMLButtonElement | null }>({});

    useEffect(() => {
        if (typeof window !== 'undefined') {
            const votes = JSON.parse(localStorage.getItem(POLL_VOTES_KEY) || '{}');
            if (votes[postId]) {
                setVotedOptionId(votes[postId]);
            }
        }
    }, [postId]);

    const totalVotes = options.reduce((sum, opt) => sum + opt.votes, 0);

    const handleVote = async (optionId: number, e?: React.MouseEvent) => {
        if (votedOptionId || !fingerprint || isSubmitting) return;

        if (e && optionRefs.current[optionId]) {
            const btn = optionRefs.current[optionId];
            const rect = btn.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            const rippleId = Date.now() + Math.random();
            setRipples((prev) => [...prev, { id: rippleId, x, y, optionId }]);
            setTimeout(() => {
                setRipples((prev) => prev.filter(r => r.id !== rippleId));
            }, 600);
        }

        setIsSubmitting(true);
        setError(null);
        try {
            const res = await fetch(`/api/polls/${postId}/vote`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ pollOptionId: optionId, fingerprintHash: fingerprint }),
            });

            if (!res.ok) {
                const errorData = await res.json();
                throw new Error(errorData.error || '投票失败');
            }

            const updatedOptions: PollOption[] = await res.json();
            setOptions(updatedOptions);
            setVotedOptionId(optionId);

            const votes = JSON.parse(localStorage.getItem(POLL_VOTES_KEY) || '{}');
            votes[postId] = optionId;
            localStorage.setItem(POLL_VOTES_KEY, JSON.stringify(votes));

        } catch (err) {
            logger.error("Vote submission error:", err);
            setError((err as Error).message);
            setTimeout(() => setError(null), 3000);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="mt-4 space-y-3">
            {error && <p className="text-red-500 text-sm text-center mb-2">{error}</p>}
            {options.map((option) => {
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
                                ${votedOptionId && !isMyVote ? 'opacity-60' : ''}
                                ${isSubmitting ? 'cursor-wait' : 'cursor-pointer'}
                                ${!votedOptionId ? 'bg-gray-800/50' : 'bg-transparent'}`
                            }
                        >
                            {/* Progress background bar */}
                            {votedOptionId &&
                                <motion.div
                                    className={`absolute top-0 left-0 h-full rounded-md z-0 ${isMyVote ? 'bg-accent/30' : 'bg-gray-700/50'}`}
                                    initial={{ width: 0 }}
                                    animate={{ width: `${percentage}%` }}
                                    transition={{ duration: 1.5, ease: 'easeInOut' }}
                                />
                            }
                            {/* Ripple effect */}
                            {ripples.filter(r => r.optionId === option.id).map(ripple => (
                                <span
                                    key={ripple.id}
                                    className="absolute rounded-full pointer-events-none z-10"
                                    style={{
                                        left: ripple.x - 60,
                                        top: ripple.y - 60,
                                        width: 120,
                                        height: 120,
                                        background: 'rgba(159,112,253,0.45)',
                                        animation: 'poll-ripple-strong 0.9s linear',
                                    }}
                                />
                            ))}
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
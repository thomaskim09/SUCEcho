// sucecho/src/app/components/StarRating.tsx
"use client";

import { useState } from 'react';
import { Icon } from './Icon';
import { motion, AnimatePresence } from 'framer-motion';

interface StarRatingProps {
    onRating: (rating: number) => Promise<void>;
    isSubmitting: boolean;
    averageRating: number;
    ratingCount: number;
    userRating: number | null;
    isFetchingRating: boolean;
}

const ratingLabels = ["糟糕", "不太行", "一般", "推荐", "极佳"];

const RatedState = ({ userRating, averageRating }: { userRating: number; averageRating: number; }) => {
    const avgLabel = averageRating > 0 ? ratingLabels[Math.round(averageRating) - 1] : '暂无';
    const userLabel = ratingLabels[userRating - 1];

    const starRow = (label: string, rating: number, colorClass: string) => (
        <>
            <div className="text-gray-400 text-sm text-right whitespace-nowrap">{label}</div>
            <div className="flex items-center justify-center space-x-1">
                {[...Array(5)].map((_, index) => {
                    const starValue = index + 1;
                    return (
                        <motion.div
                            key={starValue}
                            initial={{ scale: 0.5, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            transition={{ delay: index * 0.08, type: 'spring', stiffness: 400, damping: 15 }}
                        >
                            <Icon
                                name="star"
                                className={`w-6 h-6 ${starValue <= Math.round(rating) ? `${colorClass} fill-current` : 'text-gray-600'}`}
                            />
                        </motion.div>
                    );
                })}
            </div>
            <div className={`font-bold text-sm text-left ${colorClass} whitespace-nowrap`}>{label === '我的评分' ? userLabel : avgLabel}</div>
        </>
    );

    return (
        <div className="grid grid-cols-[max-content_1fr_max-content] items-center gap-x-4 gap-y-2 p-2 w-full">
            {starRow('我的评分', userRating, 'text-accent')}
            {starRow('总评均分', averageRating, 'text-yellow-400')}
        </div>
    );
};

export default function StarRating({ onRating, isSubmitting, averageRating, ratingCount, userRating, isFetchingRating }: StarRatingProps) {
    const [selectedRating, setSelectedRating] = useState(0);
    const [hover, setHover] = useState(0);

    const handleRateClick = async () => {
        if (selectedRating > 0 && !isSubmitting) {
            await onRating(selectedRating);
        }
    };

    const containerVariants = {
        hidden: { opacity: 0, y: 10 },
        visible: { opacity: 1, y: 0, transition: { duration: 0.5 } }
    };

    return (
        <div className={`glass-card p-2 rounded-lg min-h-[100px] flex items-center justify-center relative ${isFetchingRating ? 'animate-shimmer' : ''}`}>
            <AnimatePresence mode="wait">
                {isFetchingRating ? (
                    <motion.div key="loading" variants={containerVariants} initial="hidden" animate="visible" exit="hidden">
                        <span className="text-gray-500 text-sm font-mono">正在读取您的评分...</span>
                    </motion.div>
                ) : userRating ? (
                    <motion.div key="rated" variants={containerVariants} initial="hidden" animate="visible" exit="hidden" className="w-full">
                        <RatedState userRating={userRating} averageRating={averageRating} />
                    </motion.div>
                ) : (
                    <motion.div key="rating" variants={containerVariants} initial="hidden" animate="visible" exit="hidden">
                        <h3 className="text-center font-semibold text-gray-300 mb-2">为这个职位评分</h3>
                        <div className="flex items-center justify-center space-x-1">
                            <div className="text-center text-gray-400 text-sm w-12 mr-2 h-5">
                                <AnimatePresence>
                                    {(hover > 0 || selectedRating > 0) && (
                                        <motion.span
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            exit={{ opacity: 0 }}
                                        >
                                            {ratingLabels[(hover || selectedRating) - 1]}
                                        </motion.span>
                                    )}
                                </AnimatePresence>
                            </div>
                            {[...Array(5)].map((_, index) => {
                                const starValue = index + 1;
                                return (
                                    <motion.button
                                        type="button"
                                        key={starValue}
                                        whileHover={{ scale: 1.2, y: -2 }}
                                        whileTap={{ scale: 1.1 }}
                                        transition={{ type: 'spring', stiffness: 500, damping: 15 }}
                                        onClick={() => setSelectedRating(starValue)}
                                        onMouseEnter={() => setHover(starValue)}
                                        onMouseLeave={() => setHover(0)}
                                        disabled={isSubmitting}
                                        className="focus:outline-none"
                                    >
                                        <Icon
                                            name="star"
                                            className={`w-8 h-8 transition-colors duration-200 ${starValue <= (hover || selectedRating) ? 'text-yellow-400 fill-current' : 'text-gray-600'}`}
                                        />
                                    </motion.button>
                                );
                            })}
                            <button
                                onClick={handleRateClick}
                                disabled={isSubmitting || selectedRating === 0}
                                className="bg-accent text-white font-bold py-2 px-4 rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50 ml-4 whitespace-nowrap"
                            >
                                {isSubmitting ? '...' : '评价'}
                            </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
// sucecho/src/app/components/StarRating.tsx
"use client";

import { useState, useEffect } from 'react';
import { Icon } from './Icon';

interface StarRatingProps {
    onRating: (rating: number) => Promise<void>;
    isSubmitting: boolean;
    averageRating: number;
    ratingCount: number;
    userRating: number | null;
}

const ratingLabels = ["糟糕", "不太行", "一般", "推荐", "极佳"];

const DisplayOnlyRating = ({ rating, label }: { rating: number; label: string }) => (
    <div className="flex items-center justify-center space-x-1">
        <span className="text-gray-400 text-sm mr-2 w-12 text-right">{label}</span>
        {[...Array(5)].map((_, index) => {
            const starValue = index + 1;
            return (
                <Icon
                    key={starValue}
                    name="star"
                    className={`w-8 h-8 ${starValue <= Math.round(rating) ? 'text-yellow-400 fill-current' : 'text-gray-600'}`}
                />
            );
        })}
    </div>
);

export default function StarRating({ onRating, isSubmitting, averageRating, ratingCount, userRating }: StarRatingProps) {
    const [selectedRating, setSelectedRating] = useState(0);
    const [hover, setHover] = useState(0);
    const [hasRated, setHasRated] = useState(!!userRating);

    useEffect(() => {
        setHasRated(!!userRating);
        if (userRating) {
            setSelectedRating(userRating);
        }
    }, [userRating]);

    const handleRateClick = async () => {
        if (selectedRating > 0 && !isSubmitting) {
            await onRating(selectedRating);
        }
    };

    if (hasRated) {
        const displayLabel = averageRating > 0 ? ratingLabels[Math.round(averageRating) - 1] : '暂无评分';
        return (
            <div className="glass-card p-4 rounded-lg">
                <DisplayOnlyRating rating={averageRating} label={displayLabel} />
            </div>
        );
    }

    return (
        <div className="glass-card p-4 rounded-lg">
            <h3 className="text-center font-semibold text-gray-300 mb-2">为这个职位评分</h3>
            <div className="flex items-center justify-center space-x-1">
                <div className="text-center text-gray-400 text-sm w-12 mr-2 h-5">
                    {(hover > 0 || selectedRating > 0) && (
                        <span>{ratingLabels[(hover || selectedRating) - 1]}</span>
                    )}
                </div>
                {[...Array(5)].map((_, index) => {
                    const starValue = index + 1;
                    return (
                        <button
                            type="button"
                            key={starValue}
                            className={`transition-transform duration-200 ease-in-out ${hover >= starValue || selectedRating >= starValue ? 'transform scale-110' : ''}`}
                            onClick={() => setSelectedRating(starValue)}
                            onMouseEnter={() => setHover(starValue)}
                            onMouseLeave={() => setHover(0)}
                            disabled={isSubmitting}
                        >
                            <Icon
                                name="star"
                                className={`w-8 h-8 ${starValue <= (hover || selectedRating) ? 'text-yellow-400 fill-current' : 'text-gray-600'}`}
                            />
                        </button>
                    );
                })}
                <button
                    onClick={handleRateClick}
                    disabled={isSubmitting || selectedRating === 0}
                    className="bg-accent text-white font-bold py-2 px-4 rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50 ml-4"
                >
                    {isSubmitting ? '...' : '评价'}
                </button>
            </div>
        </div>
    );
}

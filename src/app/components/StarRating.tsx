"use client";

import { useState } from 'react';
import { Icon } from './Icon';

interface StarRatingProps {
    onRating: (rating: number) => void;
    isSubmitting: boolean;
}

export default function StarRating({ onRating, isSubmitting }: StarRatingProps) {
    const [rating, setRating] = useState(0);
    const [hover, setHover] = useState(0);

    return (
        <div className="flex items-center justify-center space-x-1">
            {[...Array(5)].map((_, index) => {
                const starValue = index + 1;
                return (
                    <button
                        type="button"
                        key={starValue}
                        className={`transition-transform duration-200 ease-in-out ${hover >= starValue || rating >= starValue ? 'transform scale-110' : ''}`}
                        onClick={() => {
                            const newRating = starValue === rating ? 0 : starValue;
                            setRating(newRating);
                            onRating(newRating);
                        }}
                        onMouseEnter={() => setHover(starValue)}
                        onMouseLeave={() => setHover(0)}
                        disabled={isSubmitting}
                    >
                        <Icon
                            name="star"
                            className={`w-8 h-8 ${starValue <= (hover || rating) ? 'text-yellow-400 fill-current' : 'text-gray-600'}`}
                        />
                    </button>
                );
            })}
        </div>
    );
}
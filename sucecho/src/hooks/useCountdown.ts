// sucecho/src/hooks/useCountdown.ts
import { useState, useEffect } from 'react';

/**
 * A custom hook to manage a countdown timer for a post.
 * @param {Date} createdAt - The creation date of the post.
 * @returns {{countdownText: string, colorClass: string, isExpired: boolean}} - The display text, color class, and expiration status.
 */
export const useCountdown = (createdAt: Date) => {
    const twentyFourHours = 24 * 60 * 60 * 1000;
    const expiresAt = new Date(createdAt).getTime() + twentyFourHours;

    const [timeLeft, setTimeLeft] = useState(expiresAt - new Date().getTime());

    useEffect(() => {
        const interval = setInterval(() => {
            const newTimeLeft = expiresAt - new Date().getTime();
            setTimeLeft(newTimeLeft);
            // No need to clear interval here, the component will unmount
        }, 1000);

        return () => clearInterval(interval);
    }, [expiresAt]);

    const isExpired = timeLeft <= 0;

    const hours = Math.floor(timeLeft / (1000 * 60 * 60));
    const minutes = Math.floor((timeLeft / 1000 / 60) % 60);
    const seconds = Math.floor((timeLeft / 1000) % 60);

    let countdownText = '已消散';
    let colorClass = 'text-gray-500';

    if (!isExpired) {
        if (hours > 0) {
            countdownText = `余 ${hours} 时`;
        } else if (minutes > 0) {
            countdownText = `余 ${minutes} 分`;
        } else {
            countdownText = `${seconds}s`;
        }

        if (hours < 1 && minutes >= 15) {
            colorClass = 'text-countdown-hour';
        } else if (hours < 3) {
            colorClass = 'text-countdown-soon';
        }

        if (minutes < 15 && hours < 1) {
            colorClass = 'text-countdown-critical';
        }
    }

    return { countdownText, colorClass, isExpired };
};
